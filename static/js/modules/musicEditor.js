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

    /** Called once when the user first switches to the Music tab. */
    static init() {
        this.song = this.engine.defaultSong();
        PianoRoll.init('music-piano-roll');
        PianoRoll.setSong(this.song);
        PianoRoll.setEditorCallbacks({
            onCellClick: (tick, midi, isDrumLane) => this.handleCellClick(tick, midi, isDrumLane),
            onSeek:      (tick) => this.handleSeek(tick),
        });
        this._renderEngineSelector();
        this._updateStatusLine();
        this._loadDemosManifest();
        this._syncEditControls();

        // Close demos dropdown when clicking outside it
        document.addEventListener('click', (e) => {
            const menu = document.getElementById('music-demos-dropdown-menu');
            const btn  = e.target.closest('.music-demos-dropdown');
            if (menu && !btn) menu.style.display = 'none';
        });
    }

    /** Ruler click — seek to that tick. While playing this jumps the playback. */
    static handleSeek(tick) {
        if (PsgSynth.isPlaying()) {
            // Stop current playback then resume from the new position.
            // For Phase MVP: just stop and let the user press Play again.
            PsgSynth.stop();
            this.isPlaying = false;
            this._updatePlayButton();
        }
        // Show the playhead at the seeked position even when not playing
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
     */
    static handleCellClick(tick, midi, isDrumLane) {
        if (!this.song) return;
        // Force the active channel to drums if user clicked the drum lane
        // (intuitive: click drum strip → drum note added). Also flip the other way.
        if (isDrumLane && this.currentChannel !== 3) {
            this.setChannel(3);
        }
        if (!isDrumLane && this.currentChannel === 3) {
            // Click in melody area while drum is active — silently switch to ch1
            this.setChannel(0);
        }

        if (this.currentChannel === 3) {
            this._toggleDrumAt(tick);
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
                durationTicks: this.song.ticksPerNote,
                channel:       ch,
                pitch:         midi,
                instrument:    this.currentInstrument,
                drum:          null,
            });
        }
    }

    static _toggleDrumAt(tick) {
        const existing = this.song.notes.findIndex(n =>
            n.channel === 3 && n.startTick === tick
        );
        if (existing >= 0) {
            this.song.notes.splice(existing, 1);
        } else {
            this.song.notes.push({
                startTick:     tick,
                durationTicks: this.song.ticksPerNote,
                channel:       3,
                pitch:         null,
                instrument:    null,
                drum:          this.currentDrum,
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
        // Force the piano-roll back to static / clean state BEFORE swapping
        // in the new song — guarantees the next play() starts from a known
        // baseline regardless of what the previous session left behind.
        PianoRoll.setFollowMode(false);
        this.song = song;
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
        const events     = this.engine.toPlaybackEvents(this.song);
        const totalTicks = this.engine.getTotalTicks(this.song);

        // Switch to player-piano scroll mode for tracking
        PianoRoll.setFollowMode(true);

        PsgSynth.play(events, totalTicks, (tick) => {
            PianoRoll.setPlayhead(tick);
            this._updateStatusLine(tick);
            if (tick === null) {
                this.isPlaying = false;
                this._updatePlayButton();
                // Back to static mode so the user can scroll/edit freely
                PianoRoll.setFollowMode(false);
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
        this._updatePlayButton();
        this._updateStatusLine();
    }

    static _updatePlayButton() {
        const btn = document.querySelector('#music-toolbar button[onclick="musicPlay()"]');
        if (btn) btn.textContent = this.isPlaying ? '⏸ Pause' : '▶ Play';
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

        const framerate = 60;   // NTSC; PAL toggle later
        const totalSec  = totalTicks / framerate;
        const fmt = (sec) => {
            const m = Math.floor(sec / 60);
            const s = (sec % 60).toFixed(1).padStart(4, '0');
            return `${m}:${s}`;
        };

        let position = '';
        const tick = currentTick ?? PianoRoll.playheadTick;
        if (tick != null) {
            const curSec = tick / framerate;
            position = ` · ⏱ ${fmt(curSec)} / ${fmt(totalSec)}`;
        } else if (totalTicks > 0) {
            position = ` · ⏱ ${fmt(totalSec)} total`;
        }

        status.textContent =
            `${label}  ·  ${melody} notes, ${drums} drums  ·  ` +
            `tempo: ${tempo} ticks/note  ·  ` +
            `${this.engine.formatName}${position}`;
    }
}
