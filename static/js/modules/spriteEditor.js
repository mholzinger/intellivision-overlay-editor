/**
 * Sprite Editor Module
 * Creates 8x8 and 8x16 pixel sprites for Intellivision GRAM cards
 * Outputs IntyBASIC BITMAP statements
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
    static sprites = [];           // Array of sprite objects
    static currentSpriteIndex = 0;
    static selectedFgColor = 7;    // Default: White
    static selectedBgColor = 0;    // Default: Black
    static gridSize = 8;           // 8 for 8x8, 16 for 8x16
    static isDrawing = false;
    static drawMode = 1;           // 1 = draw foreground, 0 = erase to background

    // Animation state
    static animationSequence = []; // Array of sprite indices for animation
    static animationFps = 10;      // Frames per second
    static isAnimating = false;
    static animationFrame = 0;     // Current frame in sequence
    static animationInterval = null;

    /**
     * Initialize the sprite editor
     */
    static init() {
        // Create initial empty sprite
        this.sprites = [this.createEmptySprite('sprite_0')];
        this.currentSpriteIndex = 0;

        // Set up event listeners
        this.setupEventListeners();

        // Initial render
        this.renderPalette();
        this.renderGrid();
        this.renderPreview();
        this.updateSpriteList();
        this.updateOutput();
    }

    /**
     * Create an empty sprite data structure
     * @param {string} name - Label for the sprite
     * @returns {Object} Sprite object
     */
    static createEmptySprite(name = 'sprite') {
        const rows = this.gridSize;
        const pixels = [];
        for (let y = 0; y < rows; y++) {
            pixels.push(new Array(8).fill(0)); // 0 = background, 1 = foreground
        }
        return {
            name: name,
            width: 8,
            height: rows,
            pixels: pixels,
            fgColor: this.selectedFgColor,
            bgColor: this.selectedBgColor
        };
    }

    /**
     * Get the current sprite being edited
     * @returns {Object} Current sprite
     */
    static getCurrentSprite() {
        return this.sprites[this.currentSpriteIndex];
    }

    /**
     * Set up all event listeners
     */
    static setupEventListeners() {
        // Grid canvas mouse events
        const canvas = document.getElementById('sprite-grid-canvas');
        if (canvas) {
            canvas.addEventListener('mousedown', (e) => this.handleGridMouseDown(e));
            canvas.addEventListener('mousemove', (e) => this.handleGridMouseMove(e));
            canvas.addEventListener('mouseup', () => this.handleGridMouseUp());
            canvas.addEventListener('mouseleave', () => this.handleGridMouseUp());

            // Prevent context menu on right-click
            canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Only handle if sprite editor is active
            const spriteTab = document.getElementById('sprite-editor-tab');
            if (!spriteTab || !spriteTab.classList.contains('active')) return;

            if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
                // Ctrl+C - Copy output
                this.copyOutputToClipboard();
            }
        });
    }

    /**
     * Render the color palette
     */
    static renderPalette() {
        const fgContainer = document.getElementById('sprite-fg-palette');
        const bgContainer = document.getElementById('sprite-bg-palette');

        if (!fgContainer || !bgContainer) return;

        // Clear existing
        fgContainer.innerHTML = '';
        bgContainer.innerHTML = '';

        // Render both palettes
        this.PALETTE.forEach((color, index) => {
            // Foreground palette
            const fgSwatch = document.createElement('div');
            fgSwatch.className = 'palette-swatch' + (index === this.selectedFgColor ? ' selected' : '');
            fgSwatch.style.backgroundColor = color.hex;
            fgSwatch.title = `${color.name} (${index})`;
            fgSwatch.onclick = () => this.selectFgColor(index);
            fgContainer.appendChild(fgSwatch);

            // Background palette
            const bgSwatch = document.createElement('div');
            bgSwatch.className = 'palette-swatch' + (index === this.selectedBgColor ? ' selected' : '');
            bgSwatch.style.backgroundColor = color.hex;
            bgSwatch.title = `${color.name} (${index})`;
            bgSwatch.onclick = () => this.selectBgColor(index);
            bgContainer.appendChild(bgSwatch);
        });
    }

    /**
     * Select foreground color
     * @param {number} index - Color index (0-15)
     */
    static selectFgColor(index) {
        this.selectedFgColor = index;
        const sprite = this.getCurrentSprite();
        if (sprite) sprite.fgColor = index;
        this.renderPalette();
        this.renderPreview();
        this.updateOutput();
    }

    /**
     * Select background color
     * @param {number} index - Color index (0-15)
     */
    static selectBgColor(index) {
        this.selectedBgColor = index;
        const sprite = this.getCurrentSprite();
        if (sprite) sprite.bgColor = index;
        this.renderPalette();
        this.renderPreview();
    }

    /**
     * Render the pixel grid
     */
    static renderGrid() {
        const canvas = document.getElementById('sprite-grid-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const sprite = this.getCurrentSprite();
        if (!sprite) return;

        const cellSize = Math.floor(canvas.width / 8);
        const height = sprite.height * cellSize;

        // Update canvas height for 8x16 mode
        canvas.height = height;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw pixels
        for (let y = 0; y < sprite.height; y++) {
            for (let x = 0; x < 8; x++) {
                const isSet = sprite.pixels[y][x] === 1;
                const colorIndex = isSet ? sprite.fgColor : sprite.bgColor;
                const color = this.PALETTE[colorIndex];

                ctx.fillStyle = color.hex;
                ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
        }

        // Draw grid lines
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;

        for (let x = 0; x <= 8; x++) {
            ctx.beginPath();
            ctx.moveTo(x * cellSize + 0.5, 0);
            ctx.lineTo(x * cellSize + 0.5, height);
            ctx.stroke();
        }

        for (let y = 0; y <= sprite.height; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * cellSize + 0.5);
            ctx.lineTo(canvas.width, y * cellSize + 0.5);
            ctx.stroke();
        }

        // Draw separator line for 8x16 mode
        if (sprite.height === 16) {
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 8 * cellSize);
            ctx.lineTo(canvas.width, 8 * cellSize);
            ctx.stroke();
        }
    }

    /**
     * Render the preview (actual size)
     */
    static renderPreview() {
        const canvas = document.getElementById('sprite-preview-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const sprite = this.getCurrentSprite();
        if (!sprite) return;

        // Set canvas size (2x scale for visibility)
        const scale = 4;
        canvas.width = 8 * scale;
        canvas.height = sprite.height * scale;

        ctx.imageSmoothingEnabled = false;

        // Draw pixels at actual scale
        for (let y = 0; y < sprite.height; y++) {
            for (let x = 0; x < 8; x++) {
                const isSet = sprite.pixels[y][x] === 1;
                const colorIndex = isSet ? sprite.fgColor : sprite.bgColor;
                const color = this.PALETTE[colorIndex];

                ctx.fillStyle = color.hex;
                ctx.fillRect(x * scale, y * scale, scale, scale);
            }
        }
    }

    /**
     * Handle mouse down on grid
     * @param {MouseEvent} e
     */
    static handleGridMouseDown(e) {
        this.isDrawing = true;
        // Left click = draw, right click = erase
        this.drawMode = e.button === 0 ? 1 : 0;
        this.handleGridClick(e);
    }

    /**
     * Handle mouse move on grid (for drag drawing)
     * @param {MouseEvent} e
     */
    static handleGridMouseMove(e) {
        if (!this.isDrawing) return;
        this.handleGridClick(e);
    }

    /**
     * Handle mouse up on grid
     */
    static handleGridMouseUp() {
        this.isDrawing = false;
    }

    /**
     * Handle a click/drag on the grid
     * @param {MouseEvent} e
     */
    static handleGridClick(e) {
        const canvas = document.getElementById('sprite-grid-canvas');
        const sprite = this.getCurrentSprite();
        if (!canvas || !sprite) return;

        const rect = canvas.getBoundingClientRect();
        const cellSize = canvas.width / 8;

        const x = Math.floor((e.clientX - rect.left) / cellSize);
        const y = Math.floor((e.clientY - rect.top) / cellSize);

        if (x >= 0 && x < 8 && y >= 0 && y < sprite.height) {
            sprite.pixels[y][x] = this.drawMode;
            this.renderGrid();
            this.renderPreview();
            this.updateOutput();
        }
    }

    /**
     * Toggle grid size between 8x8 and 8x16
     */
    static toggleGridSize() {
        const sprite = this.getCurrentSprite();
        if (!sprite) return;

        if (sprite.height === 8) {
            // Expand to 8x16
            sprite.height = 16;
            for (let y = 8; y < 16; y++) {
                sprite.pixels.push(new Array(8).fill(0));
            }
        } else {
            // Shrink to 8x8
            sprite.height = 8;
            sprite.pixels = sprite.pixels.slice(0, 8);
        }

        this.gridSize = sprite.height;
        this.renderGrid();
        this.renderPreview();
        this.updateOutput();
        this.updateSizeToggle();
    }

    /**
     * Update the size toggle button text
     */
    static updateSizeToggle() {
        const btn = document.getElementById('sprite-size-toggle');
        const sprite = this.getCurrentSprite();
        if (btn && sprite) {
            btn.textContent = sprite.height === 8 ? '8x8' : '8x16';
        }
    }

    /**
     * Clear the current sprite
     */
    static clearSprite() {
        const sprite = this.getCurrentSprite();
        if (!sprite) return;

        for (let y = 0; y < sprite.height; y++) {
            for (let x = 0; x < 8; x++) {
                sprite.pixels[y][x] = 0;
            }
        }

        this.renderGrid();
        this.renderPreview();
        this.updateOutput();
    }

    /**
     * Fill the current sprite
     */
    static fillSprite() {
        const sprite = this.getCurrentSprite();
        if (!sprite) return;

        for (let y = 0; y < sprite.height; y++) {
            for (let x = 0; x < 8; x++) {
                sprite.pixels[y][x] = 1;
            }
        }

        this.renderGrid();
        this.renderPreview();
        this.updateOutput();
    }

    /**
     * Invert the current sprite
     */
    static invertSprite() {
        const sprite = this.getCurrentSprite();
        if (!sprite) return;

        for (let y = 0; y < sprite.height; y++) {
            for (let x = 0; x < 8; x++) {
                sprite.pixels[y][x] = sprite.pixels[y][x] === 0 ? 1 : 0;
            }
        }

        this.renderGrid();
        this.renderPreview();
        this.updateOutput();
    }

    /**
     * Flip sprite horizontally
     */
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

    /**
     * Flip sprite vertically
     */
    static flipVertical() {
        const sprite = this.getCurrentSprite();
        if (!sprite) return;

        sprite.pixels.reverse();

        this.renderGrid();
        this.renderPreview();
        this.updateOutput();
    }

    /**
     * Shift sprite in a direction
     * @param {string} direction - 'up', 'down', 'left', 'right'
     */
    static shiftSprite(direction) {
        const sprite = this.getCurrentSprite();
        if (!sprite) return;

        switch (direction) {
            case 'up':
                sprite.pixels.push(sprite.pixels.shift());
                break;
            case 'down':
                sprite.pixels.unshift(sprite.pixels.pop());
                break;
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
     * Rotate sprite 90 degrees clockwise (8x8 only)
     */
    static rotateClockwise() {
        const sprite = this.getCurrentSprite();
        if (!sprite || sprite.height !== 8) return; // Only works for 8x8

        const newPixels = [];
        for (let x = 0; x < 8; x++) {
            const newRow = [];
            for (let y = 7; y >= 0; y--) {
                newRow.push(sprite.pixels[y][x]);
            }
            newPixels.push(newRow);
        }
        sprite.pixels = newPixels;

        this.renderGrid();
        this.renderPreview();
        this.updateOutput();
    }

    /**
     * Generate IntyBASIC BITMAP output
     * @returns {string} IntyBASIC code
     */
    static generateOutput() {
        const sprite = this.getCurrentSprite();
        if (!sprite) return '';

        let output = `${sprite.name}:\n`;

        for (let y = 0; y < sprite.height; y++) {
            let row = '    BITMAP "';
            for (let x = 0; x < 8; x++) {
                row += sprite.pixels[y][x] === 1 ? 'X' : '.';
            }
            row += '"';
            output += row + '\n';
        }

        return output;
    }

    /**
     * Generate output for all sprites
     * @returns {string} IntyBASIC code for all sprites
     */
    static generateAllOutput() {
        let output = "' IntyBASIC Sprite Definitions\n";
        output += "' Generated by Intellivision Overlay Editor\n";
        output += "' https://intellivision-overlay-editor.fly.dev\n\n";

        for (const sprite of this.sprites) {
            output += `${sprite.name}:\n`;
            for (let y = 0; y < sprite.height; y++) {
                let row = '    BITMAP "';
                for (let x = 0; x < 8; x++) {
                    row += sprite.pixels[y][x] === 1 ? 'X' : '.';
                }
                row += '"';
                output += row + '\n';
            }
            output += '\n';
        }

        // Add usage comment
        output += "' Usage:\n";
        output += "'   DEFINE 0, 1, sprite_name   ' Define GRAM card 0\n";
        output += "'   SPRITE 0, x + VISIBLE, y, 0 * 8 + color   ' Display as MOB\n";

        return output;
    }

    /**
     * Update the output text area
     */
    static updateOutput() {
        const textarea = document.getElementById('sprite-output');
        if (textarea) {
            textarea.value = this.generateOutput();
        }
    }

    /**
     * Copy output to clipboard
     */
    static copyOutputToClipboard() {
        const textarea = document.getElementById('sprite-output');
        if (textarea) {
            textarea.select();
            document.execCommand('copy');

            // Show feedback
            const btn = document.getElementById('sprite-copy-btn');
            if (btn) {
                const originalText = btn.textContent;
                btn.textContent = 'Copied!';
                setTimeout(() => { btn.textContent = originalText; }, 1500);
            }
        }
    }

    /**
     * Parse IntyBASIC BITMAP text and create a sprite
     * @param {string} text - BITMAP text to parse
     * @returns {boolean} Success
     */
    static parseBitmapText(text) {
        if (!text || !text.trim()) {
            alert('Please paste BITMAP text first');
            return false;
        }

        // Try to extract sprite name from "name:" pattern
        let spriteName = `sprite_${this.sprites.length}`;
        const nameMatch = text.match(/^(\w+):/m);
        if (nameMatch) {
            spriteName = nameMatch[1];
        }

        // Find all BITMAP lines
        const bitmapRegex = /BITMAP\s*"([.X]{1,8})"/gi;
        const rows = [];
        let match;

        while ((match = bitmapRegex.exec(text)) !== null) {
            const pattern = match[1];
            const row = [];
            for (let i = 0; i < 8; i++) {
                const char = pattern[i] || '.';
                row.push(char.toUpperCase() === 'X' ? 1 : 0);
            }
            rows.push(row);
        }

        if (rows.length === 0) {
            alert('No valid BITMAP lines found.\n\nExpected format:\n    BITMAP "..XXXX.."\n    BITMAP "XXXXXXXX"');
            return false;
        }

        // Limit to 8 or 16 rows
        if (rows.length > 16) {
            rows.length = 16;
        }

        // Determine if 8x8 or 8x16
        const height = rows.length <= 8 ? 8 : 16;

        // Pad to full height if needed
        while (rows.length < height) {
            rows.push(new Array(8).fill(0));
        }

        // Create the sprite
        const sprite = {
            name: spriteName,
            width: 8,
            height: height,
            pixels: rows,
            fgColor: this.selectedFgColor,
            bgColor: this.selectedBgColor
        };

        this.sprites.push(sprite);
        this.currentSpriteIndex = this.sprites.length - 1;
        this.gridSize = height;

        // Update UI
        this.updateSpriteList();
        this.renderPalette();
        this.renderGrid();
        this.renderPreview();
        this.updateOutput();
        this.updateSizeToggle();

        return true;
    }

    /**
     * Show paste dialog for importing BITMAP text
     */
    static showPasteBitmapDialog() {
        const text = prompt(
            'Paste IntyBASIC BITMAP code:\n\n' +
            'Example:\n' +
            'player:\n' +
            '    BITMAP "..XX.."\n' +
            '    BITMAP ".XXXX."\n' +
            '    BITMAP "XXXXXX"'
        );

        if (text) {
            if (this.parseBitmapText(text)) {
                // Success feedback could go here
            }
        }
    }

    /**
     * Copy all sprites output to clipboard
     */
    static copyAllToClipboard() {
        const output = this.generateAllOutput();
        navigator.clipboard.writeText(output).then(() => {
            const btn = document.getElementById('sprite-copy-all-btn');
            if (btn) {
                const originalText = btn.textContent;
                btn.textContent = 'Copied!';
                setTimeout(() => { btn.textContent = originalText; }, 1500);
            }
        });
    }

    /**
     * Download output as a .bas file
     */
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

    /**
     * Add a new sprite
     */
    static addSprite() {
        const name = `sprite_${this.sprites.length}`;
        this.sprites.push(this.createEmptySprite(name));
        this.currentSpriteIndex = this.sprites.length - 1;

        this.updateSpriteList();
        this.renderGrid();
        this.renderPreview();
        this.updateOutput();
        this.updateSizeToggle();
    }

    /**
     * Delete the current sprite
     */
    static deleteSprite() {
        if (this.sprites.length <= 1) return; // Keep at least one

        this.sprites.splice(this.currentSpriteIndex, 1);
        if (this.currentSpriteIndex >= this.sprites.length) {
            this.currentSpriteIndex = this.sprites.length - 1;
        }

        this.updateSpriteList();
        this.renderGrid();
        this.renderPreview();
        this.updateOutput();
        this.updateSizeToggle();
    }

    /**
     * Duplicate the current sprite
     */
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

    /**
     * Select a sprite by index
     * @param {number} index
     */
    static selectSprite(index) {
        if (index >= 0 && index < this.sprites.length) {
            this.currentSpriteIndex = index;
            const sprite = this.getCurrentSprite();
            this.selectedFgColor = sprite.fgColor;
            this.selectedBgColor = sprite.bgColor;
            this.gridSize = sprite.height;

            this.updateSpriteList();
            this.renderPalette();
            this.renderGrid();
            this.renderPreview();
            this.updateOutput();
            this.updateSizeToggle();
        }
    }

    /**
     * Update the sprite name
     */
    static updateSpriteName() {
        const input = document.getElementById('sprite-name-input');
        const sprite = this.getCurrentSprite();
        if (input && sprite) {
            // Sanitize: lowercase, replace spaces with underscores, remove invalid chars
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
     * Update the sprite list UI
     */
    static updateSpriteList() {
        const list = document.getElementById('sprite-list');
        const nameInput = document.getElementById('sprite-name-input');

        if (list) {
            list.innerHTML = '';
            this.sprites.forEach((sprite, index) => {
                const item = document.createElement('div');
                item.className = 'sprite-list-item' + (index === this.currentSpriteIndex ? ' selected' : '');

                // Create thumbnail
                const thumb = document.createElement('canvas');
                thumb.className = 'sprite-thumbnail';
                thumb.width = 16;
                thumb.height = sprite.height === 16 ? 32 : 16;
                const ctx = thumb.getContext('2d');
                const scale = 2;
                for (let y = 0; y < sprite.height; y++) {
                    for (let x = 0; x < 8; x++) {
                        const isSet = sprite.pixels[y][x] === 1;
                        const colorIndex = isSet ? sprite.fgColor : sprite.bgColor;
                        ctx.fillStyle = this.PALETTE[colorIndex].hex;
                        ctx.fillRect(x * scale, y * scale, scale, scale);
                    }
                }
                item.appendChild(thumb);

                // Sprite name
                const nameSpan = document.createElement('span');
                nameSpan.className = 'sprite-item-name';
                nameSpan.textContent = sprite.name;
                item.appendChild(nameSpan);

                // Add to animation button
                const addBtn = document.createElement('button');
                addBtn.className = 'add-to-anim-btn';
                addBtn.textContent = '+Anim';
                addBtn.title = 'Add to animation sequence';
                addBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.addToAnimation(index);
                };
                item.appendChild(addBtn);

                // Select sprite on click
                item.onclick = () => this.selectSprite(index);
                list.appendChild(item);
            });
        }

        if (nameInput) {
            const sprite = this.getCurrentSprite();
            nameInput.value = sprite ? sprite.name : '';
        }

        // Update count display
        const countEl = document.getElementById('sprite-count');
        if (countEl) {
            countEl.textContent = `(${this.sprites.length})`;
        }
    }

    /**
     * Import sprite from a small image
     * @param {Event} event - File input change event
     */
    static importImage(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.convertImageToSprite(img);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    /**
     * Convert an image to sprite pixels
     * @param {HTMLImageElement} img
     */
    static convertImageToSprite(img) {
        const sprite = this.getCurrentSprite();
        if (!sprite) return;

        const canvas = document.createElement('canvas');
        canvas.width = 8;
        canvas.height = sprite.height;
        const ctx = canvas.getContext('2d');

        // Draw image scaled to 8xN
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, 8, sprite.height);

        // Get pixel data
        const imageData = ctx.getImageData(0, 0, 8, sprite.height);
        const data = imageData.data;

        // Convert to 1-bit based on brightness threshold
        for (let y = 0; y < sprite.height; y++) {
            for (let x = 0; x < 8; x++) {
                const i = (y * 8 + x) * 4;
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const a = data[i + 3];

                // Calculate brightness (0-255)
                const brightness = (r + g + b) / 3;

                // If pixel is mostly transparent or dark, it's background
                sprite.pixels[y][x] = (a > 128 && brightness > 128) ? 1 : 0;
            }
        }

        this.renderGrid();
        this.renderPreview();
        this.updateOutput();

        // Reset file input
        const input = document.getElementById('sprite-import-input');
        if (input) input.value = '';
    }

    /**
     * Reset the sprite editor to initial state
     */
    static reset() {
        this.sprites = [this.createEmptySprite('sprite_0')];
        this.currentSpriteIndex = 0;
        this.selectedFgColor = 7;  // White
        this.selectedBgColor = 0;  // Black
        this.gridSize = 8;

        this.updateSpriteList();
        this.renderPalette();
        this.renderGrid();
        this.renderPreview();
        this.updateOutput();
        this.updateSizeToggle();
    }

    /**
     * Export sprite project as JSON
     */
    static exportProject() {
        const projectData = {
            version: 1,
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

    /**
     * Import sprite project from JSON file
     */
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

                    if (projectData.version && projectData.sprites) {
                        this.sprites = projectData.sprites;
                        this.currentSpriteIndex = projectData.currentSpriteIndex || 0;
                        this.selectedFgColor = projectData.selectedFgColor || 7;
                        this.selectedBgColor = projectData.selectedBgColor || 0;

                        const sprite = this.getCurrentSprite();
                        if (sprite) {
                            this.gridSize = sprite.height;
                        }

                        this.updateSpriteList();
                        this.renderPalette();
                        this.renderGrid();
                        this.renderPreview();
                        this.updateOutput();
                        this.updateSizeToggle();
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
    // Animation Methods
    // ==========================================

    /**
     * Add a sprite to the animation sequence
     * @param {number} spriteIndex - Index of sprite to add
     */
    static addToAnimation(spriteIndex) {
        if (spriteIndex >= 0 && spriteIndex < this.sprites.length) {
            this.animationSequence.push(spriteIndex);
            this.updateAnimationUI();
        }
    }

    /**
     * Remove a sprite from the animation sequence by position
     * @param {number} position - Position in sequence to remove
     */
    static removeFromAnimation(position) {
        if (position >= 0 && position < this.animationSequence.length) {
            this.animationSequence.splice(position, 1);
            this.updateAnimationUI();
        }
    }

    /**
     * Clear the entire animation sequence
     */
    static clearAnimation() {
        this.stopAnimation();
        this.animationSequence = [];
        this.updateAnimationUI();
    }

    /**
     * Add all sprites to animation in order
     */
    static addAllToAnimation() {
        this.animationSequence = this.sprites.map((_, index) => index);
        this.updateAnimationUI();
    }

    /**
     * Start playing the animation
     */
    static playAnimation() {
        if (this.animationSequence.length < 2) {
            alert('Add at least 2 sprites to the animation sequence');
            return;
        }

        this.isAnimating = true;
        this.animationFrame = 0;
        this.updatePlayButton();

        const intervalMs = 1000 / this.animationFps;
        this.animationInterval = setInterval(() => {
            this.renderAnimationFrame();
            this.animationFrame = (this.animationFrame + 1) % this.animationSequence.length;
        }, intervalMs);
    }

    /**
     * Pause the animation
     */
    static pauseAnimation() {
        this.isAnimating = false;
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }
        this.updatePlayButton();
    }

    /**
     * Stop the animation and reset to first frame
     */
    static stopAnimation() {
        this.pauseAnimation();
        this.animationFrame = 0;
        this.renderAnimationFrame();
    }

    /**
     * Toggle play/pause
     */
    static toggleAnimation() {
        if (this.isAnimating) {
            this.pauseAnimation();
        } else {
            this.playAnimation();
        }
    }

    /**
     * Update animation FPS from slider
     */
    static updateAnimationFps() {
        const slider = document.getElementById('animation-fps');
        const display = document.getElementById('animation-fps-value');
        if (slider) {
            this.animationFps = parseInt(slider.value);
            if (display) {
                display.textContent = this.animationFps;
            }

            // If currently playing, restart with new FPS
            if (this.isAnimating) {
                this.pauseAnimation();
                this.playAnimation();
            }
        }
    }

    /**
     * Render the current animation frame
     */
    static renderAnimationFrame() {
        const canvas = document.getElementById('animation-preview-canvas');
        if (!canvas || this.animationSequence.length === 0) return;

        const ctx = canvas.getContext('2d');
        const spriteIndex = this.animationSequence[this.animationFrame];
        const sprite = this.sprites[spriteIndex];

        if (!sprite) return;

        // Set canvas size based on sprite height (scale 4x for visibility)
        const scale = 4;
        canvas.width = 8 * scale;
        canvas.height = sprite.height * scale;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw sprite pixels
        for (let y = 0; y < sprite.height; y++) {
            for (let x = 0; x < 8; x++) {
                const isSet = sprite.pixels[y][x] === 1;
                const colorIndex = isSet ? sprite.fgColor : sprite.bgColor;
                const color = this.PALETTE[colorIndex];

                ctx.fillStyle = color.hex;
                ctx.fillRect(x * scale, y * scale, scale, scale);
            }
        }

        // Update frame counter
        const frameDisplay = document.getElementById('animation-frame-display');
        if (frameDisplay) {
            frameDisplay.textContent = `${this.animationFrame + 1}/${this.animationSequence.length}`;
        }

        // Highlight current sprite in sequence
        this.highlightSequenceFrame();
    }

    /**
     * Highlight the current frame in the sequence display
     */
    static highlightSequenceFrame() {
        const items = document.querySelectorAll('.animation-sequence-item');
        items.forEach((item, index) => {
            item.classList.toggle('current-frame', index === this.animationFrame);
        });
    }

    /**
     * Update the play/pause button text
     */
    static updatePlayButton() {
        const btn = document.getElementById('animation-play-btn');
        if (btn) {
            btn.textContent = this.isAnimating ? '⏸ Pause' : '▶ Play';
        }
    }

    /**
     * Update the animation UI (sequence display)
     */
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

            // Create mini thumbnail
            const thumb = document.createElement('canvas');
            thumb.width = 16;
            thumb.height = sprite.height === 16 ? 32 : 16;
            thumb.className = 'animation-thumb';

            const ctx = thumb.getContext('2d');
            const scale = 2;
            for (let y = 0; y < sprite.height; y++) {
                for (let x = 0; x < 8; x++) {
                    const isSet = sprite.pixels[y][x] === 1;
                    const colorIndex = isSet ? sprite.fgColor : sprite.bgColor;
                    ctx.fillStyle = this.PALETTE[colorIndex].hex;
                    ctx.fillRect(x * scale, y * scale, scale, scale);
                }
            }

            item.appendChild(thumb);

            // Click to remove
            item.onclick = () => this.removeFromAnimation(position);

            container.appendChild(item);
        });

        // Re-render preview if not playing
        if (!this.isAnimating && this.animationSequence.length > 0) {
            this.animationFrame = 0;
            this.renderAnimationFrame();
        }
    }

    /**
     * Handle clicking on a sprite in the sprite list to add to animation
     * Called via onclick in sprite list when in "add to animation" mode
     */
    static toggleSpriteInAnimation(spriteIndex) {
        const existingPos = this.animationSequence.indexOf(spriteIndex);
        if (existingPos === -1) {
            this.addToAnimation(spriteIndex);
        } else {
            // If clicking same sprite, add another instance (for repeating frames)
            this.addToAnimation(spriteIndex);
        }
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
