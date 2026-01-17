/**
 * Button Editor Module
 * Handles button label editing and styling
 */

import { appState } from '../services/stateManager.js';
import { UIManager } from './uiManager.js';
import { ButtonShape } from './buttonShape.js';

// Default line spacing multiplier for multiline text
const DEFAULT_LINE_SPACING = 1.2;

export class ButtonEditor {
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
     * Update a single button label
     * @param {string|number} num - Button number or ID
     */
    static updateButton(num) {
        const value = document.getElementById(`btn-input-${num}`).value;
        const svgDoc = appState.getSvgDoc();
        const btnElement = svgDoc?.querySelector(`#btn-${num}`);
        console.log('updateButton called:', num, 'value:', value, 'element:', btnElement);

        if (btnElement) {
            // Apply global button label styling (color, size, AND font)
            const size = parseFloat(document.getElementById('button-label-size').value);
            const fontSelect = document.getElementById('button-font-select');
            const fontValue = fontSelect.value;
            let fontFamily = 'Arial, sans-serif';
            if (fontValue) {
                try {
                    const fontData = JSON.parse(fontValue);
                    fontFamily = fontData.family;
                } catch (e) {
                    console.error('Error parsing button font:', e);
                }
            }

            // Set multiline text with | separator
            ButtonEditor.setMultilineText(btnElement, value, size);

            // Use inline style to override CSS class styles (supports gradient)
            btnElement.style.fill = UIManager.getButtonLabelFillValue();
            btnElement.style.fontSize = size + 'px';
            btnElement.style.fontFamily = fontFamily;
            btnElement.style.dominantBaseline = 'central';
        } else {
            console.error('Button element not found for:', num);
        }
    }

    /**
     * Update all button labels with current styling (supports gradient)
     */
    static updateAllButtonLabels() {
        const size = parseFloat(document.getElementById('button-label-size').value);
        const fontSelect = document.getElementById('button-font-select');
        const fontValue = fontSelect.value;
        let fontFamily = 'Arial, sans-serif';
        if (fontValue) {
            try {
                const fontData = JSON.parse(fontValue);
                fontFamily = fontData.family;
            } catch (e) {
                console.error('Error parsing button font:', e);
            }
        }

        document.getElementById('button-label-size-value').textContent = size;

        // Get fill value (supports gradient)
        const fillValue = UIManager.getButtonLabelFillValue();

        // Update all 12 button labels
        const buttons = [1, 2, 3, 4, 5, 6, 7, 8, 9, 'clear', 0, 'enter'];
        const svgDoc = appState.getSvgDoc();
        buttons.forEach(num => {
            const btnElement = svgDoc?.querySelector(`#btn-${num}`);
            if (btnElement) {
                // Re-render multiline text with new spacing
                const input = document.getElementById(`btn-input-${num}`);
                if (input) {
                    ButtonEditor.setMultilineText(btnElement, input.value, size);
                }

                // Use inline style to override CSS class styles
                btnElement.style.fill = fillValue;
                btnElement.style.fontSize = size + 'px';
                btnElement.style.fontFamily = fontFamily;
                btnElement.style.dominantBaseline = 'central';
            }
        });
    }

    /**
     * Toggle button background
     * @param {string|number} num - Button number or ID
     */
    static toggleButtonBackground(num) {
        const svgDoc = appState.getSvgDoc();
        const bgElement = svgDoc?.querySelector(`#btn-bg-${num}`);
        const enabled = document.getElementById(`btn-bg-enabled-${num}`).checked;
        const color = document.getElementById(`btn-bg-color-${num}`).value;

        if (!bgElement && enabled) {
            // Create background if it doesn't exist
            ButtonEditor.createButtonBackground(num);
        } else if (bgElement) {
            // Update existing background
            if (enabled) {
                // Check if it's a group (shape background) or rect (default background)
                if (bgElement.tagName === 'g') {
                    // Shape background - update fill on all child elements
                    bgElement.style.display = '';
                    bgElement.querySelectorAll('path, rect, circle, ellipse, polygon, polyline').forEach(el => {
                        el.setAttribute('fill', color);
                    });
                } else {
                    // Rect background
                    bgElement.setAttribute('fill', color);
                    bgElement.setAttribute('opacity', '1.0');
                }
            } else {
                // Hide the background
                if (bgElement.tagName === 'g') {
                    bgElement.style.display = 'none';
                } else {
                    bgElement.setAttribute('fill', 'none');
                    bgElement.setAttribute('opacity', '0');
                }
            }
        }
    }

    /**
     * Create button background - uses shape template if one is applied, otherwise rounded rect
     * @param {string|number} num - Button number or ID
     */
    static createButtonBackground(num) {
        const svgDoc = appState.getSvgDoc();
        const color = document.getElementById(`btn-bg-color-${num}`).value;

        // Check if this button has a shape applied
        const shapeConfig = appState.getButtonShape(num.toString());

        if (shapeConfig && shapeConfig.template) {
            // Use the shape template for the background fill
            this.createShapeBackground(num, color, shapeConfig);
        } else {
            // Fall back to default rounded rectangle
            this.createRectBackground(num, color);
        }
    }

    /**
     * Create a shape-based background using the button's shape template
     * @param {string|number} num - Button number or ID
     * @param {string} color - Fill color
     * @param {Object} shapeConfig - Shape configuration from state
     */
    static createShapeBackground(num, color, shapeConfig) {
        const svgDoc = appState.getSvgDoc();
        const center = ButtonShape.buttonCenters[num];
        if (!center) return;

        const templateSvg = appState.getShapeTemplate(shapeConfig.template);
        if (!templateSvg) return;

        // Remove existing background
        const existingBg = svgDoc.querySelector(`#btn-bg-${num}`);
        if (existingBg) existingBg.remove();

        // Parse the template SVG
        const parser = new DOMParser();
        const templateDoc = parser.parseFromString(templateSvg, 'image/svg+xml');
        const templateSvgEl = templateDoc.querySelector('svg');
        if (!templateSvgEl) return;

        // Get the viewBox
        const viewBox = templateSvgEl.getAttribute('viewBox') || '0 0 100 100';
        const [vbX, vbY, vbWidth, vbHeight] = viewBox.split(' ').map(parseFloat);

        // Create a group for the background shape
        const bgGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        bgGroup.setAttribute('id', `btn-bg-${num}`);

        // Calculate scaling (same as ButtonShape)
        const baseScale = ButtonShape.BUTTON_SIZE / Math.max(vbWidth, vbHeight);
        const finalScale = baseScale * (shapeConfig.scale || 1.0);

        // Build transform matching the shape's position
        const transforms = [
            `translate(${center.cx}, ${center.cy})`,
            `rotate(${shapeConfig.rotation || 0})`,
            `scale(${finalScale})`,
            `translate(${(shapeConfig.x || 0) / finalScale}, ${(shapeConfig.y || 0) / finalScale})`,
            `translate(${-(vbX + vbWidth/2)}, ${-(vbY + vbHeight/2)})`
        ];
        bgGroup.setAttribute('transform', transforms.join(' '));

        // Clone the shape elements and apply fill
        Array.from(templateSvgEl.children).forEach(el => {
            const clone = el.cloneNode(true);

            // Apply fill styling to shape elements
            const applyFill = (element) => {
                element.setAttribute('fill', color);
                element.removeAttribute('stroke');
                element.removeAttribute('stroke-width');
            };

            if (['path', 'rect', 'circle', 'ellipse', 'polygon', 'polyline'].includes(clone.tagName)) {
                applyFill(clone);
            } else if (clone.tagName === 'g') {
                clone.querySelectorAll('path, rect, circle, ellipse, polygon, polyline').forEach(applyFill);
            }

            bgGroup.appendChild(clone);
        });

        // Insert before shape layer (which is before artwork and text)
        const btnShape = svgDoc.querySelector(`#btn-shape-${num}`);
        const btnText = svgDoc.querySelector(`#btn-${num}`);

        if (btnShape && btnShape.parentNode) {
            btnShape.parentNode.insertBefore(bgGroup, btnShape);
        } else if (btnText && btnText.parentNode) {
            btnText.parentNode.insertBefore(bgGroup, btnText);
        }
    }

    /**
     * Create default rounded rectangle background
     * @param {string|number} num - Button number or ID
     * @param {string} color - Fill color
     */
    static createRectBackground(num, color) {
        const svgDoc = appState.getSvgDoc();
        // Button coordinates matching the SVG template
        const buttonCoords = {
            1: {x: 7.20, y: 26.05}, 2: {x: 21.10, y: 26.05}, 3: {x: 35.00, y: 26.05},
            4: {x: 7.20, y: 41.19}, 5: {x: 21.10, y: 41.19}, 6: {x: 35.00, y: 41.19},
            7: {x: 7.20, y: 56.33}, 8: {x: 21.10, y: 56.33}, 9: {x: 35.00, y: 56.33},
            'clear': {x: 7.20, y: 71.48}, 0: {x: 21.10, y: 71.48}, 'enter': {x: 35.00, y: 71.48}
        };

        const coords = buttonCoords[num];
        if (!coords) return;

        // Remove existing background
        const existingBg = svgDoc.querySelector(`#btn-bg-${num}`);
        if (existingBg) existingBg.remove();

        // Create rectangle element
        const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bgRect.setAttribute('id', `btn-bg-${num}`);
        bgRect.setAttribute('x', coords.x);
        bgRect.setAttribute('y', coords.y);
        bgRect.setAttribute('width', '11.4');
        bgRect.setAttribute('height', '11.4');
        bgRect.setAttribute('rx', '1.5');
        bgRect.setAttribute('ry', '1.5');

        bgRect.setAttribute('fill', color);
        bgRect.setAttribute('opacity', '1.0');

        // Insert before the button text element so it appears behind
        const btnText = svgDoc.querySelector(`#btn-${num}`);
        if (btnText && btnText.parentNode) {
            btnText.parentNode.insertBefore(bgRect, btnText);
        }
    }

    /**
     * Update button background
     * @param {string|number} num - Button number or ID
     */
    static updateButtonBackground(num) {
        const enabled = document.getElementById(`btn-bg-enabled-${num}`).checked;
        if (enabled) {
            ButtonEditor.toggleButtonBackground(num);
        }
    }
}
