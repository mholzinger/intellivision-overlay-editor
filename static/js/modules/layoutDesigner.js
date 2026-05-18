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
    static cells           = [];   // 240 entries; see _makeCell()
    static selectedSlot    = 0;    // active GRAM slot in tile picker (0–63)
    static selectedColor   = 7;    // active foreground color (0–7 in FG/BG mode)
    static selectedBgColor = 0;    // active background color (0–15 in FG/BG mode)
    static zoom            = 3;    // canvas scale: 1 canvas px = zoom hardware px
    static isPainting      = false;
    static lastPainted     = -1;   // cell index painted last drag step
    static paintValue      = true; // true = draw, false = erase
    static eraserMode      = false; // when true, left-click erases
    static undoStack       = [];   // snapshots of cells[] for undo (max 50)
    static UNDO_MAX        = 50;

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
        this._installKeyHandler();
    }

    static hide() {
        const panel = document.getElementById('layout-designer-panel');
        const spriteLayout = document.querySelector('.sprite-editor-layout');
        if (panel) panel.style.display = 'none';
        if (spriteLayout) spriteLayout.style.display = '';

        const btn = document.getElementById('layout-toggle-btn');
        if (btn) btn.classList.remove('active');

        this._removeKeyHandler();
    }

    static _installKeyHandler() {
        if (this._keyHandler) return;
        this._keyHandler = (e) => {
            // Don't hijack typing in inputs/textareas
            const tag = e.target.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                this.undo();
            }
        };
        document.addEventListener('keydown', this._keyHandler);
    }

    static _removeKeyHandler() {
        if (!this._keyHandler) return;
        document.removeEventListener('keydown', this._keyHandler);
        this._keyHandler = null;
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

    static _makeCell(cardNum = 0, fgColor = 7, bgColor = 0) {
        return { cardNum, fgColor, bgColor, isGram: true, advanceFlag: false, isEmpty: true };
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

        // GROM cards: render as the BG color (we don't have GROM pixel art).
        // - GROM 0 is the canonical "blank" tile — render as pure BG, no marker
        //   (most games use it for sky/water/empty space, where any overlay
        //   would obscure the BG color users want to see).
        // - GROM 1-255: dominant BG color + tiny low-contrast corner label so
        //   the placeholder identity is hinted without hiding the BG.
        if (cell.isGram === false) {
            const bgHex = this.PALETTE[cell.bgColor ?? 0]?.hex ?? '#0C0005';
            ctx.fillStyle = bgHex;
            ctx.fillRect(ox, oy, cs, cs);

            if (cell.cardNum !== 0) {
                // Small "G<n>" label in the top-left corner with reduced
                // alpha so the BG color remains visually dominant.
                const fgHex = this.PALETTE[cell.fgColor]?.hex ?? '#fff';
                ctx.save();
                ctx.fillStyle = fgHex;
                ctx.globalAlpha = 0.55;
                ctx.font = `${Math.max(6, this.zoom * 1.4)}px monospace`;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.fillText('G' + cell.cardNum, ox + 1, oy + 1);
                ctx.restore();
            }
            return;
        }

        // GRAM cards: get pixel data from SpriteEditor
        const tileData = SpriteEditor.getGramTilePixels(cell.cardNum);
        if (!tileData) {
            // GRAM card allocated but sprite not found — draw placeholder
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(ox, oy, cs, cs);
            ctx.fillStyle = '#666';
            ctx.font = `${Math.max(7, this.zoom * 2.2)}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(cell.cardNum, ox + cs / 2, oy + cs / 2);
            return;
        }

        const fgHex = this.PALETTE[cell.fgColor]?.hex ?? '#ffffff';
        const bgHex = this.PALETTE[cell.bgColor ?? 0]?.hex ?? '#0C0005';
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
        // FG picker — limited to colors 0–7 (hardware constraint in FG/BG mode)
        const fgContainer = document.getElementById('layout-color-picker');
        if (fgContainer) {
            fgContainer.innerHTML = '';
            this.PALETTE.slice(0, 8).forEach(color => {
                const swatch = document.createElement('div');
                swatch.className = 'layout-color-swatch' + (color.index === this.selectedColor ? ' selected' : '');
                swatch.style.background = color.hex;
                swatch.title = `FG: ${color.name} (${color.index})`;
                swatch.dataset.colorIdx = color.index;
                swatch.addEventListener('click', () => this.selectColor(color.index));
                fgContainer.appendChild(swatch);
            });
        }

        // BG picker — full 16-color palette
        const bgContainer = document.getElementById('layout-bg-color-picker');
        if (bgContainer) {
            bgContainer.innerHTML = '';
            this.PALETTE.forEach(color => {
                const swatch = document.createElement('div');
                swatch.className = 'layout-color-swatch layout-bg-swatch' +
                    (color.index === this.selectedBgColor ? ' selected' : '');
                swatch.style.background = color.hex;
                swatch.title = `BG: ${color.name} (${color.index})`;
                swatch.dataset.colorIdx = color.index;
                swatch.addEventListener('click', () => this.selectBgColor(color.index));
                bgContainer.appendChild(swatch);
            });
        }
    }

    static selectColor(idx) {
        this.selectedColor = idx;
        document.querySelectorAll('#layout-color-picker .layout-color-swatch').forEach(el => {
            el.classList.toggle('selected', parseInt(el.dataset.colorIdx) === idx);
        });
        this._updateStatus();
    }

    static selectBgColor(idx) {
        this.selectedBgColor = idx;
        document.querySelectorAll('#layout-bg-color-picker .layout-color-swatch').forEach(el => {
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
        const fgName = this.PALETTE[this.selectedColor]?.name ?? '?';
        const bgName = this.PALETTE[this.selectedBgColor]?.name ?? '?';
        const eraser = this.eraserMode ? ' · <span class="layout-status-mode">ERASER</span>' : '';
        let html = `GRAM <span class="layout-status-gram">${this.selectedSlot}</span>`
                 + ` · FG: ${fgName} (${this.selectedColor})`
                 + ` · BG: ${bgName} (${this.selectedBgColor})${eraser}`;
        if (col !== null) {
            const idx  = this._cellIndex(col, row);
            const offset = row * this.COLS + col;
            const cell = this.cells[idx];
            html += ` · [${col},${row}] (backtab + ${offset})`;
            if (!cell.isEmpty) {
                html += ` → GRAM <span class="layout-status-gram">${cell.cardNum}</span>`
                      + `, FG ${cell.fgColor}, BG ${cell.bgColor ?? 0}`;
            } else {
                html += ' (empty)';
            }
        }
        bar.innerHTML = html;
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

        // Right-click = pick up tile under cursor (copy GRAM + colors to picker)
        if (e.button === 2) {
            this._pickUpCell(pos.col, pos.row);
            return;
        }

        // Left-click — snapshot for undo, then start drag-paint
        this._pushUndo();
        this.isPainting = true;
        this.paintValue = !this.eraserMode;
        this._paint(pos.col, pos.row);
    }

    /** Right-click handler: copy cell's GRAM/FG/BG to the active picker selection. */
    static _pickUpCell(col, row) {
        const idx = this._cellIndex(col, row);
        const cell = this.cells[idx];
        if (!cell || cell.isEmpty) return;
        this.selectSlot(cell.cardNum);
        this.selectColor(cell.fgColor);
        this.selectBgColor(cell.bgColor ?? 0);
    }

    /** Push a deep copy of the current cells array to the undo stack. */
    static _pushUndo() {
        this.undoStack.push(this.cells.map(c => ({ ...c })));
        if (this.undoStack.length > this.UNDO_MAX) this.undoStack.shift();
    }

    /** Restore the most recent snapshot from the undo stack. */
    static undo() {
        if (this.undoStack.length === 0) return;
        this.cells = this.undoStack.pop();
        this.render();
        this._updateStatus();
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
        this._pushUndo();
        this.isPainting = true;
        this.paintValue = !this.eraserMode;
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
                bgColor:  this.selectedBgColor,
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
        this._pushUndo();
        this.cells = Array.from({ length: this.COLS * this.ROWS }, () => this._makeCell());
        this.render();
    }

    static toggleEraser() {
        this.eraserMode = !this.eraserMode;
        const btn = document.getElementById('layout-eraser-btn');
        if (btn) btn.classList.toggle('active', this.eraserMode);
        this._updateStatus();
    }

    // =========================================================================
    // Fill tool — fill the entire canvas with the selected tile
    // =========================================================================

    static fillLayout() {
        this._pushUndo();
        this.cells = this.cells.map(() => ({
            cardNum: this.selectedSlot,
            fgColor: this.selectedColor,
            bgColor: this.selectedBgColor,
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
     * If all cells use BG=0 → emit Color Stack mode words ($800 base, GRAM select).
     * If any cell uses BG>0 → emit FG/BG mode words for all cells (mode is global per-frame).
     *
     * Word layout: bits 15..0 = xxBP GBBa aaaa aFFF
     *   bits 2–0  (FFF): FG color (0–7)
     *   bits 8–3  (aaaaaa): GRAM card (0–63)
     *   bit  9   (B): BG bit 0
     *   bit 10   (B): BG bit 1
     *   bit 11   (G): GRAM select (1)
     *   bit 12   (P): BG bit 3
     *   bit 13   (B): BG bit 2
     *
     * Color Stack word:
     *   = (card * 8) + fg + $800
     *
     * FG/BG mode word (STIC MODE 1, GRAM):
     *   = $800 + (card * 8) + fg
     *       + ((bg & 0x1) << 9)    // BG bit 0 → word bit 9
     *       + ((bg & 0x2) << 9)    // BG bit 1 → word bit 10
     *       + ((bg & 0x4) << 11)   // BG bit 2 → word bit 13
     *       + ((bg & 0x8) << 9)    // BG bit 3 → word bit 12
     *
     * Verified: card=33, fg=4, bg=10 → $1D0C (matches jzIntv "m" dump).
     *
     * Empty cells = $0000.
     */
    static _encodeBacktabWord(cell, fgbgMode) {
        if (cell.isEmpty) return 0x0000;
        const fg = cell.fgColor & 0x7;
        const bg = (cell.bgColor ?? 0) & 0xF;
        const gc = cell.cardNum;
        const gramBit = (cell.isGram === false) ? 0 : 0x0800;

        if (!fgbgMode) {
            // Color Stack mode: bit 13 = advance color stack flag
            const adv = cell.advanceFlag ? 0x2000 : 0;
            return gramBit + (gc * 8) + fg + adv;
        }
        // FG/BG mode — scattered BG bits per STIC encoding
        const bgBits = ((bg & 0x1) << 9)
                     | ((bg & 0x2) << 9)
                     | ((bg & 0x4) << 11)
                     | ((bg & 0x8) << 9);
        return gramBit + (gc * 8) + fg + bgBits;
    }

    /** True if any non-empty cell has a non-default BG color set. */
    static _needsFgBgMode() {
        return this.cells.some(c => !c.isEmpty && (c.bgColor ?? 0) !== 0);
    }

    /**
     * Decode a 16-bit backtab word back to a cell descriptor.
     * Inverse of _encodeBacktabWord — handles Color Stack and FG/BG modes.
     * Mode is heuristic: if any BG bits are set (positions 9, 10, 12, 13),
     * we assume FG/BG mode for that word.
     *
     * Returns: { cardNum, fgColor, bgColor, isGram, advanceFlag, isEmpty }
     */
    static _decodeBacktabWord(word) {
        if (word === 0x0000) {
            return { cardNum: 0, fgColor: 7, bgColor: 0, isGram: false, advanceFlag: false, isEmpty: true };
        }

        const fg     = word & 0x7;
        const cardNum = (word >> 3) & 0x3F;
        const isGram = (word & 0x0800) !== 0;

        // Detect FG/BG mode by checking the BG-bit positions
        // Mapping per STIC: BG bit 0→word bit 9, BG bit 1→word bit 10,
        //                   BG bit 2→word bit 13, BG bit 3→word bit 12
        const bgBit0 = (word >>  9) & 0x1;
        const bgBit1 = (word >> 10) & 0x1;
        const bgBit2 = (word >> 13) & 0x1;
        const bgBit3 = (word >> 12) & 0x1;
        const bgValue = (bgBit3 << 3) | (bgBit2 << 2) | (bgBit1 << 1) | bgBit0;

        // In CS mode, bit 13 is "advance color stack". In FG/BG mode, it's BG bit 2.
        // If bits 9, 10, 12, 13 are all zero, it's safe to assume CS mode.
        // If any are set BUT only bit 13 is set, prefer CS+advance interpretation.
        const onlyBit13 = bgBit2 === 1 && bgBit0 === 0 && bgBit1 === 0 && bgBit3 === 0;
        const isFgBg = bgValue !== 0 && !onlyBit13;

        if (isFgBg) {
            return { cardNum, fgColor: fg, bgColor: bgValue, isGram, advanceFlag: false, isEmpty: false };
        } else {
            // CS mode — bit 13 is advance, BG defaults to 0
            return { cardNum, fgColor: fg, bgColor: 0, isGram, advanceFlag: bgBit2 === 1, isEmpty: false };
        }
    }

    /**
     * Parse a jzIntv debugger memory dump (output of the 'm' command).
     * Format example:
     *   0200:  0000* 0000  0000  0000   0000  0000  0000  3D03    # ................
     *   0208:  3D03  3D03  3D03  1A1B   1203  1203  1203  1204    # ................
     *
     * Extracts hex words and returns a Map<address, wordValue>.
     * The `*` marker (recently-changed flag) is stripped. Anything after `#` is ignored.
     */
    static _parseMemoryDump(text) {
        const result = new Map();
        const lineRe = /^\s*([0-9A-Fa-f]{4}):\s*(.+?)(?:\s*#.*)?$/;

        // Normalize CRLF → LF so the $ anchor matches on Windows clipboards too
        for (const rawLine of text.replace(/\r/g, '').split('\n')) {
            const m = rawLine.match(lineRe);
            if (!m) continue;
            const startAddr = parseInt(m[1], 16);
            const wordStr = m[2];
            // Extract each 4-char hex word, optionally followed by *
            const words = wordStr.match(/\b[0-9A-Fa-f]{4}\*?/g) || [];
            words.forEach((w, i) => {
                const value = parseInt(w.replace(/\*$/, ''), 16);
                if (!isNaN(value)) {
                    result.set(startAddr + i, value);
                }
            });
        }
        return result;
    }

    /**
     * Import BACKTAB from a pasted jzIntv 'm' command memory dump.
     * Looks for addresses in the BACKTAB range ($0200-$02EF, 240 words).
     * Returns true on success.
     */
    static importBacktabFromDump(text) {
        if (!text || !text.trim()) {
            alert('Please paste a jzIntv memory dump first');
            return false;
        }

        const wordMap = this._parseMemoryDump(text);
        if (wordMap.size === 0) {
            alert('No valid memory dump lines found.\n\nExpected format from jzIntv "m" command:\n  0200:  3D03 1A1B 1204 ...');
            return false;
        }

        // Slice the BACKTAB range
        const BACKTAB_BASE = 0x0200;
        const BACKTAB_LEN  = 240;
        let cellsFound = 0;
        for (let i = 0; i < BACKTAB_LEN; i++) {
            const addr = BACKTAB_BASE + i;
            if (wordMap.has(addr)) cellsFound++;
        }
        if (cellsFound === 0) {
            alert(`Memory dump didn't include the BACKTAB range ($0200-$02EF).\n\nIn jzIntv debugger run:\n  m 200 F0\n\nThen paste the output here.`);
            return false;
        }

        this._pushUndo();
        const newCells = [];
        for (let i = 0; i < BACKTAB_LEN; i++) {
            const addr = BACKTAB_BASE + i;
            const word = wordMap.get(addr) ?? 0x0000;
            const decoded = this._decodeBacktabWord(word);
            newCells.push({
                cardNum:     decoded.cardNum,
                fgColor:     decoded.fgColor,
                bgColor:     decoded.bgColor,
                isGram:      decoded.isGram,
                advanceFlag: decoded.advanceFlag,
                isEmpty:     decoded.isEmpty,
            });
        }
        this.cells = newCells;
        this.render();
        this._updateStatus();

        const fgbgCount = newCells.filter(c => !c.isEmpty && c.bgColor !== 0).length;
        const gromCount = newCells.filter(c => !c.isEmpty && !c.isGram).length;
        const summary = `Imported ${cellsFound}/240 backtab cells. ${fgbgCount} use FG/BG colors. ${gromCount} reference GROM cards (shown as gray G<n> placeholders).`;
        alert(summary);
        return true;
    }

    static showPasteBacktabDialog() {
        const text = prompt(
            'Paste a jzIntv memory dump containing BACKTAB ($0200-$02EF).\n\n' +
            'In the jzIntv debugger, run:\n' +
            '  m 200 F0\n\n' +
            'Then copy the output and paste it here.\n\n' +
            'Example format:\n' +
            '  0200:  0000 0000 0000 0000   0000 0000 0000 3D03   # ...\n' +
            '  0208:  3D03 3D03 3D03 1A1B   1203 1203 1203 1204   # ...'
        );
        if (text) this.importBacktabFromDump(text);
    }

    static exportBacktab() {
        const fgbgMode = this._needsFgBgMode();
        const words = this.cells.map(c => this._encodeBacktabWord(c, fgbgMode));

        let out = "' Screen Layout — 20 cols × 12 rows\n";
        out    += "' Generated by Intellivision Overlay Editor\n";
        out    += "' https://intellivision-overlay-editor.fly.dev\n";
        out    += `' Mode: ${fgbgMode ? 'FG/BG (MODE 1)' : 'Color Stack (MODE 0)'}\n`;
        if (fgbgMode) {
            out += "' BG bits scattered to STIC positions 9, 11, 12, 13 (no GRAM/GROM bit)\n";
        }
        out    += '\n';
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
            b: c.bgColor ?? 0,
            g: c.isGram === false ? 0 : 1,        // GROM = 0, GRAM = 1 (default)
            a: c.advanceFlag ? 1 : 0,             // advance color stack flag
            e: c.isEmpty ? 1 : 0,
        }));
    }

    static deserializeCells(data) {
        if (!Array.isArray(data)) return;
        this.cells = data.map(c => ({
            cardNum:     c.n ?? 0,
            fgColor:     c.f ?? 7,
            bgColor:     c.b ?? 0,
            isGram:      (c.g ?? 1) === 1,
            advanceFlag: (c.a ?? 0) === 1,
            isEmpty:     (c.e ?? 1) === 1,
        }));
        // Pad to 240 if needed
        while (this.cells.length < this.COLS * this.ROWS) {
            this.cells.push(this._makeCell());
        }
    }
}
