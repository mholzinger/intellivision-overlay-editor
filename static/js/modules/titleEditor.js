/**
 * Title Editor Module
 * Handles title text editing and styling
 */

import { appState } from '../services/stateManager.js';
import { UIManager } from './uiManager.js';

// Default line spacing multiplier for multiline text
const DEFAULT_LINE_SPACING = 1.2;

// Title area dimension constants and limits
const TITLE_AREA_DEFAULTS = {
    x: 3.5,
    y: 2.4,
    width: 48.6,
    height: 11.5,
    // Limits based on overlay dimensions (55.6mm x 90.4mm)
    minX: 0.5,
    maxX: 10,
    minY: 0.5,
    maxY: 10,
    minWidth: 30,
    maxWidth: 54.6,  // Nearly full width minus small margin
    minHeight: 8,
    maxHeight: 22
};

export class TitleEditor {
    /**
     * Set multiline text content on an SVG text element using tspan elements
     * @param {SVGTextElement} textElement - The text element to update
     * @param {string} text - Text with | as line separator
     * @param {number} fontSize - Current font size for calculating line spacing
     */
    static setMultilineText(textElement, text, fontSize) {
        // Clear existing content
        textElement.textContent = '';

        const lines = text.split('|').map(line => line.trim());
        const lineSpacing = fontSize * DEFAULT_LINE_SPACING;

        // Calculate vertical offset to center multiple lines
        // For n lines, offset the first line upward by (n-1)/2 * lineSpacing
        const totalHeight = (lines.length - 1) * lineSpacing;
        const startOffset = -totalHeight / 2;

        lines.forEach((line, index) => {
            const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
            tspan.textContent = line;
            tspan.setAttribute('x', textElement.getAttribute('x'));

            if (index === 0) {
                // First line: apply centering offset
                tspan.setAttribute('dy', startOffset + 'px');
            } else {
                // Subsequent lines: move down by line spacing
                tspan.setAttribute('dy', lineSpacing + 'px');
            }

            textElement.appendChild(tspan);
        });
    }

    /**
     * Update title text
     */
    static updateTitle() {
        const title = document.getElementById('title').value;
        const svgDoc = appState.getSvgDoc();
        const titleElement = svgDoc?.querySelector('#title-text');
        const fontSize = parseFloat(document.getElementById('title-font-size')?.value || '2');

        if (titleElement) {
            TitleEditor.setMultilineText(titleElement, title, fontSize);
            titleElement.style.fill = UIManager.getTitleFillValue();
            titleElement.style.dominantBaseline = 'central';
        }
    }

    /**
     * Update title color (supports gradient)
     */
    static updateTitleColor() {
        const svgDoc = appState.getSvgDoc();
        const titleElement = svgDoc?.querySelector('#title-text');
        if (titleElement) {
            titleElement.style.fill = UIManager.getTitleFillValue();
        }
    }

    /**
     * Update title font size
     */
    static updateTitleSize() {
        const size = parseFloat(document.getElementById('title-font-size').value);
        document.getElementById('title-font-size-value').textContent = size;
        const svgDoc = appState.getSvgDoc();
        const titleElement = svgDoc?.querySelector('#title-text');
        const title = document.getElementById('title')?.value || '';

        if (titleElement) {
            // Re-render multiline text with new spacing
            TitleEditor.setMultilineText(titleElement, title, size);
            titleElement.style.fontSize = size + 'px';
            titleElement.style.fill = UIManager.getTitleFillValue();
            titleElement.style.dominantBaseline = 'central';

            // Apply position including offset
            TitleEditor.updateTitlePosition();
        }
    }

    /**
     * Update title position with X/Y offset
     */
    static updateTitlePosition() {
        const svgDoc = appState.getSvgDoc();
        const titleElement = svgDoc?.querySelector('#title-text');
        if (!titleElement) return;

        const offsetX = parseFloat(document.getElementById('title-offset-x')?.value || 0);
        const offsetY = parseFloat(document.getElementById('title-offset-y')?.value || 0);

        // Update display values
        document.getElementById('title-offset-x-value').textContent = offsetX.toFixed(1);
        document.getElementById('title-offset-y-value').textContent = offsetY.toFixed(1);

        // Base position: center of title box (x=27.8, y=7.75)
        const baseX = 27.8 + offsetX;
        const baseY = 7.75 + offsetY;

        titleElement.setAttribute('x', baseX.toFixed(2));
        titleElement.setAttribute('y', baseY.toFixed(2));

        // Update tspan x coordinates for multiline text
        titleElement.querySelectorAll('tspan').forEach(tspan => {
            tspan.setAttribute('x', baseX.toFixed(2));
        });
    }

    /**
     * Update title text style (bold, italic, underline)
     */
    static updateTitleStyle() {
        const svgDoc = appState.getSvgDoc();
        const titleElement = svgDoc?.querySelector('#title-text');
        if (!titleElement) return;

        const isBold = document.getElementById('title-bold')?.checked || false;
        const isItalic = document.getElementById('title-italic')?.checked || false;
        const isUnderline = document.getElementById('title-underline')?.checked || false;

        titleElement.style.fontWeight = isBold ? 'bold' : 'normal';
        titleElement.style.fontStyle = isItalic ? 'italic' : 'normal';
        titleElement.style.textDecoration = isUnderline ? 'underline' : 'none';
    }

    /**
     * Update title area X position
     */
    static updateTitleAreaX() {
        const slider = document.getElementById('title-area-x');
        if (!slider) return;

        const x = parseFloat(slider.value);
        const valueDisplay = document.getElementById('title-area-x-value');
        if (valueDisplay) valueDisplay.textContent = x.toFixed(1);

        appState.setTitleAreaX(x);
        TitleEditor.applyTitleAreaDimensions();
    }

    /**
     * Update title area Y position
     */
    static updateTitleAreaY() {
        const slider = document.getElementById('title-area-y');
        if (!slider) return;

        const y = parseFloat(slider.value);
        const valueDisplay = document.getElementById('title-area-y-value');
        if (valueDisplay) valueDisplay.textContent = y.toFixed(1);

        appState.setTitleAreaY(y);
        TitleEditor.applyTitleAreaDimensions();
    }

    /**
     * Update title area width
     */
    static updateTitleAreaWidth() {
        const slider = document.getElementById('title-area-width');
        if (!slider) return;

        const width = parseFloat(slider.value);
        const valueDisplay = document.getElementById('title-area-width-value');
        if (valueDisplay) valueDisplay.textContent = width.toFixed(1);

        appState.setTitleAreaWidth(width);
        TitleEditor.applyTitleAreaDimensions();
    }

    /**
     * Update title area height
     */
    static updateTitleAreaHeight() {
        const slider = document.getElementById('title-area-height');
        if (!slider) return;

        const height = parseFloat(slider.value);
        const valueDisplay = document.getElementById('title-area-height-value');
        if (valueDisplay) valueDisplay.textContent = height.toFixed(1);

        appState.setTitleAreaHeight(height);
        TitleEditor.applyTitleAreaDimensions();
    }

    /**
     * Apply all title area dimensions to the SVG elements
     * This is the core method that updates all related SVG elements
     */
    static applyTitleAreaDimensions() {
        const svgDoc = appState.getSvgDoc();
        if (!svgDoc) return;

        const dims = appState.getTitleAreaDimensions();
        const { x, y, width, height } = dims;

        // Update title background rect
        const titleBg = svgDoc.querySelector('#title-background');
        if (titleBg) {
            titleBg.setAttribute('x', x.toString());
            titleBg.setAttribute('y', y.toString());
            titleBg.setAttribute('width', width.toString());
            titleBg.setAttribute('height', height.toString());
        }

        // Update title border rect
        const titleBorder = svgDoc.querySelector('#title-border');
        if (titleBorder) {
            titleBorder.setAttribute('x', x.toString());
            titleBorder.setAttribute('y', y.toString());
            titleBorder.setAttribute('width', width.toString());
            titleBorder.setAttribute('height', height.toString());
        }

        // Update title artwork clip path if it exists
        const clipRect = svgDoc.querySelector('#title-artwork-clip rect');
        if (clipRect) {
            clipRect.setAttribute('x', x.toString());
            clipRect.setAttribute('y', y.toString());
            clipRect.setAttribute('width', width.toString());
            clipRect.setAttribute('height', height.toString());
        }

        // Update title artwork image dimensions if it exists
        const titleArtwork = svgDoc.querySelector('#custom-title-artwork');
        if (titleArtwork) {
            titleArtwork.setAttribute('x', x.toString());
            titleArtwork.setAttribute('y', y.toString());
            titleArtwork.setAttribute('width', width.toString());
            titleArtwork.setAttribute('height', height.toString());
        }

        // Update tiled artwork rect if it exists
        const tiledArtwork = svgDoc.querySelector('#custom-title-artwork-tiled');
        if (tiledArtwork) {
            tiledArtwork.setAttribute('x', x.toString());
            tiledArtwork.setAttribute('y', y.toString());
            tiledArtwork.setAttribute('width', width.toString());
            tiledArtwork.setAttribute('height', height.toString());
        }

        // Re-center title text within the new area
        TitleEditor.recenterTitleText();

        // Refresh title artwork if present (to recalculate transforms)
        const artworkData = appState.getTitleArtworkData();
        if (artworkData) {
            import('./titleArtwork.js').then(({ TitleArtwork }) => {
                TitleArtwork.insertTitleArtwork(artworkData);
            });
        }
    }

    /**
     * Recenter title text within the title area
     * Uses current dimensions from state
     */
    static recenterTitleText() {
        const svgDoc = appState.getSvgDoc();
        const titleElement = svgDoc?.querySelector('#title-text');
        if (!titleElement) return;

        const dims = appState.getTitleAreaDimensions();

        // Get current offset from UI
        const offsetX = parseFloat(document.getElementById('title-offset-x')?.value || 0);
        const offsetY = parseFloat(document.getElementById('title-offset-y')?.value || 0);

        // Calculate center of title area
        const centerX = dims.x + (dims.width / 2) + offsetX;
        const centerY = dims.y + (dims.height / 2) + offsetY;

        titleElement.setAttribute('x', centerX.toFixed(2));
        titleElement.setAttribute('y', centerY.toFixed(2));

        // Update tspan x coordinates for multiline text
        titleElement.querySelectorAll('tspan').forEach(tspan => {
            tspan.setAttribute('x', centerX.toFixed(2));
        });
    }

    /**
     * Reset title area to default dimensions
     */
    static resetTitleAreaDimensions() {
        appState.setTitleAreaDimensions({
            x: TITLE_AREA_DEFAULTS.x,
            y: TITLE_AREA_DEFAULTS.y,
            width: TITLE_AREA_DEFAULTS.width,
            height: TITLE_AREA_DEFAULTS.height
        });

        // Update UI sliders
        const xSlider = document.getElementById('title-area-x');
        const ySlider = document.getElementById('title-area-y');
        const widthSlider = document.getElementById('title-area-width');
        const heightSlider = document.getElementById('title-area-height');

        if (xSlider) xSlider.value = TITLE_AREA_DEFAULTS.x;
        if (ySlider) ySlider.value = TITLE_AREA_DEFAULTS.y;
        if (widthSlider) widthSlider.value = TITLE_AREA_DEFAULTS.width;
        if (heightSlider) heightSlider.value = TITLE_AREA_DEFAULTS.height;

        // Update value displays
        const xValue = document.getElementById('title-area-x-value');
        const yValue = document.getElementById('title-area-y-value');
        const widthValue = document.getElementById('title-area-width-value');
        const heightValue = document.getElementById('title-area-height-value');

        if (xValue) xValue.textContent = TITLE_AREA_DEFAULTS.x.toFixed(1);
        if (yValue) yValue.textContent = TITLE_AREA_DEFAULTS.y.toFixed(1);
        if (widthValue) widthValue.textContent = TITLE_AREA_DEFAULTS.width.toFixed(1);
        if (heightValue) heightValue.textContent = TITLE_AREA_DEFAULTS.height.toFixed(1);

        TitleEditor.applyTitleAreaDimensions();
    }

    /**
     * Get title area defaults
     * @returns {Object} Title area default dimensions
     */
    static getTitleAreaDefaults() {
        return TITLE_AREA_DEFAULTS;
    }

    /**
     * Update title background
     */
    static updateTitleBackground() {
        const enabled = document.getElementById('title-bg-enabled').checked;
        if (enabled) {
            TitleEditor.toggleTitleBackground();
        }
    }

    /**
     * Toggle title background visibility
     */
    static toggleTitleBackground() {
        const svgDoc = appState.getSvgDoc();
        const bgElement = svgDoc?.querySelector('#title-background');
        if (!bgElement) return;

        const enabled = document.getElementById('title-bg-enabled').checked;

        if (enabled) {
            bgElement.setAttribute('fill', UIManager.getTitleBgFillValue());
        } else {
            bgElement.setAttribute('fill', 'none');
        }
    }

    /**
     * Update copyright text
     */
    static updateCopyrightText() {
        const text = document.getElementById('copyright-input').value;
        const svgDoc = appState.getSvgDoc();
        const copyrightElement = svgDoc?.querySelector('#copyright-text');
        const fontSize = parseFloat(document.getElementById('copyright-font-size')?.value || '2');

        if (copyrightElement) {
            TitleEditor.setMultilineText(copyrightElement, text, fontSize);
            copyrightElement.style.dominantBaseline = 'central';
        }
    }

    /**
     * Update copyright text color (supports gradient)
     */
    static updateCopyrightColor() {
        const svgDoc = appState.getSvgDoc();
        const copyrightElement = svgDoc?.querySelector('#copyright-text');
        if (copyrightElement) {
            copyrightElement.style.fill = UIManager.getCopyrightFillValue();
        }
    }

    /**
     * Update copyright font size
     */
    static updateCopyrightSize() {
        const size = parseFloat(document.getElementById('copyright-font-size').value);
        document.getElementById('copyright-font-size-value').textContent = size;
        const svgDoc = appState.getSvgDoc();
        const copyrightElement = svgDoc?.querySelector('#copyright-text');
        const text = document.getElementById('copyright-input')?.value || '';

        if (copyrightElement) {
            // Re-render multiline text with new spacing
            TitleEditor.setMultilineText(copyrightElement, text, size);
            copyrightElement.style.fontSize = size + 'px';
            copyrightElement.style.dominantBaseline = 'central';

            // Apply position including offset
            TitleEditor.updateCopyrightPosition();
        }
    }

    /**
     * Update copyright position with X/Y offset
     */
    static updateCopyrightPosition() {
        const svgDoc = appState.getSvgDoc();
        const copyrightElement = svgDoc?.querySelector('#copyright-text');
        if (!copyrightElement) return;

        const offsetX = parseFloat(document.getElementById('copyright-offset-x')?.value || 0);
        const offsetY = parseFloat(document.getElementById('copyright-offset-y')?.value || 0);

        // Update display values
        document.getElementById('copyright-offset-x-value').textContent = offsetX.toFixed(1);
        document.getElementById('copyright-offset-y-value').textContent = offsetY.toFixed(1);

        // Base position: center below title (x=27.8, y=19.5)
        const baseX = 27.8 + offsetX;
        const baseY = 19.5 + offsetY;

        copyrightElement.setAttribute('x', baseX.toFixed(2));
        copyrightElement.setAttribute('y', baseY.toFixed(2));

        // Update tspan x coordinates for multiline text
        copyrightElement.querySelectorAll('tspan').forEach(tspan => {
            tspan.setAttribute('x', baseX.toFixed(2));
        });
    }

    /**
     * Update copyright text style (bold, italic, underline)
     */
    static updateCopyrightStyle() {
        const svgDoc = appState.getSvgDoc();
        const copyrightElement = svgDoc?.querySelector('#copyright-text');
        if (!copyrightElement) return;

        const isBold = document.getElementById('copyright-bold')?.checked || false;
        const isItalic = document.getElementById('copyright-italic')?.checked || false;
        const isUnderline = document.getElementById('copyright-underline')?.checked || false;

        copyrightElement.style.fontWeight = isBold ? 'bold' : 'normal';
        copyrightElement.style.fontStyle = isItalic ? 'italic' : 'normal';
        copyrightElement.style.textDecoration = isUnderline ? 'underline' : 'none';
    }
}
