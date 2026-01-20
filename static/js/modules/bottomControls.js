/**
 * Bottom Controls Module
 * Handles bottom text and arrow styling
 */

import { appState } from '../services/stateManager.js';
import { UIManager } from './uiManager.js';

// Default line spacing multiplier for multiline text
const DEFAULT_LINE_SPACING = 1.2;

export class BottomControls {
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

        lines.forEach((line, index) => {
            const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
            tspan.textContent = line;
            tspan.setAttribute('x', textElement.getAttribute('x'));

            if (index === 0) {
                tspan.setAttribute('dy', '0');
            } else {
                // For horizontal text, dy moves down (positive = downward)
                tspan.setAttribute('dy', lineSpacing + 'px');
            }

            textElement.appendChild(tspan);
        });
    }

    /**
     * Update bottom text
     */
    static updateBottomText() {
        const value = document.getElementById('bottom-text-input').value;
        const svgDoc = appState.getSvgDoc();
        const textElement = svgDoc?.querySelector('#bottom-text');
        const fontSize = parseFloat(document.getElementById('bottom-text-size')?.value || '1.2');

        if (textElement) {
            BottomControls.setMultilineText(textElement, value, fontSize);
            BottomControls.applyBottomTextStyling(textElement);
        }
    }

    /**
     * Apply styling to bottom text element (supports gradient)
     * @param {SVGTextElement} textElement - The text element to style
     */
    static applyBottomTextStyling(textElement) {
        if (!textElement) return;

        const size = parseFloat(document.getElementById('bottom-text-size')?.value || '1.2');

        // Get text style options
        const isBold = document.getElementById('bottom-text-bold')?.checked || false;
        const isItalic = document.getElementById('bottom-text-italic')?.checked || false;
        const isUnderline = document.getElementById('bottom-text-underline')?.checked || false;

        textElement.style.fill = UIManager.getBottomTextFillValue();
        textElement.style.fontSize = size + 'px';
        textElement.style.dominantBaseline = 'central';
        textElement.style.fontWeight = isBold ? 'bold' : 'normal';
        textElement.style.fontStyle = isItalic ? 'italic' : 'normal';
        textElement.style.textDecoration = isUnderline ? 'underline' : 'none';
    }

    /**
     * Update bottom text style (bold, italic, underline)
     */
    static updateBottomTextStyle() {
        const svgDoc = appState.getSvgDoc();
        const textElement = svgDoc?.querySelector('#bottom-text');
        if (textElement) {
            BottomControls.applyBottomTextStyling(textElement);
        }
    }

    /**
     * Update bottom text color
     */
    static updateBottomTextColor() {
        const svgDoc = appState.getSvgDoc();
        const textElement = svgDoc?.querySelector('#bottom-text');
        if (textElement) {
            BottomControls.applyBottomTextStyling(textElement);
        }
    }

    /**
     * Update bottom text size
     */
    static updateBottomTextSize() {
        const size = parseFloat(document.getElementById('bottom-text-size').value);
        document.getElementById('bottom-text-size-value').textContent = size;

        // Re-render multiline text with new spacing and apply styling
        const value = document.getElementById('bottom-text-input').value;
        const svgDoc = appState.getSvgDoc();
        const textElement = svgDoc?.querySelector('#bottom-text');

        if (textElement) {
            BottomControls.setMultilineText(textElement, value, size);
            BottomControls.applyBottomTextStyling(textElement);

            // Apply position including offset
            BottomControls.updateBottomTextPosition();
        }
    }

    /**
     * Update bottom text position with X/Y offset
     */
    static updateBottomTextPosition() {
        const svgDoc = appState.getSvgDoc();
        const textElement = svgDoc?.querySelector('#bottom-text');
        if (!textElement) return;

        const offsetX = parseFloat(document.getElementById('bottom-text-offset-x')?.value || 0);
        const offsetY = parseFloat(document.getElementById('bottom-text-offset-y')?.value || 0);

        // Update display values
        const xValueEl = document.getElementById('bottom-text-offset-x-value');
        const yValueEl = document.getElementById('bottom-text-offset-y-value');
        if (xValueEl) xValueEl.textContent = offsetX.toFixed(1);
        if (yValueEl) yValueEl.textContent = offsetY.toFixed(1);

        // Base position: center above disc area (x=27.8, y=87.0)
        const baseX = 27.3 + offsetX;
        const baseY = 85.8 + offsetY;

        textElement.setAttribute('x', baseX.toFixed(2));
        textElement.setAttribute('y', baseY.toFixed(2));

        // Update tspan x coordinates for multiline text
        textElement.querySelectorAll('tspan').forEach(tspan => {
            tspan.setAttribute('x', baseX.toFixed(2));
        });
    }

    /**
     * Update bottom arrow color
     */
    static updateBottomArrowColor() {
        const enabled = document.getElementById('bottom-arrow-fill-enabled').checked;
        if (enabled) {
            BottomControls.toggleBottomArrowFill();
        }
    }

    /**
     * Toggle bottom arrow fill
     */
    static toggleBottomArrowFill() {
        const enabled = document.getElementById('bottom-arrow-fill-enabled').checked;
        const color = document.getElementById('bottom-arrow-color').value;
        const svgDoc = appState.getSvgDoc();

        const arrowIds = ['disc-left-arrow', 'disc-right-arrow'];
        arrowIds.forEach(arrowId => {
            const arrow = svgDoc?.querySelector(`#${arrowId}`);
            if (arrow) {
                if (enabled) {
                    arrow.setAttribute('fill', color);
                } else {
                    arrow.setAttribute('fill', 'none');
                }
            }
        });
    }

    /**
     * Update disc arrow stroke color and width
     */
    static updateDiscArrowStroke() {
        const color = document.getElementById('disc-arrow-stroke-color')?.value || '#000000';
        const width = parseFloat(document.getElementById('disc-arrow-stroke-width')?.value) || 0.2;
        const svgDoc = appState.getSvgDoc();

        // Update display value
        const widthDisplay = document.getElementById('disc-arrow-stroke-width-value');
        if (widthDisplay) widthDisplay.textContent = width.toFixed(2);

        const arrowIds = ['disc-left-arrow', 'disc-right-arrow'];
        arrowIds.forEach(arrowId => {
            const arrow = svgDoc?.querySelector(`#${arrowId}`);
            if (arrow) {
                arrow.setAttribute('stroke', color);
                arrow.setAttribute('stroke-width', width.toString());
            }
        });
    }

    /**
     * Disc arrow center positions for transform origin calculation
     * These are the geometric centers of each disc arrow polygon
     */
    static DISC_ARROW_CENTERS = {
        'disc-left-arrow': { x: 16, y: 85.25 },
        'disc-right-arrow': { x: 38.6, y: 85.25 }
    };

    /**
     * Update disc arrow transforms (scale, position, spacing, visibility)
     * Both disc arrows are controlled together (paired) with an additional spacing control
     */
    static updateDiscArrowTransforms() {
        const svgDoc = appState.getSvgDoc();
        if (!svgDoc) return;

        // Get control values
        const visible = document.getElementById('disc-arrows-visible')?.checked ?? true;
        const scale = parseFloat(document.getElementById('disc-arrows-scale')?.value || 100) / 100;
        const spacing = parseFloat(document.getElementById('disc-arrows-spacing')?.value || 0);
        const offsetX = parseFloat(document.getElementById('disc-arrows-x')?.value || 0);
        const offsetY = parseFloat(document.getElementById('disc-arrows-y')?.value || 0);

        // Update display values
        const scaleEl = document.getElementById('disc-arrows-scale-value');
        const spacingEl = document.getElementById('disc-arrows-spacing-value');
        const xEl = document.getElementById('disc-arrows-x-value');
        const yEl = document.getElementById('disc-arrows-y-value');

        if (scaleEl) scaleEl.textContent = (scale * 100).toFixed(0);
        if (spacingEl) spacingEl.textContent = spacing.toFixed(1);
        if (xEl) xEl.textContent = offsetX.toFixed(1);
        if (yEl) yEl.textContent = offsetY.toFixed(1);

        // Apply transforms to disc arrows
        // Spacing moves left arrow further left (negative) and right arrow further right (positive)
        const leftArrow = svgDoc.querySelector('#disc-left-arrow');
        const rightArrow = svgDoc.querySelector('#disc-right-arrow');

        if (leftArrow) {
            BottomControls.applyDiscArrowTransform(leftArrow, 'disc-left-arrow', scale, offsetX - spacing, offsetY, visible);
        }

        if (rightArrow) {
            BottomControls.applyDiscArrowTransform(rightArrow, 'disc-right-arrow', scale, offsetX + spacing, offsetY, visible);
        }
    }

    /**
     * Apply transform to a disc arrow element
     * @param {Element} arrow - The arrow SVG element
     * @param {string} arrowId - The arrow ID for center lookup
     * @param {number} scale - Scale factor (1.0 = 100%)
     * @param {number} offsetX - X offset in mm
     * @param {number} offsetY - Y offset in mm
     * @param {boolean} visible - Whether the arrow should be visible
     */
    static applyDiscArrowTransform(arrow, arrowId, scale, offsetX, offsetY, visible) {
        if (!arrow) return;

        // Handle visibility
        arrow.style.display = visible ? '' : 'none';

        if (!visible) return;

        const center = BottomControls.DISC_ARROW_CENTERS[arrowId];
        if (!center) return;

        // Build transform: translate to origin, scale, translate back, then apply offset
        // Simplified: translate((1-s)*cx + offsetX, (1-s)*cy + offsetY) scale(s)
        const tx = (1 - scale) * center.x + offsetX;
        const ty = (1 - scale) * center.y + offsetY;

        arrow.setAttribute('transform', `translate(${tx.toFixed(3)}, ${ty.toFixed(3)}) scale(${scale})`);
    }
}
