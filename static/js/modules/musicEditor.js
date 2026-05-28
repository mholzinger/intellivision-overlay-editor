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

import { IntyBasicMusic } from './music/engines/intybasicMusic.js';
import { PianoRoll }      from './music/pianoRoll.js';
import { PsgSynth }       from './music/playback/psgSynth.js';

// Registry of available engines. Phases 5/8/9 add ECS / JLP-zmus / raw-PSG here.
const ENGINES = {
    intybasic: IntyBasicMusic,
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

    /** Called once when the user first switches to the Music tab. */
    static init() {
        this.song = this.engine.defaultSong();
        PianoRoll.init('music-piano-roll');
        PianoRoll.setSong(this.song);
        PianoRoll.setEditorCallbacks({
            onCellClick:        (tick, midi, isDrumLane, shiftKey) => this.handleCellClick(tick, midi, isDrumLane, shiftKey),
            onSeek:             (tick) => this.handleSeek(tick),
            onNoteHover:        (info) => this._showHoverInfo(info),
            onSelectionChange:  (sel)  => this._updatePlayButton(sel),
        });
        this._renderEngineSelector();
        this._updateStatusLine();
        this._loadDemosManifest();
        this._syncEditControls();
        this._wireClipboardShortcuts();
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
        PianoRoll.setPlayhead(tick);
        this._updateStatusLine(tick);
    }

    // ── Edit controls ───────────────────────────────────────────────────────

    static setChannel(channel) {
        this.currentChannel = channel;
        this._syncEditControls();
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
            btn.classList.toggle('active', parseInt(btn.dataset.channel) === this.currentChannel);
        });
        document.querySelectorAll('.music-instrument-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.instrument === this.currentInstrument);
        });
        document.querySelectorAll('.music-drum-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.drum === this.currentDrum);
        });
        const isDrumChannel = this.currentChannel === 3;
        const instGroup = document.getElementById('music-instrument-group');
        const drumGroup = document.getElementById('music-drum-group');
        if (instGroup) instGroup.classList.toggle('disabled', isDrumChannel);
        if (drumGroup) drumGroup.classList.toggle('disabled', !isDrumChannel);
    }

    // ── Click handling: add or delete a note ────────────────────────────────

    /**
     * Called by the piano-roll on every click.
     * @param {number} tick - tick position (snapped to ticksPerNote)
     * @param {number} midi - MIDI pitch (irrelevant for drum lane clicks)
     * @param {boolean} isDrumLane - true if the click was in the drum strip
     * @param {boolean} shiftKey - true if shift was held (extend/sustain mode)
     */
    static handleCellClick(tick, midi, isDrumLane, shiftKey = false) {
        if (!this.song) return;
        // Force the active channel to drums if user clicked the drum lane
        if (isDrumLane && this.currentChannel !== 3) {
            this.setChannel(3);
        }
        if (!isDrumLane && this.currentChannel === 3) {
            this.setChannel(0);
        }

        if (this.currentChannel === 3) {
            this._toggleDrumAt(tick);
        } else if (shiftKey) {
            this._extendNoteAt(tick, midi);
        } else {
            this._toggleNoteAt(tick, midi);
        }
        this.song.metadata.dirty = true;
        PianoRoll.setSong(this.song);
        this._updateStatusLine();
    }

    static _toggleNoteAt(tick, midi) {
        const ch = this.currentChannel;
        const existing = this.song.notes.findIndex(n =>
            n.channel === ch && n.startTick === tick && n.pitch === midi
        );
        if (existing >= 0) {
            this.song.notes.splice(existing, 1);
        } else {
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

        // Case 1: shift+click directly ON a note's start tick → extend it
        const onNote = this.song.notes.find(n =>
            n.channel === ch && n.pitch === midi && n.startTick === tick
        );
        if (onNote) {
            onNote.durationTicks += step;
            return;
        }

        // Case 2: shift+click on the cell immediately after a note's right edge
        const adjacent = this.song.notes.find(n =>
            n.channel === ch && n.pitch === midi &&
            n.startTick + n.durationTicks === tick
        );
        if (adjacent) {
            adjacent.durationTicks += step;
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

    /** Cycle through drum types on repeated clicks: empty→M1→M2→M3→delete. */
    static _toggleDrumAt(tick) {
        const CYCLE = ['M1', 'M2', 'M3'];
        const existing = this.song.notes.findIndex(n =>
            n.channel === 3 && n.startTick === tick
        );
        if (existing >= 0) {
            const cur = this.song.notes[existing].drum;
            const idx = CYCLE.indexOf(cur);
            if (idx >= 0 && idx < CYCLE.length - 1) {
                // Advance to next drum type
                this.song.notes[existing].drum = CYCLE[idx + 1];
            } else {
                // Already M3 (or unknown) → delete
                this.song.notes.splice(existing, 1);
            }
        } else {
            // Empty cell → add M1 (first in cycle)
            this.song.notes.push({
                startTick:     tick,
                durationTicks: this.engine.tempoAt(this.song, tick),
                channel:       3,
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
        };

        listEl.innerHTML = demos.map(d => {
            const tagColor = tagColors[d.tag] || '#6a737d';
            return `
                <div class="music-demo-item" onclick="musicLoadDemo('${d.file}')"
                     style="padding:10px 14px; cursor:pointer; border-bottom:1px solid #f0f0f0; transition:background 0.15s;"
                     onmouseover="this.style.background='#f6f8fa'"
                     onmouseout="this.style.background='transparent'">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                        <strong style="font-size:13px; color:#24292e;">${d.title}</strong>
                        <span style="font-size:9px; padding:2px 6px; border-radius:3px; background:${tagColor}; color:#fff; font-weight:600; letter-spacing:0.5px;">${d.tag.toUpperCase()}</span>
                    </div>
                    <div style="font-size:11px; color:#586069; line-height:1.45;">${d.blurb}</div>
                </div>
            `;
        }).join('');
    }

    static toggleDemosDropdown() {
        const menu = document.getElementById('music-demos-dropdown-menu');
        if (!menu) return;
        menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
    }

    static async loadDemo(filename) {
        const menu = document.getElementById('music-demos-dropdown-menu');
        if (menu) menu.style.display = 'none';
        try {
            const r = await fetch(`/music/demos/${encodeURIComponent(filename)}`);
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const text = await r.text();
            this._loadNewSong(this.engine.parse(text));
        } catch (e) {
            alert(`Failed to load demo: ${e.message}`);
        }
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
        this.song = song;
        this.writeCursorTick = this.engine.getTotalTicks(song);  // cursor starts at end
        PianoRoll.setSong(this.song);
        this._updateStatusLine();
    }

    // ── Engine selection ────────────────────────────────────────────────────

    static _renderEngineSelector() {
        const select = document.getElementById('music-engine-select');
        if (!select) return;
        select.innerHTML = '';
        for (const slug of Object.keys(ENGINES)) {
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
        this._updateStatusLine();
    }

    // ── Toolbar actions (all are Phase 0 stubs) ────────────────────────────

    static showPasteDialog() {
        const text = prompt(
            `Paste ${this.engine.formatName} source. The piano-roll will parse and render it.`
        );
        if (text == null) return;
        try {
            this._loadNewSong(this.engine.parse(text));
        } catch (e) {
            alert(`Parse error: ${e.message}`);
        }
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
        if (!this.song || !this.song.notes || this.song.notes.length === 0) {
            alert('Nothing to play — paste an IntyBASIC MUSIC song first.');
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
                .map(e => ({ ...e, timeSec: e.timeSec - startSec }));
            totalTicks     = selection.end - selection.start;
            playheadOffset = selection.start;
            useFollowMode  = false;
            PianoRoll.setLoopInfo(null);
        } else {
            // ── Full-song playback (with loop expansion if enabled) ────────
            const loops = this.loopEnabled ? this.LOOP_COUNT : 1;
            events     = this.engine.toPlaybackEvents(this.song, 50, loops);
            totalTicks = this.engine.getPlaybackTicks
                ? this.engine.getPlaybackTicks(this.song, loops)
                : this.engine.getTotalTicks(this.song);
            loopForVisual = this.loopEnabled
                ? this.engine.getLoopInfo?.(this.song) ?? null
                : null;
            PianoRoll.setLoopInfo(loopForVisual);
            useFollowMode = true;
        }

        if (useFollowMode) PianoRoll.setFollowMode(true);

        PsgSynth.play(events, totalTicks, (tick) => {
            const displayTick = tick == null ? null : tick + playheadOffset;
            PianoRoll.setPlayhead(displayTick);
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
        this._updatePlayButton();
        this._updateStatusLine();
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
        PianoRoll.setPlayhead(this.writeCursorTick);
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
     * Wire Cmd/Ctrl+C/X/V and Delete to clipboard operations. Only fires when
     * the Music tab is active and the user isn't typing in an input.
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
            }
        });
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

        // Don't add melody notes if drum channel is selected
        if (ch === 3) return;

        // Preview: play a short blip so the user hears the note
        this._previewNote(midi);

        // Add the note at the write cursor
        this.song.notes.push({
            startTick:     this.writeCursorTick,
            durationTicks: step,
            channel:       ch,
            pitch:         midi,
            instrument:    this.currentInstrument,
            drum:          null,
        });

        // Advance write cursor
        this.writeCursorTick += step;

        // Show the cursor position on the piano-roll
        PianoRoll.setPlayhead(this.writeCursorTick);

        this.song.metadata.dirty = true;
        PianoRoll.setSong(this.song);
        // Restore playhead after setSong clears it
        PianoRoll.setPlayhead(this.writeCursorTick);
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

        status.textContent =
            `${label}  ·  ${melody} notes, ${drums} drums  ·  ` +
            `tempo: ${tempo} ticks/note  ·  ` +
            `${this.engine.formatName}${position}${loopBadge}`;
    }
}
