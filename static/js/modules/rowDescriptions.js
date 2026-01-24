/**
 * Row Descriptions Module
 * Handles row description text above each button row
 */

import { appState } from '../services/stateManager.js';
import { UIManager } from './uiManager.js';
import { FontManager } from './fontManager.js';
import { TextUtils } from '../utils/textUtils.js';
import { UIHelpers } from '../utils/uiHelpers.js';
import { SVGHelpers } from '../utils/svgHelpers.js';

// Base row description positions (centered above each row)
const ROW_POSITIONS = {
    1: { x: 27.8, y: 24.5 },
    2: { x: 27.8, y: 39.5 },
    3: { x: 27.8, y: 54.5 },
    4: { x: 27.8, y: 69.5 }
};

export class RowDescriptions {
    /**
     * Update a single row description
     * @param {number} rowNum - Row number (1-4)
     */
    static updateRowDescription(rowNum) {
        const value = UIHelpers.getTextValue(`row-desc-input-${rowNum}`);
        const svgDoc = appState.getSvgDoc();
        const textElement = svgDoc?.querySelector(`#row-desc-${rowNum}`);
        const fontSize = UIHelpers.getNumericValue('row-desc-size', null, 0, 2);

        if (textElement) {
            TextUtils.setMultilineText(textElement, value, fontSize, { centerVertically: true });
            RowDescriptions.applyRowDescStyling(textElement);
        }
    }

    /**
     * Apply styling to a row description element
     * @param {SVGTextElement} textElement - The text element to style
     */
    static applyRowDescStyling(textElement) {
        const size = UIHelpers.getNumericValue('row-desc-size', null, 0, 2);
        const fontSelect = document.getElementById('row-desc-font-select');
        let fontFamily = 'Arial, sans-serif';

        if (fontSelect?.value) {
            try {
                const { fontFamily: parsedFamily } = FontManager.parseFontData(fontSelect.value);
                fontFamily = parsedFamily;
            } catch (e) {
                console.error('Error parsing row desc font:', e);
            }
        }

        const styles = TextUtils.getTextStyles('row-desc');

        SVGHelpers.applyTextStyling(textElement, {
            fill: UIManager.getRowDescFillValue(),
            fontSize: size,
            fontFamily: fontFamily,
            ...styles
        });
    }

    /**
     * Update all row descriptions with current styling
     */
    static updateAllRowDescriptions() {
        const size = UIHelpers.getNumericValue('row-desc-size', 'row-desc-size-value', 0, 2);
        const offset = UIHelpers.getOffsetValues('row-desc');
        UIHelpers.updateOffsetDisplays('row-desc', offset.x, offset.y);

        const svgDoc = appState.getSvgDoc();
        if (!svgDoc) return;

        // Update all 4 row descriptions
        for (let i = 1; i <= 4; i++) {
            const textElement = svgDoc.querySelector(`#row-desc-${i}`);
            const value = UIHelpers.getTextValue(`row-desc-input-${i}`);

            if (textElement) {
                const newPos = SVGHelpers.calculatePosition(ROW_POSITIONS[i], offset);

                // Update position
                textElement.setAttribute('x', newPos.x);
                textElement.setAttribute('y', newPos.y);

                // Re-render multiline text with new spacing
                TextUtils.setMultilineText(textElement, value, size, { centerVertically: true });

                // Update tspan x coordinates
                TextUtils.updateTspanPositions(textElement, newPos.x);

                RowDescriptions.applyRowDescStyling(textElement);
            }
        }
    }

    /**
     * Update row description font based on selection
     */
    static updateRowDescFont() {
        const fontSelect = document.getElementById('row-desc-font-select');
        const fontValue = fontSelect?.value;
        const svgDoc = appState.getSvgDoc();

        if (!fontValue || !svgDoc) return;

        const { fontFamily, fontFile, fontFormat, isSystem } = FontManager.parseFontData(fontValue);

        // Create or update embedded font style for row descriptions
        const styleEl = SVGHelpers.getOrCreateStyle(svgDoc, 'embedded-row-desc-font-style');

        if (isSystem) {
            styleEl.textContent = `.row-desc-text { font-family: "${fontFamily}" !important; }`;
        } else {
            styleEl.textContent = `${FontManager.generateFontFace(fontFamily, fontFile, fontFormat)}\n.row-desc-text { font-family: "${fontFamily}" !important; }`;
            FontManager.ensureFontLoaded(fontFamily, fontFile, fontFormat);
        }

        // Update all row descriptions with the new font
        RowDescriptions.updateAllRowDescriptions();
    }

    /**
     * Initialize row descriptions on page load
     * Clears the default placeholder text
     */
    static initRowDescriptions() {
        const svgDoc = appState.getSvgDoc();
        if (!svgDoc) return;

        // Clear the placeholder text from all row descriptions
        for (let i = 1; i <= 4; i++) {
            const textElement = svgDoc.querySelector(`#row-desc-${i}`);
            if (textElement) {
                textElement.textContent = '';
            }
        }
    }
}
