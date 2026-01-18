/**
 * Row Descriptions Module
 * Handles row description text above each button row
 */

import { appState } from '../services/stateManager.js';
import { UIManager } from './uiManager.js';

// Default line spacing multiplier for multiline text
const DEFAULT_LINE_SPACING = 1.2;

export class RowDescriptions {
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
        const totalHeight = (lines.length - 1) * lineSpacing;
        const startOffset = -totalHeight / 2;

        lines.forEach((line, index) => {
            const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
            tspan.textContent = line;
            tspan.setAttribute('x', textElement.getAttribute('x'));

            if (index === 0) {
                tspan.setAttribute('dy', startOffset + 'px');
            } else {
                tspan.setAttribute('dy', lineSpacing + 'px');
            }

            textElement.appendChild(tspan);
        });
    }

    /**
     * Update a single row description
     * @param {number} rowNum - Row number (1-4)
     */
    static updateRowDescription(rowNum) {
        const input = document.getElementById(`row-desc-input-${rowNum}`);
        const value = input ? input.value : '';
        const svgDoc = appState.getSvgDoc();
        const textElement = svgDoc?.querySelector(`#row-desc-${rowNum}`);
        const fontSize = parseFloat(document.getElementById('row-desc-size')?.value || '2');

        if (textElement) {
            RowDescriptions.setMultilineText(textElement, value, fontSize);
            // Apply current styling
            RowDescriptions.applyRowDescStyling(textElement);
        }
    }

    /**
     * Apply styling to a row description element (supports gradient)
     * @param {SVGTextElement} textElement - The text element to style
     */
    static applyRowDescStyling(textElement) {
        const size = document.getElementById('row-desc-size')?.value || '2';
        const fontSelect = document.getElementById('row-desc-font-select');
        let fontFamily = 'Arial, sans-serif';

        if (fontSelect?.value) {
            try {
                const fontData = JSON.parse(fontSelect.value);
                fontFamily = fontData.family;
            } catch (e) {
                console.error('Error parsing row desc font:', e);
            }
        }

        textElement.style.fill = UIManager.getRowDescFillValue();
        textElement.style.fontSize = size + 'px';
        textElement.style.fontFamily = fontFamily;
        textElement.style.dominantBaseline = 'central';
    }

    /**
     * Update all row descriptions with current styling
     */
    static updateAllRowDescriptions() {
        const size = parseFloat(document.getElementById('row-desc-size')?.value || '2');
        const sizeDisplay = document.getElementById('row-desc-size-value');
        if (sizeDisplay) {
            sizeDisplay.textContent = size;
        }

        // Get position offsets
        const offsetX = parseFloat(document.getElementById('row-desc-offset-x')?.value || 0);
        const offsetY = parseFloat(document.getElementById('row-desc-offset-y')?.value || 0);

        // Update display values
        const xValueEl = document.getElementById('row-desc-offset-x-value');
        const yValueEl = document.getElementById('row-desc-offset-y-value');
        if (xValueEl) xValueEl.textContent = offsetX.toFixed(1);
        if (yValueEl) yValueEl.textContent = offsetY.toFixed(1);

        // Base row description positions (centered above each row)
        const rowPositions = {
            1: {x: 27.8, y: 24.5},
            2: {x: 27.8, y: 39.5},
            3: {x: 27.8, y: 54.5},
            4: {x: 27.8, y: 69.5}
        };

        const svgDoc = appState.getSvgDoc();
        if (!svgDoc) return;

        // Update all 4 row descriptions
        for (let i = 1; i <= 4; i++) {
            const textElement = svgDoc.querySelector(`#row-desc-${i}`);
            const input = document.getElementById(`row-desc-input-${i}`);
            if (textElement && input) {
                const pos = rowPositions[i];
                const newX = (pos.x + offsetX).toFixed(2);
                const newY = (pos.y + offsetY).toFixed(2);

                // Update position
                textElement.setAttribute('x', newX);
                textElement.setAttribute('y', newY);

                // Re-render multiline text with new spacing
                RowDescriptions.setMultilineText(textElement, input.value, size);

                // Update tspan x coordinates
                textElement.querySelectorAll('tspan').forEach(tspan => {
                    tspan.setAttribute('x', newX);
                });

                RowDescriptions.applyRowDescStyling(textElement);
            }
        }
    }

    /**
     * Update row description font based on selection
     */
    static updateRowDescFont() {
        const fontSelect = document.getElementById('row-desc-font-select');
        const fontValue = fontSelect?.value;
        const svgDoc = appState.getSvgDoc();

        if (!fontValue || !svgDoc) return;

        // Parse font data
        const fontData = JSON.parse(fontValue);
        const family = fontData.family;
        const isSystem = fontData.type === 'system';

        // Create or update embedded font style for row descriptions
        let styleEl = svgDoc.querySelector('#embedded-row-desc-font-style');
        if (!styleEl) {
            styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
            styleEl.setAttribute('id', 'embedded-row-desc-font-style');
            svgDoc.insertBefore(styleEl, svgDoc.firstChild);
        }

        if (isSystem) {
            styleEl.textContent = `.row-desc-text { font-family: "${family}" !important; }`;
        } else {
            const fontFile = fontData.file;
            const fontFormat = fontFile.toLowerCase().endsWith('.otf') ? 'opentype' : 'truetype';
            styleEl.textContent = `@font-face { font-family: "${family}"; src: url('/fonts/${fontFile}') format('${fontFormat}'); }\n.row-desc-text { font-family: "${family}" !important; }`;

            // Also load in browser for preview
            let headStyle = document.getElementById('preview-embedded-font-style');
            if (!headStyle) {
                headStyle = document.createElement('style');
                headStyle.id = 'preview-embedded-font-style';
                document.head.appendChild(headStyle);
            }
            if (!headStyle.textContent.includes(`font-family: "${family}"`)) {
                headStyle.textContent += `\n@font-face { font-family: "${family}"; src: url('/fonts/${fontFile}') format('${fontFormat}'); font-display: swap; }`;
            }
        }

        // Update all row descriptions with the new font
        RowDescriptions.updateAllRowDescriptions();
    }

    /**
     * Initialize row descriptions on page load
     * Clears the default placeholder text
     */
    static initRowDescriptions() {
        const svgDoc = appState.getSvgDoc();
        if (!svgDoc) return;

        // Clear the placeholder text from all row descriptions
        for (let i = 1; i <= 4; i++) {
            const textElement = svgDoc.querySelector(`#row-desc-${i}`);
            if (textElement) {
                textElement.textContent = '';
            }
        }
    }
}
