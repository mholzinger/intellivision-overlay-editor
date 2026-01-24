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
            const copyrightSelect = document.getElementById('copyright-font-select');
            const rowDescSelect = document.getElementById('row-desc-font-select');

            // Box art font selectors
            const boxartBrandSelect = document.getElementById('boxart-brand-font-select');
            const boxartTaglineSelect = document.getElementById('boxart-tagline-font-select');
            const boxartTitleSelect = document.getElementById('boxart-title-font-select');
            const boxartSubtitleSelect = document.getElementById('boxart-subtitle-font-select');

            select.innerHTML = '';
            buttonSelect.innerHTML = '';
            actionSelect.innerHTML = '';
            bottomSelect.innerHTML = '';
            copyrightSelect.innerHTML = '';
            if (rowDescSelect) rowDescSelect.innerHTML = '';
            if (boxartBrandSelect) boxartBrandSelect.innerHTML = '';
            if (boxartTaglineSelect) boxartTaglineSelect.innerHTML = '';
            if (boxartTitleSelect) boxartTitleSelect.innerHTML = '';
            if (boxartSubtitleSelect) boxartSubtitleSelect.innerHTML = '';

            if (data.fonts && data.fonts.length > 0) {
                // Track indices for bundled font defaults
                // Liberation Sans replaces Arial, Open Sans ExtraBold replaces Arial Black
                let liberationSansIndex = -1;
                let openSansExtraBoldIndex = -1;
                let eurostileBoldExtIndex = -1;
                let sfIntellivisedIndex = -1;

                data.fonts.forEach((f, index) => {
                    // Use displayName if available, otherwise family name
                    const displayText = f.displayName || f.family;

                    // Create option for title font selector
                    const opt = document.createElement('option');
                    opt.value = JSON.stringify(f);
                    opt.textContent = displayText;
                    select.appendChild(opt);

                    // Create option for button font selector
                    const btnOpt = document.createElement('option');
                    btnOpt.value = JSON.stringify(f);
                    btnOpt.textContent = displayText;
                    buttonSelect.appendChild(btnOpt);

                    // Create option for action button font selector
                    const actionOpt = document.createElement('option');
                    actionOpt.value = JSON.stringify(f);
                    actionOpt.textContent = displayText;
                    actionSelect.appendChild(actionOpt);

                    // Create option for bottom text font selector
                    const bottomOpt = document.createElement('option');
                    bottomOpt.value = JSON.stringify(f);
                    bottomOpt.textContent = displayText;
                    bottomSelect.appendChild(bottomOpt);

                    // Create option for copyright font selector
                    const copyrightOpt = document.createElement('option');
                    copyrightOpt.value = JSON.stringify(f);
                    copyrightOpt.textContent = displayText;
                    copyrightSelect.appendChild(copyrightOpt);

                    // Create option for row description font selector
                    if (rowDescSelect) {
                        const rowDescOpt = document.createElement('option');
                        rowDescOpt.value = JSON.stringify(f);
                        rowDescOpt.textContent = displayText;
                        rowDescSelect.appendChild(rowDescOpt);
                    }

                    // Create options for box art font selectors
                    if (boxartBrandSelect) {
                        const brandOpt = document.createElement('option');
                        brandOpt.value = JSON.stringify(f);
                        brandOpt.textContent = displayText;
                        boxartBrandSelect.appendChild(brandOpt);
                    }
                    if (boxartTaglineSelect) {
                        const taglineOpt = document.createElement('option');
                        taglineOpt.value = JSON.stringify(f);
                        taglineOpt.textContent = displayText;
                        boxartTaglineSelect.appendChild(taglineOpt);
                    }
                    if (boxartTitleSelect) {
                        const titleOpt = document.createElement('option');
                        titleOpt.value = JSON.stringify(f);
                        titleOpt.textContent = displayText;
                        boxartTitleSelect.appendChild(titleOpt);
                    }
                    if (boxartSubtitleSelect) {
                        const subtitleOpt = document.createElement('option');
                        subtitleOpt.value = JSON.stringify(f);
                        subtitleOpt.textContent = displayText;
                        boxartSubtitleSelect.appendChild(subtitleOpt);
                    }

                    // Track indices for bundled font defaults
                    // Liberation Sans Regular (replaces Arial)
                    if (f.family === 'Liberation Sans' && f.weight === 'Regular') {
                        liberationSansIndex = index;
                        console.log('✓ Found Liberation Sans at index', index);
                    }
                    // Open Sans ExtraBold (replaces Arial Black)
                    if (f.family === 'Open Sans' && f.weight === 'ExtraBold') {
                        openSansExtraBoldIndex = index;
                        console.log('✓ Found Open Sans ExtraBold at index', index);
                    }
                    // Eurostile Bold Extended (bundled custom font)
                    if (f.family === 'Eurostile Bold Extended') {
                        eurostileBoldExtIndex = index;
                        console.log('✓ Found Eurostile Bold Extended at index', index);
                    }
                    // SF Intellivised for box art brand
                    if (f.family === 'SF Intellivised') {
                        sfIntellivisedIndex = index;
                        console.log('✓ Found SF Intellivised at index', index);
                    }
                });

                // Select appropriate default fonts for each selector
                // Title: Liberation Sans (replaces Arial)
                select.selectedIndex = liberationSansIndex >= 0 ? liberationSansIndex : 0;
                // Copyright: Open Sans ExtraBold (replaces Arial Black)
                copyrightSelect.selectedIndex = openSansExtraBoldIndex >= 0 ? openSansExtraBoldIndex : 0;
                // Button labels: Eurostile Bold Extended
                buttonSelect.selectedIndex = eurostileBoldExtIndex >= 0 ? eurostileBoldExtIndex : 0;
                // Action buttons: Liberation Sans
                actionSelect.selectedIndex = liberationSansIndex >= 0 ? liberationSansIndex : 0;
                // Bottom text: Liberation Sans
                bottomSelect.selectedIndex = liberationSansIndex >= 0 ? liberationSansIndex : 0;
                // Row descriptions: Eurostile Bold Extended (or Liberation Sans as fallback)
                if (rowDescSelect) {
                    rowDescSelect.selectedIndex = eurostileBoldExtIndex >= 0 ? eurostileBoldExtIndex : (liberationSansIndex >= 0 ? liberationSansIndex : 0);
                }

                // Box art font defaults
                // Brand: SF Intellivised (falls back to Liberation Sans)
                if (boxartBrandSelect) {
                    boxartBrandSelect.selectedIndex = sfIntellivisedIndex >= 0 ? sfIntellivisedIndex : (liberationSansIndex >= 0 ? liberationSansIndex : 0);
                }
                // Tagline: Liberation Sans
                if (boxartTaglineSelect) {
                    boxartTaglineSelect.selectedIndex = liberationSansIndex >= 0 ? liberationSansIndex : 0;
                }
                // Title: Liberation Sans
                if (boxartTitleSelect) {
                    boxartTitleSelect.selectedIndex = liberationSansIndex >= 0 ? liberationSansIndex : 0;
                }
                // Subtitle: Liberation Sans
                if (boxartSubtitleSelect) {
                    boxartSubtitleSelect.selectedIndex = liberationSansIndex >= 0 ? liberationSansIndex : 0;
                }

                console.log('Font indices - Liberation Sans:', liberationSansIndex, 'Open Sans ExtraBold:', openSansExtraBoldIndex, 'Eurostile Bold Ext:', eurostileBoldExtIndex, 'SF Intellivised:', sfIntellivisedIndex);

                FontManager.updateTitleFont();
                FontManager.updateButtonFont();
                FontManager.updateActionFont();
                FontManager.updateBottomTextFont();
                FontManager.updateCopyrightFont();
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
            // Apply font-family directly as attribute for maximum priority
            titleElement.setAttribute('font-family', family);
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

    /**
     * Update copyright text font based on selection
     */
    static updateCopyrightFont() {
        const select = document.getElementById('copyright-font-select');
        const fontValue = select.value;
        const svgDoc = appState.getSvgDoc();
        const textElement = svgDoc?.querySelector('#copyright-text');
        if (!fontValue || !textElement) return;

        const fontData = JSON.parse(fontValue);
        const family = fontData.family;
        const isSystem = fontData.type === 'system';

        // Create or update embedded font style for copyright text
        let styleEl = svgDoc.querySelector('#embedded-copyright-font-style');
        if (!styleEl) {
            styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
            styleEl.setAttribute('id', 'embedded-copyright-font-style');
            const defs = svgDoc.querySelector('defs');
            if (defs) {
                defs.appendChild(styleEl);
            } else {
                svgDoc.insertBefore(styleEl, svgDoc.firstChild);
            }
        }

        if (isSystem) {
            styleEl.textContent = `#copyright-text { font-family: "${family}" !important; }`;
        } else {
            const fontFile = fontData.file;
            const fontFormat = fontFile.toLowerCase().endsWith('.otf') ? 'opentype' : 'truetype';
            styleEl.textContent = `@font-face { font-family: "${family}"; src: url('/fonts/${fontFile}') format('${fontFormat}'); }\n#copyright-text { font-family: "${family}" !important; }`;
        }

        textElement.style.fontFamily = family;
    }
}
