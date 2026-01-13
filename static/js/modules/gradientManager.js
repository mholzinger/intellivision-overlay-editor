/**
 * Gradient Manager Module
 * Handles SVG gradient creation and management for color fills
 */

import { appState } from '../services/stateManager.js';

// Gradient direction constants
export const GRADIENT_DIRECTIONS = {
    LEFT_TO_RIGHT: 'left-to-right',      // x → (horizontal)
    TOP_TO_BOTTOM: 'top-to-bottom',      // y → (vertical)
    CENTER_HORIZONTAL: 'center-h',        // ← x → (center outward horizontal)
    CENTER_VERTICAL: 'center-v'           // ↑ y ↓ (center outward vertical)
};

export class GradientManager {
    /**
     * Create or update an SVG gradient definition
     * @param {string} gradientId - Unique ID for the gradient
     * @param {string} startColor - Starting color (hex)
     * @param {string} endColor - Ending color (hex)
     * @param {string} direction - One of GRADIENT_DIRECTIONS values
     * @returns {string} URL reference to use in fill attribute (e.g., "url(#gradientId)")
     */
    static createGradient(gradientId, startColor, endColor, direction) {
        const svgDoc = appState.getSvgDoc();
        if (!svgDoc) return startColor; // Fallback to solid color

        // Find or create defs element
        let defs = svgDoc.querySelector('defs');
        if (!defs) {
            defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            svgDoc.insertBefore(defs, svgDoc.firstChild);
        }

        // Remove existing gradient with same ID
        const existingGradient = defs.querySelector(`#${gradientId}`);
        if (existingGradient) {
            existingGradient.remove();
        }

        // Create gradient element based on direction
        let gradient;
        if (direction === GRADIENT_DIRECTIONS.CENTER_HORIZONTAL ||
            direction === GRADIENT_DIRECTIONS.CENTER_VERTICAL) {
            // Use radial gradient for center-outward effects
            gradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
            gradient.setAttribute('id', gradientId);
            gradient.setAttribute('cx', '50%');
            gradient.setAttribute('cy', '50%');
            gradient.setAttribute('r', '50%');

            // For center gradients, start color is in center, end color is at edges
            const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop1.setAttribute('offset', '0%');
            stop1.setAttribute('stop-color', startColor);

            const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop2.setAttribute('offset', '100%');
            stop2.setAttribute('stop-color', endColor);

            gradient.appendChild(stop1);
            gradient.appendChild(stop2);
        } else {
            // Use linear gradient for directional effects
            gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
            gradient.setAttribute('id', gradientId);

            // Set gradient direction
            switch (direction) {
                case GRADIENT_DIRECTIONS.LEFT_TO_RIGHT:
                    gradient.setAttribute('x1', '0%');
                    gradient.setAttribute('y1', '0%');
                    gradient.setAttribute('x2', '100%');
                    gradient.setAttribute('y2', '0%');
                    break;
                case GRADIENT_DIRECTIONS.TOP_TO_BOTTOM:
                    gradient.setAttribute('x1', '0%');
                    gradient.setAttribute('y1', '0%');
                    gradient.setAttribute('x2', '0%');
                    gradient.setAttribute('y2', '100%');
                    break;
                default:
                    // Default to left-to-right
                    gradient.setAttribute('x1', '0%');
                    gradient.setAttribute('y1', '0%');
                    gradient.setAttribute('x2', '100%');
                    gradient.setAttribute('y2', '0%');
            }

            const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop1.setAttribute('offset', '0%');
            stop1.setAttribute('stop-color', startColor);

            const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop2.setAttribute('offset', '100%');
            stop2.setAttribute('stop-color', endColor);

            gradient.appendChild(stop1);
            gradient.appendChild(stop2);
        }

        defs.appendChild(gradient);

        return `url(#${gradientId})`;
    }

    /**
     * Remove a gradient definition
     * @param {string} gradientId - ID of gradient to remove
     */
    static removeGradient(gradientId) {
        const svgDoc = appState.getSvgDoc();
        if (!svgDoc) return;

        const gradient = svgDoc.querySelector(`#${gradientId}`);
        if (gradient) {
            gradient.remove();
        }
    }

    /**
     * Get the fill value for an element (either solid color or gradient URL)
     * @param {string} baseId - Base ID for the gradient (e.g., 'title-text')
     * @param {string} solidColor - Solid color value
     * @param {boolean} gradientEnabled - Whether gradient is enabled
     * @param {string} endColor - End color for gradient
     * @param {string} direction - Gradient direction
     * @returns {string} Fill value to use
     */
    static getFillValue(baseId, solidColor, gradientEnabled, endColor, direction) {
        if (!gradientEnabled) {
            // Remove any existing gradient and return solid color
            GradientManager.removeGradient(`${baseId}-gradient`);
            return solidColor;
        }

        // Create/update gradient and return URL reference
        return GradientManager.createGradient(
            `${baseId}-gradient`,
            solidColor,
            endColor,
            direction
        );
    }

    /**
     * Generate HTML for gradient controls
     * This can be used to dynamically add gradient controls to existing color pickers
     * @param {string} baseId - Base ID for the controls
     * @param {string} defaultEndColor - Default end color
     * @returns {string} HTML string for gradient controls
     */
    static generateGradientControlsHTML(baseId, defaultEndColor = '#000000') {
        return `
            <div class="gradient-controls" id="${baseId}-gradient-controls" style="margin-top: 8px; padding: 8px; background: #f5f5f5; border-radius: 6px; display: none;">
                <label style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
                    <input type="checkbox" id="${baseId}-gradient-enabled" onchange="updateGradient('${baseId}')">
                    Enable gradient
                </label>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <div>
                        <label style="font-size: 11px; color: #666;">End Color</label>
                        <input type="color" id="${baseId}-gradient-end" value="${defaultEndColor}"
                            oninput="updateGradient('${baseId}')"
                            style="width: 100%; height: 30px; padding: 2px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">
                    </div>
                    <div>
                        <label style="font-size: 11px; color: #666;">Direction</label>
                        <select id="${baseId}-gradient-direction" onchange="updateGradient('${baseId}')"
                            style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
                            <option value="left-to-right">Left → Right</option>
                            <option value="top-to-bottom">Top → Bottom</option>
                            <option value="center-h">Center ↔ Edges</option>
                            <option value="center-v">Center ↕ Edges</option>
                        </select>
                    </div>
                </div>
            </div>
            <label style="display: flex; align-items: center; gap: 6px; margin-top: 8px; font-size: 12px; color: #666;">
                <input type="checkbox" id="${baseId}-show-gradient" onchange="toggleGradientControls('${baseId}')">
                Show gradient options
            </label>
        `;
    }
}
