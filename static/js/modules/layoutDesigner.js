/**
 * Layout Designer Module
 * Full-screen Intellivision backtab layout designer.
 * The Intellivision display is 20 columns × 12 rows = 240 tile cells.
 * Each cell references a GRAM card (0–63) plus a foreground color.
 * Renders live from the SpriteEditor's current sprite set.
 */

import { SpriteEditor } from './spriteEditor.js';

export class LayoutDesigner {

    // ── Display constants ────────────────────────────────────────────────────
    static COLS        = 20;
    static ROWS        = 12;
    static CELL_PIXELS = 8;   // each tile is 8×8 hardware pixels

    // ── Editor state ─────────────────────────────────────────────────────────
    static cells         = [];   // 240 entries; see _makeCell()
    static selectedSlot  = 0;    // active GRAM slot in tile picker (0–63)
    static selectedColor = 7;    // active foreground color (0–15)
    static zoom          = 3;    // canvas scale: 1 canvas px = zoom hardware px
    static isPainting    = false;
    static lastPainted   = -1;   // cell index painted last drag step
    static paintValue    = true; // true = draw, false = erase

    // ── Intellivision 16-color palette (same as SpriteEditor) ────────────────
    static PALETTE = [
        { index: 0,  name: 'Black',        hex: '#0C0005' },
        { index: 1,  name: 'Blue',         hex: '#002DFF' },
        { index: 2,  name: 'Red',          hex: '#FF3E00' },
        { index: 3,  name: 'Tan',          hex: '#C9D464' },
        { index: 4,  name: 'Dark Green',   hex: '#00780F' },
        { index: 5,  name: 'Green',        hex: '#00A720' },
        { index: 6,  name: 'Yellow',       hex: '#FAEA27' },
        { index: 7,  name: 'White',        hex: '#FFFCFF' },
        { index: 8,  name: 'Grey',         hex: '#A7A8A8' },
        { index: 9,  name: 'Cyan',         hex: '#5ACBFF' },
        { index: 10, name: 'Orange',       hex: '#FFA600' },
        { index: 11, name: 'Brown',        hex: '#3C5800' },
        { index: 12, name: 'Pink',         hex: '#FF3276' },
        { index: 13, name: 'Light Blue',   hex: '#BD95FF' },
        { index: 14, name: 'Yellow-Green', hex: '#6CCD30' },
        { index: 15, name: 'Purple',       hex: '#C81A7D' },
    ];

    // =========================================================================
    // Init / Show / Hide
    // =========================================================================

    static init() {
        if (!this.cells.length) {
            this.cells = Array.from({ length: this.COLS * this.ROWS }, () => this._makeCell());
        }
        this._setupCanvas();
        this._setupTilePicker();
        this._setupColorPicker();
        this._setupStatusBar();
        this.render();
    }

    static show() {
        const panel = document.getElementById('layout-designer-panel');
        const spriteLayout = document.querySelector('.sprite-editor-layout');
        if (panel) panel.style.display = 'flex';
        if (spriteLayout) spriteLayout.style.display = 'none';

        // Mark the toolbar button active
        const btn = document.getElementById('layout-toggle-btn');
        if (btn) btn.classList.add('active');

        this.init();
    }

    static hide() {
        const panel = document.getElementById('layout-designer-panel');
        const spriteLayout = document.querySelector('.sprite-editor-layout');
        if (panel) panel.style.display = 'none';
        if (spriteLayout) spriteLayout.style.display = '';

        const btn = document.getElementById('layout-toggle-btn');
        if (btn) btn.classList.remove('active');
    }

    static toggle() {
        const panel = document.getElementById('layout-designer-panel');
        if (!panel) return;
        const visible = panel.style.display !== 'none' && panel.style.display !== '';
        if (visible) this.hide(); else this.show();
    }

    // =========================================================================
    // Cell helpers
    // =========================================================================

    static _makeCell(cardNum = 0, fgColor = 7) {
        return { cardNum, fgColor, isEmpty: true };
    }

    static _cellIndex(col, row) {
        return row * this.COLS + col;
    }

    // =========================================================================
    // Canvas setup & rendering
    // =========================================================================

    static _setupCanvas() {
        const canvas = document.getElementById('layout-canvas');
        if (!canvas) return;

        // Remove previous listeners by cloning
        const fresh = canvas.cloneNode(true);
        canvas.parentNode.replaceChild(fresh, canvas);

        fresh.addEventListener('mousedown',   e => this._onMouseDown(e));
        fresh.addEventListener('mousemove',   e => this._onMouseMove(e));
        fresh.addEventListener('mouseup',     e => this._onMouseUp(e));
        fresh.addEventListener('mouseleave',  e => this._onMouseUp(e));
        fresh.addEventListener('contextmenu', e => { e.preventDefault(); });

        // Touch support for tablets
        fresh.addEventListener('touchstart',  e => this._onTouchStart(e),  { passive: false });
        fresh.addEventListener('touchmove',   e => this._onTouchMove(e),   { passive: false });
        fresh.addEventListener('touchend',    e => this._onMouseUp(e));
    }

    /** Resize canvas to match zoom and re-render. */
    static _resizeCanvas() {
        const canvas = document.getElementById('layout-canvas');
        if (!canvas) return;
        const cs = this.CELL_PIXELS * this.zoom;
        canvas.width  = this.COLS * cs;
        canvas.height = this.ROWS * cs;
    }

    /** Full repaint of the layout canvas. */
    static render() {
        this._resizeCanvas();
        const canvas = document.getElementById('layout-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                this._renderCell(ctx, col, row);
            }
        }
        this._renderGridLines(ctx);
    }

    static _renderCell(ctx, col, row) {
        const cell = this.cells[this._cellIndex(col, row)];
        const cs   = this.CELL_PIXELS * this.zoom;  // canvas size of one cell
        const ox   = col * cs;
        const oy   = row * cs;

        if (cell.isEmpty) {
            // Empty cell: dark background with faint crosshair dot
            ctx.fillStyle = '#111118';
            ctx.fillRect(ox, oy, cs, cs);
            ctx.fillStyle = '#2a2a38';
            const dot = Math.max(1, this.zoom - 1);
            ctx.fillRect(ox + Math.floor(cs / 2), oy + Math.floor(cs / 2), dot, dot);
            return;
        }

        // Get tile pixel data from SpriteEditor
        const tileData = SpriteEditor.getGramTilePixels(cell.cardNum);
        if (!tileData) {
            // Card allocated but sprite not found — draw placeholder
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(ox, oy, cs, cs);
            ctx.fillStyle = '#444';
            ctx.font = `${Math.max(8, this.zoom * 2)}px monospace`;
            ctx.textAlign = 'center';
            ctx.fillText('?', ox + cs / 2, oy + cs / 2 + 3);
            return;
        }

        const fgHex = this.PALETTE[cell.fgColor]?.hex   ?? '#ffffff';
        const bgHex = this.PALETTE[tileData.bgColor]?.hex ?? '#0C0005';
        const pxSize = this.zoom;

        // Fill background first
        ctx.fillStyle = bgHex;
        ctx.fillRect(ox, oy, cs, cs);

        // Draw 8×8 pixels
        ctx.fillStyle = fgHex;
        for (let py = 0; py < 8; py++) {
            for (let px2 = 0; px2 < 8; px2++) {
                if (tileData.pixels[py]?.[px2]) {
                    ctx.fillRect(ox + px2 * pxSize, oy + py * pxSize, pxSize, pxSize);
                }
            }
        }
    }

    static _renderGridLines(ctx) {
        const cs = this.CELL_PIXELS * this.zoom;
        ctx.strokeStyle = 'rgba(80, 80, 100, 0.45)';
        ctx.lineWidth = 0.5;

        ctx.beginPath();
        for (let col = 1; col < this.COLS; col++) {
            ctx.moveTo(col * cs, 0);
            ctx.lineTo(col * cs, this.ROWS * cs);
        }
        for (let row = 1; row < this.ROWS; row++) {
            ctx.moveTo(0, row * cs);
            ctx.lineTo(this.COLS * cs, row * cs);
        }
        ctx.stroke();

        // Outer border
        ctx.strokeStyle = 'rgba(120, 120, 160, 0.7)';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, this.COLS * cs, this.ROWS * cs);
    }

    // =========================================================================
    // Tile picker
    // =========================================================================

    static _setupTilePicker() {
        const picker = document.getElementById('layout-tile-picker');
        if (!picker) return;
        picker.innerHTML = '';

        for (let slot = 0; slot < 64; slot++) {
            const tile = document.createElement('div');
            tile.className = 'layout-tile-item' + (slot === this.selectedSlot ? ' selected' : '');
            tile.dataset.slot = slot;
            tile.title = `GRAM ${slot}`;

            const canvas = document.createElement('canvas');
            canvas.width  = 16;
            canvas.height = 16;
            this._renderPickerThumb(canvas, slot);
            tile.appendChild(canvas);

            const label = document.createElement('span');
            label.textContent = slot;
            tile.appendChild(label);

            tile.addEventListener('click', () => this.selectSlot(slot));
            picker.appendChild(tile);
        }
    }

    static _renderPickerThumb(canvas, slot) {
        const ctx     = canvas.getContext('2d');
        const tileData = SpriteEditor.getGramTilePixels(slot);

        ctx.fillStyle = '#111118';
        ctx.fillRect(0, 0, 16, 16);

        if (!tileData) return;

        const fgHex = this.PALETTE[tileData.fgColor]?.hex ?? '#ffffff';
        const bgHex = this.PALETTE[tileData.bgColor]?.hex ?? '#0C0005';
        ctx.fillStyle = bgHex;
        ctx.fillRect(0, 0, 16, 16);

        ctx.fillStyle = fgHex;
        for (let py = 0; py < 8; py++) {
            for (let px = 0; px < 8; px++) {
                if (tileData.pixels[py]?.[px]) {
                    ctx.fillRect(px * 2, py * 2, 2, 2);
                }
            }
        }
    }

    /** Refresh tile picker thumbnails (call after editing a sprite). */
    static refreshTilePicker() {
        const picker = document.getElementById('layout-tile-picker');
        if (!picker) return;
        picker.querySelectorAll('.layout-tile-item').forEach(item => {
            const slot   = parseInt(item.dataset.slot);
            const canvas = item.querySelector('canvas');
            if (canvas) this._renderPickerThumb(canvas, slot);
        });
    }

    static selectSlot(slot) {
        this.selectedSlot = slot;
        document.querySelectorAll('.layout-tile-item').forEach(el => {
            el.classList.toggle('selected', parseInt(el.dataset.slot) === slot);
        });
        this._updateStatus();
    }

    // =========================================================================
    // Color picker
    // =========================================================================

    static _setupColorPicker() {
        const container = document.getElementById('layout-color-picker');
        if (!container) return;
        container.innerHTML = '';

        this.PALETTE.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'layout-color-swatch' + (color.index === this.selectedColor ? ' selected' : '');
            swatch.style.background = color.hex;
            swatch.title = `${color.name} (${color.index})`;
            swatch.dataset.colorIdx = color.index;
            swatch.addEventListener('click', () => this.selectColor(color.index));
            container.appendChild(swatch);
        });
    }

    static selectColor(idx) {
        this.selectedColor = idx;
        document.querySelectorAll('.layout-color-swatch').forEach(el => {
            el.classList.toggle('selected', parseInt(el.dataset.colorIdx) === idx);
        });
        this._updateStatus();
    }

    // =========================================================================
    // Status bar
    // =========================================================================

    static _setupStatusBar() {
        this._updateStatus();
    }

    static _updateStatus(col = null, row = null) {
        const bar = document.getElementById('layout-status-bar');
        if (!bar) return;
        const colorName = this.PALETTE[this.selectedColor]?.name ?? '?';
        let txt = `GRAM ${this.selectedSlot} · FG: ${colorName} (${this.selectedColor})`;
        if (col !== null) {
            const idx  = this._cellIndex(col, row);
            const cell = this.cells[idx];
            txt += ` · [${col},${row}]`;
            if (!cell.isEmpty) {
                txt += ` → GRAM ${cell.cardNum}, color ${cell.fgColor}`;
            } else {
                txt += ' (empty)';
            }
        }
        bar.textContent = txt;
    }

    // =========================================================================
    // Mouse / touch interaction
    // =========================================================================

    static _colRowFromEvent(e) {
        const canvas = document.getElementById('layout-canvas');
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const cs   = this.CELL_PIXELS * this.zoom;
        const scaleX = canvas.width  / rect.width;
        const scaleY = canvas.height / rect.height;
        const cx   = (e.clientX - rect.left) * scaleX;
        const cy   = (e.clientY - rect.top)  * scaleY;
        const col  = Math.floor(cx / cs);
        const row  = Math.floor(cy / cs);
        if (col < 0 || col >= this.COLS || row < 0 || row >= this.ROWS) return null;
        return { col, row };
    }

    static _onMouseDown(e) {
        e.preventDefault();
        const pos = this._colRowFromEvent(e);
        if (!pos) return;
        this.isPainting = true;
        this.paintValue = (e.button !== 2); // right-click = erase
        this._paint(pos.col, pos.row);
    }

    static _onMouseMove(e) {
        const pos = this._colRowFromEvent(e);
        if (pos) this._updateStatus(pos.col, pos.row);
        if (!this.isPainting || !pos) return;
        const idx = this._cellIndex(pos.col, pos.row);
        if (idx === this.lastPainted) return; // skip re-painting same cell
        this._paint(pos.col, pos.row);
    }

    static _onMouseUp(e) {
        this.isPainting  = false;
        this.lastPainted = -1;
    }

    static _onTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const pos   = this._colRowFromEvent(touch);
        if (!pos) return;
        this.isPainting = true;
        this.paintValue = true;
        this._paint(pos.col, pos.row);
    }

    static _onTouchMove(e) {
        e.preventDefault();
        if (!this.isPainting) return;
        const touch = e.touches[0];
        const pos   = this._colRowFromEvent(touch);
        if (!pos) return;
        const idx = this._cellIndex(pos.col, pos.row);
        if (idx === this.lastPainted) return;
        this._paint(pos.col, pos.row);
    }

    static _paint(col, row) {
        const idx = this._cellIndex(col, row);
        this.lastPainted = idx;

        if (!this.paintValue) {
            // Erase
            this.cells[idx] = this._makeCell();
        } else {
            // Draw
            this.cells[idx] = {
                cardNum:  this.selectedSlot,
                fgColor:  this.selectedColor,
                isEmpty:  false,
            };
        }

        // Repaint just the affected cell for performance
        const canvas = document.getElementById('layout-canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            this._renderCell(ctx, col, row);
            // Redraw grid lines over this cell only
            const cs = this.CELL_PIXELS * this.zoom;
            ctx.strokeStyle = 'rgba(80, 80, 100, 0.45)';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(col * cs, row * cs, cs, cs);
        }
    }

    // =========================================================================
    // Zoom
    // =========================================================================

    static setZoom(z) {
        this.zoom = Math.max(1, Math.min(6, z));
        document.querySelectorAll('.layout-zoom-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.zoom) === this.zoom);
        });
        this.render();
    }

    // =========================================================================
    // Clear
    // =========================================================================

    static clearLayout() {
        if (!confirm('Clear the entire layout?')) return;
        this.cells = Array.from({ length: this.COLS * this.ROWS }, () => this._makeCell());
        this.render();
    }

    // =========================================================================
    // Fill tool — fill the entire canvas with the selected tile
    // =========================================================================

    static fillLayout() {
        this.cells = this.cells.map(() => ({
            cardNum: this.selectedSlot,
            fgColor: this.selectedColor,
            isEmpty: false,
        }));
        this.render();
    }

    // =========================================================================
    // Export
    // =========================================================================

    /**
     * Export the layout as IntyBASIC BACKTAB data.
     *
     * Backtab word format (simplified, Color Stack mode):
     *   bits 0–2:  foreground color  (0–7, hardware range)
     *   bits 3–9:  card number
     *   bit  11:   GRAM select (1 = GRAM card)
     *
     * = (cardNum * 8) + (fgColor & 7) + $800
     * Empty cells = $0000 (GROM card 0, black — effectively blank).
     */
    static exportBacktab() {
        const words = this.cells.map(cell => {
            if (cell.isEmpty) return 0x0000;
            const word = (cell.cardNum * 8) + (cell.fgColor & 0x7) + 0x0800;
            return word;
        });

        let out = "' Screen Layout — 20 cols × 12 rows\n";
        out    += "' Generated by Intellivision Overlay Editor\n";
        out    += "' https://intellivision-overlay-editor.fly.dev\n\n";
        out    += 'DIM backtab(239)\n';

        for (let row = 0; row < this.ROWS; row++) {
            const slice = words.slice(row * this.COLS, row * this.COLS + this.COLS);
            const hex   = slice.map(w => '$' + w.toString(16).toUpperCase().padStart(4, '0')).join(', ');
            const comma = row < this.ROWS - 1 ? ',' : '';
            out += `DATA backtab / ${hex} /${comma}  ' row ${row}\n`;
        }

        this._showExportModal(out);
    }

    static _showExportModal(text) {
        let modal = document.getElementById('layout-export-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'layout-export-modal';
            modal.className = 'layout-export-modal';
            modal.innerHTML = `
                <div class="layout-export-inner">
                    <div class="layout-export-header">
                        <span>BACKTAB Export</span>
                        <button onclick="document.getElementById('layout-export-modal').style.display='none'">✕</button>
                    </div>
                    <textarea id="layout-export-text" readonly spellcheck="false"></textarea>
                    <div class="layout-export-actions">
                        <button class="btn btn-success btn-sm" onclick="layoutCopyExport()">📋 Copy</button>
                        <button class="btn btn-secondary btn-sm" onclick="layoutDownloadExport()">⬇ Download</button>
                    </div>
                </div>`;
            document.body.appendChild(modal);
        }
        document.getElementById('layout-export-text').value = text;
        modal.style.display = 'flex';
    }

    static copyExport() {
        const ta = document.getElementById('layout-export-text');
        if (!ta) return;
        navigator.clipboard.writeText(ta.value).catch(() => {
            ta.select();
            document.execCommand('copy');
        });
    }

    static downloadExport() {
        const ta = document.getElementById('layout-export-text');
        if (!ta) return;
        const blob = new Blob([ta.value], { type: 'text/plain' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = 'layout_backtab.bas';
        a.click();
        URL.revokeObjectURL(url);
    }

    // =========================================================================
    // PNG screenshot export
    // =========================================================================

    static exportPng() {
        // Render at 3× native (each hardware pixel = 3 canvas px → full 160×96 display)
        const scale  = 3;
        const offscreen = document.createElement('canvas');
        offscreen.width  = this.COLS * this.CELL_PIXELS * scale;
        offscreen.height = this.ROWS * this.CELL_PIXELS * scale;
        const ctx = offscreen.getContext('2d');
        ctx.fillStyle = '#0C0005';
        ctx.fillRect(0, 0, offscreen.width, offscreen.height);

        const savedZoom = this.zoom;
        this.zoom = scale;
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                this._renderCell(ctx, col, row);
            }
        }
        this.zoom = savedZoom;

        offscreen.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a   = document.createElement('a');
            a.href    = url;
            a.download = 'layout_mockup.png';
            a.click();
            URL.revokeObjectURL(url);
        }, 'image/png');
    }

    // =========================================================================
    // Project save / load (called by SpriteEditor.exportProject / importProject)
    // =========================================================================

    static serializeCells() {
        return this.cells.map(c => ({
            n: c.cardNum,
            f: c.fgColor,
            e: c.isEmpty ? 1 : 0,
        }));
    }

    static deserializeCells(data) {
        if (!Array.isArray(data)) return;
        this.cells = data.map(c => ({
            cardNum:  c.n ?? 0,
            fgColor:  c.f ?? 7,
            isEmpty:  (c.e ?? 1) === 1,
        }));
        // Pad to 240 if needed
        while (this.cells.length < this.COLS * this.ROWS) {
            this.cells.push(this._makeCell());
        }
    }
}
