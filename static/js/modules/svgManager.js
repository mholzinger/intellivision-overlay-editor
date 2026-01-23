/**
 * SVG Manager Module
 * Handles SVG document operations and initialization
 */

import { appState } from '../services/stateManager.js';
import { APIService } from '../services/api.js';
import { UIManager } from './uiManager.js';
import { FontManager } from './fontManager.js';
import { TitleEditor } from './titleEditor.js';
import { ButtonEditor } from './buttonEditor.js';
import { ActionButtons } from './actionButtons.js';
import { BottomControls } from './bottomControls.js';
import { BackgroundControls } from './backgroundControls.js';
import { RowDescriptions } from './rowDescriptions.js';
import { PreviewInteraction } from './previewInteraction.js';

export class SVGManager {
    /**
     * Load the SVG template from the server
     * @param {boolean} showStatus - Whether to show status message (default: true)
     */
    static async loadTemplate(showStatus = true) {
        try {
            const response = await APIService.getTemplate();
            const data = JSON.parse(response);

            if (data.svg) {
                const preview = document.getElementById('svg-preview');
                preview.innerHTML = data.svg;
                const svgDoc = document.querySelector('#svg-preview svg');
                appState.setSvgDoc(svgDoc);

                // Use 'meet' (contain) in preview so uploaded artwork is fully visible and editable
                if (svgDoc) {
                    svgDoc.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                    svgDoc.style.width = '100%';
                    svgDoc.style.height = '100%';

                    // Load available fonts and apply defaults
                    await FontManager.loadFonts();
                    TitleEditor.updateTitle();
                    TitleEditor.updateTitleSize();  // Called after updateTitle to center it
                    TitleEditor.updateTitleStyle();  // Apply default bold style
                    TitleEditor.updateTitlePosition();  // Apply default X/Y offset
                    TitleEditor.toggleTitleBackground();  // Apply default blue title background
                    TitleEditor.updateCopyrightText();    // Apply copyright text
                    TitleEditor.updateCopyrightStyle();   // Apply default bold style
                    TitleEditor.updateCopyrightPosition(); // Apply default X/Y offset
                    ButtonEditor.updateAllButtonLabels();  // Apply button label styling on load
                    ActionButtons.updateAllActionButtons();  // Apply action button styling and offsets
                    ActionButtons.toggleActionArrowFill();  // Apply default brown arrow fill
                    BottomControls.updateBottomTextColor();  // Apply default bottom text color
                    BottomControls.updateBottomTextSize();   // Apply default bottom text size
                    BottomControls.toggleBottomArrowFill();  // Apply default brown bottom arrow fill
                    BackgroundControls.initBackground();     // Initialize background element reference
                    RowDescriptions.initRowDescriptions();   // Clear row description placeholders
                    PreviewInteraction.init();               // Enable click-to-navigate on preview
                }

                if (showStatus) {
                    UIManager.showStatus('Template loaded successfully!', 'success');
                }
            } else {
                UIManager.showStatus('Error loading template', 'error');
            }
        } catch (error) {
            UIManager.showStatus('Error: ' + error.message, 'error');
        }
    }

    /**
     * Get the SVG document
     * @returns {Document} SVG document
     */
    static getSvgDoc() {
        return appState.getSvgDoc();
    }
}
