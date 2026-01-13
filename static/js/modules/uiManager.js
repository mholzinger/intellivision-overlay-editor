/**
 * UI Manager Module
 * Handles user interface interactions and status messages
 */

import { GradientManager } from './gradientManager.js';

export class UIManager {
    /**
     * Show a status message to the user
     * @param {string} message - Message to display
     * @param {string} type - Type of message ('success' or 'error')
     */
    static showStatus(message, type) {
        const status = document.getElementById('status');
        if (!status) {
            console.warn('Status element not found');
            return;
        }

        status.textContent = message;
        status.className = 'status-message status-' + type;
        status.style.display = 'block';

        setTimeout(() => {
            status.style.display = 'none';
        }, 3000);
    }

    /**
     * Get the selected font color from the UI
     * @returns {string} Selected color value
     */
    static getSelectedFontColor() {
        const colorInput = document.getElementById('font-color');
        return colorInput ? colorInput.value : '#000000';
    }

    /**
     * Get the title fill value (solid color or gradient)
     * @returns {string} Fill value (color or url(#gradient-id))
     */
    static getTitleFillValue() {
        const solidColor = UIManager.getSelectedFontColor();
        const gradientEnabled = document.getElementById('title-gradient-enabled')?.checked || false;
        const endColor = document.getElementById('title-gradient-end')?.value || '#000000';
        const direction = document.getElementById('title-gradient-direction')?.value || 'left-to-right';

        return GradientManager.getFillValue('title-text', solidColor, gradientEnabled, endColor, direction);
    }

    /**
     * Toggle gradient controls visibility
     * @param {string} baseId - Base ID for the controls (e.g., 'title')
     */
    static toggleGradientControls(baseId) {
        const showCheckbox = document.getElementById(`${baseId}-show-gradient`);
        const controlsDiv = document.getElementById(`${baseId}-gradient-controls`);

        if (showCheckbox && controlsDiv) {
            controlsDiv.style.display = showCheckbox.checked ? 'block' : 'none';
        }
    }

    /**
     * Get fill value for any element with gradient support
     * @param {string} elementId - SVG element ID for gradient naming
     * @param {string} colorInputId - ID of the color input
     * @param {string} gradientPrefix - Prefix for gradient control IDs
     * @returns {string} Fill value (color or url(#gradient-id))
     */
    static getFillValueForElement(elementId, colorInputId, gradientPrefix) {
        const solidColor = document.getElementById(colorInputId)?.value || '#000000';
        const gradientEnabled = document.getElementById(`${gradientPrefix}-gradient-enabled`)?.checked || false;
        const endColor = document.getElementById(`${gradientPrefix}-gradient-end`)?.value || '#000000';
        const direction = document.getElementById(`${gradientPrefix}-gradient-direction`)?.value || 'left-to-right';

        return GradientManager.getFillValue(elementId, solidColor, gradientEnabled, endColor, direction);
    }

    /**
     * Get title background fill value (solid color or gradient)
     * @returns {string} Fill value
     */
    static getTitleBgFillValue() {
        return UIManager.getFillValueForElement('title-background', 'title-bg-color', 'title-bg');
    }

    /**
     * Get copyright fill value (solid color or gradient)
     * @returns {string} Fill value
     */
    static getCopyrightFillValue() {
        return UIManager.getFillValueForElement('copyright-text', 'copyright-color', 'copyright');
    }

    /**
     * Get button label fill value (solid color or gradient)
     * @returns {string} Fill value
     */
    static getButtonLabelFillValue() {
        return UIManager.getFillValueForElement('button-labels', 'button-label-color', 'button-label');
    }

    /**
     * Get row description fill value (solid color or gradient)
     * @returns {string} Fill value
     */
    static getRowDescFillValue() {
        return UIManager.getFillValueForElement('row-descriptions', 'row-desc-color', 'row-desc');
    }

    /**
     * Get action button fill value (solid color or gradient)
     * @returns {string} Fill value
     */
    static getActionLabelFillValue() {
        return UIManager.getFillValueForElement('action-labels', 'action-label-color', 'action-label');
    }

    /**
     * Get bottom text fill value (solid color or gradient)
     * @returns {string} Fill value
     */
    static getBottomTextFillValue() {
        return UIManager.getFillValueForElement('bottom-text', 'bottom-text-color', 'bottom-text');
    }

    /**
     * Get background fill value (solid color or gradient)
     * @returns {string} Fill value
     */
    static getBgFillValue() {
        return UIManager.getFillValueForElement('overlay-background', 'bg-fill-color', 'bg-fill');
    }
}
