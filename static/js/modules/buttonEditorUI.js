/**
 * Button Editor UI Module
 * Handles the unified button editor interface with Apply to All functionality
 */

import { appState } from '../services/stateManager.js';
import { ButtonEditor } from './buttonEditor.js';
import { ButtonShape } from './buttonShape.js';
import { ButtonArtwork } from './buttonArtwork.js';

// All button IDs
const ALL_BUTTONS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'enter'];

export class ButtonEditorUI {
    /**
     * Handle button selection in the unified editor
     */
    static selectButtonForEditor() {
        const select = document.getElementById('button-editor-select');
        const selectedButton = select.value;

        // Store in state
        appState.setSelectedButtonForEditor(selectedButton);

        // Also sync the old selects for backward compatibility
        const artworkSelect = document.getElementById('button-artwork-select');
        const shapeSelect = document.getElementById('btn-shape-select');
        if (artworkSelect) artworkSelect.value = selectedButton;
        if (shapeSelect) shapeSelect.value = selectedButton;

        // Show/hide editor controls
        const controls = document.getElementById('button-editor-controls');
        if (selectedButton) {
            controls.style.display = 'block';

            // Load existing settings for this button
            this.loadButtonSettings(selectedButton);

            // Trigger the underlying module selections
            ButtonArtwork.selectButtonForArtwork();
            ButtonShape.selectButtonForShape();
        } else {
            controls.style.display = 'none';
        }
    }

    /**
     * Load existing settings for a button into the UI
     * @param {string} buttonId - Button identifier
     */
    static loadButtonSettings(buttonId) {
        // Load background settings from hidden inputs
        const bgEnabled = document.getElementById(`btn-bg-enabled-${buttonId}`);
        const bgColor = document.getElementById(`btn-bg-color-${buttonId}`);
        const mainBgEnabled = document.getElementById('btn-bg-enabled');
        const mainBgColor = document.getElementById('btn-bg-color');

        if (bgEnabled && mainBgEnabled) {
            mainBgEnabled.checked = bgEnabled.checked;
        }
        if (bgColor && mainBgColor) {
            mainBgColor.value = bgColor.value;
        }
    }

    /**
     * Update button background from the unified editor
     * Respects "Apply to All" checkbox
     */
    static updateButtonEditorBackground() {
        const applyToAll = document.getElementById('apply-to-all-buttons').checked;
        const enabled = document.getElementById('btn-bg-enabled').checked;
        const color = document.getElementById('btn-bg-color').value;

        if (applyToAll) {
            // Apply to all buttons
            ALL_BUTTONS.forEach(buttonId => {
                this.applyBackgroundToButton(buttonId, enabled, color);
            });
        } else {
            // Apply to selected button only
            const selectedButton = document.getElementById('button-editor-select').value;
            if (selectedButton) {
                this.applyBackgroundToButton(selectedButton, enabled, color);
            }
        }
    }

    /**
     * Apply background settings to a specific button
     * @param {string} buttonId - Button identifier
     * @param {boolean} enabled - Whether background is enabled
     * @param {string} color - Background color
     */
    static applyBackgroundToButton(buttonId, enabled, color) {
        // Update hidden inputs for backward compatibility
        const bgEnabledInput = document.getElementById(`btn-bg-enabled-${buttonId}`);
        const bgColorInput = document.getElementById(`btn-bg-color-${buttonId}`);

        if (bgEnabledInput) bgEnabledInput.checked = enabled;
        if (bgColorInput) bgColorInput.value = color;

        // Apply the background
        ButtonEditor.toggleButtonBackground(buttonId);
    }

    /**
     * Check if "Apply to All" is enabled
     * @returns {boolean}
     */
    static isApplyToAllEnabled() {
        return document.getElementById('apply-to-all-buttons')?.checked || false;
    }

    /**
     * Get all button IDs
     * @returns {string[]}
     */
    static getAllButtonIds() {
        return ALL_BUTTONS;
    }

    /**
     * Get the currently selected button in the editor
     * @returns {string|null}
     */
    static getSelectedButton() {
        return document.getElementById('button-editor-select')?.value || null;
    }
}
