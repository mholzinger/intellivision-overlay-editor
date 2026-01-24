/**
 * UI Helpers Module
 * Shared functions for reading/writing UI control values
 */

export class UIHelpers {
    /**
     * Get offset values from range inputs.
     *
     * @param {string} prefix - The ID prefix (e.g., 'title' for 'title-offset-x')
     * @returns {Object} { x, y } offset values as numbers
     */
    static getOffsetValues(prefix) {
        const x = parseFloat(document.getElementById(`${prefix}-offset-x`)?.value || 0);
        const y = parseFloat(document.getElementById(`${prefix}-offset-y`)?.value || 0);
        return { x, y };
    }

    /**
     * Update offset display values (the text showing current value).
     *
     * @param {string} prefix - The ID prefix
     * @param {number} x - X offset value
     * @param {number} y - Y offset value
     * @param {number} precision - Decimal places (default: 1)
     */
    static updateOffsetDisplays(prefix, x, y, precision = 1) {
        const xValueEl = document.getElementById(`${prefix}-offset-x-value`);
        const yValueEl = document.getElementById(`${prefix}-offset-y-value`);

        if (xValueEl) xValueEl.textContent = x.toFixed(precision);
        if (yValueEl) yValueEl.textContent = y.toFixed(precision);
    }

    /**
     * Get a numeric value from a range/number input and update its display.
     *
     * @param {string} inputId - The input element ID
     * @param {string} displayId - The display element ID (optional)
     * @param {number} precision - Decimal places for display (default: 1)
     * @param {number} defaultValue - Default if input is empty/invalid
     * @returns {number} The numeric value
     */
    static getNumericValue(inputId, displayId = null, precision = 1, defaultValue = 0) {
        const input = document.getElementById(inputId);
        const value = parseFloat(input?.value) || defaultValue;

        if (displayId) {
            const display = document.getElementById(displayId);
            if (display) {
                display.textContent = value.toFixed(precision);
            }
        }

        return value;
    }

    /**
     * Get a color value from a color picker input.
     *
     * @param {string} inputId - The input element ID
     * @param {string} defaultColor - Default color if input is empty
     * @returns {string} The color value
     */
    static getColorValue(inputId, defaultColor = '#000000') {
        return document.getElementById(inputId)?.value || defaultColor;
    }

    /**
     * Get a checkbox value.
     *
     * @param {string} inputId - The checkbox element ID
     * @param {boolean} defaultValue - Default if checkbox not found
     * @returns {boolean} The checked state
     */
    static getCheckboxValue(inputId, defaultValue = false) {
        return document.getElementById(inputId)?.checked ?? defaultValue;
    }

    /**
     * Get a text input value.
     *
     * @param {string} inputId - The input element ID
     * @param {string} defaultValue - Default if input is empty
     * @returns {string} The text value
     */
    static getTextValue(inputId, defaultValue = '') {
        return document.getElementById(inputId)?.value || defaultValue;
    }

    /**
     * Set a range input value and update its display.
     *
     * @param {string} inputId - The input element ID
     * @param {number} value - The value to set
     * @param {string} displayId - The display element ID (optional)
     * @param {number} precision - Decimal places for display
     */
    static setNumericValue(inputId, value, displayId = null, precision = 1) {
        const input = document.getElementById(inputId);
        if (input) {
            input.value = value;
        }

        if (displayId) {
            const display = document.getElementById(displayId);
            if (display) {
                display.textContent = value.toFixed(precision);
            }
        }
    }

    /**
     * Get scale value from a range input (typically 0.1 to 3.0).
     *
     * @param {string} inputId - The input element ID
     * @param {string} displayId - The display element ID (optional)
     * @param {number} defaultValue - Default scale value
     * @returns {number} The scale value
     */
    static getScaleValue(inputId, displayId = null, defaultValue = 1.0) {
        return UIHelpers.getNumericValue(inputId, displayId, 2, defaultValue);
    }

    /**
     * Get font size value from a range input.
     *
     * @param {string} inputId - The input element ID
     * @param {string} displayId - The display element ID (optional)
     * @param {number} defaultValue - Default font size
     * @returns {number} The font size in pixels
     */
    static getFontSize(inputId, displayId = null, defaultValue = 12) {
        return UIHelpers.getNumericValue(inputId, displayId, 1, defaultValue);
    }
}
