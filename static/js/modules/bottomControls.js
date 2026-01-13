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
            BottomControls.setMultilineText(textElement, value || 'DIRECTION', fontSize);
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

        textElement.style.fill = UIManager.getBottomTextFillValue();
        textElement.style.fontSize = size + 'px';
        textElement.style.dominantBaseline = 'central';
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
            BottomControls.setMultilineText(textElement, value || 'DIRECTION', size);
            BottomControls.applyBottomTextStyling(textElement);
        }
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
}
