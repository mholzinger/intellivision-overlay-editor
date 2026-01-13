/**
 * Action Buttons Module
 * Handles action button labels and arrow styling
 */

import { appState } from '../services/stateManager.js';
import { UIManager } from './uiManager.js';

// Default line spacing in pixels for multiline text
const DEFAULT_LINE_SPACING = 1.2;

export class ActionButtons {
    /**
     * Set multiline text content on an SVG text element using tspan elements
     * @param {SVGTextElement} textElement - The text element to update
     * @param {string} text - Text with | as line separator
     * @param {string} side - 'left' or 'right' to determine line stacking direction
     * @param {number} fontSize - Current font size for calculating line spacing
     */
    static setMultilineText(textElement, text, side, fontSize) {
        // Clear existing content
        textElement.textContent = '';

        const lines = text.split('|').map(line => line.trim());
        const lineSpacing = fontSize * DEFAULT_LINE_SPACING;

        // For rotated text on the sides:
        // Left side (rotate 90°): dy moves text perpendicular to reading direction
        // Right side (rotate -90°): dy moves text perpendicular to reading direction
        // Since text is rotated, we use dy to create horizontal spacing in final view

        lines.forEach((line, index) => {
            const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
            tspan.textContent = line;

            // For the first line, no offset. For subsequent lines, add spacing
            if (index === 0) {
                tspan.setAttribute('x', textElement.getAttribute('x'));
                tspan.setAttribute('dy', '0');
            } else {
                tspan.setAttribute('x', textElement.getAttribute('x'));
                // dy shifts perpendicular to the text baseline
                // For left side (90° rotation), positive dy moves right (toward edge)
                // For right side (-90° rotation), positive dy moves left (toward edge)
                // Both should expand toward the edges (away from center)
                tspan.setAttribute('dy', lineSpacing + 'px');
            }

            textElement.appendChild(tspan);
        });
    }

    /**
     * Update action button label
     * @param {string} position - Position ('top', 'bottom-left', 'bottom-right')
     */
    static updateActionButton(position) {
        const value = document.getElementById(`action-${position}`).value;
        const svgDoc = appState.getSvgDoc();
        const fontSize = parseFloat(document.getElementById('action-label-size').value);

        if (position === 'top') {
            // Update both top-left and top-right labels
            const topLeftLabel = svgDoc?.querySelector('#top-left-label');
            const topRightLabel = svgDoc?.querySelector('#top-right-label');
            const text = value || 'FIRE';

            if (topLeftLabel) {
                ActionButtons.setMultilineText(topLeftLabel, text, 'left', fontSize);
                ActionButtons.applyActionButtonStyling(topLeftLabel);
            }
            if (topRightLabel) {
                ActionButtons.setMultilineText(topRightLabel, text, 'right', fontSize);
                ActionButtons.applyActionButtonStyling(topRightLabel);
            }
        } else {
            // Update individual bottom labels
            const labelElement = svgDoc?.querySelector(`#${position}-label`);
            const side = position.includes('left') ? 'left' : 'right';
            if (labelElement) {
                ActionButtons.setMultilineText(labelElement, value || 'FIRE', side, fontSize);
                ActionButtons.applyActionButtonStyling(labelElement);
            }
        }
    }

    /**
     * Apply styling to action button element (supports gradient)
     * @param {Element} element - SVG element to style
     */
    static applyActionButtonStyling(element) {
        if (!element) return;

        const size = parseFloat(document.getElementById('action-label-size').value);
        const fontSelect = document.getElementById('action-font-select');
        const fontValue = fontSelect.value;
        let fontFamily = 'Arial, sans-serif';

        if (fontValue) {
            try {
                const fontData = JSON.parse(fontValue);
                fontFamily = fontData.family;
            } catch (e) {
                console.error('Error parsing action button font:', e);
            }
        }

        element.style.fill = UIManager.getActionLabelFillValue();
        element.style.fontSize = size + 'px';
        element.style.fontFamily = fontFamily;
        element.style.dominantBaseline = 'central';
    }

    /**
     * Update all action button labels
     */
    static updateAllActionButtons() {
        const size = parseFloat(document.getElementById('action-label-size').value);
        document.getElementById('action-label-size-value').textContent = size.toFixed(1);

        // Update all four action button labels
        const actionLabels = ['top-left-label', 'top-right-label', 'bottom-left-label', 'bottom-right-label'];
        const svgDoc = appState.getSvgDoc();
        actionLabels.forEach(labelId => {
            const labelElement = svgDoc?.querySelector(`#${labelId}`);
            if (labelElement) {
                ActionButtons.applyActionButtonStyling(labelElement);
            }
        });

        // Also update action descriptions with new size/styling
        ['left', 'right'].forEach(side => {
            const descElement = svgDoc?.querySelector(`#action-desc-${side}`);
            const input = document.getElementById(`action-desc-${side}-input`);
            if (descElement && input) {
                ActionButtons.setMultilineText(descElement, input.value, side, size);
                ActionButtons.applyActionButtonStyling(descElement);
            }
        });
    }

    /**
     * Update action arrow color
     */
    static updateActionArrowColor() {
        const enabled = document.getElementById('action-arrow-fill-enabled').checked;
        if (enabled) {
            ActionButtons.toggleActionArrowFill();
        }
    }

    /**
     * Toggle action arrow fill
     */
    static toggleActionArrowFill() {
        const enabled = document.getElementById('action-arrow-fill-enabled').checked;
        const color = document.getElementById('action-arrow-color').value;
        const svgDoc = appState.getSvgDoc();

        const arrowIds = ['top-left-arrow', 'top-right-arrow', 'bottom-left-arrow', 'bottom-right-arrow'];
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
     * Update action button description text
     * @param {string} side - 'left' or 'right'
     */
    static updateActionDescription(side) {
        const input = document.getElementById(`action-desc-${side}-input`);
        const value = input ? input.value : '';
        const svgDoc = appState.getSvgDoc();
        const descElement = svgDoc?.querySelector(`#action-desc-${side}`);
        const fontSize = parseFloat(document.getElementById('action-label-size')?.value || '2');

        if (descElement) {
            ActionButtons.setMultilineText(descElement, value, side, fontSize);
            ActionButtons.applyActionButtonStyling(descElement);
        }
    }

    /**
     * Initialize action descriptions (clear placeholder text)
     */
    static initActionDescriptions() {
        const svgDoc = appState.getSvgDoc();
        if (!svgDoc) return;

        ['left', 'right'].forEach(side => {
            const descElement = svgDoc.querySelector(`#action-desc-${side}`);
            if (descElement) {
                descElement.textContent = '';
            }
        });
    }
}
