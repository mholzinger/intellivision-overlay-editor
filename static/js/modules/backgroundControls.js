/**
 * Background Controls Module
 * Handles overlay background fill color and opacity
 */

import { appState } from '../services/stateManager.js';
import { UIManager } from './uiManager.js';

// Store reference to background element and its original state
let backgroundElement = null;

export class BackgroundControls {
    /**
     * Initialize and cache the background element reference
     */
    static initBackground() {
        const svgDoc = appState.getSvgDoc();
        if (!svgDoc) return;

        // Find the background rect (first rect with white fill at position 0,0)
        backgroundElement = svgDoc.querySelector('rect[x="0"][y="0"][width="55.6"][height="90.4"]');

        // Give it an ID for easier future reference
        if (backgroundElement && !backgroundElement.id) {
            backgroundElement.setAttribute('id', 'overlay-background');
        }
    }

    /**
     * Toggle background fill on/off
     */
    static toggleBackgroundFill() {
        const enabled = document.getElementById('bg-fill-enabled').checked;
        const color = document.getElementById('bg-fill-color').value;
        const opacity = parseFloat(document.getElementById('bg-fill-opacity').value);

        BackgroundControls.applyBackgroundFill(enabled, color, opacity);
    }

    /**
     * Update background fill color
     */
    static updateBackgroundFill() {
        const enabled = document.getElementById('bg-fill-enabled').checked;
        const color = document.getElementById('bg-fill-color').value;
        const opacity = parseFloat(document.getElementById('bg-fill-opacity').value);

        BackgroundControls.applyBackgroundFill(enabled, color, opacity);
    }

    /**
     * Update background opacity
     */
    static updateBackgroundOpacity() {
        const opacity = parseFloat(document.getElementById('bg-fill-opacity').value);
        document.getElementById('bg-opacity-value').textContent = Math.round(opacity * 100);

        const enabled = document.getElementById('bg-fill-enabled').checked;
        const color = document.getElementById('bg-fill-color').value;

        BackgroundControls.applyBackgroundFill(enabled, color, opacity);
    }

    /**
     * Apply background fill to SVG (supports gradient)
     * @param {boolean} enabled - Whether fill is enabled
     * @param {string} color - Fill color (unused when gradient enabled)
     * @param {number} opacity - Opacity value (0-1)
     */
    static applyBackgroundFill(enabled, color, opacity) {
        const svgDoc = appState.getSvgDoc();
        if (!svgDoc) return;

        // Try cached element first, or find it
        if (!backgroundElement) {
            backgroundElement = svgDoc.querySelector('#overlay-background') ||
                               svgDoc.querySelector('rect[x="0"][y="0"][width="55.6"][height="90.4"]');
        }

        if (!backgroundElement) return;

        if (enabled) {
            backgroundElement.setAttribute('fill', UIManager.getBgFillValue());
            backgroundElement.setAttribute('fill-opacity', opacity.toString());
        } else {
            backgroundElement.setAttribute('fill', '#FFFFFF');
            backgroundElement.setAttribute('fill-opacity', '1');
        }
    }
}
