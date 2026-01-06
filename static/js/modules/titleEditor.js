/**
 * Title Editor Module
 * Handles title text editing and styling
 */

import { appState } from '../services/stateManager.js';
import { UIManager } from './uiManager.js';

export class TitleEditor {
    /**
     * Update title text
     */
    static updateTitle() {
        const title = document.getElementById('title').value;
        const svgDoc = appState.getSvgDoc();
        const titleElement = svgDoc?.querySelector('#title-text');
        if (titleElement) {
            titleElement.textContent = title || 'TITLE';
            titleElement.style.fill = UIManager.getSelectedFontColor();
        }
    }

    /**
     * Update title color
     */
    static updateTitleColor() {
        const svgDoc = appState.getSvgDoc();
        const titleElement = svgDoc?.querySelector('#title-text');
        if (titleElement) {
            titleElement.style.fill = UIManager.getSelectedFontColor();
        }
    }

    /**
     * Update title font size
     */
    static updateTitleSize() {
        const size = parseFloat(document.getElementById('title-font-size').value);
        document.getElementById('title-font-size-value').textContent = size;
        const svgDoc = appState.getSvgDoc();
        const titleElement = svgDoc?.querySelector('#title-text');
        if (titleElement) {
            titleElement.style.fontSize = size + 'px';
            titleElement.style.fill = UIManager.getSelectedFontColor();

            // Center the text vertically in the title box
            // Title box is at y=3.5 with height=9, so center is at y=8
            // Adjust based on font size (approximate baseline offset)
            const baseY = 8;  // Center Y of title box
            const baselineOffset = size * 0.35;  // Approximate text baseline offset
            const centeredY = baseY + baselineOffset;
            titleElement.setAttribute('y', centeredY.toFixed(2));
        }
    }

    /**
     * Update title background
     */
    static updateTitleBackground() {
        const enabled = document.getElementById('title-bg-enabled').checked;
        if (enabled) {
            TitleEditor.toggleTitleBackground();
        }
    }

    /**
     * Toggle title background visibility
     */
    static toggleTitleBackground() {
        const svgDoc = appState.getSvgDoc();
        const bgElement = svgDoc?.querySelector('#title-background');
        if (!bgElement) return;

        const enabled = document.getElementById('title-bg-enabled').checked;
        const color = document.getElementById('title-bg-color').value;

        if (enabled) {
            bgElement.setAttribute('fill', color);
        } else {
            bgElement.setAttribute('fill', 'none');
        }
    }
}
