/**
 * Sprite Editor Module
 * Creates 8x8, 8x16, 16x8, and 16x16 pixel sprites for Intellivision GRAM cards
 * Outputs IntyBASIC BITMAP statements, split into 8x8 GRAM card blocks
 */

export class SpriteEditor {
    // Intellivision 16-color palette (matching actual hardware colors)
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
        { index: 15, name: 'Purple',       hex: '#C81A7D' }
    ];

    // Editor state
    static sprites = [];
    static currentSpriteIndex = 0;
    static selectedFgColor = 7;    // Default: White
    static selectedBgColor = 0;    // Default: Black
    static gridWidth = 8;          // Current grid width (8 or 16)
    static gridHeight = 8;         // Current grid height (8 or 16)
    static isDrawing = false;
    static drawMode = 1;           // 1 = draw foreground, 0 = erase to background

    // Animation state
    static animationSequence = [];
    static animationFps = 10;
    static isAnimating = false;
    static animationFrame = 0;
    static animationInterval = null;
    // '1x1' = single sprite per frame (default)
    // '2x1' = two sprites side-by-side (horizontal composite)
    // '1x2' = two sprites stacked (vertical composite)
    static previewLayout = '1x1';
    // Hardware stretch mode: '1x1' | '2x1' (double-W) | '1x2' (double-H) | '2x2' (both)
    static stretchMode = '1x1';
    // TV aspect correction: Intellivision pixels are ~1.6× wider than tall (160×192 → 4:3 screen)
    static tvAspect = false;

    /**
     * Initialize the sprite editor
     */
    static init() {
        this.sprites = [this.createEmptySprite('sprite_0', 8, 8)];
        this.currentSpriteIndex = 0;

        this.setupEventListeners();
        this._initPanelResizer();

        this.renderPalette();
        this.renderGrid();
        this.renderPreview();
        this.updateSpriteList();
        this.updateOutput();
        this.updateSizeSelector();
        this.updateSpriteProperties();
    }

    /**
     * Set up the drag-to-resize handle between the canvas panel and the
     * list/output panels.
     */
    static _initPanelResizer() {
        const divider   = document.querySelector('.sprite-panel-divider');
        const canvasPanel = document.querySelector('.sprite-canvas-panel');
        const layout    = document.querySelector('.sprite-editor-layout');
        if (!divider || !canvasPanel || !layout) return;

        let isDragging = false;
        let startX     = 0;
        let startWidth = 0;

        divider.addEventListener('mousedown', e => {
            isDragging  = true;
            startX      = e.clientX;
            startWidth  = canvasPanel.getBoundingClientRect().width;
            divider.classList.add('dragging');
            document.body.style.cursor     = 'col-resize';
            document.body.style.userSelect = 'none';
            e.preventDefault();
        });

        document.addEventListener('mousemove', e => {
            if (!isDragging) return;
            const delta    = e.clientX - startX;
            const maxWidth = layout.clientWidth - 420; // keep list+output visible
            const newWidth = Math.max(220, Math.min(startWidth + delta, maxWidth));
            canvasPanel.style.width = newWidth + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            divider.classList.remove('dragging');
            document.body.style.cursor     = '';
            document.body.style.userSelect = '';
        });
    }

    // ==========================================
    // GRAM Card Management
    // ==========================================

    /**
     * Returns how many GRAM slots (8×8 blocks) a sprite occupies.
     * 8×8=1, 8×16=2, 16×8=2, 16×16=4
     */
    static _gramCardsNeeded(sprite) {
        return (sprite.width / 8) * (sprite.height / 8);
    }

    /**
     * Find the next free GRAM slot (0–63) based on all currently loaded sprites.
     */
    static _nextGramCard() {
        return this._nextGramCardAfter([]);
    }

    /**
     * Find the next free GRAM slot, considering both this.sprites and
     * an additional pending array (for mid-import allocation).
     */
    static _nextGramCardAfter(pending) {
        const used = new Set();
        for (const s of [...this.sprites, ...pending]) {
            const gc = s.gramCard ?? 0;
            const needed = this._gramCardsNeeded(s);
            for (let i = 0; i < needed; i++) used.add(gc + i);
        }
        for (let i = 0; i < 64; i++) {
            if (!used.has(i)) return i;
        }
        return 0;
    }

    /**
     * Create an empty sprite data structure
     * @param {string} name
     * @param {number} width - 8 or 16
     * @param {number} height - 8 or 16
     */
    static createEmptySprite(name = 'sprite', width = 8, height = 8) {
        return {
            name,
            width,
            height,
            pixels: Array.from({ length: height }, () => new Array(width).fill(0)),
            fgColor: this.selectedFgColor,
            bgColor: this.selectedBgColor,
            // GRAM / IntyBASIC properties
            gramCard: this._nextGramCard(),
            useMode: 'mob',   // 'mob' | 'cs' | 'fgbg'
            mobColor: 7,      // MOB hardware color index (0–7)
            csColor: 7,       // Color Stack foreground color (0–7)
            csAdvance: false, // Advance color stack on this card
            fgbgFg: 7,        // FG/BG mode foreground (0–7)
            fgbgBg: 0         // FG/BG mode background (0–15)
        };
    }

    /**
     * Get the current sprite being edited
     */
    static getCurrentSprite() {
        return this.sprites[this.currentSpriteIndex];
    }

    /**
     * Set up all event listeners
     */
    static setupEventListeners() {
        const canvas = document.getElementById('sprite-grid-canvas');
        if (canvas) {
            canvas.addEventListener('mousedown', (e) => this.handleGridMouseDown(e));
            canvas.addEventListener('mousemove', (e) => this.handleGridMouseMove(e));
            canvas.addEventListener('mouseup', () => this.handleGridMouseUp());
            canvas.addEventListener('mouseleave', () => this.handleGridMouseUp());
            canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        }

        document.addEventListener('keydown', (e) => {
            const spriteTab = document.getElementById('sprite-editor-tab');
            if (!spriteTab || !spriteTab.classList.contains('active')) return;

            if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
                this.copyOutputToClipboard();
            }
        });
    }

    // ==========================================
    // Size Management
    // ==========================================

    /**
     * Set the sprite size, resizing the pixel array
     * @param {number} newWidth - 8 or 16
     * @param {number} newHeight - 8 or 16
     */
    static setSpriteSize(newWidth, newHeight) {
        const sprite = this.getCurrentSprite();
        if (!sprite) return;

        const oldWidth = sprite.width;
        const oldHeight = sprite.height;

        // Expand/crop rows (height)
        if (newHeight > oldHeight) {
            for (let y = oldHeight; y < newHeight; y++) {
                sprite.pixels.push(new Array(oldWidth).fill(0));
            }
        } else if (newHeight < oldHeight) {
            sprite.pixels = sprite.pixels.slice(0, newHeight);
        }

        // Expand/crop columns (width)
        if (newWidth !== oldWidth) {
            sprite.pixels = sprite.pixels.map(row => {
                if (newWidth > oldWidth) {
                    return [...row, ...new Array(newWidth - oldWidth).fill(0)];
                } else {
                    return row.slice(0, newWidth);
                }
            });
        }

        sprite.width = newWidth;
        sprite.height = newHeight;
        this.gridWidth = newWidth;
        this.gridHeight = newHeight;

        this.renderGrid();
        this.renderPreview();
        this.updateOutput();
        this.updateSizeSelector();
    }

    /**
     * Update the size selector button group to reflect current sprite size
     */
    static updateSizeSelector() {
        const sprite = this.getCurrentSprite();
        if (!sprite) return;

        document.querySelectorAll('.sprite-size-btn').forEach(btn => {
            const [w, h] = (btn.dataset.size || '8x8').split('x').map(Number);
            btn.classList.toggle('active', w === sprite.width && h === sprite.height);
        });
    }

    // ==========================================
    // Palette
    // ==========================================

    static renderPalette() {
        const fgContainer = document.getElementById('sprite-fg-palette');
        const bgContainer = document.getElementById('sprite-bg-palette');
        if (!fgContainer || !bgContainer) return;

        fgContainer.innerHTML = '';
        bgContainer.innerHTML = '';

        this.PALETTE.forEach((color, index) => {
            const fgSwatch = document.createElement('div');
            fgSwatch.className = 'palette-swatch' + (index === this.selectedFgColor ? ' selected' : '');
            fgSwatch.style.backgroundColor = color.hex;
            fgSwatch.title = `${color.name} (${index})`;
            fgSwatch.onclick = () => this.selectFgColor(index);
            fgContainer.appendChild(fgSwatch);

            const bgSwatch = document.createElement('div');
            bgSwatch.className = 'palette-swatch' + (index === this.selectedBgColor ? ' selected' : '');
            bgSwatch.style.backgroundColor = color.hex;
            bgSwatch.title = `${color.name} (${index})`;
            bgSwatch.onclick = () => this.selectBgColor(index);
            bgContainer.appendChild(bgSwatch);
        });
    }

    static selectFgColor(index) {
        this.selectedFgColor = index;
        const sprite = this.getCurrentSprite();
        if (sprite) sprite.fgColor = index;
        this.renderPalette();
        this.renderGrid();
        this.renderPreview();
        this.updateOutput();
    }

    static selectBgColor(index) {
        this.selectedBgColor = index;
        const sprite = this.getCurrentSprite();
        if (sprite) sprite.bgColor = index;
        this.renderPalette();
        this.renderGrid();
        this.renderPreview();
    }

    // ==========================================
    // Rendering
    // ==========================================

    /**
     * Render the pixel grid canvas
     */
    /** How many 4×8 sprites to show side-by-side in the split grid view. */
    static SPLIT_COUNT = 4;
    /** Gap in pixels between split grid panels. */
    static SPLIT_GAP = 6;

    /** Check if current sprite triggers the 4×8 split grid view. */
    static _isSplitView() {
        const sprite = this.getCurrentSprite();
        return sprite && sprite.width === 4 && sprite.height === 8;
    }

    /** Get the array of sprites shown in split view (current + next 3). */
    static _getSplitSprites() {
        const idx = this.currentSpriteIndex;
        const group = [];
        for (let i = 0; i < this.SPLIT_COUNT; i++) {
            const s = this.sprites[idx + i];
            group.push(s && s.width === 4 && s.height === 8 ? s : null);
        }
        return group;
    }

    static renderGrid() {
        const canvas = document.getElementById('sprite-grid-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const sprite = this.getCurrentSprite();
        if (!sprite) return;

        if (this._isSplitView()) {
            this._renderSplitGrid(canvas, ctx);
            return;
        }

        // Fill the container width, using whole pixels per cell
        const container = canvas.parentElement;
        if (container) {
            const available = container.clientWidth - 16; // subtract container padding
            const fitted = Math.max(8, Math.floor(available / sprite.width));
            canvas.width = fitted * sprite.width;
        }

        const cellSize = Math.floor(canvas.width / sprite.width);
        canvas.height = sprite.height * cellSize;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw pixels
        for (let y = 0; y < sprite.height; y++) {
            for (let x = 0; x < sprite.width; x++) {
                const isSet = sprite.pixels[y][x] === 1;
                const colorIndex = isSet ? sprite.fgColor : sprite.bgColor;
                ctx.fillStyle = this.PALETTE[colorIndex].hex;
                ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
        }

        // Draw fine grid lines
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
        for (let x = 0; x <= sprite.width; x++) {
            ctx.beginPath();
            ctx.moveTo(x * cellSize + 0.5, 0);
            ctx.lineTo(x * cellSize + 0.5, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y <= sprite.height; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * cellSize + 0.5);
            ctx.lineTo(canvas.width, y * cellSize + 0.5);
            ctx.stroke();
        }

        // Draw GRAM card boundary separators
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 2;
        if (sprite.height === 16) {
            ctx.beginPath();
            ctx.moveTo(0, 8 * cellSize);
            ctx.lineTo(canvas.width, 8 * cellSize);
            ctx.stroke();
        }
        if (sprite.width === 16) {
            ctx.beginPath();
            ctx.moveTo(8 * cellSize, 0);
            ctx.lineTo(8 * cellSize, canvas.height);
            ctx.stroke();
        }
    }

    /**
     * Render 4 × (4×8) sprite grids side by side with gaps.
     * The active sprite (currentSpriteIndex) gets a highlight border.
     */
    static _renderSplitGrid(canvas, ctx) {
        const group = this._getSplitSprites();
        const container = canvas.parentElement;
        const available = (container?.clientWidth ?? 600) - 16;
        const totalGaps = this.SPLIT_GAP * (this.SPLIT_COUNT - 1);
        // Each panel is 4 cells wide; fit cellSize to fill available width
        const cellSize = Math.floor((available - totalGaps) / (4 * this.SPLIT_COUNT));
        const panelW = 4 * cellSize;
        const panelH = 8 * cellSize;

        canvas.width  = panelW * this.SPLIT_COUNT + totalGaps;
        canvas.height = panelH;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let g = 0; g < this.SPLIT_COUNT; g++) {
            const ox = g * (panelW + this.SPLIT_GAP);
            const spr = group[g];

            // Background fill
            ctx.fillStyle = '#0C0005';
            ctx.fillRect(ox, 0, panelW, panelH);

            // Draw pixels
            if (spr) {
                for (let y = 0; y < 8; y++) {
                    for (let x = 0; x < 4; x++) {
                        const isSet = spr.pixels[y]?.[x] === 1;
                        const colorIndex = isSet ? spr.fgColor : spr.bgColor;
                        ctx.fillStyle = this.PALETTE[colorIndex].hex;
                        ctx.fillRect(ox + x * cellSize, y * cellSize, cellSize, cellSize);
                    }
                }
            }

            // Grid lines
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 1;
            for (let x = 0; x <= 4; x++) {
                ctx.beginPath();
                ctx.moveTo(ox + x * cellSize + 0.5, 0);
                ctx.lineTo(ox + x * cellSize + 0.5, panelH);
                ctx.stroke();
            }
            for (let y = 0; y <= 8; y++) {
                ctx.beginPath();
                ctx.moveTo(ox + 0.5, y * cellSize + 0.5);
                ctx.lineTo(ox + panelW + 0.5, y * cellSize + 0.5);
                ctx.stroke();
            }

            // Active sprite highlight
            if (this.currentSpriteIndex + g === this.currentSpriteIndex && g === 0) {
                ctx.strokeStyle = '#4a90d9';
                ctx.lineWidth = 3;
                ctx.strokeRect(ox + 1.5, 1.5, panelW - 3, panelH - 3);
            }
        }
    }

    /**
     * Render the small preview canvas
     */
    static renderPreview() {
        const canvas = document.getElementById('sprite-preview-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const sprite = this.getCurrentSprite();
        if (!sprite) return;

        const { sx, sy } = this._getScale();

        // For 4×8 sprites, show 4 consecutive sprites side by side
        if (sprite.width === 4 && sprite.height === 8) {
            const idx = this.currentSpriteIndex;
            const group = [];
            for (let i = 0; i < 4; i++) {
                const s = this.sprites[idx + i];
                if (s && s.width === 4 && s.height === 8) group.push(s);
                else group.push(null);
            }
            canvas.width  = Math.round(4 * 4 * sx);
            canvas.height = Math.round(8 * sy);
            ctx.imageSmoothingEnabled = false;
            for (let g = 0; g < 4; g++) {
                const spr = group[g];
                const ox = Math.round(g * 4 * sx);
                for (let y = 0; y < 8; y++) {
                    for (let x = 0; x < 4; x++) {
                        const isSet = spr ? (spr.pixels[y]?.[x] === 1) : false;
                        const colorIndex = isSet
                            ? (spr?.fgColor ?? 7)
                            : (spr?.bgColor ?? 0);
                        ctx.fillStyle = this.PALETTE[colorIndex].hex;
                        ctx.fillRect(ox + Math.round(x * sx), Math.round(y * sy), Math.ceil(sx), Math.ceil(sy));
                    }
                }
                // Draw a thin separator between tiles
                if (g > 0) {
                    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(ox, 0);
                    ctx.lineTo(ox, canvas.height);
                    ctx.stroke();
                }
            }
            return;
        }

        canvas.width  = Math.round(sprite.width  * sx);
        canvas.height = Math.round(sprite.height * sy);
        ctx.imageSmoothingEnabled = false;

        for (let y = 0; y < sprite.height; y++) {
            for (let x = 0; x < sprite.width; x++) {
                const isSet = sprite.pixels[y][x] === 1;
                const colorIndex = isSet ? sprite.fgColor : sprite.bgColor;
                ctx.fillStyle = this.PALETTE[colorIndex].hex;
                ctx.fillRect(Math.round(x * sx), Math.round(y * sy), Math.ceil(sx), Math.ceil(sy));
            }
        }
    }

    /** Compute pixel scale factors for the current stretch + TV aspect settings. */
    static _getScale(base = 8) {
        const tv = this.tvAspect ? 1.6 : 1;
        let mx = 1, my = 1;
        switch (this.stretchMode) {
            case '0.5x':            my = 0.5; break;
            case '2x1':  mx = 2;              break;
            case '1x2':             my = 2;   break;
            case '2x2':  mx = 2;   my = 2;   break;
        }
        return { sx: base * mx * tv, sy: base * my };
    }

    /** Set hardware stretch preview mode and re-render. */
    static setStretchMode(mode) {
        this.stretchMode = mode;
        document.querySelectorAll('.stretch-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.stretch === mode);
        });
        this.renderPreview();
        this.renderAnimationFrame();
    }

    /** Toggle TV pixel aspect ratio correction (Intellivision: ~1.6:1 PAR) and re-render. */
    static toggleTvAspect() {
        this.tvAspect = !this.tvAspect;
        const btn = document.getElementById('sprite-tv-btn');
        if (btn) btn.classList.toggle('active', this.tvAspect);
        this.renderPreview();
        this.renderAnimationFrame();
    }

    // ==========================================
    // Input Handling
    // ==========================================

    static handleGridMouseDown(e) {
        this.isDrawing = true;
        this.drawMode = e.button === 0 ? 1 : 0;
        this.handleGridClick(e);
    }

    static handleGridMouseMove(e) {
        if (!this.isDrawing) return;
        this.handleGridClick(e);
    }

    static handleGridMouseUp() {
        this.isDrawing = false;
    }

    static handleGridClick(e) {
        const canvas = document.getElementById('sprite-grid-canvas');
        const sprite = this.getCurrentSprite();
        if (!canvas || !sprite) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const canvasX = (e.clientX - rect.left) * scaleX;
        const canvasY = (e.clientY - rect.top) * scaleY;

        if (this._isSplitView()) {
            // Determine which of the 4 panels was clicked
            const totalGaps = this.SPLIT_GAP * (this.SPLIT_COUNT - 1);
            const panelW = (canvas.width - totalGaps) / this.SPLIT_COUNT;
            const panelStride = panelW + this.SPLIT_GAP;
            const panelIdx = Math.floor(canvasX / panelStride);
            if (panelIdx < 0 || panelIdx >= this.SPLIT_COUNT) return;

            const localX = canvasX - panelIdx * panelStride;
            if (localX > panelW) return; // clicked in the gap

            const cellSize = panelW / 4;
            const px = Math.floor(localX / cellSize);
            const py = Math.floor(canvasY / cellSize);
            if (px < 0 || px >= 4 || py < 0 || py >= 8) return;

            const targetIdx = this.currentSpriteIndex + panelIdx;
            let targetSprite = this.sprites[targetIdx];

            // Auto-create 4×8 sprites in empty panel slots
            if (!targetSprite || targetSprite.width !== 4 || targetSprite.height !== 8) {
                // Fill in any gaps between current sprite and the target
                while (this.sprites.length <= targetIdx) {
                    this.sprites.push({
                        name:      `sprite_${this.sprites.length}`,
                        width:     4,
                        height:    8,
                        pixels:    Array.from({ length: 8 }, () => new Array(4).fill(0)),
                        fgColor:   this.selectedFgColor,
                        bgColor:   this.selectedBgColor,
                        gramCard:  this._nextGramCard(),
                        useMode:   'mob',
                        mobColor:  7,
                        csColor:   7,
                        csAdvance: false,
                        fgbgFg:    7,
                        fgbgBg:    0
                    });
                }
                targetSprite = this.sprites[targetIdx];
                this.updateSpriteList();
            }

            targetSprite.pixels[py][px] = this.drawMode;
            this.renderGrid();
            this.renderPreview();
            this.updateOutput();
            return;
        }

        const cellSize = canvas.width / sprite.width;
        const x = Math.floor(canvasX / cellSize);
        const y = Math.floor(canvasY / cellSize);

        if (x >= 0 && x < sprite.width && y >= 0 && y < sprite.height) {
            sprite.pixels[y][x] = this.drawMode;
            this.renderGrid();
            this.renderPreview();
            this.updateOutput();
        }
    }

    // ==========================================
    // Pixel Tools
    // ==========================================

    static clearSprite() {
        const sprite = this.getCurrentSprite();
        if (!sprite) return;
        sprite.pixels = Array.from({ length: sprite.height }, () => new Array(sprite.width).fill(0));
        this.renderGrid();
        this.renderPreview();
        this.updateOutput();
    }

    static fillSprite() {
        const sprite = this.getCurrentSprite();
        if (!sprite) return;
        sprite.pixels = Array.from({ length: sprite.height }, () => new Array(sprite.width).fill(1));
        this.renderGrid();
        this.renderPreview();
        this.updateOutput();
    }

    static invertSprite() {
        const sprite = this.getCurrentSprite();
        if (!sprite) return;
        for (let y = 0; y < sprite.height; y++) {
            for (let x = 0; x < sprite.width; x++) {
                sprite.pixels[y][x] = sprite.pixels[y][x] === 0 ? 1 : 0;
            }
        }
        this.renderGrid();
        this.renderPreview();
        this.updateOutput();
    }

    static flipHorizontal() {
        const sprite = this.getCurrentSprite();
        if (!sprite) return;
        for (let y = 0; y < sprite.height; y++) {
            sprite.pixels[y].reverse();
        }
        this.renderGrid();
        this.renderPreview();
        this.updateOutput();
    }

    static flipVertical() {
        const sprite = this.getCurrentSprite();
        if (!sprite) return;
        sprite.pixels.reverse();
        this.renderGrid();
        this.renderPreview();
        this.updateOutput();
    }

    static shiftSprite(direction) {
        const sprite = this.getCurrentSprite();
        if (!sprite) return;
        switch (direction) {
            case 'up':    sprite.pixels.push(sprite.pixels.shift()); break;
            case 'down':  sprite.pixels.unshift(sprite.pixels.pop()); break;
            case 'left':
                for (let y = 0; y < sprite.height; y++) {
                    sprite.pixels[y].push(sprite.pixels[y].shift());
                }
                break;
            case 'right':
                for (let y = 0; y < sprite.height; y++) {
                    sprite.pixels[y].unshift(sprite.pixels[y].pop());
                }
                break;
        }
        this.renderGrid();
        this.renderPreview();
        this.updateOutput();
    }

    /**
     * Rotate 90° clockwise - only available for square sprites (8x8)
     */
    static rotateClockwise() {
        const sprite = this.getCurrentSprite();
        if (!sprite || sprite.width !== sprite.height) return;

        const size = sprite.width;
        const newPixels = [];
        for (let x = 0; x < size; x++) {
            const newRow = [];
            for (let y = size - 1; y >= 0; y--) {
                newRow.push(sprite.pixels[y][x]);
            }
            newPixels.push(newRow);
        }
        sprite.pixels = newPixels;
        this.renderGrid();
        this.renderPreview();
        this.updateOutput();
    }

    // ==========================================
    // Output Generation
    // ==========================================

    /**
     * Split a sprite into 8x8 GRAM card blocks, in row-major order
     * Returns array of { label, rows } objects
     *
     * 8x8  → 1 card:  name
     * 8x16 → 1 card:  name  (16 rows)
     * 16x8 → 2 cards: name_0 (left), name_1 (right)
     * 16x16→ 4 cards: name_0 (TL), name_1 (TR), name_2 (BL), name_3 (BR)
     */
    static splitIntoGramCards(sprite) {
        const wCards = sprite.width / 8;   // 1 or 2
        const hCards = sprite.height / 8;  // 1 or 2
        const cards = [];

        if (wCards === 1) {
            // Single-column sprite (8×8 or 8×16): one label, all rows together.
            // DEFINE uses numCards=height/8 to load the full run.
            const rows = [];
            for (let y = 0; y < sprite.height; y++) {
                rows.push(Array.from({ length: 8 }, (_, x) => sprite.pixels[y]?.[x] ?? 0));
            }
            cards.push({ label: sprite.name, rows });
        } else {
            // Multi-column (16-wide): separate 8×8 blocks in row-major order.
            // 16×8  → _0 (left),  _1 (right)
            // 16×16 → _0 (TL), _1 (TR), _2 (BL), _3 (BR)
            for (let hy = 0; hy < hCards; hy++) {
                for (let hx = 0; hx < wCards; hx++) {
                    const cardIndex = hy * wCards + hx;
                    const label = `${sprite.name}_${cardIndex}`;
                    const rows = [];
                    for (let y = hy * 8; y < hy * 8 + 8; y++) {
                        rows.push(Array.from({ length: 8 }, (_, x) => sprite.pixels[y]?.[hx * 8 + x] ?? 0));
                    }
                    cards.push({ label, rows });
                }
            }
        }

        return cards;
    }

    // ==========================================
    // IntyBASIC Code Generation Helpers
    // ==========================================

    /** Human-readable description of a sprite's active color settings */
    static _colorDesc(sprite) {
        const mode = sprite.useMode || 'mob';
        if (mode === 'mob') {
            const c = sprite.mobColor ?? 7;
            return `${this.PALETTE[c].name} (${c})`;
        } else if (mode === 'cs') {
            const c = sprite.csColor ?? 7;
            const adv = sprite.csAdvance ? ' +advance' : '';
            return `FG: ${this.PALETTE[c].name} (${c})${adv}`;
        } else {
            const fg = sprite.fgbgFg ?? 7;
            const bg = sprite.fgbgBg ?? 0;
            return `FG: ${this.PALETTE[fg].name}, BG: ${this.PALETTE[bg].name}`;
        }
    }

    /**
     * Generate DEFINE statement(s) for a sprite.
     * Single-column sprites use one DEFINE with numCards = height/8.
     * Multi-column sprites use one DEFINE per 8×8 block.
     */
    static _generateDefine(sprite) {
        const gc = sprite.gramCard ?? 0;
        if (sprite.width === 8) {
            const numCards = sprite.height / 8;
            return `DEFINE ${gc}, ${numCards}, ${sprite.name}`;
        } else {
            const cards = this.splitIntoGramCards(sprite);
            return cards.map((card, i) => `DEFINE ${gc + i}, 1, ${card.label}`).join('\n');
        }
    }

    /**
     * Generate mode-specific IntyBASIC usage snippet (as comments).
     */
    static _modeSnippet(sprite) {
        const mode  = sprite.useMode || 'mob';
        const gc    = sprite.gramCard ?? 0;
        const wCards = sprite.width / 8;

        if (mode === 'mob') {
            const color = sprite.mobColor ?? 7;
            const cname = this.PALETTE[color].name;
            let s = `\n' --- MOB Sprite Usage (${cname}) ---\n`;
            if (wCards === 1) {
                s += `' SPRITE n, (xPos + $200), yPos, (${gc} * 8 + ${color})\n`;
            } else {
                for (let i = 0; i < wCards; i++) {
                    const offset = i > 0 ? `${i * 8} + ` : '';
                    s += `' SPRITE n+${i}, (xPos + ${offset}$200), yPos, (${gc + i} * 8 + ${color})  ' ${cname}\n`;
                }
            }
            return s;
        } else if (mode === 'cs') {
            const color = sprite.csColor ?? 7;
            const cname = this.PALETTE[color].name;
            const adv   = sprite.csAdvance ? ' + $2000' : '';
            const bval  = `${color} + ${gc} * 8 + $800${adv}`;
            return `\n' --- Color Stack Tile Usage (FG: ${cname}) ---\n' BACKTAB(row, col) = ${bval}\n`;
        } else { // fgbg
            const fg    = sprite.fgbgFg ?? 7;
            const bg    = sprite.fgbgBg ?? 0;
            const fname = this.PALETTE[fg].name;
            const bname = this.PALETTE[bg].name;
            const bval  = `${gc} * 8 + $C00`;
            return (
                `\n' --- FG/BG Tile Usage (FG: ${fname}, BG: ${bname}) ---\n` +
                `' BACKTAB(row, col) = ${bval}  ' GRAM flag + FG/BG mode\n` +
                `' Set STIC color regs for FG/BG colors before display\n`
            );
        }
    }

    /**
     * Generate IntyBASIC output for the current sprite
     */
    static generateOutput() {
        const sprite = this.getCurrentSprite();
        if (!sprite) return '';

        const cards    = this.splitIntoGramCards(sprite);
        const gc       = sprite.gramCard ?? 0;
        const needed   = this._gramCardsNeeded(sprite);
        const slotEnd  = gc + needed - 1;
        const slotRange = needed === 1 ? `${gc}` : `${gc}–${slotEnd}`;
        const modeName  = { mob: 'MOB Sprite', cs: 'Color Stack Tile', fgbg: 'FG/BG Tile' }[sprite.useMode || 'mob'];

        let output = `' ${sprite.name}  |  GRAM ${slotRange}  |  ${modeName}  |  ${this._colorDesc(sprite)}\n`;

        for (const card of cards) {
            output += `${card.label}:\n`;
            for (const row of card.rows) {
                output += '    BITMAP "' + row.map(p => p ? 'X' : '.').join('') + '"\n';
            }
            output += '\n';
        }

        output += this._generateDefine(sprite) + '\n';
        output += this._modeSnippet(sprite);

        return output.trimEnd() + '\n';
    }

    /**
     * Generate IntyBASIC output for all sprites (full project dump)
     */
    static generateAllOutput() {
        let output = "' IntyBASIC Sprite Definitions\n";
        output += "' Generated by Intellivision Overlay Editor\n";
        output += "' https://intellivision-overlay-editor.fly.dev\n\n";

        for (const sprite of this.sprites) {
            const cards    = this.splitIntoGramCards(sprite);
            const gc       = sprite.gramCard ?? 0;
            const needed   = this._gramCardsNeeded(sprite);
            const slotEnd  = gc + needed - 1;
            const slotRange = needed === 1 ? `${gc}` : `${gc}–${slotEnd}`;
            const modeName  = { mob: 'MOB Sprite', cs: 'Color Stack Tile', fgbg: 'FG/BG Tile' }[sprite.useMode || 'mob'];

            output += `' ${sprite.name}  |  GRAM ${slotRange}  |  ${modeName}  |  ${this._colorDesc(sprite)}\n`;

            for (const card of cards) {
                output += `${card.label}:\n`;
                for (const row of card.rows) {
                    output += '    BITMAP "' + row.map(p => p ? 'X' : '.').join('') + '"\n';
                }
                output += '\n';
            }

            output += this._generateDefine(sprite) + '\n';
            output += this._modeSnippet(sprite);
            output += '\n';
        }

        return output.trimEnd() + '\n';
    }

    static updateOutput() {
        const textarea = document.getElementById('sprite-output');
        if (textarea) {
            textarea.value = this.generateOutput();
        }
    }

    static copyOutputToClipboard() {
        const textarea = document.getElementById('sprite-output');
        if (textarea) {
            textarea.select();
            document.execCommand('copy');
            const btn = document.getElementById('sprite-copy-btn');
            if (btn) {
                const orig = btn.textContent;
                btn.textContent = 'Copied!';
                setTimeout(() => { btn.textContent = orig; }, 1500);
            }
        }
    }

    static copyAllToClipboard() {
        const output = this.generateAllOutput();
        navigator.clipboard.writeText(output).then(() => {
            const btn = document.getElementById('sprite-copy-all-btn');
            if (btn) {
                const orig = btn.textContent;
                btn.textContent = 'Copied!';
                setTimeout(() => { btn.textContent = orig; }, 1500);
            }
        });
    }

    static downloadOutput() {
        const output = this.generateAllOutput();
        const blob = new Blob([output], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sprites.bas';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ==========================================
    // BITMAP Import
    // ==========================================

    /**
     * Parse IntyBASIC BITMAP or as1600 DECLE text and create one or more sprites.
     * Splits on label lines (word:) so pasting multiple labeled definitions
     * creates multiple sprites. Unlabeled input with >8 rows of 8-wide data
     * is auto-split every 8 rows.
     * Supports: BITMAP "..XX..", DECLE $FF, WORD %11001100, DATA 255
     */
    static parseBitmapText(text) {
        if (!text || !text.trim()) {
            alert('Please paste BITMAP or DECLE data first');
            return false;
        }

        // Try jzIntv "gt" (GRAM text) grid format first
        const gtSegments = this._parseJzintvGramText(text);
        const segments = gtSegments.length > 0 ? gtSegments : this._splitBitmapSegments(text);

        if (segments.length === 0) {
            alert('No valid sprite data found.\n\nSupported formats:\n    BITMAP "..XXXX.."\n    DECLE $3C, $7E, $FF\n    WORD %00111100\n    jzIntv "gt" GRAM text dump');
            return false;
        }

        // Try to detect and merge composite sprite groups (e.g. TL/TR/BL/BR → 16×16)
        const merged = this._mergeCompositeSegments(segments);

        let imported = [];
        for (const seg of merged) {
            const sprite = this._parseSingleBitmapSegment(seg.name, seg.rows);
            if (sprite) imported.push(sprite);
        }

        if (imported.length === 0) {
            alert('No valid sprite data found.\n\nSupported formats:\n    BITMAP "..XXXX.."\n    DECLE $3C, $7E, $FF\n    WORD %00111100');
            return false;
        }

        // In 4×8 split mode, auto-split 8-wide sprites into left/right halves
        if (this._isSplitView()) {
            const split = [];
            for (const spr of imported) {
                if (spr.width === 8) {
                    // Left half
                    split.push({
                        ...spr,
                        name:   spr.name + '_L',
                        width:  4,
                        pixels: spr.pixels.map(row => row.slice(0, 4)),
                        gramCard: this._nextGramCardAfter(split),
                    });
                    // Right half
                    split.push({
                        ...spr,
                        name:   spr.name + '_R',
                        width:  4,
                        pixels: spr.pixels.map(row => row.slice(4, 8)),
                        gramCard: this._nextGramCardAfter(split),
                    });
                } else {
                    split.push(spr);
                }
            }
            imported = split;
        }

        for (const sprite of imported) {
            this.sprites.push(sprite);
        }
        this.currentSpriteIndex = this.sprites.length - 1;

        const last = imported[imported.length - 1];
        this.gridWidth  = last.width;
        this.gridHeight = last.height;

        this.updateSpriteList();
        this.renderPalette();
        this.renderGrid();
        this.renderPreview();
        this.updateOutput();
        this.updateSizeSelector();
        this.updateSpriteProperties();

        return true;
    }

    /**
     * Parse jzIntv debugger "gt" (GRAM text) grid format.
     * Format: column header row, then 8 data rows like:
     *   0      0 1      1 2      2 3      3
     *   0:  ######## ######## .......# #.......
     *   1:  ######.. ..###### .......# #.......
     *   ...
     * Each pair of 8-char blocks is one GRAM card (left=even, right=odd).
     * Cards are laid out in columns across the line, 8 rows per card.
     * Returns segments array, or empty array if text doesn't match this format.
     */
    static _parseJzintvGramText(text) {
        const lines = text.split('\n');

        // Look for data rows: "N:  " followed by blocks of #/. separated by spaces
        const dataRowRe = /^\s*\d+:\s+((?:[.#]{8}\s*)+)$/;
        const dataRows = [];

        for (const line of lines) {
            const m = line.match(dataRowRe);
            if (m) {
                // Extract all 8-char blocks from this row
                const blocks = m[1].match(/[.#]{8}/g);
                if (blocks) dataRows.push(blocks);
            }
        }

        // Need exactly 8 data rows to be a valid gt dump
        if (dataRows.length < 8) return [];
        // All rows must have the same number of blocks
        const numBlocks = dataRows[0].length;
        if (!dataRows.every(r => r.length === numBlocks)) return [];

        const segments = [];
        // Process 8-row groups (multiple gt dumps can be concatenated)
        for (let rowGroup = 0; rowGroup < dataRows.length; rowGroup += 8) {
            const groupRows = dataRows.slice(rowGroup, rowGroup + 8);
            if (groupRows.length < 8) break;

            for (let col = 0; col < numBlocks; col++) {
                const rows = [];
                let allEmpty = true;
                for (let y = 0; y < 8; y++) {
                    const block = groupRows[y][col];
                    const row = [];
                    for (let x = 0; x < 8; x++) {
                        const px = block[x] === '#' ? 1 : 0;
                        if (px) allEmpty = false;
                        row.push(px);
                    }
                    rows.push(row);
                }
                // Skip completely empty cards
                if (!allEmpty) {
                    const cardIndex = (rowGroup / 8) * numBlocks + col;
                    segments.push({
                        name: `gram_${cardIndex}`,
                        rows,
                        width: 8
                    });
                }
            }
        }

        return segments;
    }

    /**
     * Split BITMAP text into labeled segments. Each segment is { name, rows[] }.
     * Label lines (e.g. "player_l:") start a new sprite group.
     * Unlabeled input with >8 rows of 8-wide bitmaps is auto-split every 8 rows.
     */
    /**
     * Parse a numeric value from assembler notation.
     * Supports: $FF (hex), 0xFF (hex), %11001100 (binary), 255 (decimal).
     */
    static _parseAsmNumber(token) {
        token = token.trim();
        if (/^\$[0-9a-f]+$/i.test(token))  return parseInt(token.slice(1), 16);
        if (/^0x[0-9a-f]+$/i.test(token))  return parseInt(token, 16);
        if (/^%[01]+$/.test(token))         return parseInt(token.slice(1), 2);
        if (/^\d+$/.test(token))            return parseInt(token, 10);
        return NaN;
    }

    /**
     * Convert a numeric value to an 8-pixel row array (MSB = leftmost pixel).
     */
    static _decleToRow(value, width = 8) {
        const row = [];
        for (let i = width - 1; i >= 0; i--) {
            row.push((value >> i) & 1);
        }
        return row;
    }

    static _splitBitmapSegments(text) {
        const bitmapLineRe = /BITMAP\s*"([.X#]{1,16})"/i;
        // DECLE / .WORD / WORD line: keyword followed by comma-separated numeric values
        const decleLineRe  = /^\s*(?:DECLE|\.?WORD|\.?BYTE|DATA)\s+(.+)/i;
        // A label line: whole line is just "word:" (plus optional whitespace/comment)
        const labelLineRe  = /^\s*(\w+)\s*:\s*(;.*)?$/;

        const segments = [];
        let currentName = null;
        let currentRows = [];
        let currentWidth = 8;

        const flushSegment = () => {
            if (currentRows.length > 0) {
                // Auto-split unlabeled blocks at 16-row boundaries (max sprite height).
                // ≤16 rows stays as one segment — _parseSingleBitmapSegment handles
                // both 8×8 and 8×16 sprites naturally.
                if (currentWidth === 8 && currentRows.length > 16) {
                    for (let i = 0; i < currentRows.length; i += 16) {
                        const chunk = currentRows.slice(i, i + 16);
                        const autoName = currentName
                            ? (i === 0 ? currentName : `${currentName}_${i / 16}`)
                            : null;
                        segments.push({ name: autoName, rows: chunk, width: currentWidth });
                    }
                } else {
                    segments.push({ name: currentName, rows: currentRows, width: currentWidth });
                }
            }
            currentName = null;
            currentRows = [];
            currentWidth = 8;
        };

        for (const line of text.split('\n')) {
            const labelMatch = line.match(labelLineRe);
            const bitmapMatch = line.match(bitmapLineRe);
            const decleMatch = !bitmapMatch ? line.match(decleLineRe) : null;

            if (labelMatch && !bitmapMatch && !decleMatch) {
                flushSegment();
                currentName = labelMatch[1];
            } else if (bitmapMatch) {
                const pattern = bitmapMatch[1];
                if (currentRows.length === 0) {
                    currentWidth = pattern.length <= 8 ? 8 : 16;
                }
                const row = [];
                for (let i = 0; i < currentWidth; i++) {
                    const ch = pattern[i] || '.';
                    row.push(ch === '#' || ch.toUpperCase() === 'X' ? 1 : 0);
                }
                currentRows.push(row);
            } else if (decleMatch) {
                // Strip trailing comment (;...) then split on commas
                const valuesStr = decleMatch[1].replace(/;.*$/, '');
                const tokens = valuesStr.split(',');
                for (const tok of tokens) {
                    const val = this._parseAsmNumber(tok);
                    if (!isNaN(val)) {
                        currentRows.push(this._decleToRow(val, currentWidth));
                    }
                }
            }
        }
        flushSegment();

        return segments.filter(s => s.rows.length > 0);
    }

    /**
     * Detect composite sprite groups by naming convention and merge their pixels.
     * Patterns detected:
     *   TL/TR/BL/BR  → 2×2 grid (e.g. MegaBossTL, MegaBossTR, MegaBossBL, MegaBossBR)
     *   T/B or Top/Bottom  → 1×2 vertical stack
     *   L/R or Left/Right  → 2×1 horizontal pair
     * Returns a new segments array with composites merged and singles passed through.
     */
    static _mergeCompositeSegments(segments) {
        if (segments.length < 2) return segments;

        // Suffix patterns: [regex, arrangement, slot-order]
        // Slot order: [topLeft, topRight, bottomLeft, bottomRight] for 2×2
        //             [top, bottom] for 1×2, [left, right] for 2×1
        const patterns = [
            // 2×2: TL/TR/BL/BR variants
            { re: /^(.+?)[-_]?(?:TL|TopLeft)$/i,   type: '2x2', pos: 'TL' },
            { re: /^(.+?)[-_]?(?:TR|TopRight)$/i,   type: '2x2', pos: 'TR' },
            { re: /^(.+?)[-_]?(?:BL|BottomLeft|BotLeft)$/i,  type: '2x2', pos: 'BL' },
            { re: /^(.+?)[-_]?(?:BR|BottomRight|BotRight)$/i, type: '2x2', pos: 'BR' },
            // 1×2 vertical: T/B
            { re: /^(.+?)[-_]?(?:T|Top)$/i,    type: '1x2', pos: 'T' },
            { re: /^(.+?)[-_]?(?:B|Bot|Bottom)$/i, type: '1x2', pos: 'B' },
            // 2×1 horizontal: L/R
            { re: /^(.+?)[-_]?(?:L|Left)$/i,   type: '2x1', pos: 'L' },
            { re: /^(.+?)[-_]?(?:R|Right)$/i,  type: '2x1', pos: 'R' },
        ];

        // Tag each segment with detected prefix/type/position
        const tagged = segments.map(seg => {
            if (!seg.name) return { seg, prefix: null };
            for (const pat of patterns) {
                const m = seg.name.match(pat.re);
                if (m) return { seg, prefix: m[1], type: pat.type, pos: pat.pos };
            }
            return { seg, prefix: null };
        });

        // Group by prefix+type
        const groups = new Map();
        const ungrouped = [];
        for (const t of tagged) {
            if (!t.prefix) { ungrouped.push(t.seg); continue; }
            const key = `${t.prefix}|${t.type}`;
            if (!groups.has(key)) groups.set(key, { prefix: t.prefix, type: t.type, slots: {} });
            groups.get(key).slots[t.pos] = t.seg;
        }

        const result = [];

        for (const [, group] of groups) {
            const { prefix, type, slots } = group;

            if (type === '2x2' && slots.TL && slots.TR && slots.BL && slots.BR) {
                // Merge 4 quadrants into one sprite
                const w = slots.TL.width + slots.TR.width;
                const topH = Math.max(slots.TL.rows.length, slots.TR.rows.length);
                const botH = Math.max(slots.BL.rows.length, slots.BR.rows.length);
                const rows = [];
                for (let y = 0; y < topH; y++) {
                    const left  = slots.TL.rows[y] || new Array(slots.TL.width).fill(0);
                    const right = slots.TR.rows[y] || new Array(slots.TR.width).fill(0);
                    rows.push([...left, ...right]);
                }
                for (let y = 0; y < botH; y++) {
                    const left  = slots.BL.rows[y] || new Array(slots.BL.width).fill(0);
                    const right = slots.BR.rows[y] || new Array(slots.BR.width).fill(0);
                    rows.push([...left, ...right]);
                }
                result.push({ name: prefix, rows, width: w });

            } else if (type === '1x2' && slots.T && slots.B) {
                // Vertical stack
                const w = Math.max(slots.T.width, slots.B.width);
                const rows = [...slots.T.rows, ...slots.B.rows];
                result.push({ name: prefix, rows, width: w });

            } else if (type === '2x1' && slots.L && slots.R) {
                // Horizontal pair
                const w = slots.L.width + slots.R.width;
                const h = Math.max(slots.L.rows.length, slots.R.rows.length);
                const rows = [];
                for (let y = 0; y < h; y++) {
                    const left  = slots.L.rows[y] || new Array(slots.L.width).fill(0);
                    const right = slots.R.rows[y] || new Array(slots.R.width).fill(0);
                    rows.push([...left, ...right]);
                }
                result.push({ name: prefix, rows, width: w });

            } else {
                // Incomplete group — import as individual sprites
                for (const seg of Object.values(slots)) result.push(seg);
            }
        }

        result.push(...ungrouped);
        return result;
    }

    /** Build a sprite object from a rows array extracted by _splitBitmapSegments. */
    static _parseSingleBitmapSegment(name, rows) {
        if (!rows || rows.length === 0) return null;

        const importWidth = rows[0].length;
        let trimmed = rows.slice(0, 16);
        const importHeight = trimmed.length <= 8 ? 8 : 16;
        while (trimmed.length < importHeight) {
            trimmed.push(new Array(importWidth).fill(0));
        }

        return {
            name:      name || `sprite_${this.sprites.length}`,
            width:     importWidth,
            height:    importHeight,
            pixels:    trimmed,
            fgColor:   this.selectedFgColor,
            bgColor:   this.selectedBgColor,
            gramCard:  this._nextGramCard(),
            useMode:   'mob',
            mobColor:  7,
            csColor:   7,
            csAdvance: false,
            fgbgFg:    7,
            fgbgBg:    0
        };
    }

    static showPasteBitmapDialog() {
        const text = prompt(
            'Paste sprite data in any supported format:\n\n' +
            '  BITMAP "..XXXX.."       (IntyBASIC)\n' +
            '  DECLE $3C, $7E, $FF    (as1600 hex)\n' +
            '  DECLE %00111100        (binary)\n' +
            '  WORD 60, 126, 255      (decimal)\n' +
            '  jzIntv "gt" GRAM dump  (grid of #/.)\n\n' +
            'Labels create separate sprites.\n' +
            'Composite suffixes auto-merge:\n' +
            '  TL/TR/BL/BR → 2×2    T/B → vertical    L/R → horizontal'
        );
        if (text) this.parseBitmapText(text);
    }

    // ==========================================
    // Sprite Properties UI
    // ==========================================

    /**
     * Refresh the sprite properties panel to reflect the current sprite's settings.
     * Called after selectSprite() and whenever properties change.
     */
    static updateSpriteProperties() {
        const sprite = this.getCurrentSprite();
        if (!sprite) return;

        // Defaults for sprites loaded from older save files that lack the new fields
        if (sprite.gramCard   === undefined) sprite.gramCard   = 0;
        if (sprite.useMode    === undefined) sprite.useMode    = 'mob';
        if (sprite.mobColor   === undefined) sprite.mobColor   = 7;
        if (sprite.csColor    === undefined) sprite.csColor    = 7;
        if (sprite.csAdvance  === undefined) sprite.csAdvance  = false;
        if (sprite.fgbgFg     === undefined) sprite.fgbgFg     = 7;
        if (sprite.fgbgBg     === undefined) sprite.fgbgBg     = 0;

        const gramInput = document.getElementById('sprite-gram-card');
        if (gramInput) gramInput.value = sprite.gramCard;

        const mode = sprite.useMode;

        // Mode button highlight
        document.querySelectorAll('.sprite-mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        // Show / hide mode-specific color sections
        const mobSection  = document.getElementById('sprite-mob-colors');
        const csSection   = document.getElementById('sprite-cs-colors');
        const fgbgSection = document.getElementById('sprite-fgbg-colors');
        if (mobSection)  mobSection.style.display  = mode === 'mob'  ? '' : 'none';
        if (csSection)   csSection.style.display   = mode === 'cs'   ? '' : 'none';
        if (fgbgSection) fgbgSection.style.display = mode === 'fgbg' ? '' : 'none';

        // MOB color swatches (0–7 primary colors)
        this._renderModePalette('sprite-mob-color-palette', sprite.mobColor, 0, 7,
            (i) => this.updateMobColor(i));

        // CS foreground swatches (0–7)
        this._renderModePalette('sprite-cs-color-palette', sprite.csColor, 0, 7,
            (i) => this.updateCsColor(i));
        const csAdv = document.getElementById('sprite-cs-advance');
        if (csAdv) csAdv.checked = sprite.csAdvance;

        // FG/BG swatches
        this._renderModePalette('sprite-fgbg-fg-palette', sprite.fgbgFg, 0, 7,
            (i) => this.updateFgbgFg(i));
        this._renderModePalette('sprite-fgbg-bg-palette', sprite.fgbgBg, 0, 15,
            (i) => this.updateFgbgBg(i));

        this.renderGramBudget();
    }

    /**
     * Render a small inline palette strip into a container element.
     * @param {string} containerId
     * @param {number} selectedIndex
     * @param {number} minIdx
     * @param {number} maxIdx
     * @param {Function} handler  Called with the color index when clicked
     */
    static _renderModePalette(containerId, selectedIndex, minIdx, maxIdx, handler) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';
        for (let i = minIdx; i <= maxIdx; i++) {
            const swatch = document.createElement('div');
            swatch.className = 'palette-swatch sm' + (i === selectedIndex ? ' selected' : '');
            swatch.style.backgroundColor = this.PALETTE[i].hex;
            swatch.title = `${this.PALETTE[i].name} (${i})`;
            swatch.onclick = () => handler(i);
            container.appendChild(swatch);
        }
    }

    static updateGramCard(val) {
        const sprite = this.getCurrentSprite();
        if (!sprite) return;
        sprite.gramCard = Math.max(0, Math.min(63, parseInt(val) || 0));
        this.renderGramBudget();
        this.updateOutput();
    }

    static updateSpriteMode(mode) {
        const sprite = this.getCurrentSprite();
        if (!sprite) return;
        sprite.useMode = mode;
        this.updateSpriteProperties();
        this.updateOutput();
    }

    static updateMobColor(idx) {
        const sprite = this.getCurrentSprite();
        if (!sprite) return;
        sprite.mobColor = idx;
        this._renderModePalette('sprite-mob-color-palette', idx, 0, 7, (i) => this.updateMobColor(i));
        this.updateOutput();
    }

    static updateCsColor(idx) {
        const sprite = this.getCurrentSprite();
        if (!sprite) return;
        sprite.csColor = idx;
        this._renderModePalette('sprite-cs-color-palette', idx, 0, 7, (i) => this.updateCsColor(i));
        this.updateOutput();
    }

    static updateCsAdvance(checked) {
        const sprite = this.getCurrentSprite();
        if (!sprite) return;
        sprite.csAdvance = checked;
        this.updateOutput();
    }

    static updateFgbgFg(idx) {
        const sprite = this.getCurrentSprite();
        if (!sprite) return;
        sprite.fgbgFg = idx;
        this._renderModePalette('sprite-fgbg-fg-palette', idx, 0, 7,  (i) => this.updateFgbgFg(i));
        this.updateOutput();
    }

    static updateFgbgBg(idx) {
        const sprite = this.getCurrentSprite();
        if (!sprite) return;
        sprite.fgbgBg = idx;
        this._renderModePalette('sprite-fgbg-bg-palette', idx, 0, 15, (i) => this.updateFgbgBg(i));
        this.updateOutput();
    }

    /**
     * Render the 8×8 GRAM budget grid showing which slots are occupied.
     */
    static renderGramBudget() {
        const grid = document.getElementById('gram-budget-grid');
        if (!grid) return;

        // Build a map of slot → sprite
        const slotMap = new Map();
        for (const sprite of this.sprites) {
            const gc     = sprite.gramCard ?? 0;
            const needed = this._gramCardsNeeded(sprite);
            for (let i = 0; i < needed; i++) {
                const slot = gc + i;
                if (slot < 64) slotMap.set(slot, sprite);
            }
        }

        const current = this.getCurrentSprite();
        grid.innerHTML = '';

        for (let i = 0; i < 64; i++) {
            const cell = document.createElement('div');
            cell.className = 'gram-budget-cell';
            cell.textContent = i;
            cell.title = `GRAM slot ${i}`;

            if (slotMap.has(i)) {
                const owner = slotMap.get(i);
                cell.classList.add('used', `mode-${owner.useMode || 'mob'}`);
                cell.title = `GRAM ${i}: ${owner.name} (${owner.useMode || 'mob'})`;
                if (owner === current) cell.classList.add('current');
                cell.onclick = () => {
                    const idx = this.sprites.indexOf(owner);
                    if (idx >= 0) this.selectSprite(idx);
                };
            } else {
                cell.classList.add('free');
            }

            grid.appendChild(cell);
        }
    }

    // ==========================================
    // Sprite Management
    // ==========================================

    static addSprite() {
        const name = `sprite_${this.sprites.length}`;
        this.sprites.push(this.createEmptySprite(name, this.gridWidth, this.gridHeight));
        this.currentSpriteIndex = this.sprites.length - 1;
        this.updateSpriteList();
        this.renderGrid();
        this.renderPreview();
        this.updateOutput();
        this.updateSizeSelector();
    }

    static deleteSprite() {
        if (this.sprites.length <= 1) return;
        this.sprites.splice(this.currentSpriteIndex, 1);
        if (this.currentSpriteIndex >= this.sprites.length) {
            this.currentSpriteIndex = this.sprites.length - 1;
        }
        const sprite = this.getCurrentSprite();
        if (sprite) {
            this.gridWidth = sprite.width;
            this.gridHeight = sprite.height;
        }
        this.updateSpriteList();
        this.renderGrid();
        this.renderPreview();
        this.updateOutput();
        this.updateSizeSelector();
    }

    static duplicateSprite() {
        const sprite = this.getCurrentSprite();
        if (!sprite) return;
        const newSprite = {
            name: `${sprite.name}_copy`,
            width: sprite.width,
            height: sprite.height,
            pixels: sprite.pixels.map(row => [...row]),
            fgColor: sprite.fgColor,
            bgColor: sprite.bgColor,
            // Auto-assign next free GRAM slots for the duplicate
            gramCard: this._nextGramCard(),
            useMode:  sprite.useMode  ?? 'mob',
            mobColor: sprite.mobColor ?? 7,
            csColor:  sprite.csColor  ?? 7,
            csAdvance: sprite.csAdvance ?? false,
            fgbgFg:   sprite.fgbgFg   ?? 7,
            fgbgBg:   sprite.fgbgBg   ?? 0
        };
        this.sprites.push(newSprite);
        this.currentSpriteIndex = this.sprites.length - 1;
        this.updateSpriteList();
        this.renderGrid();
        this.renderPreview();
        this.updateOutput();
        this.updateSpriteProperties();
    }

    static selectSprite(index) {
        if (index >= 0 && index < this.sprites.length) {
            this.currentSpriteIndex = index;
            const sprite = this.getCurrentSprite();
            this.selectedFgColor = sprite.fgColor;
            this.selectedBgColor = sprite.bgColor;
            this.gridWidth = sprite.width;
            this.gridHeight = sprite.height;
            this.updateSpriteList();
            this.renderPalette();
            this.renderGrid();
            this.renderPreview();
            this.updateOutput();
            this.updateSizeSelector();
            this.updateSpriteProperties();
        }
    }

    static updateSpriteName() {
        const input = document.getElementById('sprite-name-input');
        const sprite = this.getCurrentSprite();
        if (input && sprite) {
            sprite.name = input.value
                .toLowerCase()
                .replace(/\s+/g, '_')
                .replace(/[^a-z0-9_]/g, '')
                || 'sprite';
            this.updateSpriteList();
            this.updateOutput();
        }
    }

    /**
     * Build a thumbnail canvas for a sprite (scaled 2x)
     */
    static buildThumbnail(sprite) {
        const scale = 2;
        const thumb = document.createElement('canvas');
        thumb.width = sprite.width * scale;
        thumb.height = sprite.height * scale;
        const ctx = thumb.getContext('2d');
        for (let y = 0; y < sprite.height; y++) {
            for (let x = 0; x < sprite.width; x++) {
                const isSet = sprite.pixels[y][x] === 1;
                const colorIndex = isSet ? sprite.fgColor : sprite.bgColor;
                ctx.fillStyle = this.PALETTE[colorIndex].hex;
                ctx.fillRect(x * scale, y * scale, scale, scale);
            }
        }
        return thumb;
    }

    static updateSpriteList() {
        const list = document.getElementById('sprite-list');
        const nameInput = document.getElementById('sprite-name-input');

        if (list) {
            list.innerHTML = '';
            this.sprites.forEach((sprite, index) => {
                const item = document.createElement('div');
                item.className = 'sprite-list-item' + (index === this.currentSpriteIndex ? ' selected' : '');

                const thumb = this.buildThumbnail(sprite);
                thumb.className = 'sprite-thumbnail';
                item.appendChild(thumb);

                const nameSpan = document.createElement('span');
                nameSpan.className = 'sprite-item-name';
                nameSpan.textContent = `${sprite.name} (${sprite.width}×${sprite.height})`;
                item.appendChild(nameSpan);

                const addBtn = document.createElement('button');
                addBtn.className = 'add-to-anim-btn';
                addBtn.textContent = '+Anim';
                addBtn.title = 'Add to animation sequence';
                addBtn.onclick = (e) => { e.stopPropagation(); this.addToAnimation(index); };
                item.appendChild(addBtn);

                item.onclick = () => this.selectSprite(index);
                list.appendChild(item);
            });
        }

        if (nameInput) {
            const sprite = this.getCurrentSprite();
            nameInput.value = sprite ? sprite.name : '';
        }

        const countEl = document.getElementById('sprite-count');
        if (countEl) {
            countEl.textContent = `(${this.sprites.length})`;
        }
    }

    // ==========================================
    // Image Import
    // ==========================================

    static importImage(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => this.convertImageToSprite(img);
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    static convertImageToSprite(img) {
        const sprite = this.getCurrentSprite();
        if (!sprite) return;

        const canvas = document.createElement('canvas');
        canvas.width = sprite.width;
        canvas.height = sprite.height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, sprite.width, sprite.height);

        const imageData = ctx.getImageData(0, 0, sprite.width, sprite.height);
        const data = imageData.data;

        for (let y = 0; y < sprite.height; y++) {
            for (let x = 0; x < sprite.width; x++) {
                const i = (y * sprite.width + x) * 4;
                const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
                const brightness = (r + g + b) / 3;
                sprite.pixels[y][x] = (a > 128 && brightness > 128) ? 1 : 0;
            }
        }

        this.renderGrid();
        this.renderPreview();
        this.updateOutput();

        const input = document.getElementById('sprite-import-input');
        if (input) input.value = '';
    }

    // ==========================================
    // Project Save / Load / Reset
    // ==========================================

    static reset() {
        this.sprites = [this.createEmptySprite('sprite_0', 8, 8)];
        this.currentSpriteIndex = 0;
        this.selectedFgColor = 7;
        this.selectedBgColor = 0;
        this.gridWidth = 8;
        this.gridHeight = 8;

        this.updateSpriteList();
        this.renderPalette();
        this.renderGrid();
        this.renderPreview();
        this.updateOutput();
        this.updateSizeSelector();
    }

    static exportProject() {
        // Import lazily to avoid circular dep at module load time
        import('./layoutDesigner.js').then(({ LayoutDesigner }) => {
            const projectData = {
                version: 3,
                sprites: this.sprites,
                currentSpriteIndex: this.currentSpriteIndex,
                selectedFgColor: this.selectedFgColor,
                selectedBgColor: this.selectedBgColor,
                layout: LayoutDesigner.serializeCells(),
            };
            const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'sprite-project.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    static importProject() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const projectData = JSON.parse(event.target.result);
                    if (projectData.sprites) {
                        this.sprites = projectData.sprites;
                        this.currentSpriteIndex = projectData.currentSpriteIndex || 0;
                        this.selectedFgColor = projectData.selectedFgColor ?? 7;
                        this.selectedBgColor = projectData.selectedBgColor ?? 0;
                        const sprite = this.getCurrentSprite();
                        if (sprite) {
                            this.gridWidth = sprite.width;
                            this.gridHeight = sprite.height;
                        }
                        if (projectData.layout) {
                            import('./layoutDesigner.js').then(({ LayoutDesigner }) => {
                                LayoutDesigner.deserializeCells(projectData.layout);
                            });
                        }
                        this.updateSpriteList();
                        this.renderPalette();
                        this.renderGrid();
                        this.renderPreview();
                        this.updateOutput();
                        this.updateSizeSelector();
                    } else {
                        alert('Invalid sprite project file');
                    }
                } catch (err) {
                    console.error('Error loading sprite project:', err);
                    alert('Failed to load sprite project');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    // ==========================================
    // Animation
    // ==========================================

    static addToAnimation(spriteIndex) {
        if (spriteIndex >= 0 && spriteIndex < this.sprites.length) {
            this.animationSequence.push(spriteIndex);
            this.updateAnimationUI();
        }
    }

    static removeFromAnimation(position) {
        if (position >= 0 && position < this.animationSequence.length) {
            this.animationSequence.splice(position, 1);
            this.updateAnimationUI();
        }
    }

    static clearAnimation() {
        this.stopAnimation();
        this.animationSequence = [];
        this.updateAnimationUI();
    }

    static addAllToAnimation() {
        this.animationSequence = this.sprites.map((_, i) => i);
        this.updateAnimationUI();
    }

    /** Total logical frames given the current layout (composites consume multiple sequence slots). */
    static getLayoutFrameCount() {
        const n = this.animationSequence.length;
        if (this.previewLayout === '4x1') return Math.max(1, Math.floor(n / 4));
        if (this.previewLayout === '2x1' || this.previewLayout === '1x2') {
            return Math.max(1, Math.floor(n / 2));
        }
        return n;
    }

    /** Switch composite layout; restarts animation if playing. */
    static setPreviewLayout(layout) {
        this.previewLayout = layout;
        this.animationFrame = 0;
        document.querySelectorAll('.anim-layout-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.layout === layout);
        });
        if (this.isAnimating) {
            this.pauseAnimation();
            this.playAnimation();
        } else {
            this.renderAnimationFrame();
        }
    }

    static playAnimation() {
        if (this.getLayoutFrameCount() < 2) {
            const needed = { '1x1': 2, '2x1': 4, '1x2': 4, '4x1': 8 }[this.previewLayout] ?? 2;
            alert(`Add at least ${needed} sprites to the animation sequence for ${this.previewLayout} layout`);
            return;
        }
        if (this.animationInterval) clearInterval(this.animationInterval);
        this.isAnimating = true;
        this.animationFrame = 0;
        this.updatePlayButton();
        this.renderAnimationFrame();  // Show frame 0 immediately
        this.animationInterval = setInterval(() => {
            this.animationFrame = (this.animationFrame + 1) % this.getLayoutFrameCount();
            this.renderAnimationFrame();
        }, 1000 / this.animationFps);
    }

    static pauseAnimation() {
        this.isAnimating = false;
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }
        this.updatePlayButton();
    }

    static stopAnimation() {
        this.pauseAnimation();
        this.animationFrame = 0;
        this.renderAnimationFrame();
    }

    static toggleAnimation() {
        if (this.isAnimating) this.pauseAnimation();
        else this.playAnimation();
    }

    static updateAnimationFps() {
        const slider = document.getElementById('animation-fps');
        const display = document.getElementById('animation-fps-value');
        if (slider) {
            this.animationFps = parseInt(slider.value);
            if (display) display.textContent = this.animationFps;
            if (this.isAnimating) {
                this.pauseAnimation();
                this.playAnimation();
            }
        }
    }

    /** Draw a sprite's pixels onto ctx at (offsetX, offsetY) with pixel scale.
     *  scaleY defaults to scaleX for square pixels; pass separately for stretch.
     *  clipWidth limits how many columns are drawn (for split backtab tiles). */
    static _drawSpriteToCanvas(ctx, sprite, offsetX, offsetY, scaleX, scaleY = scaleX, clipWidth = sprite.width) {
        for (let y = 0; y < sprite.height; y++) {
            for (let x = 0; x < clipWidth; x++) {
                const isSet = sprite.pixels[y][x] === 1;
                const colorIndex = isSet ? sprite.fgColor : sprite.bgColor;
                ctx.fillStyle = this.PALETTE[colorIndex].hex;
                const px = Math.round(offsetX + x * scaleX);
                const py = offsetY + y * scaleY;
                ctx.fillRect(px, py, Math.ceil(scaleX), scaleY);
            }
        }
    }

    static renderAnimationFrame() {
        const canvas = document.getElementById('animation-preview-canvas');
        if (!canvas || this.animationSequence.length === 0) return;

        const ctx = canvas.getContext('2d');
        const { sx, sy } = this._getScale();
        const seq = this.animationSequence;

        if (this.previewLayout === '4x1') {
            // ── Four half-width sprites side-by-side (split vertical backtab) ──
            const halfW = 4;  // Each sprite shows left 4px only
            const baseIdx = this.animationFrame * 4;
            const sprites = [];
            for (let i = 0; i < 4; i++) {
                const seqIdx = seq[baseIdx + i];
                sprites.push(seqIdx !== undefined ? this.sprites[seqIdx] : null);
            }
            if (!sprites[0]) return;
            const h = Math.max(...sprites.map(s => s?.height ?? 0));
            canvas.width  = Math.round(halfW * 4 * sx);
            canvas.height = h * sy;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < 4; i++) {
                const spr = sprites[i];
                if (!spr) continue;
                this._drawSpriteToCanvas(ctx, spr, Math.round(i * halfW * sx), 0, sx, sy, halfW);
            }

        } else if (this.previewLayout === '2x1') {
            // ── Two sprites side-by-side (horizontal composite) ──────────────
            const spriteA = this.sprites[seq[this.animationFrame * 2]];
            const spriteB = seq[this.animationFrame * 2 + 1] !== undefined
                ? this.sprites[seq[this.animationFrame * 2 + 1]] : null;
            if (!spriteA) return;
            canvas.width  = Math.round((spriteA.width + (spriteB?.width  ?? spriteA.width))  * sx);
            canvas.height = Math.max(spriteA.height, spriteB?.height ?? 0) * sy;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            this._drawSpriteToCanvas(ctx, spriteA, 0, 0, sx, sy);
            if (spriteB) this._drawSpriteToCanvas(ctx, spriteB, Math.round(spriteA.width * sx), 0, sx, sy);

        } else if (this.previewLayout === '1x2') {
            // ── Two sprites stacked (vertical composite) ──────────────────────
            const spriteA = this.sprites[seq[this.animationFrame * 2]];
            const spriteB = seq[this.animationFrame * 2 + 1] !== undefined
                ? this.sprites[seq[this.animationFrame * 2 + 1]] : null;
            if (!spriteA) return;
            canvas.width  = Math.round(Math.max(spriteA.width, spriteB?.width ?? 0) * sx);
            canvas.height = (spriteA.height + (spriteB?.height ?? spriteA.height)) * sy;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            this._drawSpriteToCanvas(ctx, spriteA, 0, 0, sx, sy);
            if (spriteB) this._drawSpriteToCanvas(ctx, spriteB, 0, spriteA.height * sy, sx, sy);

        } else {
            // ── 1×1: single sprite per frame (default) ───────────────────────
            const sprite = this.sprites[seq[this.animationFrame]];
            if (!sprite) return;
            canvas.width  = Math.round(sprite.width  * sx);
            canvas.height = sprite.height * sy;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            this._drawSpriteToCanvas(ctx, sprite, 0, 0, sx, sy);
        }

        const frameDisplay = document.getElementById('animation-frame-display');
        if (frameDisplay) {
            frameDisplay.textContent = `${this.animationFrame + 1}/${this.getLayoutFrameCount()}`;
        }

        this.highlightSequenceFrame();
    }

    static highlightSequenceFrame() {
        const slotsPerFrame = { '1x1': 1, '2x1': 2, '1x2': 2, '4x1': 4 }[this.previewLayout] ?? 1;
        document.querySelectorAll('.animation-sequence-item').forEach((item, index) => {
            const framePos = Math.floor(index / slotsPerFrame);
            item.classList.toggle('current-frame', framePos === this.animationFrame);
        });
    }

    static updatePlayButton() {
        const btn = document.getElementById('animation-play-btn');
        if (btn) btn.textContent = this.isAnimating ? '⏸ Pause' : '▶ Play';
    }

    static updateAnimationUI() {
        const container = document.getElementById('animation-sequence');
        if (!container) return;

        container.innerHTML = '';

        if (this.animationSequence.length === 0) {
            container.innerHTML = '<span class="animation-empty">Click +Anim on sprites to add frames</span>';
            return;
        }

        this.animationSequence.forEach((spriteIndex, position) => {
            const sprite = this.sprites[spriteIndex];
            if (!sprite) return;

            const item = document.createElement('div');
            item.className = 'animation-sequence-item';
            item.title = `${sprite.name} (click to remove)`;

            const thumb = this.buildThumbnail(sprite);
            thumb.className = 'animation-thumb';
            item.appendChild(thumb);

            item.onclick = () => this.removeFromAnimation(position);
            container.appendChild(item);
        });

        if (!this.isAnimating && this.animationSequence.length > 0) {
            this.animationFrame = 0;
            this.renderAnimationFrame();
        }
    }

    static toggleSpriteInAnimation(spriteIndex) {
        this.addToAnimation(spriteIndex);
    }

    // =========================================================================
    // Layout Designer integration
    // =========================================================================

    /**
     * Return 8×8 pixel data for the sprite assigned to a given GRAM slot.
     * Used by LayoutDesigner to render tiles on the layout canvas.
     * Returns null if no sprite is assigned to that slot.
     */
    /**
     * Get the 8×8 pixel data for a specific GRAM slot.
     * Handles multi-card sprites: an 8×16 sprite at gramCard 0 occupies
     * slots 0 (top 8 rows) and 1 (bottom 8 rows). A 16×16 sprite at
     * gramCard 0 occupies slots 0 (TL), 1 (TR), 2 (BL), 3 (BR).
     */
    static getGramTilePixels(gramSlot) {
        // First try exact match
        let sprite = this.sprites.find(s => s.gramCard === gramSlot);
        let offsetX = 0, offsetY = 0;

        if (!sprite) {
            // Check if this slot falls within a multi-card sprite's range
            for (const s of this.sprites) {
                const gc = s.gramCard ?? 0;
                const needed = this._gramCardsNeeded(s);
                if (needed > 1 && gramSlot > gc && gramSlot < gc + needed) {
                    sprite = s;
                    const cardIndex = gramSlot - gc;
                    const cardsWide = sprite.width / 8;
                    offsetX = (cardIndex % cardsWide) * 8;
                    offsetY = Math.floor(cardIndex / cardsWide) * 8;
                    break;
                }
            }
        }

        if (!sprite) return null;

        const pixels = Array.from({ length: 8 }, (_, y) =>
            Array.from({ length: 8 }, (_, x) => sprite.pixels[offsetY + y]?.[offsetX + x] ?? 0)
        );
        return {
            pixels,
            fgColor:  sprite.fgColor,
            bgColor:  sprite.bgColor,
            name:     sprite.name,
        };
    }
}

// Make methods available globally for onclick handlers
window.spriteToggleSize = () => SpriteEditor.toggleGridSize();
window.spriteClear = () => SpriteEditor.clearSprite();
window.spriteFill = () => SpriteEditor.fillSprite();
window.spriteInvert = () => SpriteEditor.invertSprite();
window.spriteFlipH = () => SpriteEditor.flipHorizontal();
window.spriteFlipV = () => SpriteEditor.flipVertical();
window.spriteShift = (dir) => SpriteEditor.shiftSprite(dir);
window.spriteRotate = () => SpriteEditor.rotateClockwise();
window.spriteCopyOutput = () => SpriteEditor.copyOutputToClipboard();
window.spriteCopyAll = () => SpriteEditor.copyAllToClipboard();
window.spriteDownload = () => SpriteEditor.downloadOutput();
window.spriteAdd = () => SpriteEditor.addSprite();
window.spriteDelete = () => SpriteEditor.deleteSprite();
window.spriteDuplicate = () => SpriteEditor.duplicateSprite();
window.spriteUpdateName = () => SpriteEditor.updateSpriteName();
window.spriteImport = (e) => SpriteEditor.importImage(e);
