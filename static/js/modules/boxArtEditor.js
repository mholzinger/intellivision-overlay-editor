/**
 * Box Art Editor Module
 * Handles the Intellivision box art creation and editing
 */

import { appState } from '../services/stateManager.js';
import { ExportManager } from './exportManager.js';
import { PreviewInteraction } from './previewInteraction.js';
import { DraggableArtwork } from './draggableArtwork.js';
import { FontManager } from './fontManager.js';

export class BoxArtEditor {
    /**
     * Initialize the box art editor
     */
    static async init() {
        await BoxArtEditor.loadTemplate();

        // Apply initial values from controls
        BoxArtEditor.updateBrand();
        BoxArtEditor.updateTagline();
        BoxArtEditor.updateTitle();
        BoxArtEditor.updateSubtitle();
        BoxArtEditor.updateStripes();

        console.log('Box art editor initialized');
    }

    /**
     * Load the SVG template without applying updates
     * Used during import to get a fresh template before applying config
     */
    static async loadTemplate() {
        try {
            const response = await fetch('/get_boxart_template');
            const data = await response.json();

            if (data.svg) {
                const parser = new DOMParser();
                const svgDoc = parser.parseFromString(data.svg, 'image/svg+xml');
                appState.setBoxArtSvgDoc(svgDoc);

                // Insert SVG into preview
                const preview = document.getElementById('boxart-svg-preview');
                if (preview) {
                    preview.innerHTML = '';
                    const svgElement = svgDoc.documentElement.cloneNode(true);
                    preview.appendChild(svgElement);

                    // Initialize click-to-navigate for box art preview
                    PreviewInteraction.initBoxArt();
                    // Initialize drag-to-position for artwork
                    DraggableArtwork.initBoxArt();
                }
            }
        } catch (error) {
            console.error('Failed to load box art template:', error);
            BoxArtEditor.showStatus('Failed to load box art template', 'error');
        }
    }

    /**
     * Show status message
     * @param {string} message - Status message
     * @param {string} type - Status type (success, error, info)
     */
    static showStatus(message, type = 'info') {
        const status = document.getElementById('boxart-status');
        if (status) {
            status.textContent = message;
            status.className = `status-message ${type}`;
            setTimeout(() => {
                status.textContent = '';
                status.className = 'status-message';
            }, 3000);
        }
    }

    /**
     * Update brand text
     */
    static updateBrand() {
        const value = document.getElementById('boxart-brand-text')?.value || 'INTELLIVISION';
        const svgDoc = appState.getBoxArtSvgDoc();
        const brandElement = svgDoc?.querySelector('#brand-logo');

        if (brandElement) {
            brandElement.textContent = value;
            BoxArtEditor.refreshPreview();
        }
    }

    /**
     * Update tagline text
     */
    static updateTagline() {
        const value = document.getElementById('boxart-tagline')?.value || 'Intelligent Television';
        const svgDoc = appState.getBoxArtSvgDoc();
        const taglineElement = svgDoc?.querySelector('#brand-tagline');

        if (taglineElement) {
            taglineElement.textContent = value;
            BoxArtEditor.refreshPreview();
        }
    }

    /**
     * Update brand font
     */
    static updateBrandFont() {
        const select = document.getElementById('boxart-brand-font-select');
        const fontValue = select?.value;
        const svgDoc = appState.getBoxArtSvgDoc();
        const brandElement = svgDoc?.querySelector('#brand-logo');
        if (!fontValue || !brandElement) return;

        const { fontFamily, fontFile, fontFormat, isSystem } = FontManager.parseFontData(fontValue);

        // Update embedded font style in box art SVG
        let styleEl = svgDoc.querySelector('style');
        if (styleEl && !isSystem) {
            // Append font-face if not already present
            if (!styleEl.textContent.includes(`font-family: '${fontFamily}'`)) {
                styleEl.textContent += `\n${FontManager.generateFontFace(fontFamily, fontFile, fontFormat).replace(/"/g, "'")}`;
            }
        }

        brandElement.setAttribute('font-family', `'${fontFamily}', sans-serif`);
        BoxArtEditor.refreshPreview();
    }

    /**
     * Update tagline font
     */
    static updateTaglineFont() {
        const select = document.getElementById('boxart-tagline-font-select');
        const fontValue = select?.value;
        const svgDoc = appState.getBoxArtSvgDoc();
        const taglineElement = svgDoc?.querySelector('#brand-tagline');
        if (!fontValue || !taglineElement) return;

        const { fontFamily, fontFile, fontFormat, isSystem } = FontManager.parseFontData(fontValue);

        let styleEl = svgDoc.querySelector('style');
        if (styleEl && !isSystem) {
            if (!styleEl.textContent.includes(`font-family: '${fontFamily}'`)) {
                styleEl.textContent += `\n${FontManager.generateFontFace(fontFamily, fontFile, fontFormat).replace(/"/g, "'")}`;
            }
        }

        taglineElement.setAttribute('font-family', `'${fontFamily}', sans-serif`);
        BoxArtEditor.refreshPreview();
    }

    /**
     * Update header background color (border/margin area)
     */
    static updateHeaderColor() {
        const color = document.getElementById('boxart-header-color')?.value || '#1E3A8A';
        const svgDoc = appState.getBoxArtSvgDoc();
        const boxBg = svgDoc?.querySelector('#box-background');

        if (boxBg) {
            boxBg.setAttribute('fill', color);
            BoxArtEditor.refreshPreview();
        }
    }

    /**
     * Update brand size
     */
    static updateBrandSize() {
        const size = parseFloat(document.getElementById('boxart-brand-size')?.value || 12);
        document.getElementById('boxart-brand-size-value').textContent = size;

        const svgDoc = appState.getBoxArtSvgDoc();
        const brandElement = svgDoc?.querySelector('#brand-logo');

        if (brandElement) {
            brandElement.setAttribute('font-size', size);
            BoxArtEditor.refreshPreview();
        }
    }

    /**
     * Update brand color
     */
    static updateBrandColor() {
        const color = document.getElementById('boxart-brand-color')?.value || '#FFFFFF';
        const svgDoc = appState.getBoxArtSvgDoc();
        const brandElement = svgDoc?.querySelector('#brand-logo');

        if (brandElement) {
            brandElement.setAttribute('fill', color);
            BoxArtEditor.refreshPreview();
        }
    }

    /**
     * Update brand style (bold, italic, underline)
     */
    static updateBrandStyle() {
        const svgDoc = appState.getBoxArtSvgDoc();
        const brandElement = svgDoc?.querySelector('#brand-logo');
        if (!brandElement) return;

        const isBold = document.getElementById('boxart-brand-bold')?.checked || false;
        const isItalic = document.getElementById('boxart-brand-italic')?.checked || false;
        const isUnderline = document.getElementById('boxart-brand-underline')?.checked || false;

        brandElement.setAttribute('font-weight', isBold ? 'bold' : 'normal');
        brandElement.setAttribute('font-style', isItalic ? 'italic' : 'normal');
        brandElement.setAttribute('text-decoration', isUnderline ? 'underline' : 'none');
        BoxArtEditor.refreshPreview();
    }

    /**
     * Update brand position
     */
    static updateBrandPosition() {
        const x = parseFloat(document.getElementById('boxart-brand-x')?.value || 12);
        const y = parseFloat(document.getElementById('boxart-brand-y')?.value || 11);
        document.getElementById('boxart-brand-x-value').textContent = x;
        document.getElementById('boxart-brand-y-value').textContent = y;

        const svgDoc = appState.getBoxArtSvgDoc();
        const brandElement = svgDoc?.querySelector('#brand-logo');

        if (brandElement) {
            brandElement.setAttribute('x', x);
            brandElement.setAttribute('y', y);
            BoxArtEditor.refreshPreview();
        }
    }

    /**
     * Update tagline size
     */
    static updateTaglineSize() {
        const size = parseFloat(document.getElementById('boxart-tagline-size')?.value || 5);
        document.getElementById('boxart-tagline-size-value').textContent = size;

        const svgDoc = appState.getBoxArtSvgDoc();
        const taglineElement = svgDoc?.querySelector('#brand-tagline');

        if (taglineElement) {
            taglineElement.setAttribute('font-size', size);
            BoxArtEditor.refreshPreview();
        }
    }

    /**
     * Update tagline color
     */
    static updateTaglineColor() {
        const color = document.getElementById('boxart-tagline-color')?.value || '#FFFFFF';
        const svgDoc = appState.getBoxArtSvgDoc();
        const taglineElement = svgDoc?.querySelector('#brand-tagline');

        if (taglineElement) {
            taglineElement.setAttribute('fill', color);
            BoxArtEditor.refreshPreview();
        }
    }

    /**
     * Update tagline style (bold, italic, underline)
     */
    static updateTaglineStyle() {
        const svgDoc = appState.getBoxArtSvgDoc();
        const taglineElement = svgDoc?.querySelector('#brand-tagline');
        if (!taglineElement) return;

        const isBold = document.getElementById('boxart-tagline-bold')?.checked || false;
        const isItalic = document.getElementById('boxart-tagline-italic')?.checked || false;
        const isUnderline = document.getElementById('boxart-tagline-underline')?.checked || false;

        taglineElement.setAttribute('font-weight', isBold ? 'bold' : 'normal');
        taglineElement.setAttribute('font-style', isItalic ? 'italic' : 'normal');
        taglineElement.setAttribute('text-decoration', isUnderline ? 'underline' : 'none');
        BoxArtEditor.refreshPreview();
    }

    /**
     * Update tagline position
     */
    static updateTaglinePosition() {
        const x = parseFloat(document.getElementById('boxart-tagline-x')?.value || 118);
        const y = parseFloat(document.getElementById('boxart-tagline-y')?.value || 11);
        document.getElementById('boxart-tagline-x-value').textContent = x;
        document.getElementById('boxart-tagline-y-value').textContent = y;

        const svgDoc = appState.getBoxArtSvgDoc();
        const taglineElement = svgDoc?.querySelector('#brand-tagline');

        if (taglineElement) {
            taglineElement.setAttribute('x', x);
            taglineElement.setAttribute('y', y);
            BoxArtEditor.refreshPreview();
        }
    }

    /**
     * Update game title
     */
    static updateTitle() {
        const value = document.getElementById('boxart-title')?.value || 'GAME TITLE';
        const svgDoc = appState.getBoxArtSvgDoc();
        const titleElement = svgDoc?.querySelector('#game-title');

        if (titleElement) {
            titleElement.textContent = value;
            BoxArtEditor.refreshPreview();
        }
    }

    /**
     * Update game subtitle
     */
    static updateSubtitle() {
        const value = document.getElementById('boxart-subtitle')?.value || 'by MATTEL ELECTRONICS';
        const svgDoc = appState.getBoxArtSvgDoc();
        const subtitleElement = svgDoc?.querySelector('#game-subtitle');

        if (subtitleElement) {
            subtitleElement.textContent = value;
            BoxArtEditor.refreshPreview();
        }
    }

    /**
     * Update title font
     */
    static updateTitleFont() {
        const select = document.getElementById('boxart-title-font-select');
        const fontValue = select?.value;
        const svgDoc = appState.getBoxArtSvgDoc();
        const titleElement = svgDoc?.querySelector('#game-title');
        if (!fontValue || !titleElement) return;

        const { fontFamily, fontFile, fontFormat, isSystem } = FontManager.parseFontData(fontValue);

        let styleEl = svgDoc.querySelector('style');
        if (styleEl && !isSystem) {
            if (!styleEl.textContent.includes(`font-family: '${fontFamily}'`)) {
                styleEl.textContent += `\n${FontManager.generateFontFace(fontFamily, fontFile, fontFormat).replace(/"/g, "'")}`;
            }
        }

        titleElement.setAttribute('font-family', `'${fontFamily}', sans-serif`);
        BoxArtEditor.refreshPreview();
    }

    /**
     * Update subtitle font
     */
    static updateSubtitleFont() {
        const select = document.getElementById('boxart-subtitle-font-select');
        const fontValue = select?.value;
        const svgDoc = appState.getBoxArtSvgDoc();
        const subtitleElement = svgDoc?.querySelector('#game-subtitle');
        if (!fontValue || !subtitleElement) return;

        const { fontFamily, fontFile, fontFormat, isSystem } = FontManager.parseFontData(fontValue);

        let styleEl = svgDoc.querySelector('style');
        if (styleEl && !isSystem) {
            if (!styleEl.textContent.includes(`font-family: '${fontFamily}'`)) {
                styleEl.textContent += `\n${FontManager.generateFontFace(fontFamily, fontFile, fontFormat).replace(/"/g, "'")}`;
            }
        }

        subtitleElement.setAttribute('font-family', `'${fontFamily}', sans-serif`);
        BoxArtEditor.refreshPreview();
    }

    /**
     * Update title color
     */
    static updateTitleColor() {
        const color = document.getElementById('boxart-title-color')?.value || '#333333';
        const svgDoc = appState.getBoxArtSvgDoc();
        const titleElement = svgDoc?.querySelector('#game-title');

        if (titleElement) {
            titleElement.setAttribute('fill', color);
            BoxArtEditor.refreshPreview();
        }
    }

    /**
     * Update title size
     */
    static updateTitleSize() {
        const size = parseFloat(document.getElementById('boxart-title-size')?.value || 14);
        document.getElementById('boxart-title-size-value').textContent = size;

        const svgDoc = appState.getBoxArtSvgDoc();
        const titleElement = svgDoc?.querySelector('#game-title');

        if (titleElement) {
            titleElement.setAttribute('font-size', size);
            BoxArtEditor.refreshPreview();
        }
    }

    /**
     * Update title style (bold, italic, underline)
     */
    static updateTitleStyle() {
        const svgDoc = appState.getBoxArtSvgDoc();
        const titleElement = svgDoc?.querySelector('#game-title');
        if (!titleElement) return;

        const isBold = document.getElementById('boxart-title-bold')?.checked || false;
        const isItalic = document.getElementById('boxart-title-italic')?.checked || false;
        const isUnderline = document.getElementById('boxart-title-underline')?.checked || false;

        titleElement.setAttribute('font-weight', isBold ? 'bold' : 'normal');
        titleElement.setAttribute('font-style', isItalic ? 'italic' : 'normal');
        titleElement.setAttribute('text-decoration', isUnderline ? 'underline' : 'none');
        BoxArtEditor.refreshPreview();
    }

    /**
     * Update title anchor
     */
    static updateTitleAnchor() {
        const anchor = document.getElementById('boxart-title-anchor')?.value || 'middle';
        const svgDoc = appState.getBoxArtSvgDoc();
        const titleElement = svgDoc?.querySelector('#game-title');

        if (titleElement) {
            titleElement.setAttribute('text-anchor', anchor);
            BoxArtEditor.refreshPreview();
        }
    }

    /**
     * Update title position
     */
    static updateTitlePosition() {
        const x = parseFloat(document.getElementById('boxart-title-x')?.value || 93);
        const y = parseFloat(document.getElementById('boxart-title-y')?.value || 36);
        document.getElementById('boxart-title-x-value').textContent = x;
        document.getElementById('boxart-title-y-value').textContent = y;

        const svgDoc = appState.getBoxArtSvgDoc();
        const titleElement = svgDoc?.querySelector('#game-title');

        if (titleElement) {
            titleElement.setAttribute('x', x);
            titleElement.setAttribute('y', y);
            BoxArtEditor.refreshPreview();
        }
    }

    /**
     * Update subtitle color
     */
    static updateSubtitleColor() {
        const color = document.getElementById('boxart-subtitle-color')?.value || '#666666';
        const svgDoc = appState.getBoxArtSvgDoc();
        const subtitleElement = svgDoc?.querySelector('#game-subtitle');

        if (subtitleElement) {
            subtitleElement.setAttribute('fill', color);
            BoxArtEditor.refreshPreview();
        }
    }

    /**
     * Update subtitle size
     */
    static updateSubtitleSize() {
        const size = parseFloat(document.getElementById('boxart-subtitle-size')?.value || 4);
        document.getElementById('boxart-subtitle-size-value').textContent = size;

        const svgDoc = appState.getBoxArtSvgDoc();
        const subtitleElement = svgDoc?.querySelector('#game-subtitle');

        if (subtitleElement) {
            subtitleElement.setAttribute('font-size', size);
            BoxArtEditor.refreshPreview();
        }
    }

    /**
     * Update subtitle style (bold, italic, underline)
     */
    static updateSubtitleStyle() {
        const svgDoc = appState.getBoxArtSvgDoc();
        const subtitleElement = svgDoc?.querySelector('#game-subtitle');
        if (!subtitleElement) return;

        const isBold = document.getElementById('boxart-subtitle-bold')?.checked || false;
        const isItalic = document.getElementById('boxart-subtitle-italic')?.checked || false;
        const isUnderline = document.getElementById('boxart-subtitle-underline')?.checked || false;

        subtitleElement.setAttribute('font-weight', isBold ? 'bold' : 'normal');
        subtitleElement.setAttribute('font-style', isItalic ? 'italic' : 'normal');
        subtitleElement.setAttribute('text-decoration', isUnderline ? 'underline' : 'none');
        BoxArtEditor.refreshPreview();
    }

    /**
     * Update subtitle anchor
     */
    static updateSubtitleAnchor() {
        const anchor = document.getElementById('boxart-subtitle-anchor')?.value || 'middle';
        const svgDoc = appState.getBoxArtSvgDoc();
        const subtitleElement = svgDoc?.querySelector('#game-subtitle');

        if (subtitleElement) {
            subtitleElement.setAttribute('text-anchor', anchor);
            BoxArtEditor.refreshPreview();
        }
    }

    /**
     * Update subtitle position
     */
    static updateSubtitlePosition() {
        const x = parseFloat(document.getElementById('boxart-subtitle-x')?.value || 93);
        const y = parseFloat(document.getElementById('boxart-subtitle-y')?.value || 48);
        document.getElementById('boxart-subtitle-x-value').textContent = x;
        document.getElementById('boxart-subtitle-y-value').textContent = y;

        const svgDoc = appState.getBoxArtSvgDoc();
        const subtitleElement = svgDoc?.querySelector('#game-subtitle');

        if (subtitleElement) {
            subtitleElement.setAttribute('x', x);
            subtitleElement.setAttribute('y', y);
            BoxArtEditor.refreshPreview();
        }
    }

    /**
     * Update content frame color
     */
    static updateFrameColor() {
        const colorInput = document.getElementById('boxart-frame-color');
        if (!colorInput) return; // Element doesn't exist in current HTML

        const color = colorInput.value || '#8B4513';
        const svgDoc = appState.getBoxArtSvgDoc();
        const frame = svgDoc?.querySelector('#content-frame');

        if (frame) {
            frame.setAttribute('stroke', color);
            BoxArtEditor.refreshPreview();
        }
    }

    /**
     * Update content frame stroke width
     */
    static updateFrameStroke() {
        const strokeInput = document.getElementById('boxart-frame-stroke');
        if (!strokeInput) return; // Element doesn't exist in current HTML

        const width = parseFloat(strokeInput.value || 1);
        const valueDisplay = document.getElementById('boxart-frame-stroke-value');
        if (valueDisplay) valueDisplay.textContent = width;

        const svgDoc = appState.getBoxArtSvgDoc();
        const frame = svgDoc?.querySelector('#content-frame');

        if (frame) {
            frame.setAttribute('stroke-width', width);
            BoxArtEditor.refreshPreview();
        }
    }

    /**
     * Update content frame top position (Y)
     * This resizes the content frame from the top, adjusting the title/header area
     */
    static updateFrameTop() {
        const topY = parseFloat(document.getElementById('boxart-frame-top')?.value || 20);
        document.getElementById('boxart-frame-top-value').textContent = topY;

        const svgDoc = appState.getBoxArtSvgDoc();
        if (!svgDoc) return;

        // Calculate new height based on top position
        // Original: y=20, height=206, bottom=226
        const bottomY = 226; // Fixed bottom position
        const newHeight = bottomY - topY;

        // Update content frame rect
        const frame = svgDoc.querySelector('#content-frame');
        if (frame) {
            frame.setAttribute('y', topY);
            frame.setAttribute('height', newHeight);
        }

        // Update the clip path for content frame
        const clipRect = svgDoc.querySelector('#content-frame-clip rect');
        if (clipRect) {
            clipRect.setAttribute('y', topY);
            clipRect.setAttribute('height', newHeight);
        }

        // Update title area boundary (dashed rect) if it exists
        const titleArea = svgDoc.querySelector('#title-area');
        if (titleArea) {
            titleArea.setAttribute('y', topY);
        }

        // Update game title position (originally y=36 when frame at y=20, so offset is 16)
        const titleElement = svgDoc.querySelector('#game-title');
        if (titleElement) {
            const titleY = topY + 16;
            titleElement.setAttribute('y', titleY);
            // Update the slider and display value
            const titleYInput = document.getElementById('boxart-title-y');
            const titleYValue = document.getElementById('boxart-title-y-value');
            if (titleYInput) titleYInput.value = titleY;
            if (titleYValue) titleYValue.textContent = titleY;
        }

        // Update game subtitle position (originally y=48 when frame at y=20, so offset is 28)
        const subtitleElement = svgDoc.querySelector('#game-subtitle');
        if (subtitleElement) {
            const subtitleY = topY + 28;
            subtitleElement.setAttribute('y', subtitleY);
            // Update the slider and display value
            const subtitleYInput = document.getElementById('boxart-subtitle-y');
            const subtitleYValue = document.getElementById('boxart-subtitle-y-value');
            if (subtitleYInput) subtitleYInput.value = subtitleY;
            if (subtitleYValue) subtitleYValue.textContent = subtitleY;
        }

        // Update artwork placeholder
        const artworkPlaceholder = svgDoc.querySelector('#background-artwork-placeholder');
        if (artworkPlaceholder) {
            // Artwork starts below title area (36mm from top of content frame)
            const artworkY = topY + 36;
            const artworkHeight = bottomY - artworkY - 10; // Leave some margin at bottom
            artworkPlaceholder.setAttribute('y', artworkY);
            artworkPlaceholder.setAttribute('height', Math.max(artworkHeight, 50));
        }

        // Update crosshair lines for artwork alignment
        const vertLine = svgDoc.querySelector('#artwork-layer line:first-of-type');
        const horizLine = svgDoc.querySelector('#artwork-layer line:last-of-type');
        if (vertLine) {
            const artworkY = topY + 36;
            vertLine.setAttribute('y1', artworkY);
            vertLine.setAttribute('y2', bottomY - 10);
        }

        // Re-insert main artwork if it exists (to recalculate positioning)
        const mainArtworkData = appState.getBoxArtArtworkData?.();
        if (mainArtworkData) {
            BoxArtEditor.insertArtwork(mainArtworkData);
        }

        // Regenerate stripes to match new frame position
        BoxArtEditor.updateStripes();

        BoxArtEditor.refreshPreview();
    }

    /**
     * Update frame stripes
     * Creates decorative border stripes around the content frame
     * Structure for 3 stripes: line-stripe1-line-stripe2-line-stripe3-line
     * Structure for 1 stripe: line-stripe1-line
     */
    static updateStripes() {
        const svgDoc = appState.getBoxArtSvgDoc();
        if (!svgDoc) return;

        const stripeCount = parseInt(document.getElementById('boxart-stripe-count')?.value || 1);
        const stripeWidth = parseFloat(document.getElementById('boxart-stripe-width')?.value || 3);
        const lineColor = document.getElementById('boxart-stripe-line-color')?.value || '#333333';
        const stripe1Color = document.getElementById('boxart-stripe1-color')?.value || '#8B4513';
        const stripe2Color = document.getElementById('boxart-stripe2-color')?.value || '#D4AF37';
        const stripe3Color = document.getElementById('boxart-stripe3-color')?.value || '#8B4513';

        // Update display value
        const stripeWidthValue = document.getElementById('boxart-stripe-width-value');
        if (stripeWidthValue) stripeWidthValue.textContent = stripeWidth;

        // Show/hide stripe 2&3 controls
        const stripe23Controls = document.getElementById('boxart-stripe23-controls');
        const stripe1Controls = document.getElementById('boxart-stripe1-controls');
        const stripesOnTopControls = document.getElementById('boxart-stripes-ontop-controls');
        if (stripe23Controls) {
            stripe23Controls.style.display = stripeCount === 3 ? 'block' : 'none';
        }
        if (stripe1Controls) {
            stripe1Controls.style.display = stripeCount > 0 ? 'block' : 'none';
        }
        if (stripesOnTopControls) {
            stripesOnTopControls.style.display = stripeCount > 0 ? 'block' : 'none';
        }

        // Get or create the stripes layer
        let stripesLayer = svgDoc.querySelector('#frame-stripes-layer');
        if (!stripesLayer) return;

        // Clear existing stripes
        stripesLayer.innerHTML = '';

        if (stripeCount === 0) {
            // No stripes, just update content frame position to default
            BoxArtEditor.updateContentFrameForStripes(0, 0);
            BoxArtEditor.refreshPreview();
            return;
        }

        const svgNS = 'http://www.w3.org/2000/svg';
        const thinLineWidth = 0.5; // Very thin separator lines

        // Get current frame top position
        const frameTop = parseFloat(document.getElementById('boxart-frame-top')?.value || 20);
        const frameBottom = 226;

        // Base content frame position (will be inset by stripes)
        const baseX = 10;
        const baseWidth = 166;
        const cornerRadius = 4;

        // Calculate total stripe border width
        // For 1 stripe: line + stripe + line = 0.5 + stripeWidth + 0.5
        // For 3 stripes: line + stripe + line + stripe + line + stripe + line = 0.5 + sw + 0.5 + sw + 0.5 + sw + 0.5
        let totalBorderWidth;
        if (stripeCount === 1) {
            totalBorderWidth = thinLineWidth + stripeWidth + thinLineWidth;
        } else {
            totalBorderWidth = thinLineWidth + stripeWidth + thinLineWidth + stripeWidth + thinLineWidth + stripeWidth + thinLineWidth;
        }

        // Draw stripes from outside to inside
        // SVG strokes are CENTERED on the path, so half is inside and half outside
        // We track the CENTER position of each stroke
        let centerOffset = thinLineWidth / 2; // Start at center of first thin line

        // Helper to create a stroke rect at a given center offset
        const createStrokeRect = (offset, strokeWidth, color) => {
            const rect = document.createElementNS(svgNS, 'rect');
            // Position rect so stroke center is at the offset
            rect.setAttribute('x', baseX + offset);
            rect.setAttribute('y', frameTop + offset);
            rect.setAttribute('width', baseWidth - offset * 2);
            rect.setAttribute('height', frameBottom - frameTop - offset * 2);
            rect.setAttribute('fill', 'none');
            rect.setAttribute('stroke', color);
            rect.setAttribute('stroke-width', strokeWidth);
            rect.setAttribute('stroke-opacity', '1');
            rect.setAttribute('rx', Math.max(0, cornerRadius - offset));
            rect.setAttribute('ry', Math.max(0, cornerRadius - offset));
            return rect;
        };

        // Outer thin line
        stripesLayer.appendChild(createStrokeRect(centerOffset, thinLineWidth, lineColor));
        // Move to next center: half of current stroke + half of next stroke
        centerOffset += thinLineWidth / 2 + stripeWidth / 2;

        // Stripe 1 (outer stripe)
        stripesLayer.appendChild(createStrokeRect(centerOffset, stripeWidth, stripe1Color));
        centerOffset += stripeWidth / 2 + thinLineWidth / 2;

        // Line after stripe 1
        stripesLayer.appendChild(createStrokeRect(centerOffset, thinLineWidth, lineColor));
        centerOffset += thinLineWidth / 2;

        if (stripeCount === 3) {
            // Move to stripe 2 center
            centerOffset += stripeWidth / 2;

            // Stripe 2 (middle stripe)
            stripesLayer.appendChild(createStrokeRect(centerOffset, stripeWidth, stripe2Color));
            centerOffset += stripeWidth / 2 + thinLineWidth / 2;

            // Line after stripe 2
            stripesLayer.appendChild(createStrokeRect(centerOffset, thinLineWidth, lineColor));
            centerOffset += thinLineWidth / 2 + stripeWidth / 2;

            // Stripe 3 (inner stripe)
            stripesLayer.appendChild(createStrokeRect(centerOffset, stripeWidth, stripe3Color));
            centerOffset += stripeWidth / 2 + thinLineWidth / 2;

            // Inner thin line (after stripe 3)
            stripesLayer.appendChild(createStrokeRect(centerOffset, thinLineWidth, lineColor));
            centerOffset += thinLineWidth / 2;
        }

        // Update content frame to be inset by the stripe border
        BoxArtEditor.updateContentFrameForStripes(centerOffset, frameTop);

        // Apply stripes layer position based on "always on top" setting
        BoxArtEditor.updateStripesLayer();

        BoxArtEditor.refreshPreview();
    }

    /**
     * Update stripes layer position (on top or below vignette/title)
     * When "always on top" is checked, stripes render above vignette and title
     * When unchecked, stripes stay in their default position (below vignette)
     */
    static updateStripesLayer() {
        const svgDoc = appState.getBoxArtSvgDoc();
        if (!svgDoc) return;

        const stripesLayer = svgDoc.querySelector('#frame-stripes-layer');
        if (!stripesLayer) return;

        const alwaysOnTop = document.getElementById('boxart-stripes-ontop')?.checked ?? true;
        const svgRoot = svgDoc.documentElement || svgDoc.querySelector('svg');

        if (alwaysOnTop) {
            // Move stripes to the end of the SVG (renders on top of everything)
            // But before badge-layer if it exists
            const badgeLayer = svgDoc.querySelector('#badge-layer');
            if (badgeLayer) {
                svgRoot.insertBefore(stripesLayer, badgeLayer);
            } else {
                svgRoot.appendChild(stripesLayer);
            }
        } else {
            // Move stripes back to default position (after artwork-layer, before branding-layer)
            const brandingLayer = svgDoc.querySelector('#branding-layer');
            if (brandingLayer) {
                svgRoot.insertBefore(stripesLayer, brandingLayer);
            }
        }

        BoxArtEditor.refreshPreview();
    }

    /**
     * Update content frame position based on stripe border width
     * @param {number} inset - How much to inset the content frame
     * @param {number} frameTop - Top position of the frame
     */
    static updateContentFrameForStripes(inset, frameTop) {
        const svgDoc = appState.getBoxArtSvgDoc();
        if (!svgDoc) return;

        const frame = svgDoc.querySelector('#content-frame');
        if (!frame) return;

        const baseX = 10;
        const baseWidth = 166;
        const frameBottom = 226;
        const cornerRadius = 4;

        // Use current frameTop if not provided
        if (!frameTop) {
            frameTop = parseFloat(document.getElementById('boxart-frame-top')?.value || 20);
        }

        // Inset the content frame by the stripe border width
        frame.setAttribute('x', baseX + inset);
        frame.setAttribute('y', frameTop + inset);
        frame.setAttribute('width', baseWidth - inset * 2);
        frame.setAttribute('height', frameBottom - frameTop - inset * 2);
        frame.setAttribute('rx', Math.max(0, cornerRadius - inset));
        frame.setAttribute('ry', Math.max(0, cornerRadius - inset));

        // Keep the clip path at the BASE position (outer frame boundary)
        // so artwork can fill the entire content area including under stripes
        const clipRect = svgDoc.querySelector('#content-frame-clip rect');
        if (clipRect) {
            clipRect.setAttribute('x', baseX);
            clipRect.setAttribute('y', frameTop);
            clipRect.setAttribute('width', baseWidth);
            clipRect.setAttribute('height', frameBottom - frameTop);
            clipRect.setAttribute('rx', cornerRadius);
            clipRect.setAttribute('ry', cornerRadius);
        }
    }

    /**
     * Update content frame fill color
     */
    static updateFrameFill() {
        const color = document.getElementById('boxart-frame-fill')?.value || '#FFFFFF';
        const svgDoc = appState.getBoxArtSvgDoc();
        const frame = svgDoc?.querySelector('#content-frame');

        if (frame) {
            frame.setAttribute('fill', color);
            BoxArtEditor.refreshPreview();
        }
    }

    /**
     * Handle artwork upload
     * @param {Event} event - File input change event
     */
    static handleArtworkUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const dataURL = e.target.result;
            appState.setBoxArtArtworkData(dataURL);

            // Show artwork controls
            document.getElementById('boxart-artwork-controls').style.display = 'block';

            // Reset controls to defaults
            document.getElementById('boxart-art-x').value = 0;
            document.getElementById('boxart-art-y').value = 0;
            document.getElementById('boxart-art-scale').value = 1;
            document.getElementById('boxart-art-opacity').value = 1;
            document.getElementById('boxart-art-x-value').textContent = '0';
            document.getElementById('boxart-art-y-value').textContent = '0';
            document.getElementById('boxart-art-scale-value').textContent = '100';
            document.getElementById('boxart-art-opacity-value').textContent = '100';

            appState.setBoxArtArtworkPosition(0, 0);
            appState.setBoxArtArtworkScale(1.0);
            appState.setBoxArtArtworkOpacity(1.0);

            BoxArtEditor.insertArtwork(dataURL);
            BoxArtEditor.showStatus('Artwork uploaded successfully', 'success');
        };
        reader.readAsDataURL(file);
    }

    /**
     * Insert artwork into the SVG
     * @param {string} dataURL - Image data URL
     */
    static insertArtwork(dataURL) {
        const svgDoc = appState.getBoxArtSvgDoc();
        if (!svgDoc) return;

        const svgNS = 'http://www.w3.org/2000/svg';
        const xlinkNS = 'http://www.w3.org/1999/xlink';

        // Remove existing artwork
        const existing = svgDoc.querySelector('#boxart-main-artwork');
        if (existing) {
            existing.remove();
        }

        // Get position and transforms
        const position = appState.getBoxArtArtworkPosition();
        const scale = appState.getBoxArtArtworkScale();
        const opacity = appState.getBoxArtArtworkOpacity();

        // Create image element
        const image = document.createElementNS(svgNS, 'image');
        image.setAttribute('id', 'boxart-main-artwork');
        image.setAttributeNS(xlinkNS, 'xlink:href', dataURL);

        // Get current content frame dimensions (may have been adjusted)
        const frameTopY = parseFloat(document.getElementById('boxart-frame-top')?.value || 20);
        const frameX = 10;
        const frameY = frameTopY;
        const frameWidth = 166;
        const bottomY = 226;
        const frameHeight = bottomY - frameTopY;
        const centerX = frameX + frameWidth / 2;  // 93
        const centerY = frameY + frameHeight / 2;

        // Calculate artwork dimensions based on scale
        const artWidth = frameWidth * scale;
        const artHeight = frameHeight * scale;

        // Position artwork centered, then apply user offset
        const artX = centerX - (artWidth / 2) + position.x;
        const artY = centerY - (artHeight / 2) + position.y;

        image.setAttribute('x', artX.toString());
        image.setAttribute('y', artY.toString());
        image.setAttribute('width', artWidth.toString());
        image.setAttribute('height', artHeight.toString());
        image.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        image.setAttribute('opacity', opacity.toString());

        // Clip artwork to content frame
        image.setAttribute('clip-path', 'url(#content-frame-clip)');

        // Insert into artwork-layer (after placeholder elements)
        // This ensures artwork is below stripes, vignette, and title layers
        const artworkLayer = svgDoc.querySelector('#artwork-layer');
        if (artworkLayer) {
            artworkLayer.appendChild(image);
        }

        BoxArtEditor.refreshPreview();
    }

    /**
     * Update artwork from controls
     */
    static updateArtwork() {
        const x = parseFloat(document.getElementById('boxart-art-x')?.value || 0);
        const y = parseFloat(document.getElementById('boxart-art-y')?.value || 0);
        const scale = parseFloat(document.getElementById('boxart-art-scale')?.value || 1);
        const opacity = parseFloat(document.getElementById('boxart-art-opacity')?.value || 1);

        // Update display values
        document.getElementById('boxart-art-x-value').textContent = x;
        document.getElementById('boxart-art-y-value').textContent = y;
        document.getElementById('boxart-art-scale-value').textContent = Math.round(scale * 100);
        document.getElementById('boxart-art-opacity-value').textContent = Math.round(opacity * 100);

        // Update state
        appState.setBoxArtArtworkPosition(x, y);
        appState.setBoxArtArtworkScale(scale);
        appState.setBoxArtArtworkOpacity(opacity);

        // Re-insert artwork with new transforms
        const dataURL = appState.getBoxArtArtworkData();
        if (dataURL) {
            BoxArtEditor.insertArtwork(dataURL);
        }
    }

    /**
     * Clear artwork
     */
    static clearArtwork() {
        const svgDoc = appState.getBoxArtSvgDoc();
        const artwork = svgDoc?.querySelector('#boxart-main-artwork');
        if (artwork) {
            artwork.remove();
        }

        appState.setBoxArtArtworkData(null);
        appState.setBoxArtArtworkPosition(0, 0);
        appState.setBoxArtArtworkScale(1.0);
        appState.setBoxArtArtworkOpacity(1.0);

        document.getElementById('boxart-artwork-controls').style.display = 'none';
        document.getElementById('boxart-artwork-upload').value = '';

        BoxArtEditor.refreshPreview();
        BoxArtEditor.showStatus('Artwork cleared', 'success');
    }

    /**
     * Toggle vignette visibility
     */
    static toggleVignette() {
        const enabled = document.getElementById('boxart-vignette-enabled')?.checked || false;
        appState.setBoxArtVignetteEnabled(enabled);

        const svgDoc = appState.getBoxArtSvgDoc();
        const vignetteLayer = svgDoc?.querySelector('#vignette-layer');

        if (vignetteLayer) {
            vignetteLayer.style.display = enabled ? '' : 'none';
        }

        // Show/hide vignette controls
        document.getElementById('boxart-vignette-controls').style.display = enabled ? 'block' : 'none';

        BoxArtEditor.refreshPreview();
    }

    /**
     * Update vignette size with aspect ratio lock support
     * @param {string} changedAxis - Which axis was changed ('rx' or 'ry')
     */
    static updateVignetteSize(changedAxis) {
        const lockRatio = document.getElementById('boxart-vignette-lock-ratio')?.checked || false;
        const rxInput = document.getElementById('boxart-vignette-rx');
        const ryInput = document.getElementById('boxart-vignette-ry');

        if (lockRatio && rxInput && ryInput) {
            // When locked, sync the other value to match
            if (changedAxis === 'rx') {
                ryInput.value = rxInput.value;
            } else if (changedAxis === 'ry') {
                rxInput.value = ryInput.value;
            }
        }

        // Now call the regular update
        BoxArtEditor.updateVignette();
    }

    /**
     * Update vignette from controls
     */
    static updateVignette() {
        const x = parseFloat(document.getElementById('boxart-vignette-x')?.value || 93);
        const y = parseFloat(document.getElementById('boxart-vignette-y')?.value || 165);
        const rx = parseFloat(document.getElementById('boxart-vignette-rx')?.value || 65);
        const ry = parseFloat(document.getElementById('boxart-vignette-ry')?.value || 55);
        const strokeColor = document.getElementById('boxart-vignette-stroke-color')?.value || '#666666';
        const strokeWidth = parseFloat(document.getElementById('boxart-vignette-stroke-width')?.value || 2);

        // Inner circle settings
        const innerEnabled = document.getElementById('boxart-vignette-inner-enabled')?.checked || false;
        const innerColor = document.getElementById('boxart-vignette-inner-color')?.value || '#999999';
        const innerWidth = parseFloat(document.getElementById('boxart-vignette-inner-width')?.value || 1);
        const innerOffset = parseFloat(document.getElementById('boxart-vignette-inner-offset')?.value || 3);

        // Update display values
        document.getElementById('boxart-vignette-x-value').textContent = x;
        document.getElementById('boxart-vignette-y-value').textContent = y;
        document.getElementById('boxart-vignette-rx-value').textContent = rx;
        document.getElementById('boxart-vignette-ry-value').textContent = ry;
        document.getElementById('boxart-vignette-stroke-width-value').textContent = strokeWidth;

        // Update inner circle display values
        const innerWidthValue = document.getElementById('boxart-vignette-inner-width-value');
        const innerOffsetValue = document.getElementById('boxart-vignette-inner-offset-value');
        if (innerWidthValue) innerWidthValue.textContent = innerWidth;
        if (innerOffsetValue) innerOffsetValue.textContent = innerOffset;

        // Show/hide inner circle controls
        const innerControls = document.getElementById('boxart-vignette-inner-controls');
        if (innerControls) {
            innerControls.style.display = innerEnabled ? 'block' : 'none';
        }

        // Update state
        appState.setBoxArtVignettePosition(x, y);
        appState.setBoxArtVignetteSize(rx, ry);
        appState.setBoxArtVignetteStrokeColor(strokeColor);
        appState.setBoxArtVignetteStrokeWidth(strokeWidth);

        // Update SVG elements
        const svgDoc = appState.getBoxArtSvgDoc();
        const outerEllipse = svgDoc?.querySelector('#vignette-outer');
        const innerEllipse = svgDoc?.querySelector('#vignette-inner');
        const clipEllipse = svgDoc?.querySelector('#vignette-clip-shape');

        if (outerEllipse) {
            outerEllipse.setAttribute('cx', x);
            outerEllipse.setAttribute('cy', y);
            outerEllipse.setAttribute('rx', rx);
            outerEllipse.setAttribute('ry', ry);
            outerEllipse.setAttribute('stroke', strokeColor);
            outerEllipse.setAttribute('stroke-width', strokeWidth);
        }

        // Update inner circle if enabled
        if (innerEllipse) {
            if (innerEnabled) {
                innerEllipse.style.display = '';
                // Inner circle is positioned inside the outer circle with the specified gap
                const innerRx = rx - innerOffset;
                const innerRy = ry - innerOffset;
                innerEllipse.setAttribute('cx', x);
                innerEllipse.setAttribute('cy', y);
                innerEllipse.setAttribute('rx', innerRx);
                innerEllipse.setAttribute('ry', innerRy);
                innerEllipse.setAttribute('stroke', innerColor);
                innerEllipse.setAttribute('stroke-width', innerWidth);
            } else {
                innerEllipse.style.display = 'none';
            }
        }

        // Update clip path to align with inner edge of the innermost visible stroke
        // If inner circle enabled, clip to that; otherwise clip to outer circle edge
        if (clipEllipse) {
            clipEllipse.setAttribute('cx', x);
            clipEllipse.setAttribute('cy', y);
            if (innerEnabled) {
                // Clip to inner edge of inner circle
                const innerRx = rx - innerOffset;
                const innerRy = ry - innerOffset;
                clipEllipse.setAttribute('rx', innerRx - (innerWidth / 2));
                clipEllipse.setAttribute('ry', innerRy - (innerWidth / 2));
            } else {
                // Clip to inner edge of outer circle
                clipEllipse.setAttribute('rx', rx - (strokeWidth / 2));
                clipEllipse.setAttribute('ry', ry - (strokeWidth / 2));
            }
        }

        // Re-insert vignette artwork if it exists (to update position and clip path)
        const vignetteArtData = appState.getBoxArtVignetteArtworkData?.() || appState._boxArtVignetteArtworkData;
        if (vignetteArtData) {
            BoxArtEditor.insertVignetteArtwork(vignetteArtData);
        }

        BoxArtEditor.refreshPreview();
    }

    /**
     * Handle vignette artwork upload
     * @param {Event} event - File input change event
     */
    static handleVignetteArtworkUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const dataURL = e.target.result;
            // Store original data for reprocessing
            appState.setBoxArtVignetteArtworkOriginal?.(dataURL) || (appState._boxArtVignetteArtworkOriginal = dataURL);
            appState.setBoxArtVignetteArtworkData?.(dataURL) || (appState._boxArtVignetteArtworkData = dataURL);

            // Show artwork controls
            document.getElementById('boxart-vignette-artwork-controls').style.display = 'block';

            // Reset controls to defaults
            document.getElementById('boxart-vignette-art-x').value = 0;
            document.getElementById('boxart-vignette-art-y').value = 0;
            document.getElementById('boxart-vignette-art-scale').value = 1;
            document.getElementById('boxart-vignette-art-opacity').value = 1;
            document.getElementById('boxart-vignette-art-rotation').value = 0;
            document.getElementById('boxart-vignette-art-x-value').textContent = '0';
            document.getElementById('boxart-vignette-art-y-value').textContent = '0';
            document.getElementById('boxart-vignette-art-scale-value').textContent = '100';
            document.getElementById('boxart-vignette-art-opacity-value').textContent = '100';
            document.getElementById('boxart-vignette-art-rotation-value').textContent = '0';
            document.getElementById('boxart-vignette-art-remove-white').checked = false;
            document.getElementById('boxart-vignette-art-threshold-control').style.display = 'none';

            BoxArtEditor.insertVignetteArtwork(dataURL);
            BoxArtEditor.showStatus('Vignette artwork uploaded', 'success');
        };
        reader.readAsDataURL(file);
    }

    /**
     * Insert vignette artwork into the SVG
     * @param {string} dataURL - Image data URL
     */
    static insertVignetteArtwork(dataURL) {
        const svgDoc = appState.getBoxArtSvgDoc();
        if (!svgDoc) return;

        const svgNS = 'http://www.w3.org/2000/svg';
        const xlinkNS = 'http://www.w3.org/1999/xlink';

        // Remove existing vignette artwork
        const existing = svgDoc.querySelector('#boxart-vignette-artwork');
        if (existing) {
            existing.remove();
        }

        // Get control values
        const x = parseFloat(document.getElementById('boxart-vignette-art-x')?.value || 0);
        const y = parseFloat(document.getElementById('boxart-vignette-art-y')?.value || 0);
        const scale = parseFloat(document.getElementById('boxart-vignette-art-scale')?.value || 1);
        const opacity = parseFloat(document.getElementById('boxart-vignette-art-opacity')?.value || 1);
        const rotation = parseFloat(document.getElementById('boxart-vignette-art-rotation')?.value || 0);

        // Get vignette center and size from current frame settings
        const vignetteX = parseFloat(document.getElementById('boxart-vignette-x')?.value || 93);
        const vignetteY = parseFloat(document.getElementById('boxart-vignette-y')?.value || 136);
        const vignetteRx = parseFloat(document.getElementById('boxart-vignette-rx')?.value || 65);
        const vignetteRy = parseFloat(document.getElementById('boxart-vignette-ry')?.value || 65);

        // Create image element
        const image = document.createElementNS(svgNS, 'image');
        image.setAttribute('id', 'boxart-vignette-artwork');
        image.setAttributeNS(xlinkNS, 'xlink:href', dataURL);

        // Calculate artwork dimensions - fit to vignette bounds
        const artWidth = (vignetteRx * 2) * scale;
        const artHeight = (vignetteRy * 2) * scale;

        // Position artwork centered on vignette, then apply offset
        const artX = vignetteX - (artWidth / 2) + x;
        const artY = vignetteY - (artHeight / 2) + y;

        image.setAttribute('x', artX.toString());
        image.setAttribute('y', artY.toString());
        image.setAttribute('width', artWidth.toString());
        image.setAttribute('height', artHeight.toString());
        image.setAttribute('preserveAspectRatio', 'xMidYMid slice');
        image.setAttribute('opacity', opacity.toString());

        // Apply rotation around vignette center
        if (rotation !== 0) {
            image.setAttribute('transform', `rotate(${rotation} ${vignetteX} ${vignetteY})`);
        }

        // Clip artwork to vignette frame
        image.setAttribute('clip-path', 'url(#vignette-clip)');

        // Insert into vignette layer, before the ellipses
        const vignetteLayer = svgDoc.querySelector('#vignette-layer');
        const outerEllipse = svgDoc.querySelector('#vignette-outer');
        if (vignetteLayer && outerEllipse) {
            vignetteLayer.insertBefore(image, outerEllipse);
        }

        BoxArtEditor.refreshPreview();
    }

    /**
     * Update vignette artwork from controls
     */
    static updateVignetteArtwork() {
        const x = parseFloat(document.getElementById('boxart-vignette-art-x')?.value || 0);
        const y = parseFloat(document.getElementById('boxart-vignette-art-y')?.value || 0);
        const scale = parseFloat(document.getElementById('boxart-vignette-art-scale')?.value || 1);
        const opacity = parseFloat(document.getElementById('boxart-vignette-art-opacity')?.value || 1);
        const rotation = parseFloat(document.getElementById('boxart-vignette-art-rotation')?.value || 0);

        // Update display values
        document.getElementById('boxart-vignette-art-x-value').textContent = x;
        document.getElementById('boxart-vignette-art-y-value').textContent = y;
        document.getElementById('boxart-vignette-art-scale-value').textContent = Math.round(scale * 100);
        document.getElementById('boxart-vignette-art-opacity-value').textContent = Math.round(opacity * 100);
        document.getElementById('boxart-vignette-art-rotation-value').textContent = rotation;

        // Re-insert artwork with new transforms
        const dataURL = appState.getBoxArtVignetteArtworkData?.() || appState._boxArtVignetteArtworkData;
        if (dataURL) {
            BoxArtEditor.insertVignetteArtwork(dataURL);
        }
    }

    /**
     * Reprocess vignette artwork (for white removal)
     */
    static async reprocessVignetteArtwork() {
        const removeWhite = document.getElementById('boxart-vignette-art-remove-white')?.checked || false;
        const threshold = parseInt(document.getElementById('boxart-vignette-art-threshold')?.value || 245);

        // Update threshold display
        document.getElementById('boxart-vignette-art-threshold-value').textContent = threshold;

        // Show/hide threshold control
        document.getElementById('boxart-vignette-art-threshold-control').style.display = removeWhite ? 'block' : 'none';

        // Get original image data
        const originalData = appState.getBoxArtVignetteArtworkOriginal?.() || appState._boxArtVignetteArtworkOriginal;
        if (!originalData) return;

        if (removeWhite) {
            // Process image to remove white
            const { ImageProcessor } = await import('./imageProcessor.js');
            const processedData = await ImageProcessor.removeWhiteBackground(originalData, threshold);
            appState.setBoxArtVignetteArtworkData?.(processedData) || (appState._boxArtVignetteArtworkData = processedData);
            BoxArtEditor.insertVignetteArtwork(processedData);
        } else {
            // Use original data
            appState.setBoxArtVignetteArtworkData?.(originalData) || (appState._boxArtVignetteArtworkData = originalData);
            BoxArtEditor.insertVignetteArtwork(originalData);
        }
    }

    /**
     * Move vignette artwork X position
     * @param {number} delta - Amount to move
     */
    static moveVignetteArtworkX(delta) {
        const input = document.getElementById('boxart-vignette-art-x');
        const current = parseFloat(input.value || 0);
        const newVal = Math.max(-50, Math.min(50, current + delta));
        input.value = newVal;
        BoxArtEditor.updateVignetteArtwork();
    }

    /**
     * Move vignette artwork Y position
     * @param {number} delta - Amount to move
     */
    static moveVignetteArtworkY(delta) {
        const input = document.getElementById('boxart-vignette-art-y');
        const current = parseFloat(input.value || 0);
        const newVal = Math.max(-50, Math.min(50, current + delta));
        input.value = newVal;
        BoxArtEditor.updateVignetteArtwork();
    }

    /**
     * Scale vignette artwork
     * @param {number} delta - Amount to scale
     */
    static scaleVignetteArtwork(delta) {
        const input = document.getElementById('boxart-vignette-art-scale');
        const current = parseFloat(input.value || 1);
        const newVal = Math.max(0.2, Math.min(3.0, current + delta));
        input.value = newVal;
        BoxArtEditor.updateVignetteArtwork();
    }

    /**
     * Rotate vignette artwork
     * @param {number} delta - Amount to rotate in degrees
     */
    static rotateVignetteArtwork(delta) {
        const input = document.getElementById('boxart-vignette-art-rotation');
        const current = parseFloat(input.value || 0);
        let newVal = current + delta;
        // Wrap around at -180/180
        if (newVal > 180) newVal -= 360;
        if (newVal < -180) newVal += 360;
        input.value = newVal;
        BoxArtEditor.updateVignetteArtwork();
    }

    /**
     * Clear vignette artwork
     */
    static clearVignetteArtwork() {
        const svgDoc = appState.getBoxArtSvgDoc();
        const artwork = svgDoc?.querySelector('#boxart-vignette-artwork');
        if (artwork) {
            artwork.remove();
        }

        // Clear state
        appState.setBoxArtVignetteArtworkData?.(null) || (appState._boxArtVignetteArtworkData = null);
        appState.setBoxArtVignetteArtworkOriginal?.(null) || (appState._boxArtVignetteArtworkOriginal = null);

        // Hide controls and reset upload
        document.getElementById('boxart-vignette-artwork-controls').style.display = 'none';
        document.getElementById('boxart-vignette-artwork-upload').value = '';

        BoxArtEditor.refreshPreview();
        BoxArtEditor.showStatus('Vignette artwork cleared', 'success');
    }

    /**
     * Toggle voice badge
     */
    static toggleVoiceBadge() {
        const enabled = document.getElementById('boxart-voice-badge')?.checked || false;
        const svgDoc = appState.getBoxArtSvgDoc();
        const badge = svgDoc?.querySelector('#voice-badge-area');

        if (badge) {
            badge.style.display = enabled ? '' : 'none';
        }

        BoxArtEditor.refreshPreview();
    }

    /**
     * Update player count badge
     */
    static updatePlayerCount() {
        const value = document.getElementById('boxart-player-count')?.value || '';
        const svgDoc = appState.getBoxArtSvgDoc();
        const badge = svgDoc?.querySelector('#player-badge-area');

        if (badge) {
            badge.style.display = value ? '' : 'none';
        }

        BoxArtEditor.refreshPreview();
    }

    /**
     * Refresh the preview
     */
    static refreshPreview() {
        const svgDoc = appState.getBoxArtSvgDoc();
        if (!svgDoc) return;

        const preview = document.getElementById('boxart-svg-preview');
        if (preview) {
            preview.innerHTML = '';
            const svgElement = svgDoc.documentElement.cloneNode(true);
            preview.appendChild(svgElement);
        }
    }

    /**
     * Reset box art editor
     */
    static reset() {
        appState.resetBoxArt();

        // Reset all controls to defaults using safe setters
        BoxArtEditor.setInputValue('boxart-brand-text', 'INTELLIVISION');
        BoxArtEditor.setInputValue('boxart-tagline', 'Intelligent Television');
        BoxArtEditor.setInputValue('boxart-header-color', '#1a1a6e');
        BoxArtEditor.setInputValue('boxart-title', 'GAME TITLE');
        BoxArtEditor.setInputValue('boxart-subtitle', 'by MATTEL ELECTRONICS');
        BoxArtEditor.setInputValue('boxart-title-color', '#ffffff');
        BoxArtEditor.setInputValue('boxart-title-size', 14);
        BoxArtEditor.setTextContent('boxart-title-size-value', '14');

        // Frame/stripe controls
        BoxArtEditor.setInputValue('boxart-frame-top', 20);
        BoxArtEditor.setTextContent('boxart-frame-top-value', '20');
        BoxArtEditor.setInputValue('boxart-stripe-count', '1');
        BoxArtEditor.setInputValue('boxart-stripe-width', 1);
        BoxArtEditor.setTextContent('boxart-stripe-width-value', '1');
        BoxArtEditor.setInputValue('boxart-stripe-line-color', '#808080');
        BoxArtEditor.setInputValue('boxart-stripe1-color', '#8B4513');
        BoxArtEditor.setInputValue('boxart-stripe2-color', '#D4AF37');
        BoxArtEditor.setInputValue('boxart-stripe3-color', '#228B22');
        BoxArtEditor.setInputValue('boxart-frame-fill', '#FFFFFF');
        BoxArtEditor.setCheckbox('boxart-stripes-ontop', true);

        // Hide stripe 2/3 controls
        const stripe23Controls = document.getElementById('boxart-stripe23-controls');
        if (stripe23Controls) stripe23Controls.style.display = 'none';

        // Vignette controls
        BoxArtEditor.setCheckbox('boxart-vignette-enabled', false);
        const vignetteControls = document.getElementById('boxart-vignette-controls');
        if (vignetteControls) vignetteControls.style.display = 'none';
        BoxArtEditor.setCheckbox('boxart-vignette-inner-enabled', false);
        const vignetteInnerControls = document.getElementById('boxart-vignette-inner-controls');
        if (vignetteInnerControls) vignetteInnerControls.style.display = 'none';
        BoxArtEditor.setInputValue('boxart-vignette-inner-color', '#999999');
        BoxArtEditor.setInputValue('boxart-vignette-inner-width', 1);
        BoxArtEditor.setInputValue('boxart-vignette-inner-offset', 3);

        // Artwork controls
        const artworkControls = document.getElementById('boxart-artwork-controls');
        if (artworkControls) artworkControls.style.display = 'none';
        const artworkUpload = document.getElementById('boxart-artwork-upload');
        if (artworkUpload) artworkUpload.value = '';

        // Badge controls
        BoxArtEditor.setCheckbox('boxart-voice-badge', false);
        BoxArtEditor.setInputValue('boxart-player-count', '');

        // Re-initialize
        BoxArtEditor.init();
        BoxArtEditor.showStatus('Box art reset to defaults', 'success');
    }

    /**
     * Collect all box art settings into a configuration object
     * @returns {Object} Box art configuration
     */
    static collectConfig() {
        return {
            version: '1.0',
            type: 'boxart',
            created: new Date().toISOString(),
            name: document.getElementById('boxart-title')?.value || 'Untitled Box Art',

            // Branding
            brand: {
                text: document.getElementById('boxart-brand-text')?.value || 'INTELLIVISION',
                font: document.getElementById('boxart-brand-font-select')?.value || '',
                size: parseFloat(document.getElementById('boxart-brand-size')?.value) || 12,
                color: document.getElementById('boxart-brand-color')?.value || '#FFFFFF',
                bold: document.getElementById('boxart-brand-bold')?.checked || false,
                italic: document.getElementById('boxart-brand-italic')?.checked || false,
                underline: document.getElementById('boxart-brand-underline')?.checked || false,
                x: parseFloat(document.getElementById('boxart-brand-x')?.value) || 12,
                y: parseFloat(document.getElementById('boxart-brand-y')?.value) || 11
            },

            // Tagline
            tagline: {
                text: document.getElementById('boxart-tagline')?.value || 'Intelligent Television',
                font: document.getElementById('boxart-tagline-font-select')?.value || '',
                size: parseFloat(document.getElementById('boxart-tagline-size')?.value) || 5,
                color: document.getElementById('boxart-tagline-color')?.value || '#FFFFFF',
                bold: document.getElementById('boxart-tagline-bold')?.checked || false,
                italic: document.getElementById('boxart-tagline-italic')?.checked || false,
                underline: document.getElementById('boxart-tagline-underline')?.checked || false,
                x: parseFloat(document.getElementById('boxart-tagline-x')?.value) || 118,
                y: parseFloat(document.getElementById('boxart-tagline-y')?.value) || 11
            },

            // Header/background
            header: {
                color: document.getElementById('boxart-header-color')?.value || '#1E3A8A'
            },

            // Title
            title: {
                text: document.getElementById('boxart-title')?.value || 'GAME TITLE',
                font: document.getElementById('boxart-title-font-select')?.value || '',
                size: parseFloat(document.getElementById('boxart-title-size')?.value) || 14,
                color: document.getElementById('boxart-title-color')?.value || '#333333',
                bold: document.getElementById('boxart-title-bold')?.checked || false,
                italic: document.getElementById('boxart-title-italic')?.checked || false,
                underline: document.getElementById('boxart-title-underline')?.checked || false,
                anchor: document.getElementById('boxart-title-anchor')?.value || 'middle',
                x: parseFloat(document.getElementById('boxart-title-x')?.value) || 93,
                y: parseFloat(document.getElementById('boxart-title-y')?.value) || 36
            },

            // Subtitle
            subtitle: {
                text: document.getElementById('boxart-subtitle')?.value || 'by MATTEL ELECTRONICS',
                font: document.getElementById('boxart-subtitle-font-select')?.value || '',
                size: parseFloat(document.getElementById('boxart-subtitle-size')?.value) || 4,
                color: document.getElementById('boxart-subtitle-color')?.value || '#666666',
                bold: document.getElementById('boxart-subtitle-bold')?.checked || false,
                italic: document.getElementById('boxart-subtitle-italic')?.checked || false,
                underline: document.getElementById('boxart-subtitle-underline')?.checked || false,
                anchor: document.getElementById('boxart-subtitle-anchor')?.value || 'middle',
                x: parseFloat(document.getElementById('boxart-subtitle-x')?.value) || 93,
                y: parseFloat(document.getElementById('boxart-subtitle-y')?.value) || 48
            },

            // Content frame
            frame: {
                color: document.getElementById('boxart-frame-color')?.value || '#8B4513',
                strokeWidth: parseFloat(document.getElementById('boxart-frame-stroke')?.value) || 1,
                fill: document.getElementById('boxart-frame-fill')?.value || '#FFFFFF',
                top: parseFloat(document.getElementById('boxart-frame-top')?.value) || 20
            },

            // Stripes
            stripes: {
                count: parseInt(document.getElementById('boxart-stripe-count')?.value) || 1,
                width: parseFloat(document.getElementById('boxart-stripe-width')?.value) || 3,
                lineColor: document.getElementById('boxart-stripe-line-color')?.value || '#333333',
                stripe1Color: document.getElementById('boxart-stripe1-color')?.value || '#8B4513',
                stripe2Color: document.getElementById('boxart-stripe2-color')?.value || '#D4AF37',
                stripe3Color: document.getElementById('boxart-stripe3-color')?.value || '#8B4513',
                alwaysOnTop: document.getElementById('boxart-stripes-ontop')?.checked ?? true
            },

            // Main artwork
            artwork: {
                hasImage: !!appState.getBoxArtArtworkData(),
                x: parseFloat(document.getElementById('boxart-art-x')?.value) || 0,
                y: parseFloat(document.getElementById('boxart-art-y')?.value) || 0,
                scale: parseFloat(document.getElementById('boxart-art-scale')?.value) || 1,
                opacity: parseFloat(document.getElementById('boxart-art-opacity')?.value) || 1
            },

            // Vignette
            vignette: {
                enabled: document.getElementById('boxart-vignette-enabled')?.checked || false,
                x: parseFloat(document.getElementById('boxart-vignette-x')?.value) || 93,
                y: parseFloat(document.getElementById('boxart-vignette-y')?.value) || 165,
                rx: parseFloat(document.getElementById('boxart-vignette-rx')?.value) || 65,
                ry: parseFloat(document.getElementById('boxart-vignette-ry')?.value) || 55,
                lockRatio: document.getElementById('boxart-vignette-lock-ratio')?.checked || false,
                strokeColor: document.getElementById('boxart-vignette-stroke-color')?.value || '#666666',
                strokeWidth: parseFloat(document.getElementById('boxart-vignette-stroke-width')?.value) || 2,
                // Inner circle settings
                innerEnabled: document.getElementById('boxart-vignette-inner-enabled')?.checked || false,
                innerColor: document.getElementById('boxart-vignette-inner-color')?.value || '#999999',
                innerWidth: parseFloat(document.getElementById('boxart-vignette-inner-width')?.value) || 1,
                innerOffset: parseFloat(document.getElementById('boxart-vignette-inner-offset')?.value) || 3
            },

            // Vignette artwork
            vignetteArtwork: {
                hasImage: !!(appState.getBoxArtVignetteArtworkData?.() || appState._boxArtVignetteArtworkData),
                x: parseFloat(document.getElementById('boxart-vignette-art-x')?.value) || 0,
                y: parseFloat(document.getElementById('boxart-vignette-art-y')?.value) || 0,
                scale: parseFloat(document.getElementById('boxart-vignette-art-scale')?.value) || 1,
                opacity: parseFloat(document.getElementById('boxart-vignette-art-opacity')?.value) || 1,
                rotation: parseFloat(document.getElementById('boxart-vignette-art-rotation')?.value) || 0,
                removeWhite: document.getElementById('boxart-vignette-art-remove-white')?.checked || false,
                threshold: parseInt(document.getElementById('boxart-vignette-art-threshold')?.value) || 245
            },

            // Badges
            badges: {
                voiceBadge: document.getElementById('boxart-voice-badge')?.checked || false,
                playerCount: document.getElementById('boxart-player-count')?.value || ''
            },

            // Export settings
            exportSettings: {
                includeTemplate: document.getElementById('boxart-export-include-template')?.checked || false
            }
        };
    }

    /**
     * Apply a configuration object to restore box art settings
     * @param {Object} config - Configuration object to apply
     */
    static async applyConfig(config) {
        await BoxArtEditor.applyConfigValues(config);
        await BoxArtEditor.triggerAllUpdates();
    }

    /**
     * Apply configuration values to UI controls (without triggering updates)
     * @param {Object} config - Configuration object to apply
     */
    static async applyConfigValues(config) {
        // Brand settings
        if (config.brand) {
            BoxArtEditor.setInputValue('boxart-brand-text', config.brand.text);
            BoxArtEditor.setSelectValue('boxart-brand-font-select', config.brand.font);
            BoxArtEditor.setInputValue('boxart-brand-size', config.brand.size);
            BoxArtEditor.setInputValue('boxart-brand-color', config.brand.color);
            BoxArtEditor.setCheckbox('boxart-brand-bold', config.brand.bold);
            BoxArtEditor.setCheckbox('boxart-brand-italic', config.brand.italic);
            BoxArtEditor.setCheckbox('boxart-brand-underline', config.brand.underline);
            BoxArtEditor.setInputValue('boxart-brand-x', config.brand.x);
            BoxArtEditor.setInputValue('boxart-brand-y', config.brand.y);
        }

        // Tagline settings
        if (config.tagline) {
            BoxArtEditor.setInputValue('boxart-tagline', config.tagline.text);
            BoxArtEditor.setSelectValue('boxart-tagline-font-select', config.tagline.font);
            BoxArtEditor.setInputValue('boxart-tagline-size', config.tagline.size);
            BoxArtEditor.setInputValue('boxart-tagline-color', config.tagline.color);
            BoxArtEditor.setCheckbox('boxart-tagline-bold', config.tagline.bold);
            BoxArtEditor.setCheckbox('boxart-tagline-italic', config.tagline.italic);
            BoxArtEditor.setCheckbox('boxart-tagline-underline', config.tagline.underline);
            BoxArtEditor.setInputValue('boxart-tagline-x', config.tagline.x);
            BoxArtEditor.setInputValue('boxart-tagline-y', config.tagline.y);
        }

        // Header settings
        if (config.header) {
            BoxArtEditor.setInputValue('boxart-header-color', config.header.color);
        }

        // Title settings
        if (config.title) {
            BoxArtEditor.setInputValue('boxart-title', config.title.text);
            BoxArtEditor.setSelectValue('boxart-title-font-select', config.title.font);
            BoxArtEditor.setInputValue('boxart-title-size', config.title.size);
            BoxArtEditor.setInputValue('boxart-title-color', config.title.color);
            BoxArtEditor.setCheckbox('boxart-title-bold', config.title.bold);
            BoxArtEditor.setCheckbox('boxart-title-italic', config.title.italic);
            BoxArtEditor.setCheckbox('boxart-title-underline', config.title.underline);
            BoxArtEditor.setSelectValue('boxart-title-anchor', config.title.anchor);
            BoxArtEditor.setInputValue('boxart-title-x', config.title.x);
            BoxArtEditor.setInputValue('boxart-title-y', config.title.y);
        }

        // Subtitle settings
        if (config.subtitle) {
            BoxArtEditor.setInputValue('boxart-subtitle', config.subtitle.text);
            BoxArtEditor.setSelectValue('boxart-subtitle-font-select', config.subtitle.font);
            BoxArtEditor.setInputValue('boxart-subtitle-size', config.subtitle.size);
            BoxArtEditor.setInputValue('boxart-subtitle-color', config.subtitle.color);
            BoxArtEditor.setCheckbox('boxart-subtitle-bold', config.subtitle.bold);
            BoxArtEditor.setCheckbox('boxart-subtitle-italic', config.subtitle.italic);
            BoxArtEditor.setCheckbox('boxart-subtitle-underline', config.subtitle.underline);
            BoxArtEditor.setSelectValue('boxart-subtitle-anchor', config.subtitle.anchor);
            BoxArtEditor.setInputValue('boxart-subtitle-x', config.subtitle.x);
            BoxArtEditor.setInputValue('boxart-subtitle-y', config.subtitle.y);
        }

        // Frame settings
        if (config.frame) {
            BoxArtEditor.setInputValue('boxart-frame-color', config.frame.color);
            BoxArtEditor.setInputValue('boxart-frame-stroke', config.frame.strokeWidth);
            BoxArtEditor.setInputValue('boxart-frame-fill', config.frame.fill);
            BoxArtEditor.setInputValue('boxart-frame-top', config.frame.top);
        }

        // Stripe settings
        if (config.stripes) {
            BoxArtEditor.setInputValue('boxart-stripe-count', config.stripes.count);
            BoxArtEditor.setInputValue('boxart-stripe-width', config.stripes.width);
            BoxArtEditor.setInputValue('boxart-stripe-line-color', config.stripes.lineColor);
            BoxArtEditor.setInputValue('boxart-stripe1-color', config.stripes.stripe1Color);
            BoxArtEditor.setInputValue('boxart-stripe2-color', config.stripes.stripe2Color);
            BoxArtEditor.setInputValue('boxart-stripe3-color', config.stripes.stripe3Color);
            BoxArtEditor.setCheckbox('boxart-stripes-ontop', config.stripes.alwaysOnTop ?? true);
        }

        // Main artwork settings (transforms only)
        if (config.artwork) {
            BoxArtEditor.setInputValue('boxart-art-x', config.artwork.x);
            BoxArtEditor.setInputValue('boxart-art-y', config.artwork.y);
            BoxArtEditor.setInputValue('boxart-art-scale', config.artwork.scale);
            BoxArtEditor.setInputValue('boxart-art-opacity', config.artwork.opacity);
        }

        // Vignette settings
        if (config.vignette) {
            BoxArtEditor.setCheckbox('boxart-vignette-enabled', config.vignette.enabled);
            BoxArtEditor.setInputValue('boxart-vignette-x', config.vignette.x);
            BoxArtEditor.setInputValue('boxart-vignette-y', config.vignette.y);
            BoxArtEditor.setInputValue('boxart-vignette-rx', config.vignette.rx);
            BoxArtEditor.setInputValue('boxart-vignette-ry', config.vignette.ry);
            BoxArtEditor.setCheckbox('boxart-vignette-lock-ratio', config.vignette.lockRatio);
            BoxArtEditor.setInputValue('boxart-vignette-stroke-color', config.vignette.strokeColor);
            BoxArtEditor.setInputValue('boxart-vignette-stroke-width', config.vignette.strokeWidth);
            // Inner circle settings
            BoxArtEditor.setCheckbox('boxart-vignette-inner-enabled', config.vignette.innerEnabled);
            BoxArtEditor.setInputValue('boxart-vignette-inner-color', config.vignette.innerColor);
            BoxArtEditor.setInputValue('boxart-vignette-inner-width', config.vignette.innerWidth);
            BoxArtEditor.setInputValue('boxart-vignette-inner-offset', config.vignette.innerOffset);
        }

        // Vignette artwork settings (transforms only)
        if (config.vignetteArtwork) {
            BoxArtEditor.setInputValue('boxart-vignette-art-x', config.vignetteArtwork.x);
            BoxArtEditor.setInputValue('boxart-vignette-art-y', config.vignetteArtwork.y);
            BoxArtEditor.setInputValue('boxart-vignette-art-scale', config.vignetteArtwork.scale);
            BoxArtEditor.setInputValue('boxart-vignette-art-opacity', config.vignetteArtwork.opacity);
            BoxArtEditor.setInputValue('boxart-vignette-art-rotation', config.vignetteArtwork.rotation);
            BoxArtEditor.setCheckbox('boxart-vignette-art-remove-white', config.vignetteArtwork.removeWhite);
            BoxArtEditor.setInputValue('boxart-vignette-art-threshold', config.vignetteArtwork.threshold);
        }

        // Badge settings
        if (config.badges) {
            BoxArtEditor.setCheckbox('boxart-voice-badge', config.badges.voiceBadge);
            BoxArtEditor.setInputValue('boxart-player-count', config.badges.playerCount);
        }

        // Export settings
        if (config.exportSettings) {
            BoxArtEditor.setCheckbox('boxart-export-include-template', config.exportSettings.includeTemplate);
        }
    }

    /**
     * Helper to set input value
     */
    static setInputValue(id, value) {
        const el = document.getElementById(id);
        if (el && value !== undefined && value !== null) {
            el.value = value;
        }
    }

    /**
     * Helper to set text content
     */
    static setTextContent(id, text) {
        const el = document.getElementById(id);
        if (el && text !== undefined && text !== null) {
            el.textContent = text;
        }
    }

    /**
     * Helper to set checkbox state
     */
    static setCheckbox(id, checked) {
        const el = document.getElementById(id);
        if (el && checked !== undefined) {
            el.checked = checked;
        }
    }

    /**
     * Helper to set select value
     */
    static setSelectValue(id, value) {
        const el = document.getElementById(id);
        if (el && value !== undefined && value !== null) {
            el.value = value;
        }
    }

    /**
     * Trigger all update functions to refresh the SVG
     */
    static async triggerAllUpdates() {
        // Brand updates
        BoxArtEditor.updateBrand();
        BoxArtEditor.updateBrandFont();
        BoxArtEditor.updateBrandSize();
        BoxArtEditor.updateBrandColor();
        BoxArtEditor.updateBrandStyle();
        BoxArtEditor.updateBrandPosition();

        // Tagline updates
        BoxArtEditor.updateTagline();
        BoxArtEditor.updateTaglineFont();
        BoxArtEditor.updateTaglineSize();
        BoxArtEditor.updateTaglineColor();
        BoxArtEditor.updateTaglineStyle();
        BoxArtEditor.updateTaglinePosition();

        // Header updates
        BoxArtEditor.updateHeaderColor();

        // Title updates
        BoxArtEditor.updateTitle();
        BoxArtEditor.updateTitleFont();
        BoxArtEditor.updateTitleSize();
        BoxArtEditor.updateTitleColor();
        BoxArtEditor.updateTitleStyle();
        BoxArtEditor.updateTitleAnchor();
        BoxArtEditor.updateTitlePosition();

        // Subtitle updates
        BoxArtEditor.updateSubtitle();
        BoxArtEditor.updateSubtitleFont();
        BoxArtEditor.updateSubtitleSize();
        BoxArtEditor.updateSubtitleColor();
        BoxArtEditor.updateSubtitleStyle();
        BoxArtEditor.updateSubtitleAnchor();
        BoxArtEditor.updateSubtitlePosition();

        // Frame updates
        BoxArtEditor.updateFrameColor();
        BoxArtEditor.updateFrameStroke();
        BoxArtEditor.updateFrameFill();
        BoxArtEditor.updateFrameTop();

        // Stripe updates
        BoxArtEditor.updateStripes();

        // Vignette updates
        BoxArtEditor.toggleVignette();
        BoxArtEditor.updateVignette();

        // Badge updates
        BoxArtEditor.toggleVoiceBadge();
        BoxArtEditor.updatePlayerCount();

        // Update display values
        BoxArtEditor.updateValueDisplays();
    }

    /**
     * Update the value display spans for sliders
     */
    static updateValueDisplays() {
        const displays = [
            ['boxart-brand-size', 'boxart-brand-size-value'],
            ['boxart-brand-x', 'boxart-brand-x-value'],
            ['boxart-brand-y', 'boxart-brand-y-value'],
            ['boxart-tagline-size', 'boxart-tagline-size-value'],
            ['boxart-tagline-x', 'boxart-tagline-x-value'],
            ['boxart-tagline-y', 'boxart-tagline-y-value'],
            ['boxart-title-size', 'boxart-title-size-value'],
            ['boxart-title-x', 'boxart-title-x-value'],
            ['boxart-title-y', 'boxart-title-y-value'],
            ['boxart-subtitle-size', 'boxart-subtitle-size-value'],
            ['boxart-subtitle-x', 'boxart-subtitle-x-value'],
            ['boxart-subtitle-y', 'boxart-subtitle-y-value'],
            ['boxart-frame-stroke', 'boxart-frame-stroke-value'],
            ['boxart-frame-top', 'boxart-frame-top-value'],
            ['boxart-stripe-width', 'boxart-stripe-width-value'],
            ['boxart-vignette-x', 'boxart-vignette-x-value'],
            ['boxart-vignette-y', 'boxart-vignette-y-value'],
            ['boxart-vignette-rx', 'boxart-vignette-rx-value'],
            ['boxart-vignette-ry', 'boxart-vignette-ry-value'],
            ['boxart-vignette-stroke-width', 'boxart-vignette-stroke-width-value'],
            ['boxart-vignette-inner-width', 'boxart-vignette-inner-width-value'],
            ['boxart-vignette-inner-offset', 'boxart-vignette-inner-offset-value']
        ];

        for (const [inputId, valueId] of displays) {
            const input = document.getElementById(inputId);
            const display = document.getElementById(valueId);
            if (input && display) {
                display.textContent = input.value;
            }
        }

        // Handle percentage displays
        const percentDisplays = [
            ['boxart-art-scale', 'boxart-art-scale-value'],
            ['boxart-art-opacity', 'boxart-art-opacity-value'],
            ['boxart-vignette-art-scale', 'boxart-vignette-art-scale-value'],
            ['boxart-vignette-art-opacity', 'boxart-vignette-art-opacity-value']
        ];

        for (const [inputId, valueId] of percentDisplays) {
            const input = document.getElementById(inputId);
            const display = document.getElementById(valueId);
            if (input && display) {
                display.textContent = Math.round(parseFloat(input.value) * 100);
            }
        }
    }

    /**
     * Convert a data URL to a Blob
     * @param {string} dataURL - Base64 data URL
     * @returns {Blob|null} Blob object or null if conversion fails
     */
    static dataURLtoBlob(dataURL) {
        if (!dataURL || !dataURL.startsWith('data:')) {
            return null;
        }

        try {
            const parts = dataURL.split(',');
            const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
            const bstr = atob(parts[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            return new Blob([u8arr], { type: mime });
        } catch (err) {
            console.error('Failed to convert data URL to blob:', err);
            return null;
        }
    }

    /**
     * Convert a Blob to a data URL
     * @param {Blob} blob - Blob to convert
     * @returns {Promise<string>} Data URL string
     */
    static blobToDataURL(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Sanitize a string for use as a filename
     * @param {string} name - Original name
     * @returns {string} Sanitized filename
     */
    static sanitizeFilename(name) {
        return name
            .replace(/[^a-z0-9]/gi, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '')
            .toLowerCase() || 'untitled';
    }

    /**
     * Export project as a ZIP file containing config.json and all artwork images
     */
    static async exportProject() {
        // Check if JSZip is available
        if (typeof JSZip === 'undefined') {
            console.error('JSZip library not loaded');
            BoxArtEditor.showStatus('Error: JSZip library not loaded', 'error');
            return;
        }

        const config = BoxArtEditor.collectConfig();
        const zip = new JSZip();

        // Add config.json
        const jsonString = JSON.stringify(config, null, 2);
        zip.file('config.json', jsonString);

        // Add main artwork if present
        const mainArtwork = appState.getBoxArtArtworkData();
        if (mainArtwork) {
            const imageData = BoxArtEditor.dataURLtoBlob(mainArtwork);
            if (imageData) {
                zip.file('main_artwork.png', imageData);
            }
        }

        // Add vignette artwork if present
        const vignetteArtwork = appState.getBoxArtVignetteArtworkOriginal?.() ||
                               appState._boxArtVignetteArtworkOriginal ||
                               appState.getBoxArtVignetteArtworkData?.() ||
                               appState._boxArtVignetteArtworkData;
        if (vignetteArtwork) {
            const imageData = BoxArtEditor.dataURLtoBlob(vignetteArtwork);
            if (imageData) {
                zip.file('vignette_artwork.png', imageData);
            }
        }

        // Generate ZIP and download
        try {
            const blob = await zip.generateAsync({ type: 'blob' });
            const filename = BoxArtEditor.sanitizeFilename(config.name) + '_boxart_project.zip';

            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);

            BoxArtEditor.showStatus('Project exported successfully', 'success');
            console.log('Exported box art project:', filename);
        } catch (err) {
            console.error('Failed to create ZIP file:', err);
            BoxArtEditor.showStatus('Failed to export project: ' + err.message, 'error');
        }
    }

    /**
     * Import project from a ZIP or JSON file
     */
    static async importProject() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.zip,.json,application/zip,application/json';

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                if (file.name.endsWith('.json')) {
                    // JSON-only import
                    const text = await file.text();
                    const config = JSON.parse(text);
                    if (!config.version) {
                        throw new Error('Invalid configuration file: missing version');
                    }
                    await BoxArtEditor.applyConfig(config);
                    console.log('Imported box art configuration (JSON):', file.name);
                } else if (file.name.endsWith('.zip')) {
                    // ZIP project import
                    await BoxArtEditor.importFromZip(file);
                } else {
                    throw new Error('Unsupported file type. Please use .zip or .json files.');
                }

                BoxArtEditor.showStatus(`Loaded project from ${file.name}`, 'success');
            } catch (err) {
                console.error('Failed to import project:', err);
                BoxArtEditor.showStatus('Failed to import: ' + err.message, 'error');
            }
        };

        input.click();
    }

    /**
     * Import project from a ZIP file
     * @param {File} file - ZIP file to import
     */
    static async importFromZip(file) {
        // Check if JSZip is available
        if (typeof JSZip === 'undefined') {
            throw new Error('JSZip library not loaded. Please refresh the page.');
        }

        const zip = await JSZip.loadAsync(file);

        // Load and parse config.json
        const configFile = zip.file('config.json');
        if (!configFile) {
            throw new Error('Invalid project file: missing config.json');
        }

        const configText = await configFile.async('text');
        const config = JSON.parse(configText);

        if (!config.version) {
            throw new Error('Invalid configuration: missing version');
        }

        // Reset box art state and load fresh SVG template (without applying default updates)
        appState.resetBoxArt();
        await BoxArtEditor.loadTemplate();

        // Apply the configuration (sets UI values but DON'T trigger updates yet)
        await BoxArtEditor.applyConfigValues(config);

        // Load main artwork if present
        const mainArtworkFile = zip.file('main_artwork.png');
        if (mainArtworkFile) {
            const blob = await mainArtworkFile.async('blob');
            const dataURL = await BoxArtEditor.blobToDataURL(blob);
            if (dataURL) {
                // Get artwork settings from config
                const artworkSettings = config.artwork || {};

                // Set artwork state
                appState.setBoxArtArtworkData(dataURL);
                appState.setBoxArtArtworkPosition(artworkSettings.x || 0, artworkSettings.y || 0);
                appState.setBoxArtArtworkScale(artworkSettings.scale || 1.0);
                appState.setBoxArtArtworkOpacity(artworkSettings.opacity || 1.0);

                // Show artwork controls
                document.getElementById('boxart-artwork-controls').style.display = 'block';

                // Update display values
                document.getElementById('boxart-art-x-value').textContent = artworkSettings.x || 0;
                document.getElementById('boxart-art-y-value').textContent = artworkSettings.y || 0;
                document.getElementById('boxart-art-scale-value').textContent = Math.round((artworkSettings.scale || 1) * 100);
                document.getElementById('boxart-art-opacity-value').textContent = Math.round((artworkSettings.opacity || 1) * 100);
            }
        }

        // Load vignette artwork if present
        const vignetteArtworkFile = zip.file('vignette_artwork.png');
        if (vignetteArtworkFile) {
            const blob = await vignetteArtworkFile.async('blob');
            const dataURL = await BoxArtEditor.blobToDataURL(blob);
            if (dataURL) {
                // Get artwork settings from config
                const artSettings = config.vignetteArtwork || {};

                // Store original and current data
                appState.setBoxArtVignetteArtworkOriginal?.(dataURL) || (appState._boxArtVignetteArtworkOriginal = dataURL);
                appState.setBoxArtVignetteArtworkData?.(dataURL) || (appState._boxArtVignetteArtworkData = dataURL);

                // Show artwork controls
                document.getElementById('boxart-vignette-artwork-controls').style.display = 'block';

                // Update display values
                document.getElementById('boxart-vignette-art-x-value').textContent = artSettings.x || 0;
                document.getElementById('boxart-vignette-art-y-value').textContent = artSettings.y || 0;
                document.getElementById('boxart-vignette-art-scale-value').textContent = Math.round((artSettings.scale || 1) * 100);
                document.getElementById('boxart-vignette-art-opacity-value').textContent = Math.round((artSettings.opacity || 1) * 100);
                document.getElementById('boxart-vignette-art-rotation-value').textContent = artSettings.rotation || 0;

                // Show/hide threshold control based on removeWhite setting
                document.getElementById('boxart-vignette-art-threshold-control').style.display =
                    artSettings.removeWhite ? 'block' : 'none';

                // If removeWhite is enabled, process the image
                if (artSettings.removeWhite) {
                    const { ImageProcessor } = await import('./imageProcessor.js');
                    const processedData = await ImageProcessor.removeWhiteBackground(dataURL, artSettings.threshold || 245);
                    appState.setBoxArtVignetteArtworkData?.(processedData) || (appState._boxArtVignetteArtworkData = processedData);
                }
            }
        }

        // Now trigger all updates AFTER artwork is loaded
        await BoxArtEditor.triggerAllUpdates();

        // Insert artwork into SVG (after updates so layer order is correct)
        const mainArtwork = appState.getBoxArtArtworkData();
        if (mainArtwork) {
            BoxArtEditor.insertArtwork(mainArtwork);
        }

        // Insert vignette artwork
        const vignetteArtwork = appState.getBoxArtVignetteArtworkData?.() || appState._boxArtVignetteArtworkData;
        if (vignetteArtwork) {
            BoxArtEditor.insertVignetteArtwork(vignetteArtwork);
        }

        // Final refresh to ensure everything is rendered
        BoxArtEditor.refreshPreview();

        console.log('Imported box art project (ZIP):', file.name);
    }

    /**
     * Export as PNG
     */
    static async exportPNG() {
        const svgDoc = appState.getBoxArtSvgDoc();
        if (!svgDoc) {
            BoxArtEditor.showStatus('No box art to export', 'error');
            return;
        }

        try {
            // Clone the SVG for export processing
            const exportCopy = svgDoc.documentElement.cloneNode(true);

            // Inline fonts in the SVG style block for proper rendering
            const styleEl = exportCopy.querySelector('style');
            if (styleEl) {
                styleEl.textContent = await ExportManager.inlineFontsInCSS(styleEl.textContent);
            }

            // Remove template guides if checkbox is unchecked
            const includeTemplate = document.getElementById('boxart-export-include-template')?.checked;
            if (!includeTemplate) {
                // Remove artwork placeholder rect and crosshairs
                const artworkLayer = exportCopy.querySelector('#artwork-layer');
                if (artworkLayer) {
                    // Remove placeholder rect
                    const placeholder = artworkLayer.querySelector('#background-artwork-placeholder');
                    if (placeholder) placeholder.remove();
                    // Remove crosshair lines
                    const lines = artworkLayer.querySelectorAll('line');
                    lines.forEach(line => line.remove());
                }

                // Remove title area boundary (dashed rect)
                const titleArea = exportCopy.querySelector('#title-area');
                if (titleArea) titleArea.remove();

                // Remove badge area placeholders
                const voiceBadge = exportCopy.querySelector('#voice-badge-area');
                if (voiceBadge) voiceBadge.remove();
                const playerBadge = exportCopy.querySelector('#player-badge-area');
                if (playerBadge) playerBadge.remove();

                // Remove outer border stroke (thin gray line around edge)
                const outerBorder = exportCopy.querySelector('#box-outer-border');
                if (outerBorder) outerBorder.remove();
            }

            const serializer = new XMLSerializer();
            const svgString = serializer.serializeToString(exportCopy);

            // Create a canvas and render SVG
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Box art dimensions at 300 DPI
            // 186mm x 256mm at 300 DPI (11.811 pixels/mm)
            const width = Math.round(186 * 11.811);
            const height = Math.round(256 * 11.811);

            canvas.width = width;
            canvas.height = height;

            const img = new Image();
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            img.onload = function() {
                ctx.drawImage(img, 0, 0, width, height);
                URL.revokeObjectURL(url);

                // Get game title for filename
                const gameTitle = document.getElementById('boxart-title')?.value || 'box_art';
                const filename = gameTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'box_art';

                // Download
                const link = document.createElement('a');
                link.download = `${filename}_box_art.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();

                BoxArtEditor.showStatus('PNG exported successfully', 'success');
            };

            img.onerror = function() {
                URL.revokeObjectURL(url);
                BoxArtEditor.showStatus('Failed to export PNG', 'error');
            };

            img.src = url;
        } catch (error) {
            console.error('Export error:', error);
            BoxArtEditor.showStatus('Failed to export PNG', 'error');
        }
    }
}

// Box art template loading functions (pre-made box art projects)
let boxartTemplatesLoaded = false;

window.toggleBoxArtTemplateDropdown = async function() {
    const menu = document.getElementById('boxart-template-dropdown-menu');
    const isVisible = menu.style.display !== 'none';

    if (isVisible) {
        menu.style.display = 'none';
    } else {
        menu.style.display = 'block';

        // Load templates list if not already loaded
        if (!boxartTemplatesLoaded) {
            await loadBoxArtTemplatesList();
        }
    }
};

async function loadBoxArtTemplatesList() {
    const listContainer = document.getElementById('boxart-template-list');

    try {
        const response = await fetch('/get_boxart_examples');
        if (!response.ok) throw new Error('Failed to load templates');

        const data = await response.json();
        const templates = data.examples || [];

        if (templates.length === 0) {
            listContainer.innerHTML = '<div style="padding: 8px 12px; color: #666; font-size: 12px;">No templates available</div>';
        } else {
            listContainer.innerHTML = templates.map(tpl =>
                `<div class="boxart-template-item" onclick="loadBoxArtTemplate('${tpl.name}')" style="padding: 8px 12px; cursor: pointer; font-size: 13px; transition: background 0.15s; color: #333;" onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background='transparent'">${tpl.displayName}</div>`
            ).join('');
        }
        boxartTemplatesLoaded = true;
    } catch (error) {
        console.error('Error loading box art templates:', error);
        listContainer.innerHTML = '<div style="padding: 8px 12px; color: #e74c3c; font-size: 12px;">Error loading templates</div>';
    }
}

window.loadBoxArtTemplate = async function(templateName) {
    // Close the dropdown
    document.getElementById('boxart-template-dropdown-menu').style.display = 'none';

    // Confirm with user
    if (!confirm(`Load the "${templateName.replace(/_/g, ' ')}" template? This will replace your current work.`)) {
        return;
    }

    try {
        // Reset box art to clean state
        BoxArtEditor.reset();

        const response = await fetch(`/get_boxart_example/${templateName}`);
        if (!response.ok) throw new Error('Failed to load template');

        const blob = await response.blob();
        const file = new File([blob], `${templateName}.zip`, { type: 'application/zip' });

        // Import the template
        await BoxArtEditor.importFromZip(file);

        BoxArtEditor.showStatus(`Loaded template: ${templateName.replace(/_/g, ' ')}`, 'success');
    } catch (error) {
        console.error('Error loading box art template:', error);
        BoxArtEditor.showStatus('Error loading template: ' + error.message, 'error');
    }
};

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.querySelector('.boxart-template-dropdown');
    const menu = document.getElementById('boxart-template-dropdown-menu');
    if (dropdown && menu && !dropdown.contains(event.target)) {
        menu.style.display = 'none';
    }
});
