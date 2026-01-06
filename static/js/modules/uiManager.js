/**
 * UI Manager Module
 * Handles user interface interactions and status messages
 */

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
}
