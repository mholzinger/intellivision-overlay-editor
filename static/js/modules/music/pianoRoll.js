/**
 * Piano-roll editor surface for the Music Studio.
 *
 * Layout (left-to-right):
 *   ┌──────────┬────────────────────────────────────────────────┐
 *   │ keyboard │  ruler / time axis                             │ ← RULER_HEIGHT
 *   │  (fixed) ├────────────────────────────────────────────────┤
 *   │  C2-B6   │  semitone grid + notes                         │
 *   │          │                                                │
 *   │          ├────────────────────────────────────────────────┤
 *   │          │  drum strip (M1/M2/M3 hits)                    │ ← DRUM_HEIGHT
 *   └──────────┴────────────────────────────────────────────────┘
 *
 * Two scroll modes:
 *   • 'static'  — canvas is the full song width, user scrolls the container.
 *                 Used while stopped / editing. You see the entire score.
 *   • 'follow'  — canvas is viewport-sized; playhead is FIXED at PLAYHEAD_X.
 *                 The drawing transform shifts the music horizontally so the
 *                 score scrolls past the stationary playhead — player-piano
 *                 style. Used during playback for tracking.
 *
 * Mode auto-switches: PianoRoll.setFollowMode(true) on play, false on stop.
 */

export class PianoRoll {
    // ── Display constants ───────────────────────────────────────────────────
    static KEYBOARD_WIDTH   = 60;   // px gutter for the piano keys
    static KEY_HEIGHT       =  8;   // px per semitone row
    static TICK_WIDTH       = 16;   // px per tempo step
    static NUM_KEYS         = 60;   // 5 octaves (C2-B6) — Intellivision range
    static LOWEST_MIDI      = 36;   // C2 (MIDI 36)
    static RULER_HEIGHT     = 22;   // px strip at top for timeline ruler
    static DRUM_HEIGHT      = 24;   // px strip at bottom for drums
    // Where the stationary playhead sits (in canvas-x coordinates) when in
    // 'follow' scroll mode. We give some lead-in space after the keyboard
    // so users can see notes approaching before they hit the line.
    static PLAYHEAD_X       = 200;

    static canvas           = null;
    static ctx              = null;
    static song             = null;
    /**
     * playheadTick is the VISUAL position on the rendered piano-roll.
     * For looping playback, this wraps back to loopInfo.introEnd whenever
     * the raw playback tick crosses a loop boundary, so the line returns
     * to the start of the loop body instead of running off the right edge.
     */
    static playheadTick     = null;
    /** Raw playback tick from the synth (monotonically increasing). */
    static playheadTickRaw  = null;
    /** Write cursor: where the next typed/clicked note will land. Always
     *  visible (green dashed line). Distinct from playhead so the user can
     *  see at a glance "I'll add notes HERE, playback is at THERE". */
    static writeCursorTick  = null;
    static loopInfo         = null;     // { introEnd, loopEnd, loopDuration } or null
    static editorCallbacks  = {};   // { onCellClick(tick, midi, isDrumLane) }
    static hoverTick        = null;
    static hoverMidi        = null;
    static hoverIsDrumLane  = false;
    static hoverDrumChannel = null;   // 3 or 7 while hovering a drum strip, else null
    static scrollMode       = 'static';  // 'static' | 'follow'
    static framerate        = 50;        // IntyBASIC MUSIC ticks 50/sec (manual.txt:1228)

    /** True when the loaded song uses ECS 8-channel mode. Triggers a second
     *  drum strip and the channel-4-6 melody colors. */
    static hasEcs           = false;

    // ── Range selection ─────────────────────────────────────────────────────
    // selectionStart / selectionEnd are ticks (inclusive start, exclusive end).
    // Both null = no selection. _drag is the live drag state while the user is
    // pressing the mouse down on the ruler.
    static selectionStart   = null;
    static selectionEnd     = null;
    static _drag            = null;   // { startTick, startX, currentTick, isDrag } | null

    /** Wire the piano-roll to its host canvas. Called once on tab init. */
    static init(canvasId = 'music-piano-roll') {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');

        this.canvas.addEventListener('mousedown', e => this._onMouseDown(e));
        this.canvas.addEventListener('click', e => this._onClick(e));
        this.canvas.addEventListener('mousemove', e => this._onMouseMove(e));
        this.canvas.addEventListener('mouseleave', () => {
            this.hoverTick = null;
            this.hoverMidi = null;
            this.render();
        });
        this.canvas.addEventListener('contextmenu', e => {
            e.preventDefault();
            this._onClick(e);
        });
        // Window-level mouseup so a drag that ends off-canvas still finalises
        window.addEventListener('mouseup', e => this._onMouseUp(e));
        // Esc clears any active selection (skip when the user is typing in
        // another input on the page so we don't steal their Escape).
        window.addEventListener('keydown', e => {
            if (e.key !== 'Escape') return;
            const ae = document.activeElement;
            const tag = ae?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || ae?.isContentEditable) return;
            if (this.selectionStart != null) this.clearSelection();
        });

        // Resize follow-mode canvas when the window changes
        window.addEventListener('resize', () => {
            if (this.scrollMode === 'follow') {
                this._sizeForFollowMode();
                this.render();
            }
        });

        this._sizeForStaticMode();
        this.render();
    }

    /** Editor registers callbacks here so the piano-roll stays format-neutral. */
    static setEditorCallbacks(cbs) {
        this.editorCallbacks = cbs || {};
    }

    /** Toggle between 'static' (full song visible, free-scroll) and 'follow'
     *  (player-piano style — fixed playhead, score scrolls past).
     *  Always re-runs the sizing pass — callers can rely on this being a hard
     *  reset, which prevents the "stale follow-mode after song change" bug. */
    static setFollowMode(enabled) {
        this.scrollMode = enabled ? 'follow' : 'static';
        if (enabled) this._sizeForFollowMode();
        else         this._sizeForStaticMode();
        this.render();
    }

    /** Update the displayed song, resize, then re-render.
     *  Loading a new song always clears the playhead — the old position has
     *  no meaning for the new song. */
    static setSong(song) {
        this.song = song;
        this.hasEcs = (song?.channelCount || 0) >= 8;
        this.playheadTick = null;
        this.hoverTick = null;
        if (this.scrollMode === 'follow') this._sizeForFollowMode();
        else                              this._sizeForStaticMode();
        this.render();
    }

    /**
     * Set the loop structure that maps raw playback ticks → visual ticks.
     * Pass null to clear (non-looping playback or stopped state).
     * Caller (MusicEditor) sets this before play() and clears on stop().
     */
    static setLoopInfo(loopInfo) {
        this.loopInfo = loopInfo;
    }

    /**
     * Set/clear the playhead position (in raw playback ticks).
     * The raw tick is stored as playheadTickRaw; the visual tick (used
     * for rendering) is derived by mapping raw → visual through loopInfo
     * so that during loop iterations 2+ the playhead jumps back to the
     * loop start position instead of scrolling off into empty space.
     */
    static setPlayhead(tick) {
        this.playheadTickRaw = tick;
        this.playheadTick    = this._mapRawTickToVisual(tick);
        this.render();
        if (tick !== null && this.scrollMode === 'static') {
            this._scrollPlayheadIntoView();
        }
    }

    /**
     * Returns the current ruler selection as { start, end } (start inclusive,
     * end exclusive, both in ticks). Null when no selection is active.
     */
    static getSelection() {
        if (this.selectionStart == null || this.selectionEnd == null) return null;
        if (this.selectionEnd <= this.selectionStart) return null;
        return { start: this.selectionStart, end: this.selectionEnd };
    }

    static setSelection(start, end) {
        if (start == null || end == null || end <= start) {
            this.clearSelection();
            return;
        }
        this.selectionStart = start;
        this.selectionEnd   = end;
        this.render();
        const cb = this.editorCallbacks.onSelectionChange;
        if (typeof cb === 'function') cb(this.getSelection());
    }

    static clearSelection() {
        const had = this.selectionStart != null;
        this.selectionStart = null;
        this.selectionEnd   = null;
        if (had) {
            this.render();
            const cb = this.editorCallbacks.onSelectionChange;
            if (typeof cb === 'function') cb(null);
        }
    }

    /** Set/clear the green write-cursor marker (where the next note lands).
     *  In static mode this also warps the visible viewport to that tick so
     *  minimap clicks (and ruler seeks) feel like "jump there" — not just
     *  "move the marker off-screen". */
    static setWriteCursor(tick) {
        this.writeCursorTick = tick;
        this.render();
        if (tick != null && this.scrollMode === 'static') {
            this._scrollTickIntoView(tick);
        }
    }

    /** Map a raw playback tick to its position on the visually-rendered song. */
    static _mapRawTickToVisual(rawTick) {
        if (rawTick == null) return null;
        const loop = this.loopInfo;
        if (!loop || loop.loopDuration <= 0) return rawTick;
        if (rawTick < loop.introEnd) return rawTick;           // still in intro
        // Position within the current loop iteration:
        const intoBody = (rawTick - loop.introEnd) % loop.loopDuration;
        return loop.introEnd + intoBody;
    }

    // ── Sizing ──────────────────────────────────────────────────────────────

    /** Static mode: canvas spans the full song width (container scrolls). */
    static _sizeForStaticMode() {
        if (!this.canvas) return;
        let maxTick = 0;
        for (const note of (this.song?.notes || [])) {
            maxTick = Math.max(maxTick, note.startTick + note.durationTicks);
        }
        const widthTicks = Math.max(64, maxTick + 8);
        this.canvas.width  = this.KEYBOARD_WIDTH + widthTicks * this.TICK_WIDTH;
        this.canvas.height = this.RULER_HEIGHT + this.NUM_KEYS * this.KEY_HEIGHT + this._totalDrumHeight();
    }

    /** Follow mode: canvas = container viewport; we control scroll via drawing offset. */
    static _sizeForFollowMode() {
        if (!this.canvas) return;
        const container = this.canvas.parentElement;
        if (!container) return;
        // Reset any external scroll — follow mode doesn't use container scrollLeft
        container.scrollLeft = 0;
        this.canvas.width  = Math.max(800, container.clientWidth - 20);
        this.canvas.height = this.RULER_HEIGHT + this.NUM_KEYS * this.KEY_HEIGHT + this._totalDrumHeight();
    }

    // ── Coordinate helpers ──────────────────────────────────────────────────

    /** Pixel x at which `tick` should be drawn given the current scroll mode. */
    static _tickToX(tick) {
        if (this.scrollMode === 'follow' && this.playheadTick != null) {
            return this.PLAYHEAD_X + (tick - this.playheadTick) * this.TICK_WIDTH;
        }
        return this.KEYBOARD_WIDTH + tick * this.TICK_WIDTH;
    }

    /** Inverse: a canvas-x pixel converted back to a tick (for clicks). */
    static _xToTick(x) {
        if (this.scrollMode === 'follow' && this.playheadTick != null) {
            return (x - this.PLAYHEAD_X) / this.TICK_WIDTH + this.playheadTick;
        }
        return (x - this.KEYBOARD_WIDTH) / this.TICK_WIDTH;
    }

    // ── Top-level render ────────────────────────────────────────────────────

    static render() {
        if (!this.ctx) return;
        const { width, height } = this.canvas;

        // Background
        this.ctx.fillStyle = '#0a0a14';
        this.ctx.fillRect(0, 0, width, height);

        this._renderRuler();
        this._renderGrid();
        this._renderLoopRegion();  // translucent band over the loop body
        this._renderSelection();   // shaded between selection bars + bar markers
        this._renderNotes();
        this._renderHover();
        this._renderWriteCursor();   // green dashed — where the NEXT note lands
        this._renderPlayhead();      // red — current playback position
        // Keyboard drawn LAST so it's always on top — important for follow mode
        // where notes might otherwise overlap into the keyboard area.
        this._renderKeyboard();
    }

    /**
     * Draw the active selection (or live drag preview): a translucent overlay
     * spanning the selected tick range plus two vertical bars at the
     * boundaries. Drag-in-progress uses a slightly different tint so the user
     * sees feedback before mouseup commits.
     */
    /**
     * Translucent blue band over the loop body (introEnd → loopEnd) so the
     * user can see at a glance which bars will repeat when playback loops.
     * Mirrors the minimap's loop indicator.
     */
    static _renderLoopRegion() {
        const loop = this.loopInfo;
        if (!loop || loop.loopDuration <= 0) return;
        const { ctx, KEYBOARD_WIDTH, RULER_HEIGHT } = this;
        const { width, height } = this.canvas;
        const xStart = Math.max(KEYBOARD_WIDTH, this._tickToX(loop.introEnd));
        const xEnd   = Math.max(KEYBOARD_WIDTH, this._tickToX(loop.loopEnd));
        if (xEnd <= KEYBOARD_WIDTH || xStart >= width) return;
        ctx.fillStyle = 'rgba(80, 110, 220, 0.08)';
        const yTop = RULER_HEIGHT;
        const yBot = height - this._totalDrumHeight();
        ctx.fillRect(xStart, yTop, xEnd - xStart, yBot - yTop);
        // Subtle dashed boundary markers
        ctx.strokeStyle = 'rgba(130, 160, 230, 0.45)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(xStart + 0.5, yTop); ctx.lineTo(xStart + 0.5, yBot);
        ctx.moveTo(xEnd   - 0.5, yTop); ctx.lineTo(xEnd   - 0.5, yBot);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    static _renderSelection() {
        let start, end, isPreview = false;
        if (this._drag && this._drag.isDrag) {
            // Live drag preview
            const tickStep = this.song?.ticksPerNote || 1;
            const a = Math.min(this._drag.startTick, this._drag.currentTick);
            const b = Math.max(this._drag.startTick, this._drag.currentTick);
            start = Math.floor(a / tickStep) * tickStep;
            end   = Math.max(start + tickStep, Math.ceil(b / tickStep) * tickStep);
            isPreview = true;
        } else if (this.selectionStart != null && this.selectionEnd != null) {
            start = this.selectionStart;
            end   = this.selectionEnd;
        } else {
            return;
        }

        const { ctx, KEYBOARD_WIDTH, RULER_HEIGHT } = this;
        const { width, height } = this.canvas;
        const xStart = Math.max(KEYBOARD_WIDTH, this._tickToX(start));
        const xEnd   = Math.max(KEYBOARD_WIDTH, this._tickToX(end));
        if (xEnd <= KEYBOARD_WIDTH || xStart >= width) return;

        // Shaded region (skip the keyboard column; cover ruler → bottom)
        ctx.fillStyle = isPreview
            ? 'rgba(255, 215, 0, 0.10)'
            : 'rgba(255, 215, 0, 0.16)';
        ctx.fillRect(xStart, 0, xEnd - xStart, height);

        // Boundary bars
        ctx.strokeStyle = isPreview ? 'rgba(255, 215, 0, 0.75)' : '#ffd700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(xStart + 0.5, 0); ctx.lineTo(xStart + 0.5, height);
        ctx.moveTo(xEnd   - 0.5, 0); ctx.lineTo(xEnd   - 0.5, height);
        ctx.stroke();
        ctx.lineWidth = 1;

        // Mini header above the selection in the ruler area showing length
        const lenTicks = end - start;
        const label = `↔ ${lenTicks}t`;
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const midX = (xStart + xEnd) / 2;
        ctx.fillText(label, Math.max(midX, xStart + 18), 2);

        // Clear-selection (✕) button — only on a committed selection, not the
        // live preview. Sits just inside the right boundary bar at the top.
        if (!isPreview) {
            const btnR = 9;
            const btnX = Math.max(xStart + btnR + 2, xEnd - btnR - 4);
            const btnY = btnR + 2;
            ctx.fillStyle = 'rgba(40, 25, 0, 0.92)';
            ctx.beginPath();
            ctx.arc(btnX, btnY, btnR, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(btnX - 3, btnY - 3); ctx.lineTo(btnX + 3, btnY + 3);
            ctx.moveTo(btnX + 3, btnY - 3); ctx.lineTo(btnX - 3, btnY + 3);
            ctx.stroke();
            ctx.lineWidth = 1;
            this._selectionClearBtn = { x: btnX, y: btnY, r: btnR };
        } else {
            this._selectionClearBtn = null;
        }
    }

    /** True if event landed on the in-canvas ✕ clear-selection button. */
    static _isClickOnClearBtn(e) {
        const b = this._selectionClearBtn;
        if (!b) return false;
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top)  * scaleY;
        const dx = x - b.x, dy = y - b.y;
        return dx * dx + dy * dy <= b.r * b.r;
    }

    // ── Keyboard column ─────────────────────────────────────────────────────

    static _renderKeyboard() {
        const { ctx, KEYBOARD_WIDTH, KEY_HEIGHT, NUM_KEYS, LOWEST_MIDI, RULER_HEIGHT } = this;
        const { height } = this.canvas;
        // Mask any music that would have leaked under the keyboard area
        ctx.fillStyle = '#1a1a24';
        ctx.fillRect(0, 0, KEYBOARD_WIDTH, height);

        for (let i = 0; i < NUM_KEYS; i++) {
            const midi = LOWEST_MIDI + (NUM_KEYS - 1 - i);
            const y    = RULER_HEIGHT + i * KEY_HEIGHT;
            const noteInOctave = midi % 12;
            const isBlack = [1, 3, 6, 8, 10].includes(noteInOctave);
            ctx.fillStyle = isBlack ? '#16161e' : '#2a2a36';
            ctx.fillRect(0, y, KEYBOARD_WIDTH - 1, KEY_HEIGHT - 1);

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

    // ── Timeline ruler ──────────────────────────────────────────────────────

    static _renderRuler() {
        const { ctx, KEYBOARD_WIDTH, TICK_WIDTH, RULER_HEIGHT } = this;
        const { width } = this.canvas;

        // Background
        ctx.fillStyle = '#1e1e2a';
        ctx.fillRect(KEYBOARD_WIDTH, 0, width - KEYBOARD_WIDTH, RULER_HEIGHT);
        ctx.fillStyle = 'rgba(80, 80, 110, 0.5)';
        ctx.fillRect(KEYBOARD_WIDTH, RULER_HEIGHT - 1, width - KEYBOARD_WIDTH, 1);

        // Determine the tick range visible in the current view
        const tickStep = this.song?.ticksPerNote || 4;
        const minVisibleX = KEYBOARD_WIDTH;
        const maxVisibleX = width;
        const minTick = Math.max(0, Math.floor(this._xToTick(minVisibleX) / tickStep) * tickStep);
        const maxTick = Math.ceil(this._xToTick(maxVisibleX) / tickStep) * tickStep;

        // Tick marks at three weights:
        //   subdivisions — short, every tickStep
        //   beats        — medium, every 4 subdivisions, dim label
        //   bars         — full-height, bold bright bar number
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let t = minTick; t <= maxTick; t += tickStep) {
            const x = this._tickToX(t);
            if (x < KEYBOARD_WIDTH || x > width) continue;
            const subIdx = t / tickStep;
            const isBar  = (subIdx % 16) === 0;
            const isBeat = !isBar && (subIdx % 4) === 0;

            const tickHeight = isBar ? RULER_HEIGHT - 2 : (isBeat ? 8 : 4);
            ctx.strokeStyle = isBar
                ? 'rgba(200, 210, 240, 0.85)'
                : 'rgba(180, 180, 200, 0.4)';
            ctx.lineWidth = isBar ? 1.5 : 1;
            ctx.beginPath();
            ctx.moveTo(x + 0.5, RULER_HEIGHT - tickHeight);
            ctx.lineTo(x + 0.5, RULER_HEIGHT - 1);
            ctx.stroke();

            if (isBar) {
                // Bold bar number, right of the line, large.
                const beatTicks = tickStep * 4;
                const bar = Math.floor(t / (beatTicks * 4)) + 1;
                ctx.fillStyle = '#e6e8f0';
                ctx.font = 'bold 11px monospace';
                ctx.textAlign = 'left';
                ctx.fillText(String(bar), x + 4, RULER_HEIGHT / 2);
                ctx.textAlign = 'center';
            } else if (isBeat) {
                // Dim small beat number (just the beat digit, no bar prefix)
                const beatTicks = tickStep * 4;
                const beat = (Math.floor(t / beatTicks) % 4) + 1;
                ctx.fillStyle = 'rgba(140, 145, 165, 0.7)';
                ctx.font = '9px monospace';
                ctx.fillText(String(beat), x, RULER_HEIGHT / 2);
            }
        }
        ctx.lineWidth = 1;
    }

    /** Render the tick number as "1.1", "1.2", ... where the dot separates
     *  bar.beat. A "bar" is 4 beats = 16 ticks at tickStep=4 (i.e. 4*4=16 ticks).
     *  For songs with non-standard tempos we fall back to raw tick count. */
    static _tickLabel(tick) {
        const tickStep = this.song?.ticksPerNote || 4;
        const beatTicks = tickStep * 4;
        if (beatTicks > 0) {
            const bar = Math.floor(tick / (beatTicks * 4)) + 1;
            const beat = Math.floor((tick % (beatTicks * 4)) / beatTicks) + 1;
            return `${bar}.${beat}`;
        }
        return String(tick);
    }

    // ── Grid ─────────────────────────────────────────────────────────────────

    static _renderGrid() {
        const { ctx, KEYBOARD_WIDTH, KEY_HEIGHT, TICK_WIDTH, NUM_KEYS, RULER_HEIGHT } = this;
        const { width, height } = this.canvas;

        const gridTop = RULER_HEIGHT;
        const gridBottom = height - this._totalDrumHeight();

        // Horizontal lines per semitone (slightly darker every C)
        ctx.lineWidth = 1;
        for (let i = 0; i <= NUM_KEYS; i++) {
            const midi = this.LOWEST_MIDI + (NUM_KEYS - 1 - i);
            const isC = (midi % 12) === 0;
            ctx.strokeStyle = isC
                ? 'rgba(80, 80, 110, 0.35)'
                : 'rgba(60, 60, 80, 0.20)';
            const y = gridTop + i * KEY_HEIGHT;
            ctx.beginPath();
            ctx.moveTo(KEYBOARD_WIDTH, y + 0.5);
            ctx.lineTo(width, y + 0.5);
            ctx.stroke();
        }

        // Vertical lines per tick step. Three weights:
        //   subdivisions (every tickStep) — thinnest
        //   beats (every 4 subdivisions)  — medium
        //   bars  (every 4 beats)         — heavy, used by musicians to scan structure
        const tickStep = this.song?.ticksPerNote || 4;
        const minTick = Math.max(0, Math.floor(this._xToTick(KEYBOARD_WIDTH) / tickStep) * tickStep);
        const maxTick = Math.ceil(this._xToTick(width) / tickStep) * tickStep;
        for (let t = minTick; t <= maxTick; t += tickStep) {
            const x = this._tickToX(t);
            if (x < KEYBOARD_WIDTH || x > width) continue;
            const subIdx = t / tickStep;
            const isBar  = (subIdx % 16) === 0;
            const isBeat = !isBar && (subIdx % 4) === 0;
            ctx.strokeStyle = isBar
                ? 'rgba(160, 165, 200, 0.9)'
                : isBeat
                    ? 'rgba(80, 80, 110, 0.6)'
                    : 'rgba(50, 50, 70, 0.3)';
            ctx.lineWidth = isBar ? 1.5 : 1;
            ctx.beginPath();
            ctx.moveTo(x + 0.5, gridTop);
            ctx.lineTo(x + 0.5, gridBottom);
            ctx.stroke();
        }
        ctx.lineWidth = 1;

        // Drum strips. Layout (top-down) when ECS is active:
        //   [ECS DRUMS]  (channel 7)  — at gridBottom
        //   [BASE DRUMS] (channel 3)  — at gridBottom + DRUM_HEIGHT
        // Without ECS, just the base strip at gridBottom.
        const strips = this.hasEcs
            ? [
                { y: gridBottom,                    label: '🥁 ECS', tint: '#a050c8' },
                { y: gridBottom + this.DRUM_HEIGHT, label: '🥁 DRUMS', tint: '#c060c0' },
              ]
            : [
                { y: gridBottom,                    label: '🥁 DRUMS', tint: '#c060c0' },
              ];
        for (const strip of strips) {
            // Solid wash
            ctx.fillStyle = 'rgba(180, 100, 180, 0.18)';
            ctx.fillRect(KEYBOARD_WIDTH, strip.y, width - KEYBOARD_WIDTH, this.DRUM_HEIGHT);
            // Diagonal-stripe accent
            ctx.save();
            ctx.fillStyle = 'rgba(180, 100, 180, 0.08)';
            for (let sx = KEYBOARD_WIDTH; sx < width; sx += 12) {
                ctx.beginPath();
                ctx.moveTo(sx, strip.y);
                ctx.lineTo(sx + this.DRUM_HEIGHT, strip.y + this.DRUM_HEIGHT);
                ctx.lineTo(sx + this.DRUM_HEIGHT - 4, strip.y + this.DRUM_HEIGHT);
                ctx.lineTo(sx - 4, strip.y);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();
            // Top divider
            ctx.strokeStyle = 'rgba(220, 130, 220, 0.85)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(KEYBOARD_WIDTH, strip.y + 1);
            ctx.lineTo(width, strip.y + 1);
            ctx.stroke();
            ctx.lineWidth = 1;
            // Gutter label
            ctx.fillStyle = strip.tint;
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(strip.label, KEYBOARD_WIDTH / 2, strip.y + this.DRUM_HEIGHT / 2);
        }
    }

    // ── Notes ───────────────────────────────────────────────────────────────

    static CHANNEL_COLORS = {
        0: { fill: '#4a90d9', stroke: '#7bb8ff' },   // ch1   — blue   (base PSG)
        1: { fill: '#5cb85c', stroke: '#8fdc8f' },   // ch2   — green
        2: { fill: '#d97a4a', stroke: '#ffa67b' },   // ch3   — orange
        3: { fill: '#c060c0', stroke: '#e896e8' },   // drums — purple (base drums)
        4: { fill: '#48b8c0', stroke: '#7be0e8' },   // ch4   — cyan   (ECS PSG)
        5: { fill: '#bcc850', stroke: '#e0ec80' },   // ch5   — yellow-green
        6: { fill: '#c08858', stroke: '#e8b888' },   // ch6   — tan
        7: { fill: '#a050c8', stroke: '#d088e8' },   // ECS drums — deeper violet
    };

    /** Total height of all drum strips (one for base, two if ECS is active). */
    static _totalDrumHeight() {
        return this.DRUM_HEIGHT * (this.hasEcs ? 2 : 1);
    }

    static _renderNotes() {
        if (!this.song || !this.song.notes || this.song.notes.length === 0) {
            const { ctx, KEYBOARD_WIDTH, RULER_HEIGHT } = this;
            ctx.fillStyle = '#555';
            ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText('Click anywhere to add a note · 🎶 Demos for inspiration · 📋 Paste to import',
                         KEYBOARD_WIDTH + 12, RULER_HEIGHT + 8);
            return;
        }

        const { ctx, KEYBOARD_WIDTH, KEY_HEIGHT, TICK_WIDTH, NUM_KEYS, LOWEST_MIDI, RULER_HEIGHT } = this;
        const { width, height } = this.canvas;
        // Base-drum strip Y (always bottom). ECS-drum strip sits one DRUM_HEIGHT above it.
        const baseDrumY = height - this.DRUM_HEIGHT;
        const ecsDrumY  = baseDrumY - this.DRUM_HEIGHT;
        const gridTop = RULER_HEIGHT;

        for (const note of this.song.notes) {
            const x = this._tickToX(note.startTick);
            const w = Math.max(2, note.durationTicks * TICK_WIDTH - 1);
            // Cull anything entirely off-screen for performance
            if (x + w < KEYBOARD_WIDTH || x > width) continue;

            const isDrum = note.drum !== null && note.drum !== undefined;
            const color = this.CHANNEL_COLORS[note.channel] || this.CHANNEL_COLORS[0];

            if (isDrum) {
                // Route drum to the correct strip by channel (ch 7 = ECS).
                const stripY = (note.channel === 7) ? ecsDrumY : baseDrumY;
                const drumX = Math.max(KEYBOARD_WIDTH, x);
                const drumW = Math.min(w, this.DRUM_HEIGHT - 4);
                const drumY = stripY + 4;
                ctx.fillStyle = color.fill;
                ctx.fillRect(drumX, drumY, drumW, this.DRUM_HEIGHT - 8);
                ctx.fillStyle = '#fff';
                ctx.font = '9px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(note.drum, drumX + drumW / 2, drumY + (this.DRUM_HEIGHT - 8) / 2);
                continue;
            }

            if (note.pitch < LOWEST_MIDI || note.pitch >= LOWEST_MIDI + NUM_KEYS) continue;
            const keyIdx = (NUM_KEYS - 1) - (note.pitch - LOWEST_MIDI);
            const y = gridTop + keyIdx * KEY_HEIGHT;
            // Clip x so notes can't draw into the keyboard column
            const clippedX = Math.max(KEYBOARD_WIDTH, x);
            const clippedW = w - (clippedX - x);
            if (clippedW <= 0) continue;
            ctx.fillStyle = color.fill;
            ctx.fillRect(clippedX, y + 1, clippedW, KEY_HEIGHT - 2);
            ctx.strokeStyle = color.stroke;
            ctx.lineWidth = 1;
            ctx.strokeRect(clippedX + 0.5, y + 1.5, clippedW - 1, KEY_HEIGHT - 3);

            if (note.instrument && clippedW > 14 && KEY_HEIGHT >= 8 && clippedX === x) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
                ctx.font = `${Math.min(KEY_HEIGHT - 2, 9)}px monospace`;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText(note.instrument, x + 2, y + KEY_HEIGHT / 2);
            }
        }
    }

    // ── Playhead ────────────────────────────────────────────────────────────

    /**
     * Draw the write cursor — thin green dashed line showing where the next
     * typed/clicked note will land. Always visible (independent of playback),
     * so the user can see at a glance "playback is THERE, my next edit goes
     * HERE". Suppressed at tick 0 / null to avoid sticking a marker on the
     * keyboard column for fresh songs.
     */
    static _renderWriteCursor() {
        if (this.writeCursorTick == null) return;
        const { ctx, RULER_HEIGHT } = this;
        const x = this._tickToX(this.writeCursorTick);
        if (x < this.KEYBOARD_WIDTH || x > this.canvas.width) return;

        ctx.strokeStyle = 'rgba(80, 200, 120, 0.85)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(x + 0.5, RULER_HEIGHT);
        ctx.lineTo(x + 0.5, this.canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.lineWidth = 1;

        // Small green flag in the ruler so the cursor is also visible up there
        ctx.fillStyle = 'rgba(80, 200, 120, 0.85)';
        ctx.beginPath();
        ctx.moveTo(x,     RULER_HEIGHT - 6);
        ctx.lineTo(x + 8, RULER_HEIGHT - 3);
        ctx.lineTo(x,     RULER_HEIGHT);
        ctx.closePath();
        ctx.fill();
    }

    /** Draw the playhead — thick red line + triangle marker at the top. */
    static _renderPlayhead() {
        if (this.playheadTick == null) return;
        const { ctx, RULER_HEIGHT } = this;
        const x = this._tickToX(this.playheadTick);
        if (x < this.KEYBOARD_WIDTH || x > this.canvas.width) return;

        // Vertical line — bright red, 3px
        ctx.fillStyle = 'rgba(255, 60, 60, 0.92)';
        ctx.fillRect(x - 1, RULER_HEIGHT, 3, this.canvas.height - RULER_HEIGHT);

        // Triangle marker at the top — pointing down into the canvas
        ctx.fillStyle = '#ff3030';
        ctx.beginPath();
        ctx.moveTo(x - 6, 2);
        ctx.lineTo(x + 6, 2);
        ctx.lineTo(x,     RULER_HEIGHT - 2);
        ctx.closePath();
        ctx.fill();
    }

    /** In static mode, scroll the container so the playhead stays in view. */
    static _scrollPlayheadIntoView() {
        if (this.playheadTick != null) this._scrollTickIntoView(this.playheadTick);
    }

    /** Scroll the container (in static mode) so the given tick is on-screen.
     *  Used by both the playhead and the write cursor so that minimap-clicks
     *  and ruler-clicks warp the visible viewport, not just the markers. */
    static _scrollTickIntoView(tick) {
        if (!this.canvas || tick == null) return;
        const container = this.canvas.parentElement;
        if (!container) return;
        const x = this.KEYBOARD_WIDTH + tick * this.TICK_WIDTH;
        const ratio = container.clientWidth / this.canvas.clientWidth;
        const displayedX = x * ratio;
        const margin = 100;
        if (displayedX > container.scrollLeft + container.clientWidth - margin) {
            container.scrollLeft = displayedX - container.clientWidth + margin;
        }
        if (displayedX < container.scrollLeft + margin) {
            container.scrollLeft = Math.max(0, displayedX - margin);
        }
    }

    // ── Click / hover handling ──────────────────────────────────────────────

    static _eventToCell(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        if (x < this.KEYBOARD_WIDTH) return null;
        if (y < this.RULER_HEIGHT) {
            // Click in ruler area — interpret as seek request
            const rawTick = this._xToTick(x);
            const tickStep = this.song?.ticksPerNote || 1;
            const tick = Math.max(0, Math.floor(rawTick / tickStep) * tickStep);
            return { tick, midi: null, isDrumLane: false, drumChannel: null, isRuler: true };
        }

        const baseDrumY = this.canvas.height - this.DRUM_HEIGHT;
        const ecsDrumY  = baseDrumY - this.DRUM_HEIGHT;
        const isBaseDrum = y >= baseDrumY;
        const isEcsDrum  = this.hasEcs && !isBaseDrum && y >= ecsDrumY;
        const isDrumLane = isBaseDrum || isEcsDrum;
        const drumChannel = isEcsDrum ? 7 : (isBaseDrum ? 3 : null);

        const tickStep = this.song?.ticksPerNote || 1;
        const rawTick = this._xToTick(x);
        const tick = Math.max(0, Math.floor(rawTick / tickStep) * tickStep);

        const keyIdx = Math.floor((y - this.RULER_HEIGHT) / this.KEY_HEIGHT);
        const midi = this.LOWEST_MIDI + (this.NUM_KEYS - 1 - keyIdx);

        return { tick, midi, isDrumLane, drumChannel, isRuler: false };
    }

    static _onClick(e) {
        // If the user just finished a real drag on the ruler, the click event
        // also fires after mouseup — suppress it so the drag doesn't get
        // double-processed as a seek.
        if (this._suppressNextClick) {
            this._suppressNextClick = false;
            return;
        }
        const cell = this._eventToCell(e);
        if (!cell) return;
        if (cell.isRuler) {
            const cb = this.editorCallbacks.onSeek;
            if (typeof cb === 'function') cb(cell.tick);
            return;
        }
        const cb = this.editorCallbacks.onCellClick;
        if (typeof cb === 'function') {
            cb(cell.tick, cell.midi, cell.isDrumLane, e.shiftKey, cell.drumChannel);
        }
    }

    /** Mouse down: only the ruler starts a potential drag-to-select. */
    static _onMouseDown(e) {
        // First: if the click hit the in-canvas ✕ clear button, just clear
        // the selection and suppress everything else (no drag, no seek).
        if (this._isClickOnClearBtn(e)) {
            this.clearSelection();
            this._suppressNextClick = true;
            return;
        }
        const cell = this._eventToCell(e);
        if (!cell || !cell.isRuler) return;
        const rect = this.canvas.getBoundingClientRect();
        this._drag = {
            startTick:   cell.tick,
            startX:      e.clientX - rect.left,
            currentTick: cell.tick,
            isDrag:      false,
        };
    }

    static _onMouseUp(e) {
        if (!this._drag) return;
        const drag = this._drag;
        this._drag = null;
        if (drag.isDrag) {
            // Real drag → commit the selection (snap to tickStep)
            const tickStep = this.song?.ticksPerNote || 1;
            const a = Math.min(drag.startTick, drag.currentTick);
            const b = Math.max(drag.startTick, drag.currentTick);
            // Snap end UP so it's at least one tick step past start
            const start = Math.floor(a / tickStep) * tickStep;
            const end   = Math.max(start + tickStep, Math.ceil(b / tickStep) * tickStep);
            this.setSelection(start, end);
            this._suppressNextClick = true;
        }
        // If it wasn't a drag, the subsequent click handler will fire and
        // treat it as a normal ruler seek — nothing to do here.
    }

    // Note names for MIDI → display (e.g. MIDI 60 → "C4")
    static NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

    static _midiToName(midi) {
        const octave = Math.floor(midi / 12) - 1;
        return this.NOTE_NAMES[midi % 12] + octave;
    }

    static _onMouseMove(e) {
        // Cursor affordance: pointer when over the ✕ clear button.
        if (this._isClickOnClearBtn(e)) {
            this.canvas.style.cursor = 'pointer';
        } else if (this.canvas.style.cursor === 'pointer') {
            this.canvas.style.cursor = '';
        }
        // Live drag preview: if the user is dragging on the ruler, update the
        // selection bounds as they move (no commit until mouseup).
        if (this._drag) {
            const rect = this.canvas.getBoundingClientRect();
            const dx = Math.abs((e.clientX - rect.left) - this._drag.startX);
            // x-position on canvas → tick (clamped to musical area)
            const scaleX = this.canvas.width / rect.width;
            const px = (e.clientX - rect.left) * scaleX;
            const rawTick = this._xToTick(Math.max(this.KEYBOARD_WIDTH, px));
            this._drag.currentTick = Math.max(0, rawTick);
            if (!this._drag.isDrag && dx > 4) this._drag.isDrag = true;
            if (this._drag.isDrag) this.render();
            return;
        }
        const cell = this._eventToCell(e);
        if (!cell || cell.isRuler) {
            if (this.hoverTick !== null) { this.hoverTick = null; this.render(); }
            // Clear note-under-cursor info
            if (this.editorCallbacks.onNoteHover) this.editorCallbacks.onNoteHover(null);
            return;
        }
        if (cell.tick !== this.hoverTick ||
            cell.midi !== this.hoverMidi ||
            cell.isDrumLane !== this.hoverIsDrumLane ||
            cell.drumChannel !== this.hoverDrumChannel) {
            this.hoverTick = cell.tick;
            this.hoverMidi = cell.midi;
            this.hoverIsDrumLane = cell.isDrumLane;
            this.hoverDrumChannel = cell.drumChannel;
            this.render();

            // Check if hovering directly over an existing note
            if (this.song?.notes && this.editorCallbacks.onNoteHover) {
                const hit = this.song.notes.find(n => {
                    if (n.startTick > cell.tick || n.startTick + (n.durationTicks || 1) <= cell.tick) return false;
                    if (cell.isDrumLane) return n.channel === cell.drumChannel;
                    return n.pitch === cell.midi;
                });
                const drumLabel = cell.drumChannel === 7 ? 'ECS drums' : 'drums';
                if (hit) {
                    const info = hit.drum
                        ? `${hit.drum} · ${hit.channel === 7 ? 'ECS drums' : 'drums'} · tick ${hit.startTick}`
                        : `${this._midiToName(hit.pitch)}${hit.instrument || ''} · ch${hit.channel + 1} · tick ${hit.startTick} · ${hit.durationTicks}t`;
                    this.editorCallbacks.onNoteHover(info);
                } else {
                    const posInfo = cell.isDrumLane
                        ? `tick ${cell.tick} · ${drumLabel}`
                        : `${this._midiToName(cell.midi)} · tick ${cell.tick}`;
                    this.editorCallbacks.onNoteHover(posInfo);
                }
            }
        }
    }

    static _renderHover() {
        if (this.hoverTick == null) return;
        const { ctx, KEYBOARD_WIDTH, KEY_HEIGHT, TICK_WIDTH, NUM_KEYS, LOWEST_MIDI, RULER_HEIGHT } = this;
        const tickStep = this.song?.ticksPerNote || 1;
        const x = this._tickToX(this.hoverTick);
        const w = Math.max(2, tickStep * TICK_WIDTH - 1);

        if (this.hoverIsDrumLane) {
            const baseDrumY = this.canvas.height - this.DRUM_HEIGHT;
            const ecsDrumY  = baseDrumY - this.DRUM_HEIGHT;
            const stripY = (this.hoverDrumChannel === 7) ? ecsDrumY : baseDrumY;
            ctx.fillStyle = 'rgba(192, 96, 192, 0.35)';
            ctx.fillRect(Math.max(KEYBOARD_WIDTH, x), stripY + 4, w, this.DRUM_HEIGHT - 8);
            return;
        }

        if (this.hoverMidi < LOWEST_MIDI || this.hoverMidi >= LOWEST_MIDI + NUM_KEYS) return;
        const keyIdx = (NUM_KEYS - 1) - (this.hoverMidi - LOWEST_MIDI);
        const y = RULER_HEIGHT + keyIdx * KEY_HEIGHT;
        const clippedX = Math.max(KEYBOARD_WIDTH, x);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.fillRect(clippedX, y + 1, w, KEY_HEIGHT - 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 1;
        ctx.strokeRect(clippedX + 0.5, y + 1.5, w - 1, KEY_HEIGHT - 3);
    }
}
