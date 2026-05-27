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

    /** Update the displayed song and re-render. */
    static setSong(song) {
        this.song = song;
        this.render();
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

    static _renderNotes() {
        if (!this.song || !this.song.notes) return;
        // Phase 1+: iterate this.song.notes and draw colored rectangles by channel.
        // Placeholder text for Phase 0:
        const { ctx, KEYBOARD_WIDTH } = this;
        ctx.fillStyle = '#666';
        ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('Phase 0 scaffolding — note rendering in Phase 1',
                     KEYBOARD_WIDTH + 12, 12);
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
        this.canvas.height = this.NUM_KEYS * this.KEY_HEIGHT;
    }
}
