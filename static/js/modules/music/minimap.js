// Song minimap — a compact full-song overview that lives above the piano-roll.
// Shows every note as a colored bar (per channel), the current playhead, and the
// active loop region. Clicking anywhere on the strip seeks playback to that tick.
//
// The minimap is its own canvas + module so it stays independent of the
// piano-roll's scroll mode / sizing logic.

export class Minimap {
    static canvas        = null;
    static ctx           = null;
    static song          = null;
    static playheadTick  = null;
    static loopInfo      = null;     // { introEnd, loopEnd, loopDuration } | null
    static onSeek        = null;     // (tick) => void
    static onHover       = null;     // (tick|null) => void

    static HEIGHT        = 50;       // px
    static hoverTick     = null;

    static CHANNEL_COLORS = [
        '#4a90d9', '#5cb85c', '#d97a4a', '#c060c0',   // base PSG: blue / green / orange / purple
        '#48b8c0', '#bcc850', '#c08858', '#a050c8',   // ECS PSG:  cyan / yellow-green / tan / violet
    ];

    static init(canvasId = 'music-minimap', { onSeek, onHover } = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.onSeek  = onSeek  || null;
        this.onHover = onHover || null;

        this.canvas.addEventListener('click',     e => this._onClick(e));
        this.canvas.addEventListener('mousemove', e => this._onMouseMove(e));
        this.canvas.addEventListener('mouseleave', () => {
            this.hoverTick = null;
            if (this.onHover) this.onHover(null);
            this.render();
        });
        window.addEventListener('resize', () => { this._resize(); this.render(); });

        this._resize();
        this.render();
    }

    static setSong(song) {
        this.song = song;
        this._resize();
        this.render();
    }

    static setPlayhead(tick) {
        this.playheadTick = tick;
        this.render();
    }

    static setLoopInfo(loopInfo) {
        this.loopInfo = loopInfo;
        this.render();
    }

    // ── Sizing ──────────────────────────────────────────────────────────────

    static _resize() {
        if (!this.canvas) return;
        const container = this.canvas.parentElement;
        if (!container) return;
        // Canvas drawing-buffer width matches container CSS width for crisp pixels
        this.canvas.width  = Math.max(400, container.clientWidth);
        this.canvas.height = this.HEIGHT;
    }

    /** Total UNLOOPED song length in ticks (last note's end). */
    static _totalTicks() {
        if (!this.song?.notes) return 0;
        let max = 0;
        for (const n of this.song.notes) {
            max = Math.max(max, n.startTick + (n.durationTicks || 1));
        }
        // Also extend for trailing JUMP/STOP/REPEAT control ticks so the
        // playhead during the last bar doesn't run off the visible strip.
        for (const c of (this.song.controls || [])) {
            if (c.tick > max) max = c.tick;
        }
        return max;
    }

    // ── Hit-testing ─────────────────────────────────────────────────────────

    static _xToTick(x) {
        const total = this._totalTicks();
        if (total <= 0) return 0;
        const t = Math.max(0, Math.floor((x / this.canvas.width) * total));
        return Math.min(t, total);
    }

    static _onClick(e) {
        if (!this.song) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const tick = this._xToTick(x);
        if (this.onSeek) this.onSeek(tick);
    }

    static _onMouseMove(e) {
        if (!this.song) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const tick = this._xToTick(x);
        if (tick !== this.hoverTick) {
            this.hoverTick = tick;
            this.render();
            if (this.onHover) this.onHover(tick);
        }
    }

    // ── Render ──────────────────────────────────────────────────────────────

    static render() {
        if (!this.ctx) return;
        const { ctx } = this;
        const { width, height } = this.canvas;

        // Background
        ctx.fillStyle = '#15151f';
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = '#2a2a36';
        ctx.lineWidth = 1;
        ctx.strokeRect(0.5, 0.5, width - 1, height - 1);

        if (!this.song?.notes?.length) {
            ctx.fillStyle = '#5a606a';
            ctx.font = '11px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Song overview — paste, type, or load a demo', width / 2, height / 2);
            return;
        }

        const total = this._totalTicks();
        if (total <= 0) return;
        const xPerTick = width / total;

        // Active loop region (translucent fill) — helps the user see how much
        // of the song will repeat.
        if (this.loopInfo && this.loopInfo.loopDuration > 0) {
            const x0 = this.loopInfo.introEnd * xPerTick;
            const x1 = this.loopInfo.loopEnd  * xPerTick;
            ctx.fillStyle = 'rgba(80, 80, 180, 0.18)';
            ctx.fillRect(x0, 0, x1 - x0, height);
            ctx.strokeStyle = 'rgba(120, 120, 220, 0.6)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x0 + 0.5, 0); ctx.lineTo(x0 + 0.5, height);
            ctx.moveTo(x1 - 0.5, 0); ctx.lineTo(x1 - 0.5, height);
            ctx.stroke();
        }

        // Channel rows: 4 (base) or 8 (ECS) horizontal lanes
        const isEcs    = (this.song.channelCount || 0) >= 8;
        const rowCount = isEcs ? 8 : 4;
        const rowH     = height / rowCount;

        // Notes
        for (const n of this.song.notes) {
            if (n.channel < 0 || n.channel >= rowCount) continue;
            const x = n.startTick * xPerTick;
            const w = Math.max(1, (n.durationTicks || 1) * xPerTick);
            const y = n.channel * rowH + 1;
            ctx.fillStyle = this.CHANNEL_COLORS[n.channel] || '#888';
            ctx.fillRect(x, y, w, Math.max(1, rowH - 2));
        }

        // Hover indicator
        if (this.hoverTick != null && this.hoverTick > 0) {
            const hx = this.hoverTick * xPerTick;
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.55)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(hx + 0.5, 0); ctx.lineTo(hx + 0.5, height);
            ctx.stroke();
        }

        // Playhead
        if (this.playheadTick != null && this.playheadTick > 0) {
            const px = this.playheadTick * xPerTick;
            ctx.strokeStyle = '#ff5050';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(px, 0); ctx.lineTo(px, height);
            ctx.stroke();
        }

        // Time-axis tick labels at quartile positions (helps gauge progress)
        ctx.fillStyle = 'rgba(160, 165, 175, 0.6)';
        ctx.font = '9px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        const framerate = 50;   // MUSIC ticks/sec on real hardware
        const totalSec  = total / framerate;
        const fmt = (sec) => {
            const m = Math.floor(sec / 60);
            const s = (sec - m * 60).toFixed(1);
            return `${m}:${s.padStart(4, '0')}`;
        };
        ctx.fillText('0:00', 4, 2);
        ctx.textAlign = 'right';
        ctx.fillText(fmt(totalSec), width - 4, 2);
    }
}
