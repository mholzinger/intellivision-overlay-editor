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
        const used = new Set();
        for (const s of this.sprites) {
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
    static renderGrid() {
        const canvas = document.getElementById('sprite-grid-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const sprite = this.getCurrentSprite();
        if (!sprite) return;

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
            // Horizontal separator at row 8
            ctx.beginPath();
            ctx.moveTo(0, 8 * cellSize);
            ctx.lineTo(canvas.width, 8 * cellSize);
            ctx.stroke();
        }
        if (sprite.width === 16) {
            // Vertical separator at column 8
            ctx.beginPath();
            ctx.moveTo(8 * cellSize, 0);
            ctx.lineTo(8 * cellSize, canvas.height);
            ctx.stroke();
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

        const scale = 4;
        canvas.width = sprite.width * scale;
        canvas.height = sprite.height * scale;
        ctx.imageSmoothingEnabled = false;

        for (let y = 0; y < sprite.height; y++) {
            for (let x = 0; x < sprite.width; x++) {
                const isSet = sprite.pixels[y][x] === 1;
                const colorIndex = isSet ? sprite.fgColor : sprite.bgColor;
                ctx.fillStyle = this.PALETTE[colorIndex].hex;
                ctx.fillRect(x * scale, y * scale, scale, scale);
            }
        }
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
        const cellSize = canvas.width / sprite.width;

        const x = Math.floor((e.clientX - rect.left) / cellSize);
        const y = Math.floor((e.clientY - rect.top) / cellSize);

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
     * Parse IntyBASIC BITMAP text and create a sprite.
     * Supports X, #, and . notation. Auto-detects width (8 or 16) from pattern length.
     */
    static parseBitmapText(text) {
        if (!text || !text.trim()) {
            alert('Please paste BITMAP text first');
            return false;
        }

        let spriteName = `sprite_${this.sprites.length}`;
        const nameMatch = text.match(/^(\w+):/m);
        if (nameMatch) spriteName = nameMatch[1];

        const bitmapRegex = /BITMAP\s*"([.X#]{1,16})"/gi;
        const rows = [];
        let importWidth = 8;
        let match;

        while ((match = bitmapRegex.exec(text)) !== null) {
            const pattern = match[1];
            // Detect width from first row
            if (rows.length === 0) {
                importWidth = pattern.length <= 8 ? 8 : 16;
            }
            const row = [];
            for (let i = 0; i < importWidth; i++) {
                const char = pattern[i] || '.';
                row.push(char === '#' || char.toUpperCase() === 'X' ? 1 : 0);
            }
            rows.push(row);
        }

        if (rows.length === 0) {
            alert('No valid BITMAP lines found.\n\nExpected format:\n    BITMAP "..XXXX.."\n    BITMAP "########"');
            return false;
        }

        if (rows.length > 16) rows.length = 16;

        const importHeight = rows.length <= 8 ? 8 : 16;
        while (rows.length < importHeight) {
            rows.push(new Array(importWidth).fill(0));
        }

        const sprite = {
            name: spriteName,
            width: importWidth,
            height: importHeight,
            pixels: rows,
            fgColor: this.selectedFgColor,
            bgColor: this.selectedBgColor,
            gramCard: this._nextGramCard(),
            useMode:  'mob',
            mobColor: 7,
            csColor:  7,
            csAdvance: false,
            fgbgFg:   7,
            fgbgBg:   0
        };

        this.sprites.push(sprite);
        this.currentSpriteIndex = this.sprites.length - 1;
        this.gridWidth = importWidth;
        this.gridHeight = importHeight;

        this.updateSpriteList();
        this.renderPalette();
        this.renderGrid();
        this.renderPreview();
        this.updateOutput();
        this.updateSizeSelector();
        this.updateSpriteProperties();

        return true;
    }

    static showPasteBitmapDialog() {
        const text = prompt(
            'Paste IntyBASIC BITMAP code:\n\n' +
            'Example:\n' +
            'player:\n' +
            '    BITMAP "..XX.."\n' +
            '    BITMAP ".####."\n' +
            '    BITMAP "XXXXXX"'
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
        const projectData = {
            version: 2,
            sprites: this.sprites,
            currentSpriteIndex: this.currentSpriteIndex,
            selectedFgColor: this.selectedFgColor,
            selectedBgColor: this.selectedBgColor
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

    /** Total logical frames given the current layout (pairs consume 2 sequence slots). */
    static getLayoutFrameCount() {
        const n = this.animationSequence.length;
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
            const needed = (this.previewLayout === '1x1') ? 2 : 4;
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

    /** Draw a sprite's pixels onto ctx at (offsetX, offsetY) with pixel scale. */
    static _drawSpriteToCanvas(ctx, sprite, offsetX, offsetY, scale) {
        for (let y = 0; y < sprite.height; y++) {
            for (let x = 0; x < sprite.width; x++) {
                const isSet = sprite.pixels[y][x] === 1;
                const colorIndex = isSet ? sprite.fgColor : sprite.bgColor;
                ctx.fillStyle = this.PALETTE[colorIndex].hex;
                ctx.fillRect(offsetX + x * scale, offsetY + y * scale, scale, scale);
            }
        }
    }

    static renderAnimationFrame() {
        const canvas = document.getElementById('animation-preview-canvas');
        if (!canvas || this.animationSequence.length === 0) return;

        const ctx = canvas.getContext('2d');
        const scale = 4;
        const seq   = this.animationSequence;

        if (this.previewLayout === '2x1') {
            // ── Two sprites side-by-side (horizontal composite) ──────────────
            const spriteA = this.sprites[seq[this.animationFrame * 2]];
            const spriteB = seq[this.animationFrame * 2 + 1] !== undefined
                ? this.sprites[seq[this.animationFrame * 2 + 1]] : null;
            if (!spriteA) return;
            canvas.width  = (spriteA.width + (spriteB?.width  ?? spriteA.width))  * scale;
            canvas.height =  Math.max(spriteA.height, spriteB?.height ?? 0)        * scale;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            this._drawSpriteToCanvas(ctx, spriteA, 0, 0, scale);
            if (spriteB) this._drawSpriteToCanvas(ctx, spriteB, spriteA.width * scale, 0, scale);

        } else if (this.previewLayout === '1x2') {
            // ── Two sprites stacked (vertical composite) ──────────────────────
            const spriteA = this.sprites[seq[this.animationFrame * 2]];
            const spriteB = seq[this.animationFrame * 2 + 1] !== undefined
                ? this.sprites[seq[this.animationFrame * 2 + 1]] : null;
            if (!spriteA) return;
            canvas.width  =  Math.max(spriteA.width, spriteB?.width ?? 0)          * scale;
            canvas.height = (spriteA.height + (spriteB?.height ?? spriteA.height)) * scale;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            this._drawSpriteToCanvas(ctx, spriteA, 0, 0, scale);
            if (spriteB) this._drawSpriteToCanvas(ctx, spriteB, 0, spriteA.height * scale, scale);

        } else {
            // ── 1×1: single sprite per frame (default) ───────────────────────
            const sprite = this.sprites[seq[this.animationFrame]];
            if (!sprite) return;
            canvas.width  = sprite.width  * scale;
            canvas.height = sprite.height * scale;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            this._drawSpriteToCanvas(ctx, sprite, 0, 0, scale);
        }

        const frameDisplay = document.getElementById('animation-frame-display');
        if (frameDisplay) {
            frameDisplay.textContent = `${this.animationFrame + 1}/${this.getLayoutFrameCount()}`;
        }

        this.highlightSequenceFrame();
    }

    static highlightSequenceFrame() {
        document.querySelectorAll('.animation-sequence-item').forEach((item, index) => {
            // In composite modes each logical frame spans 2 sequence slots.
            const framePos = (this.previewLayout === '1x1') ? index : Math.floor(index / 2);
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
