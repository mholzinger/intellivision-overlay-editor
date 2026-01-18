/**
 * Configuration Manager - Export/Import overlay settings
 * Handles saving and loading overlay configurations as JSON files
 */

import { appState } from '../services/stateManager.js';
import { ButtonShape } from './buttonShape.js';
import { APIService } from '../services/api.js';
import { SVGManager } from './svgManager.js';

export class ConfigManager {
    static CONFIG_VERSION = '1.0';

    /**
     * Reset the overlay to a clean state without reloading the page.
     * Clears all state and reloads the fresh SVG template.
     */
    static async resetOverlayState() {
        // Reset application state
        appState.reset();

        // Reload the fresh SVG template
        await SVGManager.loadTemplate();

        // Hide artwork controls
        const artworkControls = document.getElementById('artwork-controls');
        if (artworkControls) {
            artworkControls.style.display = 'none';
        }

        // Reset button artwork dropdown selection
        const btnArtSelect = document.getElementById('btn-artwork-select');
        if (btnArtSelect) {
            btnArtSelect.value = '';
        }

        // Reset button shape dropdown selection
        const btnShapeSelect = document.getElementById('btn-shape-select');
        if (btnShapeSelect) {
            btnShapeSelect.value = '';
        }

        // Hide button artwork controls
        const btnArtworkControls = document.getElementById('btn-artwork-controls');
        if (btnArtworkControls) {
            btnArtworkControls.style.display = 'none';
        }

        // Hide button shape controls
        const btnShapeControls = document.getElementById('btn-shape-controls');
        if (btnShapeControls) {
            btnShapeControls.style.display = 'none';
        }
    }

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
                bold: document.getElementById('title-bold')?.checked || false,
                italic: document.getElementById('title-italic')?.checked || false,
                underline: document.getElementById('title-underline')?.checked || false,
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
                bold: document.getElementById('copyright-bold')?.checked || false,
                italic: document.getElementById('copyright-italic')?.checked || false,
                underline: document.getElementById('copyright-underline')?.checked || false,
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
                autoFit: document.getElementById('button-label-autofit')?.checked ?? true,
                bold: document.getElementById('button-label-bold')?.checked || false,
                italic: document.getElementById('button-label-italic')?.checked || false,
                underline: document.getElementById('button-label-underline')?.checked || false,
                offset: {
                    x: parseFloat(document.getElementById('button-label-offset-x')?.value) || 0,
                    y: parseFloat(document.getElementById('button-label-offset-y')?.value) || 0
                },
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
                bold: document.getElementById('row-desc-bold')?.checked || false,
                italic: document.getElementById('row-desc-italic')?.checked || false,
                underline: document.getElementById('row-desc-underline')?.checked || false,
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
                bold: document.getElementById('action-label-bold')?.checked || false,
                italic: document.getElementById('action-label-italic')?.checked || false,
                underline: document.getElementById('action-label-underline')?.checked || false,
                gradient: {
                    enabled: document.getElementById('action-label-gradient-enabled')?.checked || false,
                    endColor: document.getElementById('action-label-gradient-end')?.value || '#000000',
                    direction: document.getElementById('action-label-gradient-direction')?.value || 'left-to-right'
                },
                arrowFill: {
                    enabled: document.getElementById('action-arrow-fill-enabled')?.checked || true,
                    color: document.getElementById('action-arrow-color')?.value || '#000000'
                },
                arrowStroke: {
                    color: document.getElementById('action-arrow-stroke-color')?.value || '#000000',
                    width: parseFloat(document.getElementById('action-arrow-stroke-width')?.value) || 0.2
                },
                arrowTransforms: {
                    topArrows: {
                        visible: document.getElementById('top-arrows-visible')?.checked ?? true,
                        scale: parseFloat(document.getElementById('top-arrows-scale')?.value) || 100,
                        x: parseFloat(document.getElementById('top-arrows-x')?.value) || 0,
                        y: parseFloat(document.getElementById('top-arrows-y')?.value) || 0
                    },
                    bottomLeftArrow: {
                        visible: document.getElementById('bottom-left-arrow-visible')?.checked ?? true,
                        scale: parseFloat(document.getElementById('bottom-left-arrow-scale')?.value) || 100,
                        x: parseFloat(document.getElementById('bottom-left-arrow-x')?.value) || 0,
                        y: parseFloat(document.getElementById('bottom-left-arrow-y')?.value) || 0
                    },
                    bottomRightArrow: {
                        visible: document.getElementById('bottom-right-arrow-visible')?.checked ?? true,
                        scale: parseFloat(document.getElementById('bottom-right-arrow-scale')?.value) || 100,
                        x: parseFloat(document.getElementById('bottom-right-arrow-x')?.value) || 0,
                        y: parseFloat(document.getElementById('bottom-right-arrow-y')?.value) || 0
                    }
                },
                labels: {
                    top: document.getElementById('action-top')?.value || 'ACTION',
                    bottomLeft: document.getElementById('action-bottom-left')?.value || 'ACTION',
                    bottomRight: document.getElementById('action-bottom-right')?.value || 'ACTION',
                    descLeft: document.getElementById('action-desc-left-input')?.value || '',
                    descRight: document.getElementById('action-desc-right-input')?.value || ''
                },
                labelOffsets: {
                    top: {
                        x: parseFloat(document.getElementById('action-top-offset-x')?.value) || 0,
                        y: parseFloat(document.getElementById('action-top-offset-y')?.value) || 0
                    },
                    bottomLeft: {
                        x: parseFloat(document.getElementById('action-bottom-left-offset-x')?.value) || 0,
                        y: parseFloat(document.getElementById('action-bottom-left-offset-y')?.value) || 0
                    },
                    bottomRight: {
                        x: parseFloat(document.getElementById('action-bottom-right-offset-x')?.value) || 0,
                        y: parseFloat(document.getElementById('action-bottom-right-offset-y')?.value) || 0
                    },
                    descLeft: {
                        x: parseFloat(document.getElementById('action-desc-left-offset-x')?.value) || 0,
                        y: parseFloat(document.getElementById('action-desc-left-offset-y')?.value) || 0
                    },
                    descRight: {
                        x: parseFloat(document.getElementById('action-desc-right-offset-x')?.value) || 0,
                        y: parseFloat(document.getElementById('action-desc-right-offset-y')?.value) || 0
                    }
                }
            },

            // Bottom arrows
            bottomArrows: {
                text: document.getElementById('bottom-text-input')?.value || 'DIRECTION',
                font: document.getElementById('bottom-text-font-select')?.value || '',
                fontSize: parseFloat(document.getElementById('bottom-text-size')?.value) || 2,
                color: document.getElementById('bottom-text-color')?.value || '#000000',
                bold: document.getElementById('bottom-text-bold')?.checked || false,
                italic: document.getElementById('bottom-text-italic')?.checked || false,
                underline: document.getElementById('bottom-text-underline')?.checked || false,
                gradient: {
                    enabled: document.getElementById('bottom-text-gradient-enabled')?.checked || false,
                    endColor: document.getElementById('bottom-text-gradient-end')?.value || '#000000',
                    direction: document.getElementById('bottom-text-gradient-direction')?.value || 'left-to-right'
                },
                arrowFill: {
                    enabled: document.getElementById('bottom-arrow-fill-enabled')?.checked || true,
                    color: document.getElementById('bottom-arrow-color')?.value || '#000000'
                },
                arrowStroke: {
                    color: document.getElementById('disc-arrow-stroke-color')?.value || '#000000',
                    width: parseFloat(document.getElementById('disc-arrow-stroke-width')?.value) || 0.2
                },
                arrowTransforms: {
                    visible: document.getElementById('disc-arrows-visible')?.checked ?? true,
                    scale: parseFloat(document.getElementById('disc-arrows-scale')?.value) || 100,
                    spacing: parseFloat(document.getElementById('disc-arrows-spacing')?.value) || 0,
                    x: parseFloat(document.getElementById('disc-arrows-x')?.value) || 0,
                    y: parseFloat(document.getElementById('disc-arrows-y')?.value) || 0
                },
                textOffset: {
                    x: parseFloat(document.getElementById('bottom-text-offset-x')?.value) || 0,
                    y: parseFloat(document.getElementById('bottom-text-offset-y')?.value) || 0
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
            this.setCheckbox('title-bold', config.title.bold || false);
            this.setCheckbox('title-italic', config.title.italic || false);
            this.setCheckbox('title-underline', config.title.underline || false);

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
            this.setCheckbox('copyright-bold', config.copyright.bold || false);
            this.setCheckbox('copyright-italic', config.copyright.italic || false);
            this.setCheckbox('copyright-underline', config.copyright.underline || false);

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
            this.setCheckbox('button-label-autofit', config.buttonLabels.autoFit ?? true);
            this.setCheckbox('button-label-bold', config.buttonLabels.bold || false);
            this.setCheckbox('button-label-italic', config.buttonLabels.italic || false);
            this.setCheckbox('button-label-underline', config.buttonLabels.underline || false);

            if (config.buttonLabels.offset) {
                this.setInputValue('button-label-offset-x', config.buttonLabels.offset.x);
                this.setInputValue('button-label-offset-y', config.buttonLabels.offset.y);
            }

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
            this.setCheckbox('row-desc-bold', config.rowDescriptions.bold || false);
            this.setCheckbox('row-desc-italic', config.rowDescriptions.italic || false);
            this.setCheckbox('row-desc-underline', config.rowDescriptions.underline || false);

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
            this.setCheckbox('action-label-bold', config.actionButtons.bold || false);
            this.setCheckbox('action-label-italic', config.actionButtons.italic || false);
            this.setCheckbox('action-label-underline', config.actionButtons.underline || false);

            if (config.actionButtons.gradient) {
                this.setCheckbox('action-label-gradient-enabled', config.actionButtons.gradient.enabled);
                this.setInputValue('action-label-gradient-end', config.actionButtons.gradient.endColor);
                this.setSelectValue('action-label-gradient-direction', config.actionButtons.gradient.direction);
            }

            if (config.actionButtons.arrowFill) {
                this.setCheckbox('action-arrow-fill-enabled', config.actionButtons.arrowFill.enabled);
                this.setInputValue('action-arrow-color', config.actionButtons.arrowFill.color);
            }

            if (config.actionButtons.arrowStroke) {
                this.setInputValue('action-arrow-stroke-color', config.actionButtons.arrowStroke.color);
                this.setInputValue('action-arrow-stroke-width', config.actionButtons.arrowStroke.width);
            }

            if (config.actionButtons.arrowTransforms) {
                const transforms = config.actionButtons.arrowTransforms;
                if (transforms.topArrows) {
                    this.setCheckbox('top-arrows-visible', transforms.topArrows.visible);
                    this.setInputValue('top-arrows-scale', transforms.topArrows.scale);
                    this.setInputValue('top-arrows-x', transforms.topArrows.x);
                    this.setInputValue('top-arrows-y', transforms.topArrows.y);
                }
                if (transforms.bottomLeftArrow) {
                    this.setCheckbox('bottom-left-arrow-visible', transforms.bottomLeftArrow.visible);
                    this.setInputValue('bottom-left-arrow-scale', transforms.bottomLeftArrow.scale);
                    this.setInputValue('bottom-left-arrow-x', transforms.bottomLeftArrow.x);
                    this.setInputValue('bottom-left-arrow-y', transforms.bottomLeftArrow.y);
                }
                if (transforms.bottomRightArrow) {
                    this.setCheckbox('bottom-right-arrow-visible', transforms.bottomRightArrow.visible);
                    this.setInputValue('bottom-right-arrow-scale', transforms.bottomRightArrow.scale);
                    this.setInputValue('bottom-right-arrow-x', transforms.bottomRightArrow.x);
                    this.setInputValue('bottom-right-arrow-y', transforms.bottomRightArrow.y);
                }
            }

            if (config.actionButtons.labels) {
                this.setInputValue('action-top', config.actionButtons.labels.top);
                this.setInputValue('action-bottom-left', config.actionButtons.labels.bottomLeft);
                this.setInputValue('action-bottom-right', config.actionButtons.labels.bottomRight);
                this.setInputValue('action-desc-left-input', config.actionButtons.labels.descLeft);
                this.setInputValue('action-desc-right-input', config.actionButtons.labels.descRight);
            }

            if (config.actionButtons.labelOffsets) {
                const offsets = config.actionButtons.labelOffsets;
                if (offsets.top) {
                    this.setInputValue('action-top-offset-x', offsets.top.x);
                    this.setInputValue('action-top-offset-y', offsets.top.y);
                }
                if (offsets.bottomLeft) {
                    this.setInputValue('action-bottom-left-offset-x', offsets.bottomLeft.x);
                    this.setInputValue('action-bottom-left-offset-y', offsets.bottomLeft.y);
                }
                if (offsets.bottomRight) {
                    this.setInputValue('action-bottom-right-offset-x', offsets.bottomRight.x);
                    this.setInputValue('action-bottom-right-offset-y', offsets.bottomRight.y);
                }
                if (offsets.descLeft) {
                    this.setInputValue('action-desc-left-offset-x', offsets.descLeft.x);
                    this.setInputValue('action-desc-left-offset-y', offsets.descLeft.y);
                }
                if (offsets.descRight) {
                    this.setInputValue('action-desc-right-offset-x', offsets.descRight.x);
                    this.setInputValue('action-desc-right-offset-y', offsets.descRight.y);
                }
            }
        }

        // Bottom arrows
        if (config.bottomArrows) {
            this.setInputValue('bottom-text-input', config.bottomArrows.text);
            this.setInputValue('bottom-text-color', config.bottomArrows.color);
            this.setInputValue('bottom-text-size', config.bottomArrows.fontSize);
            this.setSelectValue('bottom-text-font-select', config.bottomArrows.font);
            this.setCheckbox('bottom-text-bold', config.bottomArrows.bold || false);
            this.setCheckbox('bottom-text-italic', config.bottomArrows.italic || false);
            this.setCheckbox('bottom-text-underline', config.bottomArrows.underline || false);

            if (config.bottomArrows.gradient) {
                this.setCheckbox('bottom-text-gradient-enabled', config.bottomArrows.gradient.enabled);
                this.setInputValue('bottom-text-gradient-end', config.bottomArrows.gradient.endColor);
                this.setSelectValue('bottom-text-gradient-direction', config.bottomArrows.gradient.direction);
            }

            if (config.bottomArrows.arrowFill) {
                this.setCheckbox('bottom-arrow-fill-enabled', config.bottomArrows.arrowFill.enabled);
                this.setInputValue('bottom-arrow-color', config.bottomArrows.arrowFill.color);
            }

            if (config.bottomArrows.arrowStroke) {
                this.setInputValue('disc-arrow-stroke-color', config.bottomArrows.arrowStroke.color);
                this.setInputValue('disc-arrow-stroke-width', config.bottomArrows.arrowStroke.width);
            }

            if (config.bottomArrows.arrowTransforms) {
                const transforms = config.bottomArrows.arrowTransforms;
                this.setCheckbox('disc-arrows-visible', transforms.visible);
                this.setInputValue('disc-arrows-scale', transforms.scale);
                this.setInputValue('disc-arrows-spacing', transforms.spacing);
                this.setInputValue('disc-arrows-x', transforms.x);
                this.setInputValue('disc-arrows-y', transforms.y);
            }

            if (config.bottomArrows.textOffset) {
                this.setInputValue('bottom-text-offset-x', config.bottomArrows.textOffset.x);
                this.setInputValue('bottom-text-offset-y', config.bottomArrows.textOffset.y);
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
        if (window.updateTitleStyle) window.updateTitleStyle();
        // Title background - always call to apply colors
        if (window.updateTitleBackground) {
            window.updateTitleBackground();
        }

        // Copyright updates
        if (window.updateCopyrightText) window.updateCopyrightText();
        if (window.updateCopyrightColor) window.updateCopyrightColor();
        if (window.updateCopyrightFont) window.updateCopyrightFont();
        if (window.updateCopyrightSize) window.updateCopyrightSize();
        if (window.updateCopyrightStyle) window.updateCopyrightStyle();

        // Background fill updates
        if (window.toggleBackgroundFill) window.toggleBackgroundFill();
        if (window.updateBackgroundFill) window.updateBackgroundFill();
        if (window.updateBackgroundOpacity) window.updateBackgroundOpacity();

        // Button font update first (needed for font loading)
        if (window.updateButtonFont) window.updateButtonFont();

        // Individual button updates (set text content and backgrounds)
        const buttonIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 'clear', 0, 'enter'];
        for (const id of buttonIds) {
            if (window.updateButton) window.updateButton(id);
            if (window.toggleButtonBackground) window.toggleButtonBackground(id);
        }

        // Button label updates AFTER individual buttons (applies auto-fit and styling)
        if (window.updateAllButtonLabels) window.updateAllButtonLabels();

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
        if (window.updateActionArrowStroke) window.updateActionArrowStroke();
        if (window.updateActionArrowTransforms) window.updateActionArrowTransforms();

        // Bottom arrow updates
        if (window.updateBottomText) window.updateBottomText();
        if (window.updateBottomTextColor) window.updateBottomTextColor();
        if (window.updateBottomTextSize) window.updateBottomTextSize();
        if (window.updateBottomTextFont) window.updateBottomTextFont();
        if (window.updateBottomTextStyle) window.updateBottomTextStyle();
        if (window.toggleBottomArrowFill) window.toggleBottomArrowFill();
        if (window.updateDiscArrowStroke) window.updateDiscArrowStroke();
        if (window.updateDiscArrowTransforms) window.updateDiscArrowTransforms();

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

// Layout template loading functions (pre-made overlay projects)
let layoutTemplatesLoaded = false;

window.toggleLayoutTemplateDropdown = async function() {
    const menu = document.getElementById('layout-template-dropdown-menu');
    const isVisible = menu.style.display !== 'none';

    if (isVisible) {
        menu.style.display = 'none';
    } else {
        menu.style.display = 'block';

        // Load templates list if not already loaded
        if (!layoutTemplatesLoaded) {
            await loadLayoutTemplatesList();
        }
    }
};

async function loadLayoutTemplatesList() {
    const listContainer = document.getElementById('layout-template-list');

    try {
        const response = await fetch('/get_examples');
        if (!response.ok) throw new Error('Failed to load templates');

        const data = await response.json();
        const templates = data.examples || [];

        if (templates.length === 0) {
            listContainer.innerHTML = '<div style="padding: 8px 12px; color: #666; font-size: 12px;">No templates available</div>';
        } else {
            listContainer.innerHTML = templates.map(tpl =>
                `<div class="layout-template-item" onclick="loadLayoutTemplate('${tpl.name}')" style="padding: 8px 12px; cursor: pointer; font-size: 13px; transition: background 0.15s; color: #333;" onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background='transparent'">${tpl.displayName}</div>`
            ).join('');
        }
        layoutTemplatesLoaded = true;
    } catch (error) {
        console.error('Error loading templates:', error);
        listContainer.innerHTML = '<div style="padding: 8px 12px; color: #e74c3c; font-size: 12px;">Error loading templates</div>';
    }
}

window.loadLayoutTemplate = async function(templateName) {
    // Close the dropdown
    document.getElementById('layout-template-dropdown-menu').style.display = 'none';

    // Confirm with user
    if (!confirm(`Load the "${templateName.replace(/_/g, ' ')}" template? This will replace your current work.`)) {
        return;
    }

    try {
        // Reset to clean state before importing the template
        await ConfigManager.resetOverlayState();

        const response = await fetch(`/get_example/${templateName}`);
        if (!response.ok) throw new Error('Failed to load template');

        const blob = await response.blob();
        const file = new File([blob], `${templateName}.zip`, { type: 'application/zip' });

        // Import the template into the clean state
        await ConfigManager.importFromZip(file);

        // Show success message
        const status = document.getElementById('status');
        if (status) {
            status.textContent = `Loaded template: ${templateName.replace(/_/g, ' ')}`;
            status.className = 'status-message success';
            setTimeout(() => { status.textContent = ''; }, 3000);
        }
    } catch (error) {
        console.error('Error loading template:', error);
        const status = document.getElementById('status');
        if (status) {
            status.textContent = 'Error loading template: ' + error.message;
            status.className = 'status-message error';
        }
    }
};

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.querySelector('.layout-template-dropdown');
    const menu = document.getElementById('layout-template-dropdown-menu');
    if (dropdown && menu && !dropdown.contains(event.target)) {
        menu.style.display = 'none';
    }
});
