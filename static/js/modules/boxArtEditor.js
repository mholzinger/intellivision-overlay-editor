/**
 * Box Art Editor Module
 * Handles the Intellivision box art creation and editing
 */

import { appState } from '../services/stateManager.js';
import { ExportManager } from './exportManager.js';

export class BoxArtEditor {
    /**
     * Initialize the box art editor
     */
    static async init() {
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
                }

                // Apply initial values from controls
                BoxArtEditor.updateBrand();
                BoxArtEditor.updateTagline();
                BoxArtEditor.updateTitle();
                BoxArtEditor.updateSubtitle();

                console.log('Box art editor initialized');
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

        const fontData = JSON.parse(fontValue);
        const family = fontData.family;
        const isSystem = fontData.type === 'system';

        // Update embedded font style in box art SVG
        let styleEl = svgDoc.querySelector('style');
        if (styleEl && !isSystem) {
            const fontFile = fontData.file;
            const fontFormat = fontFile.toLowerCase().endsWith('.otf') ? 'opentype' : 'truetype';
            // Append font-face if not already present
            if (!styleEl.textContent.includes(`font-family: '${family}'`)) {
                styleEl.textContent += `\n@font-face { font-family: '${family}'; src: url('/fonts/${fontFile}') format('${fontFormat}'); }`;
            }
        }

        brandElement.setAttribute('font-family', `'${family}', sans-serif`);
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

        const fontData = JSON.parse(fontValue);
        const family = fontData.family;
        const isSystem = fontData.type === 'system';

        let styleEl = svgDoc.querySelector('style');
        if (styleEl && !isSystem) {
            const fontFile = fontData.file;
            const fontFormat = fontFile.toLowerCase().endsWith('.otf') ? 'opentype' : 'truetype';
            if (!styleEl.textContent.includes(`font-family: '${family}'`)) {
                styleEl.textContent += `\n@font-face { font-family: '${family}'; src: url('/fonts/${fontFile}') format('${fontFormat}'); }`;
            }
        }

        taglineElement.setAttribute('font-family', `'${family}', sans-serif`);
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

        const fontData = JSON.parse(fontValue);
        const family = fontData.family;
        const isSystem = fontData.type === 'system';

        let styleEl = svgDoc.querySelector('style');
        if (styleEl && !isSystem) {
            const fontFile = fontData.file;
            const fontFormat = fontFile.toLowerCase().endsWith('.otf') ? 'opentype' : 'truetype';
            if (!styleEl.textContent.includes(`font-family: '${family}'`)) {
                styleEl.textContent += `\n@font-face { font-family: '${family}'; src: url('/fonts/${fontFile}') format('${fontFormat}'); }`;
            }
        }

        titleElement.setAttribute('font-family', `'${family}', sans-serif`);
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

        const fontData = JSON.parse(fontValue);
        const family = fontData.family;
        const isSystem = fontData.type === 'system';

        let styleEl = svgDoc.querySelector('style');
        if (styleEl && !isSystem) {
            const fontFile = fontData.file;
            const fontFormat = fontFile.toLowerCase().endsWith('.otf') ? 'opentype' : 'truetype';
            if (!styleEl.textContent.includes(`font-family: '${family}'`)) {
                styleEl.textContent += `\n@font-face { font-family: '${family}'; src: url('/fonts/${fontFile}') format('${fontFormat}'); }`;
            }
        }

        subtitleElement.setAttribute('font-family', `'${family}', sans-serif`);
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
        const color = document.getElementById('boxart-frame-color')?.value || '#8B4513';
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
        const width = parseFloat(document.getElementById('boxart-frame-stroke')?.value || 1);
        document.getElementById('boxart-frame-stroke-value').textContent = width;

        const svgDoc = appState.getBoxArtSvgDoc();
        const frame = svgDoc?.querySelector('#content-frame');

        if (frame) {
            frame.setAttribute('stroke-width', width);
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

        // Content frame dimensions: x=10, y=20, width=166, height=206
        // Center of content frame: cx=93, cy=123
        const frameX = 10;
        const frameY = 20;
        const frameWidth = 166;
        const frameHeight = 206;
        const centerX = frameX + frameWidth / 2;  // 93
        const centerY = frameY + frameHeight / 2; // 123

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

        // Insert BEFORE title-layer so title appears on top of artwork
        const titleLayer = svgDoc.querySelector('#title-layer');
        if (titleLayer && titleLayer.parentNode) {
            titleLayer.parentNode.insertBefore(image, titleLayer);
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
     * Update vignette from controls
     */
    static updateVignette() {
        const x = parseFloat(document.getElementById('boxart-vignette-x')?.value || 93);
        const y = parseFloat(document.getElementById('boxart-vignette-y')?.value || 165);
        const rx = parseFloat(document.getElementById('boxart-vignette-rx')?.value || 65);
        const ry = parseFloat(document.getElementById('boxart-vignette-ry')?.value || 55);
        const strokeColor = document.getElementById('boxart-vignette-stroke-color')?.value || '#666666';
        const strokeWidth = parseFloat(document.getElementById('boxart-vignette-stroke-width')?.value || 2);

        // Update display values
        document.getElementById('boxart-vignette-x-value').textContent = x;
        document.getElementById('boxart-vignette-y-value').textContent = y;
        document.getElementById('boxart-vignette-rx-value').textContent = rx;
        document.getElementById('boxart-vignette-ry-value').textContent = ry;
        document.getElementById('boxart-vignette-stroke-width-value').textContent = strokeWidth;

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

        if (innerEllipse) {
            innerEllipse.setAttribute('cx', x);
            innerEllipse.setAttribute('cy', y);
            innerEllipse.setAttribute('rx', rx - 3);  // Inner ring slightly smaller
            innerEllipse.setAttribute('ry', ry - 3);
        }

        if (clipEllipse) {
            clipEllipse.setAttribute('cx', x);
            clipEllipse.setAttribute('cy', y);
            clipEllipse.setAttribute('rx', rx - 5);
            clipEllipse.setAttribute('ry', ry - 5);
        }

        // Re-insert vignette artwork if it exists (to update clip path)
        const vignetteArtData = appState.getBoxArtVignetteArtworkData?.();
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

        // Reset all controls to defaults
        document.getElementById('boxart-brand-text').value = 'INTELLIVISION';
        document.getElementById('boxart-tagline').value = 'Intelligent Television';
        document.getElementById('boxart-header-color').value = '#1a1a6e';
        document.getElementById('boxart-title').value = 'GAME TITLE';
        document.getElementById('boxart-subtitle').value = 'by MATTEL ELECTRONICS';
        document.getElementById('boxart-title-color').value = '#ffffff';
        document.getElementById('boxart-title-size').value = 14;
        document.getElementById('boxart-title-size-value').textContent = '14';
        document.getElementById('boxart-frame-color').value = '#8B4513';
        document.getElementById('boxart-frame-stroke').value = 1;
        document.getElementById('boxart-frame-stroke-value').textContent = '1';
        document.getElementById('boxart-vignette-enabled').checked = false;
        document.getElementById('boxart-vignette-controls').style.display = 'none';
        document.getElementById('boxart-artwork-controls').style.display = 'none';
        document.getElementById('boxart-artwork-upload').value = '';
        document.getElementById('boxart-voice-badge').checked = false;
        document.getElementById('boxart-player-count').value = '';

        // Re-initialize
        BoxArtEditor.init();
        BoxArtEditor.showStatus('Box art reset to defaults', 'success');
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

                // Download
                const link = document.createElement('a');
                link.download = 'intellivision_box_art.png';
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
