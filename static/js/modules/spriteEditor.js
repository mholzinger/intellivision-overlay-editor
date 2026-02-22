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

    /**
     * Initialize the sprite editor
     */
    static init() {
        this.sprites = [this.createEmptySprite('sprite_0', 8, 8)];
        this.currentSpriteIndex = 0;

        this.setupEventListeners();

        this.renderPalette();
        this.renderGrid();
        this.renderPreview();
        this.updateSpriteList();
        this.updateOutput();
        this.updateSizeSelector();
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
            bgColor: this.selectedBgColor
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

        for (let hy = 0; hy < hCards; hy++) {
            for (let hx = 0; hx < wCards; hx++) {
                const cardIndex = hy * wCards + hx;
                // No suffix for simple 8x8 or 8x16 (single-card) sprites
                const label = (wCards === 1 && hCards <= 2 && sprite.width === 8)
                    ? sprite.name
                    : `${sprite.name}_${cardIndex}`;

                const rowStart = hy * 8;
                const colStart = hx * 8;
                const rows = [];

                for (let y = rowStart; y < rowStart + 8; y++) {
                    const row = [];
                    for (let x = colStart; x < colStart + 8; x++) {
                        row.push(sprite.pixels[y]?.[x] ?? 0);
                    }
                    rows.push(row);
                }

                cards.push({ label, rows });
            }
        }

        return cards;
    }

    /**
     * Generate IntyBASIC output for the current sprite
     */
    static generateOutput() {
        const sprite = this.getCurrentSprite();
        if (!sprite) return '';

        const cards = this.splitIntoGramCards(sprite);
        let output = '';

        for (const card of cards) {
            output += `${card.label}:\n`;
            for (const row of card.rows) {
                output += '    BITMAP "' + row.map(p => p ? 'X' : '.').join('') + '"\n';
            }
            output += '\n';
        }

        return output.trimEnd() + '\n';
    }

    /**
     * Generate IntyBASIC output for all sprites
     */
    static generateAllOutput() {
        let output = "' IntyBASIC Sprite Definitions\n";
        output += "' Generated by Intellivision Overlay Editor\n";
        output += "' https://intellivision-overlay-editor.fly.dev\n\n";

        for (const sprite of this.sprites) {
            const cards = this.splitIntoGramCards(sprite);
            for (const card of cards) {
                output += `${card.label}:\n`;
                for (const row of card.rows) {
                    output += '    BITMAP "' + row.map(p => p ? 'X' : '.').join('') + '"\n';
                }
                output += '\n';
            }
        }

        output += "' Usage:\n";
        output += "'   DEFINE 0, 1, sprite_name   ' Define GRAM card 0\n";
        output += "'   SPRITE 0, x + VISIBLE, y, 0 * 8 + color   ' Display as MOB\n";

        return output;
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
            bgColor: this.selectedBgColor
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
            bgColor: sprite.bgColor
        };
        this.sprites.push(newSprite);
        this.currentSpriteIndex = this.sprites.length - 1;
        this.updateSpriteList();
        this.renderGrid();
        this.renderPreview();
        this.updateOutput();
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

    static playAnimation() {
        if (this.animationSequence.length < 2) {
            alert('Add at least 2 sprites to the animation sequence');
            return;
        }
        this.isAnimating = true;
        this.animationFrame = 0;
        this.updatePlayButton();
        this.animationInterval = setInterval(() => {
            this.renderAnimationFrame();
            this.animationFrame = (this.animationFrame + 1) % this.animationSequence.length;
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

    static renderAnimationFrame() {
        const canvas = document.getElementById('animation-preview-canvas');
        if (!canvas || this.animationSequence.length === 0) return;

        const ctx = canvas.getContext('2d');
        const sprite = this.sprites[this.animationSequence[this.animationFrame]];
        if (!sprite) return;

        const scale = 4;
        canvas.width = sprite.width * scale;
        canvas.height = sprite.height * scale;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let y = 0; y < sprite.height; y++) {
            for (let x = 0; x < sprite.width; x++) {
                const isSet = sprite.pixels[y][x] === 1;
                const colorIndex = isSet ? sprite.fgColor : sprite.bgColor;
                ctx.fillStyle = this.PALETTE[colorIndex].hex;
                ctx.fillRect(x * scale, y * scale, scale, scale);
            }
        }

        const frameDisplay = document.getElementById('animation-frame-display');
        if (frameDisplay) {
            frameDisplay.textContent = `${this.animationFrame + 1}/${this.animationSequence.length}`;
        }

        this.highlightSequenceFrame();
    }

    static highlightSequenceFrame() {
        document.querySelectorAll('.animation-sequence-item').forEach((item, index) => {
            item.classList.toggle('current-frame', index === this.animationFrame);
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
            container.innerHTML = '<span class="animation-empty">Click sprites to add to sequence</span>';
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
