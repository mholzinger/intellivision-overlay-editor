/**
 * Action Buttons Module
 * Handles action button labels and arrow styling
 */

import { appState } from '../services/stateManager.js';

export class ActionButtons {
    /**
     * Update action button label
     * @param {string} position - Position ('top', 'bottom-left', 'bottom-right')
     */
    static updateActionButton(position) {
        const value = document.getElementById(`action-${position}`).value;
        const svgDoc = appState.getSvgDoc();

        if (position === 'top') {
            // Update both top-left and top-right labels
            const topLeftLabel = svgDoc?.querySelector('#top-left-label');
            const topRightLabel = svgDoc?.querySelector('#top-right-label');
            if (topLeftLabel) {
                topLeftLabel.textContent = value || 'FIRE';
                ActionButtons.applyActionButtonStyling(topLeftLabel);
            }
            if (topRightLabel) {
                topRightLabel.textContent = value || 'FIRE';
                ActionButtons.applyActionButtonStyling(topRightLabel);
            }
        } else {
            // Update individual bottom labels
            const labelElement = svgDoc?.querySelector(`#${position}-label`);
            if (labelElement) {
                labelElement.textContent = value || 'FIRE';
                ActionButtons.applyActionButtonStyling(labelElement);
            }
        }
    }

    /**
     * Apply styling to action button element
     * @param {Element} element - SVG element to style
     */
    static applyActionButtonStyling(element) {
        if (!element) return;

        const color = document.getElementById('action-label-color').value;
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

        element.style.fill = color;
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
}
