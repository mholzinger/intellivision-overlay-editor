/**
 * Piano-roll editor surface for the Music Studio.
 *
 * Phase 0: blank canvas with a static grid + keyboard column. Click handler
 * stubbed to log the (channel, pitch, tick) target so we can verify hit
 * detection. Note placement, editing, playback cursor all come in Phase 1+.
 *
 * Layout:
 *   ┌──────────┬─────────────────────────────────────────┐
 *   │ keyboard │  time grid (notes appear here)          │
 *   │  (88     │                                         │
 *   │   keys)  │                                         │
 *   └──────────┴─────────────────────────────────────────┘
 *      ↑          ↑
 *   left gutter   main scrollable area
 */

export class PianoRoll {
    // ── Display constants ───────────────────────────────────────────────────
    static KEYBOARD_WIDTH   = 60;   // px gutter for the piano keys
    static KEY_HEIGHT       =  8;   // px per semitone row
    static TICK_WIDTH       = 16;   // px per tempo step
    static NUM_KEYS         = 60;   // 5 octaves (C2-B6) — Intellivision range
    static LOWEST_MIDI      = 36;   // C2 (MIDI 36)

    static canvas           = null;
    static ctx              = null;
    static song             = null;     // SongIR currently displayed
    static scrollX          = 0;        // tick-grid horizontal scroll

    /** Wire the piano-roll to its host canvas element. Called once on tab init. */
    static init(canvasId = 'music-piano-roll') {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');

        // Click-to-add-note hook (Phase 3 wires this to the editor).
        this.canvas.addEventListener('click', e => this._onClick(e));

        this._sizeToContainer();
        this.render();
    }

    /** Update the displayed song, resize the canvas to fit, then re-render. */
    static setSong(song) {
        this.song = song;
        this._sizeToSong();
        this.render();
    }

    /** Compute total song length in ticks so the canvas can be wide enough. */
    static _sizeToSong() {
        if (!this.song || !this.canvas) return;
        let maxTick = 0;
        for (const note of (this.song.notes || [])) {
            maxTick = Math.max(maxTick, note.startTick + note.durationTicks);
        }
        // Default to at least 64 ticks (8 beats × 4 ticks) so a blank song shows
        // something to click into.
        const widthTicks = Math.max(64, maxTick + 8);
        const desiredWidth = this.KEYBOARD_WIDTH + widthTicks * this.TICK_WIDTH;
        // Keep height fixed (semitones + drum strip)
        const drumStripHeight = 24;
        this.canvas.width  = desiredWidth;
        this.canvas.height = this.NUM_KEYS * this.KEY_HEIGHT + drumStripHeight;
    }

    /** Re-render everything. */
    static render() {
        if (!this.ctx) return;
        const { width, height } = this.canvas;

        // Background
        this.ctx.fillStyle = '#0a0a14';
        this.ctx.fillRect(0, 0, width, height);

        this._renderKeyboard();
        this._renderGrid();
        this._renderNotes();
    }

    // ── Drawing primitives ──────────────────────────────────────────────────

    static _renderKeyboard() {
        const { ctx, KEYBOARD_WIDTH, KEY_HEIGHT, NUM_KEYS, LOWEST_MIDI } = this;
        const { height } = this.canvas;
        ctx.fillStyle = '#1a1a24';
        ctx.fillRect(0, 0, KEYBOARD_WIDTH, height);

        // Draw 5 octaves of keys from top (highest) to bottom (lowest)
        for (let i = 0; i < NUM_KEYS; i++) {
            const midi = LOWEST_MIDI + (NUM_KEYS - 1 - i);
            const y    = i * KEY_HEIGHT;
            const noteInOctave = midi % 12;
            const isBlack = [1, 3, 6, 8, 10].includes(noteInOctave);
            ctx.fillStyle = isBlack ? '#16161e' : '#2a2a36';
            ctx.fillRect(0, y, KEYBOARD_WIDTH - 1, KEY_HEIGHT - 1);

            // Label C of each octave
            if (noteInOctave === 0) {
                const octave = Math.floor(midi / 12) - 1;
                ctx.fillStyle = '#888';
                ctx.font = `${Math.max(8, KEY_HEIGHT - 2)}px monospace`;
                ctx.textAlign = 'right';
                ctx.textBaseline = 'middle';
                ctx.fillText(`C${octave}`, KEYBOARD_WIDTH - 4, y + KEY_HEIGHT / 2);
            }
        }
    }

    static _renderGrid() {
        const { ctx, KEYBOARD_WIDTH, KEY_HEIGHT, TICK_WIDTH, NUM_KEYS } = this;
        const { width, height } = this.canvas;
        const gridLeft = KEYBOARD_WIDTH;

        // Horizontal lines per semitone
        ctx.strokeStyle = 'rgba(60, 60, 80, 0.3)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= NUM_KEYS; i++) {
            const y = i * KEY_HEIGHT;
            ctx.beginPath();
            ctx.moveTo(gridLeft, y + 0.5);
            ctx.lineTo(width, y + 0.5);
            ctx.stroke();
        }

        // Vertical lines per tick (every 4 ticks darker = beat)
        const ticksVisible = Math.ceil((width - gridLeft) / TICK_WIDTH);
        for (let t = 0; t <= ticksVisible; t++) {
            ctx.strokeStyle = (t % 4 === 0)
                ? 'rgba(80, 80, 110, 0.6)'
                : 'rgba(50, 50, 70, 0.3)';
            const x = gridLeft + t * TICK_WIDTH;
            ctx.beginPath();
            ctx.moveTo(x + 0.5, 0);
            ctx.lineTo(x + 0.5, height);
            ctx.stroke();
        }
    }

    // ── Note rendering ──────────────────────────────────────────────────────

    /** Per-channel colors. Channel 3 = drums (rendered in a strip at the bottom). */
    static CHANNEL_COLORS = {
        0: { fill: '#4a90d9', stroke: '#7bb8ff' },   // ch1 — blue
        1: { fill: '#5cb85c', stroke: '#8fdc8f' },   // ch2 — green
        2: { fill: '#d97a4a', stroke: '#ffa67b' },   // ch3 — orange
        3: { fill: '#c060c0', stroke: '#e896e8' },   // drums — purple (strip)
    };

    static _renderNotes() {
        if (!this.song || !this.song.notes || this.song.notes.length === 0) {
            const { ctx, KEYBOARD_WIDTH } = this;
            ctx.fillStyle = '#555';
            ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText('No notes yet — click ➕ New Song or 📋 Paste to begin',
                         KEYBOARD_WIDTH + 12, 12);
            return;
        }

        const { ctx, KEYBOARD_WIDTH, KEY_HEIGHT, TICK_WIDTH, NUM_KEYS, LOWEST_MIDI } = this;
        const { height } = this.canvas;
        const drumStripHeight = 24;
        const drumStripY = height - drumStripHeight;

        // Draw a faint divider above the drum strip
        ctx.fillStyle = 'rgba(180, 100, 180, 0.08)';
        ctx.fillRect(KEYBOARD_WIDTH, drumStripY, this.canvas.width - KEYBOARD_WIDTH, drumStripHeight);
        ctx.strokeStyle = 'rgba(180, 100, 180, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(KEYBOARD_WIDTH, drumStripY + 0.5);
        ctx.lineTo(this.canvas.width, drumStripY + 0.5);
        ctx.stroke();

        // Draw each note
        for (const note of this.song.notes) {
            const isDrum = note.drum !== null && note.drum !== undefined;
            const x = KEYBOARD_WIDTH + note.startTick * TICK_WIDTH;
            const w = Math.max(2, note.durationTicks * TICK_WIDTH - 1);
            const color = this.CHANNEL_COLORS[note.channel] || this.CHANNEL_COLORS[0];

            if (isDrum) {
                // Drums render as colored squares in the bottom strip
                const drumX = x;
                const drumW = Math.min(w, drumStripHeight - 4);
                const drumY = drumStripY + 4;
                ctx.fillStyle = color.fill;
                ctx.fillRect(drumX, drumY, drumW, drumStripHeight - 8);
                // Tiny label
                ctx.fillStyle = '#fff';
                ctx.font = '9px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(note.drum, drumX + drumW / 2, drumY + (drumStripHeight - 8) / 2);
                continue;
            }

            // Melody notes
            if (note.pitch < LOWEST_MIDI || note.pitch >= LOWEST_MIDI + NUM_KEYS) continue;
            const keyIdx = (NUM_KEYS - 1) - (note.pitch - LOWEST_MIDI);
            const y = keyIdx * KEY_HEIGHT;
            ctx.fillStyle = color.fill;
            ctx.fillRect(x, y + 1, w, KEY_HEIGHT - 2);
            ctx.strokeStyle = color.stroke;
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 0.5, y + 1.5, w - 1, KEY_HEIGHT - 3);

            // Instrument letter overlay if the note is wide enough
            if (note.instrument && w > 14 && KEY_HEIGHT >= 8) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
                ctx.font = `${Math.min(KEY_HEIGHT - 2, 9)}px monospace`;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText(note.instrument, x + 2, y + KEY_HEIGHT / 2);
            }
        }
    }

    // ── Hit detection (Phase 3 will use this for click-to-add) ──────────────

    static _onClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        if (x < this.KEYBOARD_WIDTH) return;     // clicked the keyboard gutter

        const tick = Math.floor((x - this.KEYBOARD_WIDTH) / this.TICK_WIDTH);
        const keyIdx = Math.floor(y / this.KEY_HEIGHT);
        const midi = this.LOWEST_MIDI + (this.NUM_KEYS - 1 - keyIdx);
        // Phase 3: dispatch to MusicEditor.addNoteAt(tick, midi).
        console.log('[PianoRoll] click → tick', tick, 'midi', midi);
    }

    static _sizeToContainer() {
        const container = this.canvas.parentElement;
        if (!container) return;
        this.canvas.width  = Math.max(600, container.clientWidth - 20);
        // 24px drum strip at the bottom matches _sizeToSong
        this.canvas.height = this.NUM_KEYS * this.KEY_HEIGHT + 24;
    }
}
