/**
 * Configuration Manager - Export/Import overlay settings
 * Handles saving and loading overlay configurations as JSON files
 */

import { appState } from '../services/stateManager.js';
import { ButtonShape } from './buttonShape.js';
import { APIService } from '../services/api.js';

export class ConfigManager {
    static CONFIG_VERSION = '1.0';

    /**
     * Collect all current UI settings into a configuration object
     * @returns {Object} Complete overlay configuration
     */
    static collectConfig() {
        const config = {
            version: this.CONFIG_VERSION,
            created: new Date().toISOString(),
            name: document.getElementById('title')?.value || 'Untitled Overlay',

            // Title settings
            title: {
                text: document.getElementById('title')?.value || '',
                font: document.getElementById('font-select')?.value || '',
                fontSize: parseFloat(document.getElementById('title-font-size')?.value) || 5.5,
                color: document.getElementById('font-color')?.value || '#ffffff',
                gradient: {
                    enabled: document.getElementById('title-gradient-enabled')?.checked || false,
                    endColor: document.getElementById('title-gradient-end')?.value || '#000000',
                    direction: document.getElementById('title-gradient-direction')?.value || 'left-to-right'
                },
                background: {
                    enabled: document.getElementById('title-bg-enabled')?.checked || false,
                    color: document.getElementById('title-bg-color')?.value || '#0000ff',
                    gradient: {
                        enabled: document.getElementById('title-bg-gradient-enabled')?.checked || false,
                        endColor: document.getElementById('title-bg-gradient-end')?.value || '#000000',
                        direction: document.getElementById('title-bg-gradient-direction')?.value || 'left-to-right'
                    }
                }
            },

            // Copyright settings
            copyright: {
                text: document.getElementById('copyright-input')?.value || '',
                font: document.getElementById('copyright-font-select')?.value || '',
                fontSize: parseFloat(document.getElementById('copyright-font-size')?.value) || 2,
                color: document.getElementById('copyright-color')?.value || '#333333',
                gradient: {
                    enabled: document.getElementById('copyright-gradient-enabled')?.checked || false,
                    endColor: document.getElementById('copyright-gradient-end')?.value || '#000000',
                    direction: document.getElementById('copyright-gradient-direction')?.value || 'left-to-right'
                }
            },

            // Background fill settings
            backgroundFill: {
                enabled: document.getElementById('bg-fill-enabled')?.checked || false,
                color: document.getElementById('bg-fill-color')?.value || '#ffffff',
                opacity: parseFloat(document.getElementById('bg-fill-opacity')?.value) || 1.0,
                gradient: {
                    enabled: document.getElementById('bg-fill-gradient-enabled')?.checked || false,
                    endColor: document.getElementById('bg-fill-gradient-end')?.value || '#000000',
                    direction: document.getElementById('bg-fill-gradient-direction')?.value || 'left-to-right'
                }
            },

            // Main artwork settings (transforms only, no image data)
            artwork: {
                hasImage: !!appState.getArtworkData(),
                x: parseFloat(document.getElementById('artwork-x-pos')?.value) || 0,
                y: parseFloat(document.getElementById('artwork-y-pos')?.value) || 0,
                scale: parseFloat(document.getElementById('artwork-scale')?.value) || 1.0,
                rotation: parseFloat(document.getElementById('artwork-rotation')?.value) || 0,
                opacity: parseFloat(document.getElementById('artwork-opacity')?.value) || 0.9,
                removeWhite: document.getElementById('artwork-remove-white')?.checked || false,
                threshold: parseInt(document.getElementById('artwork-threshold')?.value) || 245,
                tiled: document.getElementById('artwork-tile')?.checked || false
            },

            // Button label styling
            buttonLabels: {
                font: document.getElementById('button-font-select')?.value || '',
                fontSize: parseFloat(document.getElementById('button-label-size')?.value) || 3,
                color: document.getElementById('button-label-color')?.value || '#000000',
                gradient: {
                    enabled: document.getElementById('button-label-gradient-enabled')?.checked || false,
                    endColor: document.getElementById('button-label-gradient-end')?.value || '#000000',
                    direction: document.getElementById('button-label-gradient-direction')?.value || 'left-to-right'
                }
            },

            // Row description styling
            rowDescriptions: {
                font: document.getElementById('row-desc-font-select')?.value || '',
                fontSize: parseFloat(document.getElementById('row-desc-size')?.value) || 2,
                color: document.getElementById('row-desc-color')?.value || '#333333',
                gradient: {
                    enabled: document.getElementById('row-desc-gradient-enabled')?.checked || false,
                    endColor: document.getElementById('row-desc-gradient-end')?.value || '#000000',
                    direction: document.getElementById('row-desc-gradient-direction')?.value || 'left-to-right'
                }
            },

            // Individual button settings
            buttons: this.collectButtonSettings(),

            // Row descriptions text
            rowDescriptionTexts: {
                row1: document.getElementById('row-desc-input-1')?.value || '',
                row2: document.getElementById('row-desc-input-2')?.value || '',
                row3: document.getElementById('row-desc-input-3')?.value || '',
                row4: document.getElementById('row-desc-input-4')?.value || ''
            },

            // Button artwork transforms (no image data)
            buttonArtwork: this.collectButtonArtworkSettings(),

            // Button shapes (SVG shape overlays)
            buttonShapes: this.collectButtonShapeSettings(),

            // Action buttons
            actionButtons: {
                font: document.getElementById('action-font-select')?.value || '',
                fontSize: parseFloat(document.getElementById('action-label-size')?.value) || 2,
                color: document.getElementById('action-label-color')?.value || '#000000',
                gradient: {
                    enabled: document.getElementById('action-label-gradient-enabled')?.checked || false,
                    endColor: document.getElementById('action-label-gradient-end')?.value || '#000000',
                    direction: document.getElementById('action-label-gradient-direction')?.value || 'left-to-right'
                },
                arrowFill: {
                    enabled: document.getElementById('action-arrow-fill-enabled')?.checked || true,
                    color: document.getElementById('action-arrow-color')?.value || '#8B4513'
                },
                labels: {
                    top: document.getElementById('action-top')?.value || 'ACTION',
                    bottomLeft: document.getElementById('action-bottom-left')?.value || 'ACTION',
                    bottomRight: document.getElementById('action-bottom-right')?.value || 'ACTION',
                    descLeft: document.getElementById('action-desc-left-input')?.value || '',
                    descRight: document.getElementById('action-desc-right-input')?.value || ''
                }
            },

            // Bottom arrows
            bottomArrows: {
                text: document.getElementById('bottom-text-input')?.value || 'DIRECTION',
                font: document.getElementById('bottom-text-font-select')?.value || '',
                fontSize: parseFloat(document.getElementById('bottom-text-size')?.value) || 2,
                color: document.getElementById('bottom-text-color')?.value || '#000000',
                gradient: {
                    enabled: document.getElementById('bottom-text-gradient-enabled')?.checked || false,
                    endColor: document.getElementById('bottom-text-gradient-end')?.value || '#000000',
                    direction: document.getElementById('bottom-text-gradient-direction')?.value || 'left-to-right'
                },
                arrowFill: {
                    enabled: document.getElementById('bottom-arrow-fill-enabled')?.checked || true,
                    color: document.getElementById('bottom-arrow-color')?.value || '#8B4513'
                }
            },

            // Export settings
            exportSettings: {
                includeTemplate: document.getElementById('export-include-template')?.checked || false
            }
        };

        return config;
    }

    /**
     * Collect individual button settings (labels and backgrounds)
     * @returns {Object} Button settings keyed by button ID
     */
    static collectButtonSettings() {
        const buttonIds = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'enter'];
        const buttons = {};

        for (const id of buttonIds) {
            // Get the input value - use empty string if blank (don't fallback to id)
            const inputEl = document.getElementById(`btn-input-${id}`);
            const labelValue = inputEl ? inputEl.value : id;

            buttons[id] = {
                label: labelValue,
                background: {
                    enabled: document.getElementById(`btn-bg-enabled-${id}`)?.checked || false,
                    color: document.getElementById(`btn-bg-color-${id}`)?.value || '#ff0000'
                }
            };
        }

        return buttons;
    }

    /**
     * Collect button artwork transform settings (no image data)
     * @returns {Object} Button artwork settings keyed by button ID
     */
    static collectButtonArtworkSettings() {
        const buttonIds = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'enter'];
        const artwork = {};

        for (const id of buttonIds) {
            const btnArt = appState.getButtonArtwork(id);
            if (btnArt) {
                // Button artwork uses originalDataURL property name
                artwork[id] = {
                    hasImage: !!(btnArt.originalDataURL || btnArt.dataURL),
                    x: btnArt.x || 0,
                    y: btnArt.y || 0,
                    scale: btnArt.scale || 1.0,
                    rotation: btnArt.rotation || 0,
                    opacity: btnArt.opacity || 1.0,
                    removeWhite: btnArt.removeWhite || false,
                    threshold: btnArt.threshold || 245
                };
            }
        }

        return artwork;
    }

    /**
     * Collect button shape settings
     * @returns {Object} Button shape settings keyed by button ID
     */
    static collectButtonShapeSettings() {
        const buttonIds = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'enter'];
        const shapes = {};

        for (const id of buttonIds) {
            const shape = appState.getButtonShape(id);
            if (shape && shape.template) {
                shapes[id] = {
                    template: shape.template,
                    strokeColor: shape.strokeColor || '#ffffff',
                    strokeWidth: shape.strokeWidth || 0.5,
                    fillEnabled: shape.fillEnabled || false,
                    fillColor: shape.fillColor || '#ff0000',
                    scale: shape.scale || 1.0,
                    rotation: shape.rotation || 0,
                    x: shape.x || 0,
                    y: shape.y || 0
                };
            }
        }

        return shapes;
    }

    /**
     * Export current configuration as a JSON file download
     */
    static exportConfig() {
        const config = this.collectConfig();
        const filename = this.sanitizeFilename(config.name) + '_overlay_config.json';

        const jsonString = JSON.stringify(config, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('Exported overlay configuration:', filename);
    }

    /**
     * Sanitize a string for use as a filename
     * @param {string} name - Original name
     * @returns {string} Sanitized filename
     */
    static sanitizeFilename(name) {
        return name
            .replace(/[^a-z0-9]/gi, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '')
            .toLowerCase() || 'untitled';
    }

    /**
     * Import configuration from a JSON file
     * Opens a file picker and applies the loaded settings
     */
    static importConfig() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                const config = JSON.parse(text);

                // Validate basic structure
                if (!config.version) {
                    throw new Error('Invalid configuration file: missing version');
                }

                await this.applyConfig(config);
                console.log('Imported overlay configuration:', file.name);

                // Show success message
                const status = document.getElementById('status');
                if (status) {
                    status.textContent = `Loaded settings from ${file.name}`;
                    status.style.color = '#28a745';
                    setTimeout(() => { status.textContent = ''; }, 3000);
                }
            } catch (err) {
                console.error('Failed to import configuration:', err);
                alert('Failed to import configuration: ' + err.message);
            }
        };

        input.click();
    }

    /**
     * Apply a configuration object to the UI
     * @param {Object} config - Configuration object to apply
     */
    static async applyConfig(config) {
        // Title settings
        if (config.title) {
            this.setInputValue('title', config.title.text);
            this.setInputValue('font-color', config.title.color);
            this.setInputValue('title-font-size', config.title.fontSize);
            this.setSelectValue('font-select', config.title.font);

            if (config.title.gradient) {
                this.setCheckbox('title-gradient-enabled', config.title.gradient.enabled);
                this.setInputValue('title-gradient-end', config.title.gradient.endColor);
                this.setSelectValue('title-gradient-direction', config.title.gradient.direction);
            }

            if (config.title.background) {
                this.setCheckbox('title-bg-enabled', config.title.background.enabled);
                this.setInputValue('title-bg-color', config.title.background.color);
                if (config.title.background.gradient) {
                    this.setCheckbox('title-bg-gradient-enabled', config.title.background.gradient.enabled);
                    this.setInputValue('title-bg-gradient-end', config.title.background.gradient.endColor);
                    this.setSelectValue('title-bg-gradient-direction', config.title.background.gradient.direction);
                }
            }
        }

        // Copyright settings
        if (config.copyright) {
            this.setInputValue('copyright-input', config.copyright.text);
            this.setInputValue('copyright-color', config.copyright.color);
            this.setInputValue('copyright-font-size', config.copyright.fontSize);
            this.setSelectValue('copyright-font-select', config.copyright.font);

            if (config.copyright.gradient) {
                this.setCheckbox('copyright-gradient-enabled', config.copyright.gradient.enabled);
                this.setInputValue('copyright-gradient-end', config.copyright.gradient.endColor);
                this.setSelectValue('copyright-gradient-direction', config.copyright.gradient.direction);
            }
        }

        // Background fill settings
        if (config.backgroundFill) {
            this.setCheckbox('bg-fill-enabled', config.backgroundFill.enabled);
            this.setInputValue('bg-fill-color', config.backgroundFill.color);
            this.setInputValue('bg-fill-opacity', config.backgroundFill.opacity);

            if (config.backgroundFill.gradient) {
                this.setCheckbox('bg-fill-gradient-enabled', config.backgroundFill.gradient.enabled);
                this.setInputValue('bg-fill-gradient-end', config.backgroundFill.gradient.endColor);
                this.setSelectValue('bg-fill-gradient-direction', config.backgroundFill.gradient.direction);
            }
        }

        // Artwork transform settings (images must be re-uploaded)
        if (config.artwork) {
            this.setInputValue('artwork-x-pos', config.artwork.x);
            this.setInputValue('artwork-y-pos', config.artwork.y);
            this.setInputValue('artwork-scale', config.artwork.scale);
            this.setInputValue('artwork-rotation', config.artwork.rotation);
            this.setInputValue('artwork-opacity', config.artwork.opacity);
            this.setCheckbox('artwork-remove-white', config.artwork.removeWhite);
            this.setInputValue('artwork-threshold', config.artwork.threshold);
            this.setCheckbox('artwork-tile', config.artwork.tiled);
        }

        // Button label styling
        if (config.buttonLabels) {
            this.setInputValue('button-label-color', config.buttonLabels.color);
            this.setInputValue('button-label-size', config.buttonLabels.fontSize);
            this.setSelectValue('button-font-select', config.buttonLabels.font);

            if (config.buttonLabels.gradient) {
                this.setCheckbox('button-label-gradient-enabled', config.buttonLabels.gradient.enabled);
                this.setInputValue('button-label-gradient-end', config.buttonLabels.gradient.endColor);
                this.setSelectValue('button-label-gradient-direction', config.buttonLabels.gradient.direction);
            }
        }

        // Row description styling
        if (config.rowDescriptions) {
            this.setInputValue('row-desc-color', config.rowDescriptions.color);
            this.setInputValue('row-desc-size', config.rowDescriptions.fontSize);
            this.setSelectValue('row-desc-font-select', config.rowDescriptions.font);

            if (config.rowDescriptions.gradient) {
                this.setCheckbox('row-desc-gradient-enabled', config.rowDescriptions.gradient.enabled);
                this.setInputValue('row-desc-gradient-end', config.rowDescriptions.gradient.endColor);
                this.setSelectValue('row-desc-gradient-direction', config.rowDescriptions.gradient.direction);
            }
        }

        // Individual button settings
        if (config.buttons) {
            for (const [id, btn] of Object.entries(config.buttons)) {
                this.setInputValue(`btn-input-${id}`, btn.label);
                if (btn.background) {
                    this.setCheckbox(`btn-bg-enabled-${id}`, btn.background.enabled);
                    this.setInputValue(`btn-bg-color-${id}`, btn.background.color);
                }
            }
        }

        // Row description texts
        if (config.rowDescriptionTexts) {
            this.setInputValue('row-desc-input-1', config.rowDescriptionTexts.row1);
            this.setInputValue('row-desc-input-2', config.rowDescriptionTexts.row2);
            this.setInputValue('row-desc-input-3', config.rowDescriptionTexts.row3);
            this.setInputValue('row-desc-input-4', config.rowDescriptionTexts.row4);
        }

        // Button shapes - restore shape configs to state
        // (actual rendering happens in triggerAllUpdates via ButtonShape.renderAllShapes)
        if (config.buttonShapes) {
            for (const [id, shape] of Object.entries(config.buttonShapes)) {
                if (shape && shape.template) {
                    appState.setButtonShape(id, shape);
                }
            }
        }

        // Action buttons
        if (config.actionButtons) {
            this.setInputValue('action-label-color', config.actionButtons.color);
            this.setInputValue('action-label-size', config.actionButtons.fontSize);
            this.setSelectValue('action-font-select', config.actionButtons.font);

            if (config.actionButtons.gradient) {
                this.setCheckbox('action-label-gradient-enabled', config.actionButtons.gradient.enabled);
                this.setInputValue('action-label-gradient-end', config.actionButtons.gradient.endColor);
                this.setSelectValue('action-label-gradient-direction', config.actionButtons.gradient.direction);
            }

            if (config.actionButtons.arrowFill) {
                this.setCheckbox('action-arrow-fill-enabled', config.actionButtons.arrowFill.enabled);
                this.setInputValue('action-arrow-color', config.actionButtons.arrowFill.color);
            }

            if (config.actionButtons.labels) {
                this.setInputValue('action-top', config.actionButtons.labels.top);
                this.setInputValue('action-bottom-left', config.actionButtons.labels.bottomLeft);
                this.setInputValue('action-bottom-right', config.actionButtons.labels.bottomRight);
                this.setInputValue('action-desc-left-input', config.actionButtons.labels.descLeft);
                this.setInputValue('action-desc-right-input', config.actionButtons.labels.descRight);
            }
        }

        // Bottom arrows
        if (config.bottomArrows) {
            this.setInputValue('bottom-text-input', config.bottomArrows.text);
            this.setInputValue('bottom-text-color', config.bottomArrows.color);
            this.setInputValue('bottom-text-size', config.bottomArrows.fontSize);
            this.setSelectValue('bottom-text-font-select', config.bottomArrows.font);

            if (config.bottomArrows.gradient) {
                this.setCheckbox('bottom-text-gradient-enabled', config.bottomArrows.gradient.enabled);
                this.setInputValue('bottom-text-gradient-end', config.bottomArrows.gradient.endColor);
                this.setSelectValue('bottom-text-gradient-direction', config.bottomArrows.gradient.direction);
            }

            if (config.bottomArrows.arrowFill) {
                this.setCheckbox('bottom-arrow-fill-enabled', config.bottomArrows.arrowFill.enabled);
                this.setInputValue('bottom-arrow-color', config.bottomArrows.arrowFill.color);
            }
        }

        // Export settings
        if (config.exportSettings) {
            this.setCheckbox('export-include-template', config.exportSettings.includeTemplate);
        }

        // Trigger all updates to refresh the SVG preview
        await this.triggerAllUpdates();
    }

    /**
     * Helper to set input value
     */
    static setInputValue(id, value) {
        const el = document.getElementById(id);
        if (el && value !== undefined && value !== null) {
            el.value = value;
        }
    }

    /**
     * Helper to set checkbox state
     */
    static setCheckbox(id, checked) {
        const el = document.getElementById(id);
        if (el && checked !== undefined) {
            el.checked = checked;
        }
    }

    /**
     * Helper to set select value
     */
    static setSelectValue(id, value) {
        const el = document.getElementById(id);
        if (el && value !== undefined && value !== null) {
            el.value = value;
        }
    }

    /**
     * Trigger all update functions to refresh the SVG preview
     */
    static async triggerAllUpdates() {
        // Use global functions to update everything
        // These are defined in overlay_editor.js

        // Title updates
        if (window.updateTitle) window.updateTitle();
        if (window.updateTitleColor) window.updateTitleColor();
        if (window.updateTitleFont) window.updateTitleFont();
        if (window.updateTitleSize) window.updateTitleSize();
        // Title background - always call to apply colors
        if (window.updateTitleBackground) {
            window.updateTitleBackground();
        }

        // Copyright updates
        if (window.updateCopyrightText) window.updateCopyrightText();
        if (window.updateCopyrightColor) window.updateCopyrightColor();
        if (window.updateCopyrightFont) window.updateCopyrightFont();
        if (window.updateCopyrightSize) window.updateCopyrightSize();

        // Background fill updates
        if (window.toggleBackgroundFill) window.toggleBackgroundFill();
        if (window.updateBackgroundFill) window.updateBackgroundFill();
        if (window.updateBackgroundOpacity) window.updateBackgroundOpacity();

        // Button label updates
        if (window.updateAllButtonLabels) window.updateAllButtonLabels();
        if (window.updateButtonFont) window.updateButtonFont();

        // Individual button updates
        const buttonIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 'clear', 0, 'enter'];
        for (const id of buttonIds) {
            if (window.updateButton) window.updateButton(id);
            if (window.toggleButtonBackground) window.toggleButtonBackground(id);
        }

        // Button shape updates - load templates and render shapes
        await this.renderButtonShapes();

        // Row description updates
        if (window.updateAllRowDescriptions) window.updateAllRowDescriptions();
        if (window.updateRowDescFont) window.updateRowDescFont();
        for (let i = 1; i <= 4; i++) {
            if (window.updateRowDescription) window.updateRowDescription(i);
        }

        // Action button updates
        if (window.updateAllActionButtons) window.updateAllActionButtons();
        if (window.updateActionFont) window.updateActionFont();
        if (window.updateActionButton) {
            window.updateActionButton('top');
            window.updateActionButton('bottom-left');
            window.updateActionButton('bottom-right');
        }
        if (window.updateActionDescription) {
            window.updateActionDescription('left');
            window.updateActionDescription('right');
        }
        if (window.toggleActionArrowFill) window.toggleActionArrowFill();

        // Bottom arrow updates
        if (window.updateBottomText) window.updateBottomText();
        if (window.updateBottomTextColor) window.updateBottomTextColor();
        if (window.updateBottomTextSize) window.updateBottomTextSize();
        if (window.updateBottomTextFont) window.updateBottomTextFont();
        if (window.toggleBottomArrowFill) window.toggleBottomArrowFill();

        // Update UI value displays
        this.updateValueDisplays();
    }

    /**
     * Update the value display spans for sliders
     */
    static updateValueDisplays() {
        // Title font size
        const titleSize = document.getElementById('title-font-size');
        const titleSizeVal = document.getElementById('title-font-size-value');
        if (titleSize && titleSizeVal) titleSizeVal.textContent = titleSize.value;

        // Copyright font size
        const copyrightSize = document.getElementById('copyright-font-size');
        const copyrightSizeVal = document.getElementById('copyright-font-size-value');
        if (copyrightSize && copyrightSizeVal) copyrightSizeVal.textContent = copyrightSize.value;

        // Button label size
        const btnLabelSize = document.getElementById('button-label-size');
        const btnLabelSizeVal = document.getElementById('button-label-size-value');
        if (btnLabelSize && btnLabelSizeVal) btnLabelSizeVal.textContent = btnLabelSize.value;

        // Row description size
        const rowDescSize = document.getElementById('row-desc-size');
        const rowDescSizeVal = document.getElementById('row-desc-size-value');
        if (rowDescSize && rowDescSizeVal) rowDescSizeVal.textContent = rowDescSize.value;

        // Action label size
        const actionSize = document.getElementById('action-label-size');
        const actionSizeVal = document.getElementById('action-label-size-value');
        if (actionSize && actionSizeVal) actionSizeVal.textContent = actionSize.value;

        // Bottom text size
        const bottomSize = document.getElementById('bottom-text-size');
        const bottomSizeVal = document.getElementById('bottom-text-size-value');
        if (bottomSize && bottomSizeVal) bottomSizeVal.textContent = bottomSize.value;

        // Background opacity
        const bgOpacity = document.getElementById('bg-fill-opacity');
        const bgOpacityVal = document.getElementById('bg-fill-opacity-value');
        if (bgOpacity && bgOpacityVal) bgOpacityVal.textContent = Math.round(bgOpacity.value * 100) + '%';
    }

    /**
     * Load shape templates and render all button shapes
     * Called during config restore to ensure shapes are rendered
     */
    static async renderButtonShapes() {
        const allShapes = appState.getAllButtonShapes();
        if (!allShapes || Object.keys(allShapes).length === 0) {
            return;
        }

        // Collect unique template names that need to be loaded
        const templatesToLoad = new Set();
        for (const shape of Object.values(allShapes)) {
            if (shape && shape.template && !appState.getShapeTemplate(shape.template)) {
                templatesToLoad.add(shape.template);
            }
        }

        // Load any missing templates
        for (const templateName of templatesToLoad) {
            try {
                const data = await APIService.getShapeTemplate(templateName);
                appState.addShapeTemplate(templateName, data.svg);
            } catch (error) {
                console.error(`Failed to load shape template ${templateName}:`, error);
            }
        }

        // Render all shapes
        ButtonShape.renderAllShapes();
    }

    /**
     * Export project as a ZIP file containing config.json and all artwork images
     * Uses JSZip library loaded via CDN
     */
    static async exportProject() {
        // Check if JSZip is available
        if (typeof JSZip === 'undefined') {
            console.error('JSZip library not loaded');
            alert('Error: JSZip library not loaded. Please refresh the page.');
            return;
        }

        const config = this.collectConfig();
        const zip = new JSZip();

        // Add config.json
        const jsonString = JSON.stringify(config, null, 2);
        zip.file('config.json', jsonString);

        // Add main artwork if present (use original unprocessed data)
        const mainArtwork = appState.getArtworkOriginalData() || appState.getArtworkData();
        if (mainArtwork) {
            const imageData = this.dataURLtoBlob(mainArtwork);
            if (imageData) {
                zip.file('main_artwork.png', imageData);
            }
        }

        // Add button artwork images
        const buttonIds = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'enter'];
        const buttonArtworkFolder = zip.folder('button_artwork');

        for (const id of buttonIds) {
            const btnArt = appState.getButtonArtwork(id);
            if (btnArt) {
                // Button artwork uses originalDataURL (not originalData)
                const artworkData = btnArt.originalDataURL || btnArt.dataURL || btnArt.originalData;
                if (artworkData) {
                    const imageData = this.dataURLtoBlob(artworkData);
                    if (imageData) {
                        buttonArtworkFolder.file(`${id}.png`, imageData);
                    }
                }
            }
        }

        // Generate ZIP and download
        try {
            const blob = await zip.generateAsync({ type: 'blob' });
            const filename = this.sanitizeFilename(config.name) + '_overlay_project.zip';

            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);

            console.log('Exported overlay project:', filename);
        } catch (err) {
            console.error('Failed to create ZIP file:', err);
            alert('Failed to export project: ' + err.message);
        }
    }

    /**
     * Convert a data URL to a Blob
     * @param {string} dataURL - Base64 data URL
     * @returns {Blob|null} Blob object or null if conversion fails
     */
    static dataURLtoBlob(dataURL) {
        if (!dataURL || !dataURL.startsWith('data:')) {
            return null;
        }

        try {
            const parts = dataURL.split(',');
            const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
            const bstr = atob(parts[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            return new Blob([u8arr], { type: mime });
        } catch (err) {
            console.error('Failed to convert data URL to blob:', err);
            return null;
        }
    }

    /**
     * Import project from a ZIP or JSON file
     * Handles both new ZIP format and legacy JSON-only format
     */
    static async importProject() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.zip,.json,application/zip,application/json';

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                if (file.name.endsWith('.json')) {
                    // Legacy JSON-only import
                    const text = await file.text();
                    const config = JSON.parse(text);
                    if (!config.version) {
                        throw new Error('Invalid configuration file: missing version');
                    }
                    await this.applyConfig(config);
                    console.log('Imported overlay configuration (JSON):', file.name);
                } else if (file.name.endsWith('.zip')) {
                    // ZIP project import
                    await this.importFromZip(file);
                } else {
                    throw new Error('Unsupported file type. Please use .zip or .json files.');
                }

                // Show success message
                const status = document.getElementById('status');
                if (status) {
                    status.textContent = `Loaded project from ${file.name}`;
                    status.style.color = '#28a745';
                    setTimeout(() => { status.textContent = ''; }, 3000);
                }
            } catch (err) {
                console.error('Failed to import project:', err);
                alert('Failed to import project: ' + err.message);
            }
        };

        input.click();
    }

    /**
     * Import project from a ZIP file
     * @param {File} file - ZIP file to import
     */
    static async importFromZip(file) {
        // Check if JSZip is available
        if (typeof JSZip === 'undefined') {
            throw new Error('JSZip library not loaded. Please refresh the page.');
        }

        const zip = await JSZip.loadAsync(file);

        // Load and parse config.json
        const configFile = zip.file('config.json');
        if (!configFile) {
            throw new Error('Invalid project file: missing config.json');
        }

        const configText = await configFile.async('text');
        const config = JSON.parse(configText);

        if (!config.version) {
            throw new Error('Invalid configuration: missing version');
        }

        // Apply the configuration first (sets UI values)
        await this.applyConfig(config);

        // Load main artwork if present
        const mainArtworkFile = zip.file('main_artwork.png');
        if (mainArtworkFile) {
            const blob = await mainArtworkFile.async('blob');
            const dataURL = await this.blobToDataURL(blob);
            if (dataURL) {
                // Get artwork settings from config
                const artworkSettings = config.artwork || {};

                // Set all artwork state in appState
                appState.setArtworkOriginalData(dataURL);
                appState.setArtworkData(dataURL);
                appState.setArtworkPosition(artworkSettings.x || 0, artworkSettings.y || 0);
                appState.setArtworkScale(artworkSettings.scale || 1.0);
                appState.setArtworkOpacity(artworkSettings.opacity || 0.9);
                appState.setArtworkRotation(artworkSettings.rotation || 0);
                appState.setArtworkTiled(artworkSettings.tiled || false);
                appState.setArtworkRemoveWhite(artworkSettings.removeWhite || false);
                appState.setArtworkWhiteThreshold(artworkSettings.threshold || 245);

                // Insert artwork into SVG
                if (window.insertArtwork) {
                    window.insertArtwork(dataURL);
                }

                // Show artwork controls
                const artworkControls = document.getElementById('artwork-controls');
                if (artworkControls) {
                    artworkControls.style.display = 'block';
                }
            }
        }

        // Load button artwork images
        const buttonArtworkFolder = zip.folder('button_artwork');
        if (buttonArtworkFolder) {
            const buttonIds = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'enter'];

            for (const id of buttonIds) {
                const btnFile = buttonArtworkFolder.file(`${id}.png`);
                if (btnFile) {
                    const blob = await btnFile.async('blob');
                    const dataURL = await this.blobToDataURL(blob);
                    if (dataURL) {
                        // Get existing settings from config or use defaults
                        const artworkSettings = config.buttonArtwork?.[id] || {};
                        const removeWhite = artworkSettings.removeWhite || false;
                        const threshold = artworkSettings.threshold || 245;

                        // Set button artwork in appState (uses originalDataURL/dataURL property names)
                        appState.setButtonArtwork(id, {
                            originalDataURL: dataURL,
                            dataURL: dataURL,
                            x: artworkSettings.x || 0,
                            y: artworkSettings.y || 0,
                            scale: artworkSettings.scale || 1.0,
                            rotation: artworkSettings.rotation || 0,
                            opacity: artworkSettings.opacity || 1.0,
                            removeWhite: removeWhite,
                            threshold: threshold
                        });

                        // If removeWhite is enabled, process the image
                        if (removeWhite && window.ImageProcessor) {
                            // Process image asynchronously
                            window.ImageProcessor.removeWhiteBackground(dataURL, threshold, function(processedDataURL) {
                                const art = appState.getButtonArtwork(id);
                                if (art) {
                                    art.dataURL = processedDataURL;
                                    appState.setButtonArtwork(id, art);
                                    if (window.insertButtonArtwork) {
                                        window.insertButtonArtwork(id);
                                    }
                                }
                            });
                        } else {
                            // Insert button artwork into SVG without processing
                            if (window.insertButtonArtwork) {
                                window.insertButtonArtwork(id);
                            }
                        }
                    }
                }
            }
        }

        console.log('Imported overlay project (ZIP):', file.name);
    }

    /**
     * Convert a Blob to a data URL
     * @param {Blob} blob - Blob to convert
     * @returns {Promise<string>} Data URL string
     */
    static blobToDataURL(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
}

// Make export/import available globally for button onclick
window.exportOverlayConfig = () => ConfigManager.exportConfig();
window.importOverlayConfig = () => ConfigManager.importConfig();
window.exportOverlayProject = () => ConfigManager.exportProject();
window.importOverlayProject = () => ConfigManager.importProject();
