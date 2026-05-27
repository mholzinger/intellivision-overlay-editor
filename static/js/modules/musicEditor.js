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

    /** Called once when the user first switches to the Music tab. */
    static init() {
        this.song = this.engine.defaultSong();
        PianoRoll.init('music-piano-roll');
        PianoRoll.setSong(this.song);
        this._renderEngineSelector();
        this._updateStatusLine();
        this._loadDemosManifest();

        // Close demos dropdown when clicking outside it
        document.addEventListener('click', (e) => {
            const menu = document.getElementById('music-demos-dropdown-menu');
            const btn  = e.target.closest('.music-demos-dropdown');
            if (menu && !btn) menu.style.display = 'none';
        });
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
            this.song = this.engine.parse(text);
            PianoRoll.setSong(this.song);
            this._updateStatusLine();
        } catch (e) {
            alert(`Failed to load demo: ${e.message}`);
        }
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

        PsgSynth.play(events, totalTicks, (tick) => {
            PianoRoll.setPlayhead(tick);
            if (tick === null) {
                this.isPlaying = false;
                this._updatePlayButton();
            }
        });
        this.isPlaying = true;
        this._updatePlayButton();
    }

    static stop() {
        PsgSynth.stop();
        this.isPlaying = false;
        PianoRoll.setPlayhead(null);
        this._updatePlayButton();
    }

    static _updatePlayButton() {
        const btn = document.querySelector('#music-toolbar button[onclick="musicPlay()"]');
        if (btn) btn.textContent = this.isPlaying ? '⏸ Pause' : '▶ Play';
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
