/**
 * Title Editor Module
 * Handles title text editing and styling
 */

import { appState } from '../services/stateManager.js';
import { UIManager } from './uiManager.js';

// Default line spacing multiplier for multiline text
const DEFAULT_LINE_SPACING = 1.2;

export class TitleEditor {
    /**
     * Set multiline text content on an SVG text element using tspan elements
     * @param {SVGTextElement} textElement - The text element to update
     * @param {string} text - Text with | as line separator
     * @param {number} fontSize - Current font size for calculating line spacing
     */
    static setMultilineText(textElement, text, fontSize) {
        // Clear existing content
        textElement.textContent = '';

        const lines = text.split('|').map(line => line.trim());
        const lineSpacing = fontSize * DEFAULT_LINE_SPACING;

        // Calculate vertical offset to center multiple lines
        // For n lines, offset the first line upward by (n-1)/2 * lineSpacing
        const totalHeight = (lines.length - 1) * lineSpacing;
        const startOffset = -totalHeight / 2;

        lines.forEach((line, index) => {
            const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
            tspan.textContent = line;
            tspan.setAttribute('x', textElement.getAttribute('x'));

            if (index === 0) {
                // First line: apply centering offset
                tspan.setAttribute('dy', startOffset + 'px');
            } else {
                // Subsequent lines: move down by line spacing
                tspan.setAttribute('dy', lineSpacing + 'px');
            }

            textElement.appendChild(tspan);
        });
    }

    /**
     * Update title text
     */
    static updateTitle() {
        const title = document.getElementById('title').value;
        const svgDoc = appState.getSvgDoc();
        const titleElement = svgDoc?.querySelector('#title-text');
        const fontSize = parseFloat(document.getElementById('title-font-size')?.value || '2');

        if (titleElement) {
            TitleEditor.setMultilineText(titleElement, title || 'TITLE', fontSize);
            titleElement.style.fill = UIManager.getSelectedFontColor();
            titleElement.style.dominantBaseline = 'central';
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
        const title = document.getElementById('title')?.value || 'TITLE';

        if (titleElement) {
            // Re-render multiline text with new spacing
            TitleEditor.setMultilineText(titleElement, title, size);
            titleElement.style.fontSize = size + 'px';
            titleElement.style.fill = UIManager.getSelectedFontColor();
            titleElement.style.dominantBaseline = 'central';

            // Center the text vertically in the title box
            // Title box is at y=2.5 with height=10.5, so center is at y=7.75
            const baseY = 7.75;
            titleElement.setAttribute('y', baseY.toFixed(2));
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

    /**
     * Update copyright text
     */
    static updateCopyrightText() {
        const text = document.getElementById('copyright-input').value;
        const svgDoc = appState.getSvgDoc();
        const copyrightElement = svgDoc?.querySelector('#copyright-text');
        const fontSize = parseFloat(document.getElementById('copyright-font-size')?.value || '2');

        if (copyrightElement) {
            TitleEditor.setMultilineText(copyrightElement, text || '© Copyright Year & Printing Info.', fontSize);
            copyrightElement.style.dominantBaseline = 'central';
        }
    }

    /**
     * Update copyright text color
     */
    static updateCopyrightColor() {
        const color = document.getElementById('copyright-color').value;
        const svgDoc = appState.getSvgDoc();
        const copyrightElement = svgDoc?.querySelector('#copyright-text');
        if (copyrightElement) {
            copyrightElement.style.fill = color;
        }
    }

    /**
     * Update copyright font size
     */
    static updateCopyrightSize() {
        const size = parseFloat(document.getElementById('copyright-font-size').value);
        document.getElementById('copyright-font-size-value').textContent = size;
        const svgDoc = appState.getSvgDoc();
        const copyrightElement = svgDoc?.querySelector('#copyright-text');
        const text = document.getElementById('copyright-input')?.value || '© Copyright Year & Printing Info.';

        if (copyrightElement) {
            // Re-render multiline text with new spacing
            TitleEditor.setMultilineText(copyrightElement, text, size);
            copyrightElement.style.fontSize = size + 'px';
            copyrightElement.style.dominantBaseline = 'central';
        }
    }
}
