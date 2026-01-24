/**
 * Text Utilities Module
 * Shared text rendering and styling functions for SVG text elements
 */

// Default line spacing multiplier for multiline text
const DEFAULT_LINE_SPACING = 1.2;

export class TextUtils {
    /**
     * Set multiline text on an SVG text element using tspan elements.
     * Lines are split by the '|' character.
     *
     * @param {SVGTextElement} textElement - The SVG text element
     * @param {string} text - The text content (use '|' for line breaks)
     * @param {number} fontSize - Font size in pixels
     * @param {Object} options - Optional settings
     * @param {boolean} options.centerVertically - If true, centers text block vertically (default: false)
     * @param {number} options.lineSpacing - Line spacing multiplier (default: 1.2)
     */
    static setMultilineText(textElement, text, fontSize, options = {}) {
        const { centerVertically = false, lineSpacing = DEFAULT_LINE_SPACING } = options;

        // Clear existing content
        textElement.textContent = '';

        const lines = text.split('|').map(line => line.trim());
        const lineHeight = fontSize * lineSpacing;
        const x = textElement.getAttribute('x');

        if (centerVertically && lines.length > 1) {
            // Calculate vertical offset to center the text block
            const totalHeight = (lines.length - 1) * lineHeight;
            const startOffset = -totalHeight / 2;

            lines.forEach((line, index) => {
                const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                tspan.textContent = line;
                tspan.setAttribute('x', x);

                if (index === 0) {
                    tspan.setAttribute('dy', `${startOffset}px`);
                } else {
                    tspan.setAttribute('dy', `${lineHeight}px`);
                }

                textElement.appendChild(tspan);
            });
        } else {
            // Sequential positioning (first line at element position)
            lines.forEach((line, index) => {
                const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                tspan.textContent = line;
                tspan.setAttribute('x', x);

                if (index === 0) {
                    tspan.setAttribute('dy', '0');
                } else {
                    tspan.setAttribute('dy', `${lineHeight}px`);
                }

                textElement.appendChild(tspan);
            });
        }
    }

    /**
     * Apply text styling (bold, italic, underline) to an element.
     * Reads checkbox states from DOM elements with the given prefix.
     *
     * @param {Element} element - The element to style
     * @param {string} prefix - The ID prefix for checkboxes (e.g., 'title' for 'title-bold')
     */
    static applyTextStyles(element, prefix) {
        const isBold = document.getElementById(`${prefix}-bold`)?.checked || false;
        const isItalic = document.getElementById(`${prefix}-italic`)?.checked || false;
        const isUnderline = document.getElementById(`${prefix}-underline`)?.checked || false;

        element.style.fontWeight = isBold ? 'bold' : 'normal';
        element.style.fontStyle = isItalic ? 'italic' : 'normal';
        element.style.textDecoration = isUnderline ? 'underline' : 'none';
    }

    /**
     * Apply text styling with explicit values (no DOM lookup).
     *
     * @param {Element} element - The element to style
     * @param {Object} styles - Style settings
     * @param {boolean} styles.bold - Whether text is bold
     * @param {boolean} styles.italic - Whether text is italic
     * @param {boolean} styles.underline - Whether text is underlined
     */
    static applyTextStylesDirect(element, { bold = false, italic = false, underline = false }) {
        element.style.fontWeight = bold ? 'bold' : 'normal';
        element.style.fontStyle = italic ? 'italic' : 'normal';
        element.style.textDecoration = underline ? 'underline' : 'none';
    }

    /**
     * Get text style values from DOM checkboxes.
     *
     * @param {string} prefix - The ID prefix for checkboxes
     * @returns {Object} { bold, italic, underline }
     */
    static getTextStyles(prefix) {
        return {
            bold: document.getElementById(`${prefix}-bold`)?.checked || false,
            italic: document.getElementById(`${prefix}-italic`)?.checked || false,
            underline: document.getElementById(`${prefix}-underline`)?.checked || false
        };
    }

    /**
     * Update tspan x coordinates when text position changes.
     *
     * @param {SVGTextElement} textElement - The SVG text element
     * @param {string|number} x - The new x coordinate
     */
    static updateTspanPositions(textElement, x) {
        textElement.querySelectorAll('tspan').forEach(tspan => {
            tspan.setAttribute('x', x);
        });
    }
}
