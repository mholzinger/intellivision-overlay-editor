/**
 * Button Shape Module
 * Handles custom SVG shapes for individual buttons
 */

import { appState } from '../services/stateManager.js';
import { APIService } from '../services/api.js';
import { UIManager } from './uiManager.js';
import { ButtonEditor } from './buttonEditor.js';

export class ButtonShape {
    // Button center coordinates (same as buttonArtwork)
    static buttonCenters = {
        1: {cx: 12.90, cy: 31.75}, 2: {cx: 26.80, cy: 31.75}, 3: {cx: 40.70, cy: 31.75},
        4: {cx: 12.90, cy: 46.89}, 5: {cx: 26.80, cy: 46.89}, 6: {cx: 40.70, cy: 46.89},
        7: {cx: 12.90, cy: 62.03}, 8: {cx: 26.80, cy: 62.03}, 9: {cx: 40.70, cy: 62.03},
        'clear': {cx: 12.90, cy: 77.18}, 0: {cx: 26.80, cy: 77.18}, 'enter': {cx: 40.70, cy: 77.18}
    };

    // Default button size in mm
    static BUTTON_SIZE = 11.4;

    /**
     * Initialize by loading available shape templates
     */
    static async initialize() {
        try {
            const shapes = await APIService.listShapeTemplates();
            // Populate the shape dropdown
            const dropdown = document.getElementById('btn-shape-template');
            if (dropdown) {
                // Keep the "None" option
                dropdown.innerHTML = '<option value="">None</option>';
                shapes.forEach(shape => {
                    const option = document.createElement('option');
                    option.value = shape.name;
                    // Capitalize first letter for display
                    option.textContent = shape.name.charAt(0).toUpperCase() + shape.name.slice(1);
                    dropdown.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Failed to load shape templates:', error);
        }
    }

    /**
     * Handle button selection for shape editing
     */
    static selectButtonForShape() {
        // Get selected button from state (set by unified editor) or fallback to hidden select
        const select = document.getElementById('btn-shape-select');
        const selectedButton = appState.getSelectedButtonForShape() || select?.value;
        appState.setSelectedButtonForShape(selectedButton);

        if (selectedButton) {
            // Load existing shape config if available
            const shape = appState.getButtonShape(selectedButton);
            if (shape && shape.template) {
                // Button has existing shape - load values and show controls
                document.getElementById('btn-shape-template').value = shape.template || '';
                document.getElementById('btn-shape-stroke-color').value = shape.strokeColor || '#ffffff';
                document.getElementById('btn-shape-stroke-width').value = shape.strokeWidth || 0.5;
                document.getElementById('btn-shape-fill-enabled').checked = shape.fillEnabled || false;
                document.getElementById('btn-shape-fill-color').value = shape.fillColor || '#ff0000';
                document.getElementById('btn-shape-scale').value = shape.scale || 1.0;
                document.getElementById('btn-shape-rotation').value = shape.rotation || 0;
                document.getElementById('btn-shape-x').value = shape.x || 0;
                document.getElementById('btn-shape-y').value = shape.y || 0;

                // Update display values
                this.updateDisplayValues(shape);

                // Show/hide fill color based on checkbox
                document.getElementById('btn-shape-fill-color-container').style.display =
                    shape.fillEnabled ? 'block' : 'none';

                // Show shape styling controls
                document.getElementById('btn-shape-controls').style.display = 'block';
            } else {
                // No shape configured - reset controls and hide styling section
                this.resetControls();
                document.getElementById('btn-shape-controls').style.display = 'none';
            }
        } else {
            document.getElementById('btn-shape-controls').style.display = 'none';
        }
    }

    /**
     * Reset controls to default values
     */
    static resetControls() {
        document.getElementById('btn-shape-template').value = '';
        document.getElementById('btn-shape-stroke-color').value = '#ffffff';
        document.getElementById('btn-shape-stroke-width').value = 0.5;
        document.getElementById('btn-shape-fill-enabled').checked = false;
        document.getElementById('btn-shape-fill-color').value = '#ff0000';
        document.getElementById('btn-shape-scale').value = 1.0;
        document.getElementById('btn-shape-rotation').value = 0;
        document.getElementById('btn-shape-x').value = 0;
        document.getElementById('btn-shape-y').value = 0;
        document.getElementById('btn-shape-fill-color-container').style.display = 'none';

        this.updateDisplayValues({
            strokeWidth: 0.5,
            scale: 1.0,
            rotation: 0,
            x: 0,
            y: 0
        });
    }

    /**
     * Update display value labels
     */
    static updateDisplayValues(shape) {
        document.getElementById('btn-shape-stroke-width-value').textContent =
            (shape.strokeWidth || 0.5).toFixed(1);
        document.getElementById('btn-shape-scale-value').textContent =
            Math.round((shape.scale || 1.0) * 100);
        document.getElementById('btn-shape-rotation-value').textContent =
            shape.rotation || 0;
        document.getElementById('btn-shape-x-value').textContent =
            (shape.x || 0).toFixed(1);
        document.getElementById('btn-shape-y-value').textContent =
            (shape.y || 0).toFixed(1);
    }

    /**
     * Toggle fill color visibility
     */
    static toggleFillEnabled() {
        const enabled = document.getElementById('btn-shape-fill-enabled').checked;
        document.getElementById('btn-shape-fill-color-container').style.display =
            enabled ? 'block' : 'none';
        this.updateButtonShape();
    }

    /**
     * Handle shape template selection change
     */
    static async onTemplateChange() {
        const selectedButton = appState.getSelectedButtonForShape();
        if (!selectedButton) return;

        const templateName = document.getElementById('btn-shape-template').value;

        if (!templateName) {
            // Clear shape from button and hide controls
            this.clearButtonShape();
            document.getElementById('btn-shape-controls').style.display = 'none';
            return;
        }

        // Show shape styling controls when a template is selected
        document.getElementById('btn-shape-controls').style.display = 'block';

        // Load template if not cached
        if (!appState.getShapeTemplate(templateName)) {
            try {
                const data = await APIService.getShapeTemplate(templateName);
                appState.addShapeTemplate(templateName, data.svg);
            } catch (error) {
                console.error('Failed to load shape template:', error);
                return;
            }
        }

        // Apply shape with current control values
        this.updateButtonShape();
    }

    /**
     * Update button shape from UI controls
     */
    static updateButtonShape() {
        const selectedButton = appState.getSelectedButtonForShape();
        if (!selectedButton) return;

        const templateName = document.getElementById('btn-shape-template').value;
        const applyToAll = document.getElementById('apply-to-all-buttons')?.checked || false;

        if (!templateName) {
            // Clear shape - check if applying to all
            if (applyToAll) {
                this.getAllButtonIds().forEach(buttonId => {
                    this.removeShapeFromSVG(buttonId);
                    appState.removeButtonShape(buttonId);
                    this.refreshButtonBackground(buttonId);
                });
            } else {
                this.removeShapeFromSVG(selectedButton);
                appState.removeButtonShape(selectedButton);
                this.refreshButtonBackground(selectedButton);
            }
            return;
        }

        // Gather shape config from controls
        const shapeConfig = {
            template: templateName,
            strokeColor: document.getElementById('btn-shape-stroke-color').value,
            strokeWidth: parseFloat(document.getElementById('btn-shape-stroke-width').value),
            fillEnabled: document.getElementById('btn-shape-fill-enabled').checked,
            fillColor: document.getElementById('btn-shape-fill-color').value,
            scale: parseFloat(document.getElementById('btn-shape-scale').value),
            rotation: parseFloat(document.getElementById('btn-shape-rotation').value),
            x: parseFloat(document.getElementById('btn-shape-x').value),
            y: parseFloat(document.getElementById('btn-shape-y').value)
        };

        // Update display values
        this.updateDisplayValues(shapeConfig);

        if (applyToAll) {
            // Apply to all buttons
            this.getAllButtonIds().forEach(buttonId => {
                appState.setButtonShape(buttonId, { ...shapeConfig });
                this.renderShapeToButton(buttonId, shapeConfig);
                this.refreshButtonBackground(buttonId);
            });
        } else {
            // Apply to selected button only
            appState.setButtonShape(selectedButton, shapeConfig);
            this.renderShapeToButton(selectedButton, shapeConfig);
            this.refreshButtonBackground(selectedButton);
        }
    }

    /**
     * Get all button IDs
     * @returns {string[]}
     */
    static getAllButtonIds() {
        return ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'enter'];
    }

    /**
     * Refresh button background when shape changes
     * @param {string} buttonId - Button identifier
     */
    static refreshButtonBackground(buttonId) {
        const bgEnabled = document.getElementById(`btn-bg-enabled-${buttonId}`)?.checked;
        if (bgEnabled) {
            // Re-create the background with the current/new shape
            ButtonEditor.createButtonBackground(buttonId);
        }
    }

    /**
     * Render a shape to a specific button
     */
    static renderShapeToButton(buttonId, shapeConfig) {
        const svgDoc = appState.getSvgDoc();
        if (!svgDoc) return;

        const center = this.buttonCenters[buttonId];
        if (!center) return;

        const templateSvg = appState.getShapeTemplate(shapeConfig.template);
        if (!templateSvg) return;

        // Remove existing shape for this button
        this.removeShapeFromSVG(buttonId);

        // Parse the template SVG to extract paths/shapes
        const parser = new DOMParser();
        const templateDoc = parser.parseFromString(templateSvg, 'image/svg+xml');
        const templateSvgEl = templateDoc.querySelector('svg');
        if (!templateSvgEl) return;

        // Get the viewBox to understand the coordinate system
        const viewBox = templateSvgEl.getAttribute('viewBox') || '0 0 100 100';
        const [vbX, vbY, vbWidth, vbHeight] = viewBox.split(' ').map(parseFloat);

        // Create a group for the shape
        const shapeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        shapeGroup.setAttribute('id', `btn-shape-${buttonId}`);

        // Calculate scaling to fit button size
        const baseScale = this.BUTTON_SIZE / Math.max(vbWidth, vbHeight);
        const finalScale = baseScale * shapeConfig.scale;

        // Build transform: translate to button center, apply rotation, scale, offset, then center the shape
        const transforms = [
            `translate(${center.cx}, ${center.cy})`,
            `rotate(${shapeConfig.rotation})`,
            `scale(${finalScale})`,
            `translate(${shapeConfig.x / finalScale}, ${shapeConfig.y / finalScale})`,
            `translate(${-(vbX + vbWidth/2)}, ${-(vbY + vbHeight/2)})`
        ];
        shapeGroup.setAttribute('transform', transforms.join(' '));

        // Clone only direct children of the SVG (not nested elements)
        Array.from(templateSvgEl.children).forEach(el => {
            const clone = el.cloneNode(true);

            // Apply user styling to shape elements
            if (clone.tagName === 'path' || clone.tagName === 'rect' ||
                clone.tagName === 'circle' || clone.tagName === 'ellipse' ||
                clone.tagName === 'line' || clone.tagName === 'polyline' ||
                clone.tagName === 'polygon') {
                this.applyShapeStyling(clone, shapeConfig, finalScale);
            } else if (clone.tagName === 'g') {
                // Apply styling to paths inside groups
                clone.querySelectorAll('path, rect, circle, ellipse, line, polyline, polygon').forEach(pathEl => {
                    this.applyShapeStyling(pathEl, shapeConfig, finalScale);
                });
            }

            shapeGroup.appendChild(clone);
        });

        // Insert shape into SVG - after background, before artwork and text
        // Layer order: bg-rect → shape → artwork → text
        const btnText = svgDoc.querySelector(`#btn-${buttonId}`);
        const btnArt = svgDoc.querySelector(`#btn-art-${buttonId}`);
        const btnBg = svgDoc.querySelector(`#btn-bg-${buttonId}`);

        if (btnArt && btnArt.parentNode) {
            btnArt.parentNode.insertBefore(shapeGroup, btnArt);
        } else if (btnText && btnText.parentNode) {
            btnText.parentNode.insertBefore(shapeGroup, btnText);
        } else if (btnBg && btnBg.parentNode) {
            btnBg.parentNode.insertBefore(shapeGroup, btnBg.nextSibling);
        } else {
            // Fallback: append to keypad_buttons group or root
            const keypadGroup = svgDoc.querySelector('#keypad_buttons') || svgDoc.querySelector('svg');
            if (keypadGroup) {
                keypadGroup.appendChild(shapeGroup);
            }
        }
    }

    /**
     * Apply styling to a shape element
     */
    static applyShapeStyling(element, shapeConfig, scale) {
        // Check if template has an original fill (not "none")
        const originalFill = element.getAttribute('fill');
        const hasSolidFill = originalFill && originalFill !== 'none';

        if (hasSolidFill) {
            // Filled shape (like ladder) - no stroke outline by default
            // User can override fill color if fillEnabled is checked
            if (shapeConfig.fillEnabled) {
                element.setAttribute('fill', shapeConfig.fillColor);
            }
            // Remove any stroke that might interfere
            element.removeAttribute('stroke');
            element.removeAttribute('stroke-width');
        } else {
            // Stroke-based shape (like arrow) - apply stroke styling
            element.setAttribute('stroke', shapeConfig.strokeColor);
            element.setAttribute('stroke-width', (shapeConfig.strokeWidth / scale).toString());
            element.setAttribute('stroke-linejoin', 'miter');
            element.setAttribute('stroke-miterlimit', '10');

            // Apply fill if user enabled it
            if (shapeConfig.fillEnabled) {
                element.setAttribute('fill', shapeConfig.fillColor);
            } else {
                element.setAttribute('fill', 'none');
            }
        }
    }

    /**
     * Remove shape element from SVG
     */
    static removeShapeFromSVG(buttonId) {
        const svgDoc = appState.getSvgDoc();
        if (!svgDoc) return;

        const existing = svgDoc.querySelector(`#btn-shape-${buttonId}`);
        if (existing) {
            existing.remove();
        }
    }

    /**
     * Clear button shape
     */
    static clearButtonShape() {
        const selectedButton = appState.getSelectedButtonForShape();
        if (!selectedButton) return;

        this.removeShapeFromSVG(selectedButton);
        appState.removeButtonShape(selectedButton);
        this.resetControls();

        UIManager.showStatus(`Shape cleared for button ${selectedButton}`, 'success');
    }

    /**
     * Move shape X position
     */
    static moveShapeX(delta) {
        const slider = document.getElementById('btn-shape-x');
        const newValue = parseFloat(slider.value) + delta;
        slider.value = Math.max(-5.7, Math.min(5.7, newValue));
        this.updateButtonShape();
    }

    /**
     * Move shape Y position
     */
    static moveShapeY(delta) {
        const slider = document.getElementById('btn-shape-y');
        const newValue = parseFloat(slider.value) + delta;
        slider.value = Math.max(-5.7, Math.min(5.7, newValue));
        this.updateButtonShape();
    }

    /**
     * Adjust shape scale
     */
    static scaleShape(delta) {
        const slider = document.getElementById('btn-shape-scale');
        const newValue = parseFloat(slider.value) + delta;
        slider.value = Math.max(0.1, Math.min(3.0, newValue));
        this.updateButtonShape();
    }

    /**
     * Adjust shape rotation
     */
    static rotateShape(delta) {
        const slider = document.getElementById('btn-shape-rotation');
        let newValue = parseFloat(slider.value) + delta;
        // Wrap around at -180/180
        if (newValue > 180) newValue = -180 + (newValue - 180);
        if (newValue < -180) newValue = 180 + (newValue + 180);
        slider.value = newValue;
        this.updateButtonShape();
    }

    /**
     * Re-render all button shapes (used when loading a project)
     */
    static renderAllShapes() {
        const allShapes = appState.getAllButtonShapes();
        for (const [buttonId, shapeConfig] of Object.entries(allShapes)) {
            if (shapeConfig && shapeConfig.template) {
                this.renderShapeToButton(buttonId, shapeConfig);
            }
        }
    }

    /**
     * Clear all shapes from all buttons
     */
    static clearAllShapes() {
        const buttonIds = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'enter'];
        buttonIds.forEach(id => {
            this.removeShapeFromSVG(id);
        });
    }
}
