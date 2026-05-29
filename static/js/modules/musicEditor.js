/**
 * Music Studio — Intellivision music composition + playback.
 *
 * Phase 0: scaffolding. Tab loads, piano-roll renders, engine selector wired,
 * import/export buttons present but stubbed. Real functionality phases 1+.
 *
 * Architecture: this module is thin — it holds the active engine + current
 * song, wires UI events to the engine, and feeds the piano-roll renderer.
 * Format-specific parsing/serializing lives in engines/*.js.
 */

import { IntyBasicMusic }    from './music/engines/intybasicMusic.js';
import { ChevallierTracker } from './music/engines/chevallierTracker.js';
import { ImtTracker }        from './music/engines/imtTracker.js';
import { ZmusEngine }        from './music/engines/zmusEngine.js';
import { PianoRoll }      from './music/pianoRoll.js';
import { Minimap }        from './music/minimap.js';
import { PsgSynth }       from './music/playback/psgSynth.js';
import { audioBufferToWav, downloadBlob, slugifyFilename } from '../utils/wavEncoder.js';
import { UIManager }      from './uiManager.js';

// Registry of available engines. Phase 9 adds raw-PSG here.
const ENGINES = {
    intybasic: IntyBasicMusic,
    'chevallier-tracker': ChevallierTracker,
    'imt-tracker':        ImtTracker,
    'zmus':               ZmusEngine,
};

export class MusicEditor {
    static engine     = IntyBasicMusic;   // active engine class
    static song       = null;             // current SongIR
    static isPlaying  = false;

    // ── Edit-mode state ─────────────────────────────────────────────────────
    static currentChannel    = 0;     // 0/1/2 = melody, 3 = drums
    static currentInstrument = 'W';   // W/X/Y/Z for melody
    static currentDrum       = 'M1';  // M1/M2/M3 for drum channel
    static loopEnabled       = true;  // honor MUSIC JUMP / REPEAT during playback
    static LOOP_COUNT        = 4;     // how many iterations per Play press

    // ── Software keyboard state ─────────────────────────────────────────────
    static KEYBOARD_LOW_MIDI  = 36;   // C2 (Intellivision's lowest usable note)
    static KEYBOARD_HIGH_MIDI = 96;   // C7 (highest usable note) — exclusive
    static writeCursorTick    = 0;    // where the next keyboard-entered note lands

    // 'wide' = full C2-C7 edge-to-edge. 'compact' = 2-octave window with ◀▶ shift.
    static keyboardMode       = 'wide';
    static COMPACT_OCTAVES    = 2;
    static compactBaseOctave  = 4;    // C4 by default (middle C)

    // Clipboard: notes from the last copy/cut. Note startTicks are rebased to 0
    // so paste can offset them by the destination (writeCursorTick).
    static clipboard          = null;   // { notes: [...], lengthTicks: number } | null

    // Mixer: channels the user has muted or soloed. If solo is non-empty,
    // ONLY soloed channels play. Otherwise all channels except muted play.
    static mutedChannels      = new Set();
    static soloedChannels     = new Set();

    /** Called once when the user first switches to the Music tab. */
    static init() {
        this.song = this.engine.defaultSong();
        PianoRoll.init('music-piano-roll');
        PianoRoll.setSong(this.song);
        PianoRoll.setEditorCallbacks({
            onCellClick:        (tick, midi, isDrumLane, shiftKey, drumChannel) => this.handleCellClick(tick, midi, isDrumLane, shiftKey, drumChannel),
            onSeek:             (tick) => this.handleSeek(tick),
            onNoteHover:        (info) => this._showHoverInfo(info),
            onSelectionChange:  (sel)  => this._updatePlayButton(sel),
        });
        Minimap.init('music-minimap', {
            onSeek:  (tick) => this.handleSeek(tick),
            onHover: (tick) => this._showHoverInfo(tick == null ? null : `overview · tick ${tick}`),
        });
        Minimap.setSong(this.song);
        this._renderEngineSelector();
        this._updateStatusLine();
        this._loadDemosManifest();
        this._syncEditControls();
        this._wireClipboardShortcuts();
        this._wireMixerShortcuts();
        this._probeJzintvAvailability();
        this._renderKeyboard();

        // Close demos dropdown when clicking outside it
        document.addEventListener('click', (e) => {
            const menu = document.getElementById('music-demos-dropdown-menu');
            const btn  = e.target.closest('.music-demos-dropdown');
            if (menu && !btn) menu.style.display = 'none';
        });
    }

    /** Ruler click — seek to that tick. Also moves the keyboard write cursor. */
    static handleSeek(tick) {
        if (PsgSynth.isPlaying()) {
            PsgSynth.stop();
            this.isPlaying = false;
            this._updatePlayButton();
        }
        this.writeCursorTick = tick;
        // Seeking is an EDIT action, not playback — clear the red playhead and
        // show only the green write cursor.
        PianoRoll.setPlayhead(null);
        PianoRoll.setWriteCursor(tick);
        Minimap.setPlayhead(tick);
        this._updateStatusLine(tick);
    }

    // ── Edit controls ───────────────────────────────────────────────────────

    static setChannel(channel) {
        this.currentChannel = channel;
        this._syncEditControls();
    }

    /** Toggle mute on a channel. Independent of solo (a channel can be both
     *  muted and soloed; solo wins for playback). */
    static toggleMuteChannel(channel) {
        if (this.mutedChannels.has(channel)) this.mutedChannels.delete(channel);
        else                                 this.mutedChannels.add(channel);
        this._pushMixerState();
    }

    static toggleSoloChannel(channel) {
        if (this.soloedChannels.has(channel)) this.soloedChannels.delete(channel);
        else                                  this.soloedChannels.add(channel);
        this._pushMixerState();
    }

    static _pushMixerState() {
        this._syncEditControls();
        PianoRoll.setMixerState(this.mutedChannels, this.soloedChannels);
    }

    // ── jzIntv (bit-perfect) playback ───────────────────────────────────────

    /** Probe the server for the compile pipeline (intybasic + as1600 + lib).
     *  Reveals the "▶ jzIntv" button always — enabled when the server has the
     *  toolchain, disabled with a setup tooltip when it doesn't. Keeps the
     *  feature discoverable on production-without-toolchain installs. */
    static _probeJzintvAvailability() {
        const btn = document.getElementById('music-play-jzintv-btn');
        if (!btn) return;
        btn.style.display = '';   // always visible; enabled state set below
        fetch('/music/compile_rom/status')
            .then(r => r.ok ? r.json() : null)
            .then(s => {
                if (s?.available) {
                    btn.disabled = false;
                    btn.title = 'Compile to a real ROM and play through jzIntv WASM (bit-perfect).';
                } else {
                    btn.disabled = true;
                    const missing = !s ? 'reachable' :
                        [
                            !s.intybasic && 'intybasic',
                            !s.as1600    && 'as1600',
                            !s.library   && 'intybasic library',
                        ].filter(Boolean).join(' + ');
                    btn.title = `jzIntv bit-perfect playback requires ${missing} on the server. See docs/wasm-playback.md.`;
                }
            })
            .catch(() => {
                btn.disabled = true;
                btn.title = 'Server probe failed — bit-perfect playback unavailable.';
            });
    }

    /** Compile the current song to a ROM and open it in the Emulator tab.
     *  Only works with the IntyBASIC engine — Tracker round-trip is Phase-2. */
    static async playJzintv() {
        if (this.engine.formatSlug !== 'intybasic') {
            UIManager.showStatus(
                `jzIntv playback only supports IntyBASIC songs today (current: ${this.engine.formatName}).`,
                'warning'
            );
            return;
        }
        if (!this.song?.notes?.length) {
            UIManager.showStatus('Nothing to compile — add some notes first.', 'warning');
            return;
        }
        const source = this.engine.serialize(this.song);
        const songLabel = this.song.label || 'mysong';
        const btn = document.getElementById('music-play-jzintv-btn');
        const prevText = btn?.textContent;
        if (btn) { btn.disabled = true; btn.textContent = '⏳ Compiling…'; }
        UIManager.showStatus('Compiling MUSIC source → ROM (intybasic + as1600)…', 'info');

        try {
            const r = await fetch('/music/compile_rom', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source,
                    song_label: songLabel,
                    title: songLabel,
                }),
            });
            const result = await r.json();
            if (!r.ok) throw new Error(result.error || `HTTP ${r.status}`);
            UIManager.showStatus(
                `Compiled ${result.rom_bytes} bytes — opening in jzIntv…`,
                'success'
            );
            // Hand off to the existing Emulator tab via the shared rom_token URL.
            // The shell loads the ROM and starts playback automatically.
            window.switchEditorTab?.('emulator');
            const iframe = document.getElementById('emulator-iframe');
            if (iframe) iframe.src = `/emulator/shell/?rom_token=${result.token}`;
        } catch (e) {
            UIManager.showStatus(`Compile failed: ${e.message}`, 'error');
            console.error('[musicPlayJzintv]', e);
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = prevText; }
        }
    }

    /** True if the channel's notes will be heard during playback right now. */
    static isChannelAudible(channel) {
        if (this.soloedChannels.size > 0) return this.soloedChannels.has(channel);
        return !this.mutedChannels.has(channel);
    }

    /** Capture-phase listener: Cmd/Ctrl+click a channel button mutes, Shift+
     *  click solos. Plain click falls through to the inline onclick (select).
     *  Stops propagation only when a modifier is present so we don't break
     *  the existing setChannel UX. */
    static _wireMixerShortcuts() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.music-channel-btn');
            if (!btn) return;
            if (!(e.metaKey || e.ctrlKey || e.shiftKey)) return;
            e.preventDefault();
            e.stopImmediatePropagation();
            const ch = parseInt(btn.dataset.channel);
            if (e.metaKey || e.ctrlKey) this.toggleMuteChannel(ch);
            else if (e.shiftKey)         this.toggleSoloChannel(ch);
        }, true);
    }

    static setInstrument(letter) {
        this.currentInstrument = letter;
        this._syncEditControls();
    }

    static setDrum(label) {
        this.currentDrum = label;
        this._syncEditControls();
    }

    /** Toggle whether MUSIC JUMP / REPEAT extends playback duration. */
    static toggleLoop() {
        this.loopEnabled = !this.loopEnabled;
        const btn = document.getElementById('music-loop-btn');
        if (btn) {
            btn.classList.toggle('active', this.loopEnabled);
            btn.textContent = this.loopEnabled ? '🔁 Loop' : '➡️ Once';
        }
        this._updateStatusLine();
    }

    /** Refresh active-state on the channel/instrument/drum buttons + enable/disable groups. */
    static _syncEditControls() {
        document.querySelectorAll('.music-channel-btn').forEach(btn => {
            const ch = parseInt(btn.dataset.channel);
            btn.classList.toggle('active', ch === this.currentChannel);
            btn.classList.toggle('muted', this.mutedChannels.has(ch));
            btn.classList.toggle('soloed', this.soloedChannels.has(ch));
        });
        document.querySelectorAll('.music-instrument-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.instrument === this.currentInstrument);
        });
        document.querySelectorAll('.music-drum-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.drum === this.currentDrum);
        });
        const isDrumChannel = this.currentChannel === 3 || this.currentChannel === 7;
        const instGroup = document.getElementById('music-instrument-group');
        const drumGroup = document.getElementById('music-drum-group');
        if (instGroup) instGroup.classList.toggle('disabled', isDrumChannel);
        if (drumGroup) drumGroup.classList.toggle('disabled', !isDrumChannel);
        // ECS UI visibility — auto-show when the song uses 8-channel format
        const isEcs = (this.song?.channelCount || 0) >= 8;
        const ecsGroup = document.getElementById('music-ecs-channels');
        if (ecsGroup) ecsGroup.style.display = isEcs ? 'inline-flex' : 'none';
        const ecsBtn = document.getElementById('music-ecs-toggle');
        if (ecsBtn) {
            ecsBtn.textContent = isEcs ? '− ECS' : '+ ECS';
            ecsBtn.classList.toggle('active', isEcs);
        }
    }

    /** Promote a 4-channel song to 8 (ECS) or demote back. Demotion warns if
     *  the song has any notes on ECS channels (4-7) so the user doesn't lose
     *  work silently. */
    static toggleEcs() {
        if (!this.song) return;
        const isEcs = (this.song.channelCount || 0) >= 8;
        if (isEcs) {
            const ecsNotes = this.song.notes.filter(n => n.channel >= 4).length;
            if (ecsNotes > 0) {
                const ok = confirm(`Disabling ECS will remove ${ecsNotes} notes on channels 4–7. Continue?`);
                if (!ok) return;
                this.song.notes = this.song.notes.filter(n => n.channel < 4);
            }
            this.song.channelCount = 3;
            if (this.currentChannel >= 4) this.setChannel(0);
        } else {
            this.song.channelCount = 8;
        }
        this.song.metadata.dirty = true;
        PianoRoll.setSong(this.song);
        Minimap.setSong(this.song);
        this._syncEditControls();
        this._updateStatusLine();
    }

    // ── Click handling: add or delete a note ────────────────────────────────

    /**
     * Called by the piano-roll on every click.
     * @param {number} tick - tick position (snapped to ticksPerNote)
     * @param {number} midi - MIDI pitch (irrelevant for drum lane clicks)
     * @param {boolean} isDrumLane - true if the click was in the drum strip
     * @param {boolean} shiftKey - true if shift was held (extend/sustain mode)
     */
    static handleCellClick(tick, midi, isDrumLane, shiftKey = false, drumChannel = null) {
        if (!this.song) return;
        // Force the active channel to drums (specific drum channel if ECS)
        if (isDrumLane) {
            const targetCh = drumChannel ?? 3;
            if (this.currentChannel !== targetCh) this.setChannel(targetCh);
        } else if (this.currentChannel === 3 || this.currentChannel === 7) {
            // Click in melody area while drums were active → fall back to ch 1
            this.setChannel(0);
        }

        if (isDrumLane) {
            this._toggleDrumAt(tick, drumChannel ?? 3);
        } else if (shiftKey) {
            this._extendNoteAt(tick, midi);
        } else {
            // Preview the pitch so the user hears what they're adding or removing
            this._previewNote(midi);
            this._toggleNoteAt(tick, midi);
        }
        this.song.metadata.dirty = true;
        PianoRoll.setSong(this.song);
        Minimap.setSong(this.song);
        this._updateStatusLine();
    }

    static _toggleNoteAt(tick, midi) {
        const ch = this.currentChannel;
        // PSG channels are MONO: at any tick, each channel holds at most one
        // pitched note. Real IntyBASIC MUSIC stores exactly one token per
        // channel slot per line, so stacking notes on the same channel at the
        // same tick would silently drop all but the first at export. Enforce
        // that here: same pitch toggles off, different pitch REPLACES.
        const existingIdx = this.song.notes.findIndex(n =>
            n.channel === ch && n.startTick === tick && n.pitch != null
        );
        if (existingIdx >= 0) {
            const existing = this.song.notes[existingIdx];
            if (existing.pitch === midi) {
                this.song.notes.splice(existingIdx, 1);
            } else {
                const oldName = this._midiToName(existing.pitch);
                const newName = this._midiToName(midi);
                existing.pitch      = midi;
                existing.instrument = this.currentInstrument;
                UIManager.showStatus(
                    `Ch${ch + 1}: replaced ${oldName} with ${newName} (1 note per channel per tick — PSG is mono)`,
                    'info'
                );
            }
        } else {
            // No collision at this tick. But before adding, trim any earlier
            // sustained note on this channel whose duration overlaps tick —
            // real hardware retriggers when a new note token arrives.
            this._trimPriorNoteAt(ch, tick);
            this.song.notes.push({
                startTick:     tick,
                durationTicks: this.engine.tempoAt(this.song, tick),
                channel:       ch,
                pitch:         midi,
                instrument:    this.currentInstrument,
                drum:          null,
            });
        }
    }

    /** If an earlier melody note on `channel` extends past `tick`, trim its
     *  duration so it ends exactly at `tick`. Mirrors real-hardware behavior:
     *  a new MUSIC token retriggers the channel, ending any sustain. */
    static _trimPriorNoteAt(channel, tick) {
        for (const n of this.song.notes) {
            if (n.channel !== channel) continue;
            if (n.pitch == null) continue;
            if (n.startTick >= tick) continue;
            const end = n.startTick + (n.durationTicks || 0);
            if (end > tick) n.durationTicks = tick - n.startTick;
        }
    }

    static _NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    static _midiToName(midi) {
        return this._NOTE_NAMES[midi % 12] + (Math.floor(midi / 12) - 1);
    }

    /**
     * Shift+click: extend a note's duration.
     *
     * Three ways to trigger:
     *   1. Shift+click ON an existing note → extend it by one step to the right
     *   2. Shift+click on the cell RIGHT AFTER a note → same (extend into this cell)
     *   3. Shift+click INSIDE an already-extended note → shrink it back to this tick
     *
     * Each extend = one more "S" (sustain) in IntyBASIC terms.
     */
    static _extendNoteAt(tick, midi) {
        const ch = this.currentChannel;
        const step = this.engine.tempoAt(this.song, tick);

        // Cap an extend at the next note on the same channel — otherwise the
        // visual sustain would overlap a later retrigger on the channel,
        // which doesn't match real hardware playback.
        const capAt = (startTick) => {
            const next = this.song.notes
                .filter(n => n.channel === ch && n.pitch != null && n.startTick > startTick)
                .reduce((acc, n) => (acc == null || n.startTick < acc) ? n.startTick : acc, null);
            return next;
        };

        // Case 1: shift+click directly ON a note's start tick → extend it
        const onNote = this.song.notes.find(n =>
            n.channel === ch && n.pitch === midi && n.startTick === tick
        );
        if (onNote) {
            const cap = capAt(onNote.startTick);
            const requested = onNote.durationTicks + step;
            onNote.durationTicks = cap != null
                ? Math.min(requested, cap - onNote.startTick)
                : requested;
            return;
        }

        // Case 2: shift+click on the cell immediately after a note's right edge
        const adjacent = this.song.notes.find(n =>
            n.channel === ch && n.pitch === midi &&
            n.startTick + n.durationTicks === tick
        );
        if (adjacent) {
            const cap = capAt(adjacent.startTick);
            const requested = adjacent.durationTicks + step;
            adjacent.durationTicks = cap != null
                ? Math.min(requested, cap - adjacent.startTick)
                : requested;
            return;
        }

        // Case 3: shift+click inside an already-extended note → shrink back
        const covering = this.song.notes.find(n =>
            n.channel === ch && n.pitch === midi &&
            n.startTick < tick && n.startTick + n.durationTicks > tick
        );
        if (covering) {
            covering.durationTicks = tick - covering.startTick;
            if (covering.durationTicks <= 0) covering.durationTicks = step;
            return;
        }

        // Nothing to extend — add a new note
        this._toggleNoteAt(tick, midi);
    }

    /** Cycle through drum types on repeated clicks: empty→M1→M2→M3→delete.
     *  @param channel - 3 for base PSG drums, 7 for ECS drums. */
    static _toggleDrumAt(tick, channel = 3) {
        const CYCLE = ['M1', 'M2', 'M3'];
        const existing = this.song.notes.findIndex(n =>
            n.channel === channel && n.startTick === tick
        );
        if (existing >= 0) {
            const cur = this.song.notes[existing].drum;
            const idx = CYCLE.indexOf(cur);
            if (idx >= 0 && idx < CYCLE.length - 1) {
                this.song.notes[existing].drum = CYCLE[idx + 1];
            } else {
                this.song.notes.splice(existing, 1);
            }
        } else {
            this.song.notes.push({
                startTick:     tick,
                durationTicks: this.engine.tempoAt(this.song, tick),
                channel,
                pitch:         null,
                instrument:    null,
                drum:          CYCLE[0],
            });
        }
    }

    // ── Demos dropdown ─────────────────────────────────────────────────────

    static async _loadDemosManifest() {
        const listEl = document.getElementById('music-demos-list');
        if (!listEl) return;
        try {
            const r = await fetch('/music/demos/manifest');
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const manifest = await r.json();
            this._renderDemosList(manifest.demos || []);
        } catch (e) {
            listEl.innerHTML = `<div style="padding:12px 14px; color:#a00; font-size:12px;">Could not load demos: ${e.message}</div>`;
        }
    }

    static _renderDemosList(demos) {
        const listEl = document.getElementById('music-demos-list');
        if (!listEl) return;
        if (demos.length === 0) {
            listEl.innerHTML = '<div style="padding:12px 14px; color:#666; font-size:12px;">No demos available.</div>';
            return;
        }

        const tagColors = {
            'Title':     '#0366d6',
            'Boss':      '#cb2431',
            'Gameplay':  '#28a745',
            'Ambient':   '#6f42c1',
            'Showcase':  '#d97706',
            'Reference': '#6a737d',
            'ECS':       '#48b8c0',
            'Cover':     '#9c27b0',
            'Container': '#795548',
        };

        // Group by engine. Manifest demos already arrive in engine-order, but
        // we re-bucket here so an out-of-order manifest still groups cleanly.
        const engineLabels = {
            'intybasic':          { name: 'IntyBASIC MUSIC',                     icon: '🎵' },
            'imt-tracker':        { name: 'IMT (Intellivision Music Tracker)',    icon: '🎼' },
            'chevallier-tracker': { name: 'Chevallier Tracker',                   icon: '🎼' },
            'zmus':               { name: 'ZMUS (Zbiciak microprogrammed)',       icon: '📜' },
        };
        const grouped = new Map();
        for (const d of demos) {
            const slug = d.engine || 'intybasic';
            if (!grouped.has(slug)) grouped.set(slug, []);
            grouped.get(slug).push(d);
        }

        const sections = [];
        for (const [slug, group] of grouped) {
            const eng = engineLabels[slug] || { name: slug, icon: '🎶' };
            sections.push(`
                <div style="padding:10px 14px 6px; background:#f6f8fa; border-bottom:1px solid #e1e4e8;">
                    <div style="font-size:10px; font-weight:700; color:#586069; text-transform:uppercase; letter-spacing:1px;">
                        ${eng.icon} ${eng.name}
                    </div>
                </div>
            `);
            for (const d of group) {
                const tagColor = tagColors[d.tag] || '#6a737d';
                sections.push(`
                    <div class="music-demo-item" onclick="musicLoadDemo('${d.file}', '${slug}')"
                         style="padding:10px 14px; cursor:pointer; border-bottom:1px solid #f0f0f0; transition:background 0.15s;"
                         onmouseover="this.style.background='#f6f8fa'"
                         onmouseout="this.style.background='transparent'">
                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                            <strong style="font-size:13px; color:#24292e;">${d.title}</strong>
                            <span style="font-size:9px; padding:2px 6px; border-radius:3px; background:${tagColor}; color:#fff; font-weight:600; letter-spacing:0.5px;">${d.tag.toUpperCase()}</span>
                        </div>
                        <div style="font-size:11px; color:#586069; line-height:1.45;">${d.blurb}</div>
                    </div>
                `);
            }
        }

        listEl.innerHTML = sections.join('');
    }

    static toggleDemosDropdown() {
        const menu = document.getElementById('music-demos-dropdown-menu');
        if (!menu) return;
        menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
    }

    static async loadDemo(filename, engineSlug) {
        const menu = document.getElementById('music-demos-dropdown-menu');
        if (menu) menu.style.display = 'none';
        try {
            const r = await fetch(`/music/demos/${encodeURIComponent(filename)}`);
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const text = await r.text();
            // Demos in the manifest declare their engine explicitly. If we
            // have that hint, use it directly — no auto-detection needed.
            // Falls back to detection for legacy callers.
            if (engineSlug && ENGINES[engineSlug]) {
                this._parseWithEngine(text, engineSlug, `demo "${filename}"`);
            } else {
                this._parseWithDetect(text, `demo "${filename}"`);
            }
        } catch (e) {
            alert(`Failed to load demo: ${e.message}`);
        }
    }

    /** Parse source with a pre-selected engine — used when the caller already
     *  knows the right engine (e.g. demo manifest declares it). Switches the
     *  active engine transparently if it differs from the current selection. */
    static _parseWithEngine(text, engineSlug, sourceLabel = 'source') {
        const targetEngine = ENGINES[engineSlug];
        if (!targetEngine) { return this._parseWithDetect(text, sourceLabel); }
        const switched = targetEngine !== this.engine;
        if (switched) {
            this.engine = targetEngine;
            this._renderEngineSelector();
        }
        try {
            this._loadNewSong(targetEngine.parse(text));
            if (switched) {
                UIManager.showStatus(
                    `Switched to ${targetEngine.formatName} — ${sourceLabel}`,
                    'info'
                );
            }
        } catch (e) {
            alert(`Failed to load ${sourceLabel}: ${e.message}`);
        }
    }

    /**
     * Parse source with auto-engine-detection. If the source looks like a
     * different engine than the dropdown's current selection, switch engines
     * transparently and show a status hint instead of erroring. This makes
     * loading mismatched demos and pastes "just work".
     */
    static _parseWithDetect(text, sourceLabel = 'source') {
        const detectedSlug = this._detectEngineSlug(text);
        const targetEngine = (detectedSlug && ENGINES[detectedSlug]) || this.engine;
        const switched = targetEngine !== this.engine;
        if (switched) {
            this.engine = targetEngine;
            this._renderEngineSelector();
        }
        try {
            this._loadNewSong(targetEngine.parse(text));
            if (switched) {
                UIManager.showStatus(
                    `Switched to ${targetEngine.formatName} — ${sourceLabel} is in that format.`,
                    'info'
                );
            }
        } catch (e) {
            alert(`Failed to load ${sourceLabel}: ${e.message}`);
        }
    }

    /**
     * Quick content-sniff to pick the right engine. Both formats have distinctive
     * surface markers — IntyBASIC has "DATA <n>" then "MUSIC <args>" lines,
     * while Chevallier Tracker has "NAME PROC" + "NOTES(" macro calls. Returns
     * the engine slug or null when undecided (defer to the current engine).
     */
    static _detectEngineSlug(text) {
        // IMT and Chevallier both use PROC + NOTES() syntax, so check IMT
        // first — its distinctive marker is the @@instr / @@drums labels
        // in the song header. ZMUS uses PROC + DECLE stream (no NOTES).
        const looksLikeImt   = ImtTracker.looksLike(text);
        const looksLikeZmus  = ZmusEngine.looksLike(text);
        const looksLikeTrk   = /^\s*[A-Z_][A-Z0-9_]*\s+PROC\b/im.test(text)
                            && /NOTES\(/i.test(text);
        const looksLikeIb    = /^\s*MUSIC\b/im.test(text)
                            && /^\s*DATA\s+\d/im.test(text);

        if (looksLikeImt)                                return 'imt-tracker';
        if (looksLikeZmus && !looksLikeTrk)              return 'zmus';
        if (looksLikeTrk && !looksLikeIb)                return 'chevallier-tracker';
        if (looksLikeIb && !looksLikeTrk && !looksLikeZmus) return 'intybasic';
        return null;
    }

    /**
     * Centralized "song-change" path. Anything that replaces the current
     * song (loadDemo, paste, newSong) goes through here so we always:
     *   1. Kill any in-progress playback (synth + UI button state)
     *   2. Reset the playhead and force the canvas back to static scroll mode
     *   3. Hand the new song to the piano-roll (which clears playheadTick too)
     *   4. Refresh the status line
     *
     * This fixes the bug where loading a second demo after playing the first
     * left scrollMode/playheadTick in stale states, breaking the player-piano
     * effect on subsequent plays.
     */
    static _loadNewSong(song) {
        if (PsgSynth.isPlaying()) {
            PsgSynth.stop();
        }
        this.isPlaying = false;
        this._updatePlayButton();
        PianoRoll.setFollowMode(false);
        PianoRoll.setLoopInfo(null);
        Minimap.setLoopInfo(null);
        this.song = song;
        this.writeCursorTick = this.engine.getTotalTicks(song);  // cursor starts at end
        PianoRoll.setSong(this.song);
        Minimap.setSong(this.song);
        // Clear any stale red playback marker, place the green write cursor
        // at the new song's end so the user immediately sees where typing goes
        PianoRoll.setPlayhead(null);
        PianoRoll.setWriteCursor(this.writeCursorTick);
        Minimap.setPlayhead(this.writeCursorTick);
        this._syncEditControls();  // pick up channelCount changes (ECS auto-show)
        this._updateStatusLine();
    }

    // ── Engine selection ────────────────────────────────────────────────────

    static _renderEngineSelector() {
        const select = document.getElementById('music-engine-select');
        if (!select) return;
        select.innerHTML = '';
        for (const slug of Object.keys(ENGINES)) {
            // Engines flagged `hideFromDropdown` stay in the registry for
            // auto-detect (so pasted source from that format still parses)
            // but don't crowd the user-facing selector.
            if (ENGINES[slug].hideFromDropdown) continue;
            const opt = document.createElement('option');
            opt.value = slug;
            opt.textContent = ENGINES[slug].formatName;
            if (slug === this.engine.formatSlug) opt.selected = true;
            select.appendChild(opt);
        }
    }

    static setEngine(slug) {
        if (!ENGINES[slug]) return;
        this.engine = ENGINES[slug];
        // Phase 5+: offer to convert current song to new engine.
        this.song = this.engine.defaultSong();
        PianoRoll.setSong(this.song);
        Minimap.setSong(this.song);
        this._updateStatusLine();
    }

    // ── Toolbar actions (all are Phase 0 stubs) ────────────────────────────

    static showPasteDialog() {
        const text = prompt(
            `Paste source for any supported engine — the editor will detect and parse it. ` +
            `(Current engine: ${this.engine.formatName}, but a mismatch will auto-switch.)`
        );
        if (text == null) return;
        this._parseWithDetect(text, 'pasted source');
    }

    static copyToClipboard() {
        const text = this.engine.serialize(this.song);
        navigator.clipboard.writeText(text).then(
            () => alert(`Copied ${this.engine.formatName} to clipboard.`),
            () => alert('Copy failed — your browser blocked clipboard access.')
        );
    }

    static newSong() {
        if (this.song?.notes?.length > 0) {
            if (!confirm('Discard current song and start over?')) return;
        }
        this._loadNewSong(this.engine.defaultSong());
    }

    static play() {
        if (!this.song) {
            alert(`Nothing to play — load a demo from the Demos dropdown, or paste a ${this.engine.formatName} song.`);
            return;
        }
        if (!this.song.notes || this.song.notes.length === 0) {
            // The ZMUS engine ships as a Phase-1 opaque container — the song
            // data is captured (and round-trips on export), but the bytecode
            // hasn't been decoded into notes yet. Be honest about it rather
            // than showing the generic "nothing to play" error.
            const isOpaque = (this.engine.formatSlug === 'zmus')
                          && (this.song.metadata?.zmusBytes?.length > 0);
            if (isOpaque) {
                alert(
                    `ZMUS Phase 1: the song imported as ${this.song.metadata.zmusBytes.length} ` +
                    `DECLEs and round-trips on export, but bytecode decoding into musical ` +
                    `notes (for piano-roll + Web Audio playback) is Phase 2 work. ` +
                    `Use the IntyBASIC demos for now, or wait for the ZMUS Phase 2 decoder.`
                );
                return;
            }
            alert(`Nothing to play — load a demo from the Demos dropdown, or paste a ${this.engine.formatName} song.`);
            return;
        }
        // If already playing, treat as stop (button doubles as pause)
        if (PsgSynth.isPlaying()) {
            this.stop();
            return;
        }

        const selection = PianoRoll.getSelection();
        let events, totalTicks, playheadOffset = 0, loopForVisual = null, useFollowMode;

        if (selection) {
            // ── Play Selection mode ────────────────────────────────────────
            // Filter events to [start, end), shift them to start at time 0,
            // and skip looping/follow-scroll so the user keeps the selected
            // region visible. We also annotate the playhead callback so the
            // line moves through the selection at its real screen position.
            const all = this.engine.toPlaybackEvents(this.song, 50, 1);
            const tickSec = 1 / 50;
            const startSec = selection.start * tickSec;
            const endSec   = selection.end   * tickSec;
            events = all
                .filter(e => e.timeSec >= startSec && e.timeSec < endSec)
                .filter(e => this.isChannelAudible(e.channel))
                .map(e => ({ ...e, timeSec: e.timeSec - startSec }));
            totalTicks     = selection.end - selection.start;
            playheadOffset = selection.start;
            useFollowMode  = false;
            PianoRoll.setLoopInfo(null);
            Minimap.setLoopInfo(null);
        } else {
            // ── Full-song playback (with loop expansion if enabled) ────────
            const loops = this.loopEnabled ? this.LOOP_COUNT : 1;
            events     = this.engine.toPlaybackEvents(this.song, 50, loops)
                            .filter(e => this.isChannelAudible(e.channel));
            totalTicks = this.engine.getPlaybackTicks
                ? this.engine.getPlaybackTicks(this.song, loops)
                : this.engine.getTotalTicks(this.song);
            loopForVisual = this.loopEnabled
                ? this.engine.getLoopInfo?.(this.song) ?? null
                : null;
            PianoRoll.setLoopInfo(loopForVisual);
            Minimap.setLoopInfo(loopForVisual);
            useFollowMode = true;
        }

        if (useFollowMode) PianoRoll.setFollowMode(true);

        PsgSynth.play(events, totalTicks, (tick) => {
            const displayTick = tick == null ? null : tick + playheadOffset;
            PianoRoll.setPlayhead(displayTick);
            Minimap.setPlayhead(displayTick);
            this._updateStatusLine(displayTick);
            if (tick === null) {
                this.isPlaying = false;
                this._updatePlayButton();
                if (useFollowMode) PianoRoll.setFollowMode(false);
            }
        });
        this.isPlaying = true;
        this._updatePlayButton();
    }

    static stop() {
        PsgSynth.stop();
        this.isPlaying = false;
        // Switch back to static view but KEEP the playhead at its last
        // position so users see where they stopped (and can resume from there).
        PianoRoll.setFollowMode(false);
        // Clear loop wrap so the preserved playhead reflects the actual
        // (raw) tick position rather than a wrapped one — once stopped,
        // there's no looping context to map through.
        PianoRoll.setLoopInfo(null);
        Minimap.setLoopInfo(null);
        this._updatePlayButton();
        this._updateStatusLine();
    }

    /**
     * Render the current song (one iteration, no loop expansion) to a
     * 16-bit PCM WAV and download it. Honors channel mute/solo so the
     * downloaded WAV matches what you hear in the mixer.
     */
    static async downloadWav() {
        if (!this.song) return;
        try {
            const btn = document.querySelector('#music-toolbar button[onclick="musicDownloadWav()"]');
            const btnLabel = btn?.textContent;
            if (btn) { btn.disabled = true; btn.textContent = '⏳ Rendering…'; }

            const events     = this.engine.toPlaybackEvents(this.song, 50, 1)
                                    .filter(e => this.isChannelAudible(e.channel));
            const totalTicks = this.engine.getPlaybackTicks
                ? this.engine.getPlaybackTicks(this.song, 1)
                : this.engine.getTotalTicks(this.song);

            const buffer = await PsgSynth.renderToBuffer(events, totalTicks);
            const blob   = audioBufferToWav(buffer);
            const name   = this.song.name || this.song.title || 'untitled-song';
            downloadBlob(blob, `${slugifyFilename(name)}.wav`);

            if (btn) { btn.disabled = false; btn.textContent = btnLabel; }
        } catch (e) {
            console.error('MusicEditor.downloadWav failed:', e);
            const btn = document.querySelector('#music-toolbar button[onclick="musicDownloadWav()"]');
            if (btn) { btn.disabled = false; btn.textContent = '💾 WAV'; }
            alert('WAV render failed — see browser console for details.');
        }
    }

    /**
     * @param {{start:number,end:number}|null} [selectionOverride] — optional
     *   selection state. When called from the onSelectionChange callback, the
     *   PianoRoll passes us the new selection directly (it may not yet have
     *   committed it to its own state when this fires). Falls back to the
     *   PianoRoll's current selection otherwise.
     */
    static _updatePlayButton(selectionOverride) {
        const btn = document.querySelector('#music-toolbar button[onclick="musicPlay()"]');
        if (!btn) return;
        const sel = (selectionOverride !== undefined) ? selectionOverride : PianoRoll.getSelection();
        if (this.isPlaying) {
            btn.textContent = '⏸ Pause';
        } else if (sel) {
            btn.textContent = '▶ Play Selection';
        } else {
            btn.textContent = '▶ Play';
        }
    }

    // ── Clipboard: copy / cut / paste / delete on the range selection ───────

    /** Snapshot every note that starts inside the selection, rebased to tick 0. */
    static copySelection() {
        const sel = PianoRoll.getSelection();
        if (!sel || !this.song) return;
        const inRange = this.song.notes.filter(n =>
            n.startTick >= sel.start && n.startTick < sel.end
        );
        this.clipboard = {
            notes: inRange.map(n => ({ ...n, startTick: n.startTick - sel.start })),
            lengthTicks: sel.end - sel.start,
        };
        UIManager.showStatus(`Copied ${inRange.length} notes (${sel.end - sel.start} ticks)`, 'success');
    }

    /** Copy the selection then delete its notes from the song. Keeps selection bars. */
    static cutSelection() {
        const sel = PianoRoll.getSelection();
        if (!sel || !this.song) return;
        this.copySelection();
        this._removeNotesInRange(sel.start, sel.end);
        this.song.metadata.dirty = true;
        PianoRoll.setSong(this.song);
        Minimap.setSong(this.song);
        this._updateStatusLine();
    }

    /** Paste the clipboard at the write cursor (advancing it past the paste). */
    static pasteAtCursor() {
        if (!this.clipboard || !this.song) return;
        const dest = this.writeCursorTick;
        for (const n of this.clipboard.notes) {
            this.song.notes.push({ ...n, startTick: n.startTick + dest });
        }
        this.writeCursorTick = dest + this.clipboard.lengthTicks;
        this.song.metadata.dirty = true;
        PianoRoll.setSong(this.song);
        Minimap.setSong(this.song);
        PianoRoll.setPlayhead(this.writeCursorTick);
        Minimap.setPlayhead(this.writeCursorTick);
        UIManager.showStatus(`Pasted ${this.clipboard.notes.length} notes at tick ${dest}`, 'success');
        this._updateStatusLine();
    }

    /** Delete notes inside the selection (no clipboard change). Clears selection. */
    static deleteSelection() {
        const sel = PianoRoll.getSelection();
        if (!sel || !this.song) return;
        const removed = this._removeNotesInRange(sel.start, sel.end);
        this.song.metadata.dirty = true;
        PianoRoll.setSong(this.song);
        Minimap.setSong(this.song);
        PianoRoll.clearSelection();
        UIManager.showStatus(`Deleted ${removed} notes`, 'success');
        this._updateStatusLine();
    }

    /** Returns number removed. */
    static _removeNotesInRange(startTick, endTick) {
        const before = this.song.notes.length;
        this.song.notes = this.song.notes.filter(n =>
            !(n.startTick >= startTick && n.startTick < endTick)
        );
        return before - this.song.notes.length;
    }

    /**
     * Wire keyboard shortcuts for the Music tab: clipboard, transport, and
     * selection transpose. All shortcuts skip when the user is typing in an
     * input/textarea on the page.
     */
    static _wireClipboardShortcuts() {
        window.addEventListener('keydown', (e) => {
            const musicTab = document.getElementById('music-editor-content');
            if (!musicTab || !musicTab.classList.contains('active')) return;
            const ae = document.activeElement;
            const tag = ae?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || ae?.isContentEditable) return;

            const mod = e.metaKey || e.ctrlKey;
            if (mod && e.key === 'c') {
                if (PianoRoll.getSelection()) { e.preventDefault(); this.copySelection(); }
            } else if (mod && e.key === 'x') {
                if (PianoRoll.getSelection()) { e.preventDefault(); this.cutSelection(); }
            } else if (mod && e.key === 'v') {
                if (this.clipboard) { e.preventDefault(); this.pasteAtCursor(); }
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                if (PianoRoll.getSelection()) { e.preventDefault(); this.deleteSelection(); }
            } else if (e.key === ' ' || e.code === 'Space') {
                // Spacebar = Play/Pause (universal music-app shortcut)
                e.preventDefault();
                this.play();
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                // Transpose the selection: ±1 semitone, or ±1 octave with Shift
                if (PianoRoll.getSelection()) {
                    e.preventDefault();
                    const delta = (e.key === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? 12 : 1);
                    this.transposeSelection(delta);
                }
            }
        });
    }

    /**
     * Transpose every melody note that starts inside the selection by `delta`
     * semitones, clamped to the Intellivision playable range (C2..C7). Drums
     * are untouched.
     */
    static transposeSelection(delta) {
        const sel = PianoRoll.getSelection();
        if (!sel || !this.song || !delta) return;
        const MIN = 36, MAX = 96;   // C2..C7
        let moved = 0;
        for (const n of this.song.notes) {
            if (n.drum) continue;
            if (n.pitch == null) continue;
            if (n.startTick < sel.start || n.startTick >= sel.end) continue;
            const next = Math.max(MIN, Math.min(MAX, n.pitch + delta));
            if (next !== n.pitch) { n.pitch = next; moved++; }
        }
        if (moved > 0) {
            this.song.metadata.dirty = true;
            PianoRoll.setSong(this.song);
            Minimap.setSong(this.song);
            UIManager.showStatus(
                `Transposed ${moved} notes by ${delta > 0 ? '+' : ''}${delta} semitone${Math.abs(delta) === 1 ? '' : 's'}`,
                'success'
            );
            this._updateStatusLine();
        }
    }

    /** Show note-under-cursor info at the end of the status line (or clear it). */
    static _showHoverInfo(info) {
        const el = document.getElementById('music-hover-info');
        if (!el) return;
        el.textContent = info ? `🎵 ${info}` : '';
    }

    // ── Software keyboard ───────────────────────────────────────────────────

    static NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

    /**
     * Build the software keyboard. Two modes:
     *   - 'wide':    full C2-C7 (5 octaves), edge-to-edge widescreen layout
     *   - 'compact': 2-octave window starting at compactBaseOctave, with
     *                ◀ / ▶ shift buttons to move the window
     * White keys flex (wide) or have a fixed width (compact); black keys
     * are absolutely positioned between their neighbors in both modes.
     */
    static _renderKeyboard() {
        const container = document.getElementById('music-keyboard');
        if (!container) return;
        container.innerHTML = '';

        const isCompact = this.keyboardMode === 'compact';
        let lowMidi, highMidi;
        if (isCompact) {
            lowMidi  = (this.compactBaseOctave + 1) * 12;            // e.g. octave 4 → MIDI 60 (C4)
            highMidi = lowMidi + this.COMPACT_OCTAVES * 12;          // exclusive upper bound
        } else {
            lowMidi  = this.KEYBOARD_LOW_MIDI;
            highMidi = this.KEYBOARD_HIGH_MIDI;
        }

        // Switch container class so CSS can pick the right layout
        container.classList.toggle('music-keyboard-compact', isCompact);
        container.classList.toggle('music-keyboard-wide',   !isCompact);

        // First pass: white keys define the layout grid
        const whiteKeys = [];
        for (let midi = lowMidi; midi < highMidi; midi++) {
            const semi = midi % 12;
            if ([1, 3, 6, 8, 10].includes(semi)) continue;
            const octave = Math.floor(midi / 12) - 1;

            const key = document.createElement('div');
            key.className = 'music-key music-key-white';
            key.dataset.midi = midi;
            key.textContent = `${this.NOTE_NAMES[semi]}${octave}`;
            this._wireKeyEvents(key, midi);
            container.appendChild(key);
            whiteKeys.push({ midi, el: key });
        }

        // Second pass: position black keys absolutely between adjacent whites.
        // Deferred until layout settles so getBoundingClientRect is accurate.
        requestAnimationFrame(() => {
            for (let midi = lowMidi; midi < highMidi; midi++) {
                const semi = midi % 12;
                if (![1, 3, 6, 8, 10].includes(semi)) continue;
                const leftWhite = whiteKeys.find(w => w.midi === midi - 1);
                if (!leftWhite) continue;

                const key = document.createElement('div');
                key.className = 'music-key music-key-black';
                key.dataset.midi = midi;
                key.textContent = this.NOTE_NAMES[semi];
                this._wireKeyEvents(key, midi);

                const leftRect      = leftWhite.el.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                const leftOffset    = leftRect.right - containerRect.left;
                const blackWidth    = isCompact ? 26 : 20;
                key.style.position = 'absolute';
                key.style.left     = `${leftOffset - blackWidth / 2}px`;
                key.style.width    = `${blackWidth}px`;
                container.appendChild(key);
            }
        });

        this._updateKeyboardModeUI();
    }

    /** Toggle between 'wide' (full C2–C7) and 'compact' (2-octave + shift) modes. */
    static toggleKeyboardMode() {
        this.keyboardMode = (this.keyboardMode === 'wide') ? 'compact' : 'wide';
        this._renderKeyboard();
    }

    /** Compact-mode only: shift the 2-octave window down one octave. */
    static octaveDown() {
        if (this.keyboardMode !== 'compact') return;
        if (this.compactBaseOctave > 1) {
            this.compactBaseOctave--;
            this._renderKeyboard();
        }
    }

    /** Compact-mode only: shift the 2-octave window up one octave. */
    static octaveUp() {
        if (this.keyboardMode !== 'compact') return;
        // Top of compact window must stay <= KEYBOARD_HIGH_MIDI
        const topMidi = (this.compactBaseOctave + 1 + this.COMPACT_OCTAVES) * 12;
        if (topMidi < this.KEYBOARD_HIGH_MIDI) {
            this.compactBaseOctave++;
            this._renderKeyboard();
        }
    }

    /** Sync the toggle button label, octave-shift visibility, range label, and hint. */
    static _updateKeyboardModeUI() {
        const isCompact = this.keyboardMode === 'compact';

        const toggleBtn = document.getElementById('music-keyboard-mode-btn');
        if (toggleBtn) toggleBtn.textContent = isCompact ? 'Wide' : 'Compact';

        const shiftWrap = document.getElementById('music-keyboard-shift');
        if (shiftWrap) shiftWrap.style.display = isCompact ? 'flex' : 'none';

        const rangeLabel = document.getElementById('music-keyboard-range');
        if (rangeLabel) {
            if (isCompact) {
                const lowOct  = this.compactBaseOctave;
                const highOct = lowOct + this.COMPACT_OCTAVES - 1;
                rangeLabel.textContent = `C${lowOct}–B${highOct}`;
            } else {
                rangeLabel.textContent = 'C2–C7';
            }
        }

        const hint = document.getElementById('music-keyboard-hint');
        if (hint) {
            hint.textContent = isCompact
                ? 'Compact 2-octave window. Use ◀ / ▶ to shift octave. Click a key to preview + place a note at the write cursor.'
                : 'Full range C2–C7. Click a key to preview + place a note at the write cursor. Click the ruler to move the cursor.';
        }
    }

    /** Attach mouse + touch event handlers to a keyboard key element. */
    static _wireKeyEvents(key, midi) {
        key.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this._onKeyPress(midi);
            key.classList.add('pressed');
        });
        key.addEventListener('mouseup', () => key.classList.remove('pressed'));
        key.addEventListener('mouseleave', () => key.classList.remove('pressed'));
        key.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this._onKeyPress(midi);
            key.classList.add('pressed');
        }, { passive: false });
        key.addEventListener('touchend', () => key.classList.remove('pressed'));
    }

    /**
     * Software keyboard key press:
     *   1. Preview the note (short blip so user hears what they're placing)
     *   2. Add the note at writeCursorTick on the current channel
     *   3. Advance writeCursorTick by one ticksPerNote step
     *   4. Update the playhead to show the write cursor position
     */
    static _onKeyPress(midi) {
        if (!this.song) return;
        const step = this.engine.tempoAt(this.song, this.writeCursorTick) || 8;
        const ch   = this.currentChannel;

        // Don't add melody notes if a drum channel is selected (3 or 7)
        if (ch === 3 || ch === 7) return;

        // Preview: play a short blip so the user hears the note
        this._previewNote(midi);

        // Honor PSG mono-per-channel: replace any existing pitched note on
        // this channel at the cursor tick instead of stacking on top.
        const existingIdx = this.song.notes.findIndex(n =>
            n.channel === ch && n.startTick === this.writeCursorTick && n.pitch != null
        );
        if (existingIdx >= 0) {
            const existing = this.song.notes[existingIdx];
            existing.pitch      = midi;
            existing.instrument = this.currentInstrument;
        } else {
            // Trim any earlier sustained note that would have overlapped
            this._trimPriorNoteAt(ch, this.writeCursorTick);
            this.song.notes.push({
                startTick:     this.writeCursorTick,
                durationTicks: step,
                channel:       ch,
                pitch:         midi,
                instrument:    this.currentInstrument,
                drum:          null,
            });
        }

        // Advance write cursor
        this.writeCursorTick += step;

        // Show the cursor position — green write cursor on roll, red marker
        // on the minimap (which only has one indicator).
        PianoRoll.setWriteCursor(this.writeCursorTick);
        Minimap.setPlayhead(this.writeCursorTick);

        this.song.metadata.dirty = true;
        PianoRoll.setSong(this.song);
        Minimap.setSong(this.song);
        // Restore cursor after setSong clears it
        PianoRoll.setWriteCursor(this.writeCursorTick);
        Minimap.setPlayhead(this.writeCursorTick);
        this._updateStatusLine();
    }

    /** Play a brief preview blip for a note (50ms, just enough to hear the pitch). */
    static _previewNote(midi) {
        try {
            PsgSynth._ensureContext();
            const freq = 440 * Math.pow(2, (midi - 69) / 12);
            const osc = PsgSynth.ctx.createOscillator();
            const gain = PsgSynth.ctx.createGain();
            osc.type = 'square';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.12, PsgSynth.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, PsgSynth.ctx.currentTime + 0.12);
            osc.connect(gain).connect(PsgSynth.masterGain || PsgSynth.ctx.destination);
            osc.start(PsgSynth.ctx.currentTime);
            osc.stop(PsgSynth.ctx.currentTime + 0.15);
        } catch (_) { /* audio context not available — skip preview */ }
    }

    // ── Status line ─────────────────────────────────────────────────────────

    /** Update the status line. Optional currentTick shows position during playback. */
    static _updateStatusLine(currentTick = null) {
        const status = document.getElementById('music-status-line');
        if (!status) return;
        const notes  = this.song?.notes ?? [];
        const melody = notes.filter(n => n.pitch !== null).length;
        const drums  = notes.filter(n => n.drum !== null && n.drum !== undefined).length;
        const tempo  = this.song?.ticksPerNote ?? 8;
        const label  = this.song?.label || '(unnamed)';
        const totalTicks = this.engine.getTotalTicks?.(this.song) ?? 0;

        const framerate = 50;   // IntyBASIC MUSIC = 50 ticks/sec (manual.txt:1228)
        const totalSec  = totalTicks / framerate;
        const fmt = (sec) => {
            const m = Math.floor(sec / 60);
            const s = (sec % 60).toFixed(1).padStart(4, '0');
            return `${m}:${s}`;
        };

        // Loop indicator — only shown if the song actually has a JUMP/REPEAT
        const loopInfo = this.engine.getLoopInfo?.(this.song);
        let loopBadge = '';
        if (loopInfo) {
            const loopSec = loopInfo.loopDuration / framerate;
            loopBadge = this.loopEnabled
                ? ` · 🔁 ${this.LOOP_COUNT}× (${fmt(loopSec)} loop)`
                : ` · ➡️ loop disabled`;
        }

        let position = '';
        // Status reads the RAW (unwrapped) tick so the time display reflects
        // actual playback time even mid-loop. PianoRoll's visual playhead
        // is the wrapped one.
        const tick = currentTick ?? PianoRoll.playheadTickRaw ?? PianoRoll.playheadTick;
        if (tick != null) {
            const curSec = tick / framerate;
            position = ` · ⏱ ${fmt(curSec)} / ${fmt(totalSec)}`;
        } else if (totalTicks > 0) {
            position = ` · ⏱ ${fmt(totalSec)} total`;
        }

        // BPM: 50 ticks/sec on hardware. A "beat" in this editor is 4
        // subdivisions = 4 ticks-per-note × ticksPerNote. So:
        //   beats/sec = 50 / (tempo * 4)   →   bpm = beats/sec * 60
        const bpm = Math.round((framerate * 60) / (tempo * 4));

        // Estimated ROM bytes — composers need this to stay within their
        // game's allocated music budget. Formatted as "Nb" up to 1KB,
        // "N.NkB" above that.
        const romBytes = this.engine.estimateRomBytes?.(this.song) ?? 0;
        const romStr = romBytes < 1024
            ? `${romBytes} B`
            : `${(romBytes / 1024).toFixed(1)} kB`;

        // Opaque-container engines (ZMUS Phase 1) don't have a meaningful
        // per-note tempo — the bytecode hasn't been decoded yet. Show the
        // raw container size instead of a phony "tempo / BPM".
        const isOpaque = (this.engine.formatSlug === 'zmus')
                      && (this.song?.metadata?.zmusBytes?.length > 0);
        if (isOpaque) {
            const decleCount = this.song.metadata.zmusBytes.length;
            status.textContent =
                `${label}  ·  ZMUS opaque container · ${decleCount} DECLEs (${romStr})  ·  ` +
                `bytecode decode is Phase 2 — round-trips on export but no piano-roll yet  ·  ` +
                `${this.engine.formatName}`;
            return;
        }

        status.textContent =
            `${label}  ·  ${melody} notes, ${drums} drums  ·  ` +
            `tempo: ${tempo} ticks/note (~${bpm} BPM)  ·  ` +
            `ROM: ~${romStr}  ·  ` +
            `${this.engine.formatName}${position}${loopBadge}`;
    }
}
