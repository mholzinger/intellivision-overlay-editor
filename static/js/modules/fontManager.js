/**
 * Font Manager Module
 * Handles font loading and application to SVG elements
 */

import { appState } from '../services/stateManager.js';
import { APIService } from '../services/api.js';
import { UIManager } from './uiManager.js';
import { ButtonEditor } from './buttonEditor.js';
import { ActionButtons } from './actionButtons.js';

export class FontManager {
    /**
     * Load available fonts from the server and populate selectors
     */
    static async loadFonts() {
        try {
            const data = await APIService.listFonts();
            const select = document.getElementById('font-select');
            const buttonSelect = document.getElementById('button-font-select');
            const actionSelect = document.getElementById('action-font-select');
            const bottomSelect = document.getElementById('bottom-text-font-select');

            select.innerHTML = '';
            buttonSelect.innerHTML = '';
            actionSelect.innerHTML = '';
            bottomSelect.innerHTML = '';

            if (data.fonts && data.fonts.length > 0) {
                let defaultIndex = 0;
                data.fonts.forEach((f, index) => {
                    // Create option for title font selector
                    const opt = document.createElement('option');
                    opt.value = JSON.stringify(f);
                    opt.textContent = f.type === 'system' ? f.family + ' (system)' : f.family;
                    select.appendChild(opt);

                    // Create option for button font selector
                    const btnOpt = document.createElement('option');
                    btnOpt.value = JSON.stringify(f);
                    btnOpt.textContent = f.type === 'system' ? f.family + ' (system)' : f.family;
                    buttonSelect.appendChild(btnOpt);

                    // Create option for action button font selector
                    const actionOpt = document.createElement('option');
                    actionOpt.value = JSON.stringify(f);
                    actionOpt.textContent = f.type === 'system' ? f.family + ' (system)' : f.family;
                    actionSelect.appendChild(actionOpt);

                    // Create option for bottom text font selector
                    const bottomOpt = document.createElement('option');
                    bottomOpt.value = JSON.stringify(f);
                    bottomOpt.textContent = f.type === 'system' ? f.family + ' (system)' : f.family;
                    bottomSelect.appendChild(bottomOpt);

                    // Set Eurostile BQ as default
                    if (f.family === 'Eurostile BQ' && f.type === 'system') {
                        defaultIndex = index;
                        console.log('✓ Found Eurostile BQ at index', index);
                    }
                });

                // Select default font for all selectors
                select.selectedIndex = defaultIndex;
                buttonSelect.selectedIndex = defaultIndex;
                actionSelect.selectedIndex = defaultIndex;
                console.log('Selected font index:', defaultIndex);

                FontManager.updateTitleFont();
                FontManager.updateButtonFont();
                FontManager.updateActionFont();
            } else {
                const opt = document.createElement('option');
                opt.value = '';
                opt.textContent = 'No fonts found';
                select.appendChild(opt);

                const btnOpt = document.createElement('option');
                btnOpt.value = '';
                btnOpt.textContent = 'No fonts found';
                buttonSelect.appendChild(btnOpt);

                const actionOpt = document.createElement('option');
                actionOpt.value = '';
                actionOpt.textContent = 'No fonts found';
                actionSelect.appendChild(actionOpt);
            }
        } catch (error) {
            console.error('Error loading fonts', error);
        }
    }

    /**
     * Update title font based on selection
     */
    static updateTitleFont() {
        const select = document.getElementById('font-select');
        const fontValue = select.value;
        const svgDoc = appState.getSvgDoc();
        const titleElement = svgDoc?.querySelector('#title-text');
        if (!fontValue) return;

        // Parse font data
        const fontData = JSON.parse(fontValue);
        const family = fontData.family;
        const isSystem = fontData.type === 'system';

        // Create or replace a <style id="embedded-font-style"> inside the SVG
        let styleEl = svgDoc.querySelector('#embedded-font-style');
        if (!styleEl) {
            styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
            styleEl.setAttribute('id', 'embedded-font-style');
            svgDoc.insertBefore(styleEl, svgDoc.firstChild);
        }

        if (isSystem) {
            // System font: just set font-family, no @font-face needed
            styleEl.textContent = `#title-text { font-family: "${family}" !important; }`;
        } else {
            // Custom font: use @font-face for browser preview
            const fontFile = fontData.file;
            const fontFormat = fontFile.toLowerCase().endsWith('.otf') ? 'opentype' : 'truetype';
            styleEl.textContent = `@font-face { font-family: "${family}"; src: url('/fonts/${fontFile}') format('${fontFormat}'); }\n#title-text { font-family: "${family}" !important; }`;

            // Also load in browser for preview
            let headStyle = document.getElementById('preview-embedded-font-style');
            if (!headStyle) {
                headStyle = document.createElement('style');
                headStyle.id = 'preview-embedded-font-style';
                document.head.appendChild(headStyle);
            }
            headStyle.textContent = `@font-face { font-family: "${family}"; src: url('/fonts/${fontFile}') format('${fontFormat}'); font-display: swap; }`;
        }

        if (titleElement) {
            titleElement.style.fontFamily = family;
            titleElement.style.fill = UIManager.getSelectedFontColor();
        }
    }

    /**
     * Update button font based on selection
     */
    static updateButtonFont() {
        const select = document.getElementById('button-font-select');
        const fontValue = select.value;
        const svgDoc = appState.getSvgDoc();
        if (!fontValue) return;

        // Parse font data
        const fontData = JSON.parse(fontValue);
        const family = fontData.family;
        const isSystem = fontData.type === 'system';

        // For button labels, we'll embed font info in SVG styles
        let styleEl = svgDoc.querySelector('#embedded-button-font-style');
        if (!styleEl) {
            styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
            styleEl.setAttribute('id', 'embedded-button-font-style');
            svgDoc.insertBefore(styleEl, svgDoc.firstChild);
        }

        if (isSystem) {
            // System font: just set font-family for button labels
            styleEl.textContent = `.button-label-text { font-family: "${family}" !important; }`;
        } else {
            // Custom font: use @font-face for button labels
            const fontFile = fontData.file;
            const fontFormat = fontFile.toLowerCase().endsWith('.otf') ? 'opentype' : 'truetype';
            styleEl.textContent = `@font-face { font-family: "${family}"; src: url('/fonts/${fontFile}') format('${fontFormat}'); }\n.button-label-text { font-family: "${family}" !important; }`;

            // Also load in browser for preview (reuse or add to existing preview style)
            let headStyle = document.getElementById('preview-embedded-font-style');
            if (!headStyle) {
                headStyle = document.createElement('style');
                headStyle.id = 'preview-embedded-font-style';
                document.head.appendChild(headStyle);
            }
            // Append button font if not already there
            if (!headStyle.textContent.includes(`font-family: "${family}"`)) {
                headStyle.textContent += `\n@font-face { font-family: "${family}"; src: url('/fonts/${fontFile}') format('${fontFormat}'); font-display: swap; }`;
            }
        }

        // Update all button labels to use the new font
        ButtonEditor.updateAllButtonLabels();
    }

    /**
     * Update action button font based on selection
     */
    static updateActionFont() {
        const select = document.getElementById('action-font-select');
        const fontValue = select.value;
        const svgDoc = appState.getSvgDoc();
        if (!fontValue) return;

        // Parse font data
        const fontData = JSON.parse(fontValue);
        const family = fontData.family;
        const isSystem = fontData.type === 'system';

        // For action button labels, we'll embed font info in SVG styles
        let styleEl = svgDoc.querySelector('#embedded-action-font-style');
        if (!styleEl) {
            styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
            styleEl.setAttribute('id', 'embedded-action-font-style');
            svgDoc.insertBefore(styleEl, svgDoc.firstChild);
        }

        if (isSystem) {
            // System font: just set font-family for action labels
            styleEl.textContent = `.action-label-text { font-family: "${family}" !important; }`;
        } else {
            // Custom font: use @font-face for action labels
            const fontFile = fontData.file;
            const fontFormat = fontFile.toLowerCase().endsWith('.otf') ? 'opentype' : 'truetype';
            styleEl.textContent = `@font-face { font-family: "${family}"; src: url('/fonts/${fontFile}') format('${fontFormat}'); }\n.action-label-text { font-family: "${family}" !important; }`;

            // Also load in browser for preview (reuse or add to existing preview style)
            let headStyle = document.getElementById('preview-embedded-font-style');
            if (!headStyle) {
                headStyle = document.createElement('style');
                headStyle.id = 'preview-embedded-font-style';
                document.head.appendChild(headStyle);
            }
            // Append action font if not already there
            if (!headStyle.textContent.includes(`font-family: "${family}"`)) {
                headStyle.textContent += `\n@font-face { font-family: "${family}"; src: url('/fonts/${fontFile}') format('${fontFormat}'); font-display: swap; }`;
            }
        }

        // Update all action button labels to use the new font
        ActionButtons.updateAllActionButtons();
    }

    /**
     * Update bottom text font based on selection
     */
    static updateBottomTextFont() {
        const select = document.getElementById('bottom-text-font-select');
        const fontValue = select.value;
        const svgDoc = appState.getSvgDoc();
        const textElement = svgDoc?.querySelector('#bottom-text');
        if (!fontValue || !textElement) return;

        const fontData = JSON.parse(fontValue);
        const family = fontData.family;
        const isSystem = fontData.type === 'system';

        // Create or update embedded font style for bottom text
        let styleEl = svgDoc.querySelector('#embedded-bottom-text-font-style');
        if (!styleEl) {
            styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
            styleEl.setAttribute('id', 'embedded-bottom-text-font-style');
            svgDoc.querySelector('defs').appendChild(styleEl);
        }

        if (isSystem) {
            styleEl.textContent = `#bottom-text { font-family: "${family}" !important; }`;
        } else {
            const fontFile = fontData.file;
            const fontFormat = fontFile.toLowerCase().endsWith('.otf') ? 'opentype' : 'truetype';
            styleEl.textContent = `@font-face { font-family: "${family}"; src: url('/fonts/${fontFile}') format('${fontFormat}'); }\n#bottom-text { font-family: "${family}" !important; }`;
        }

        textElement.style.fontFamily = family;
    }
}
