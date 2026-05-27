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

// Registry of available engines. Phases 5/8/9 add ECS / JLP-zmus / raw-PSG here.
const ENGINES = {
    intybasic: IntyBasicMusic,
};

export class MusicEditor {
    static engine     = IntyBasicMusic;   // active engine class
    static song       = null;             // current SongIR
    static isPlaying  = false;

    /** Called once when the user first switches to the Music tab. */
    static init() {
        this.song = this.engine.defaultSong();
        PianoRoll.init('music-piano-roll');
        PianoRoll.setSong(this.song);
        this._renderEngineSelector();
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
            `Paste ${this.engine.formatName} source.\n\n` +
            `Phase 1: this will parse and render in the piano-roll.\n` +
            `Phase 0: parser is a stub — pasting returns an empty song.`
        );
        if (text == null) return;
        try {
            this.song = this.engine.parse(text);
            PianoRoll.setSong(this.song);
            this._updateStatusLine();
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
        this.song = this.engine.defaultSong();
        PianoRoll.setSong(this.song);
        this._updateStatusLine();
    }

    static play() {
        // Phase 2: spin up psgSynth, schedule events, animate playhead.
        alert('Playback arrives in Phase 2 (Web Audio synth).');
    }

    static stop() {
        // Phase 2: tear down synth.
        this.isPlaying = false;
    }

    // ── Status line ─────────────────────────────────────────────────────────

    static _updateStatusLine() {
        const status = document.getElementById('music-status-line');
        if (!status) return;
        const notes  = this.song?.notes ?? [];
        const melody = notes.filter(n => n.pitch !== null).length;
        const drums  = notes.filter(n => n.drum !== null && n.drum !== undefined).length;
        const ch     = this.engine.channelCount;
        const tempo  = this.song?.ticksPerNote ?? 8;
        const label  = this.song?.label || '(unnamed)';
        status.textContent =
            `${this.engine.formatName} · ${label} · ${ch} channels · ` +
            `tempo: ${tempo} ticks/note · ` +
            `${melody} notes, ${drums} drum hits`;
    }
}
