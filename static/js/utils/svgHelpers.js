/**
 * SVG Helpers Module
 * Shared functions for SVG element manipulation
 */

export class SVGHelpers {
    /**
     * Update text element position and its tspan children.
     *
     * @param {SVGTextElement} textElement - The SVG text element
     * @param {number} x - New x coordinate
     * @param {number} y - New y coordinate
     */
    static updateTextPosition(textElement, x, y) {
        textElement.setAttribute('x', x);
        textElement.setAttribute('y', y);

        // Update tspan x coordinates for multiline text
        textElement.querySelectorAll('tspan').forEach(tspan => {
            tspan.setAttribute('x', x);
        });
    }

    /**
     * Apply common text styling to an SVG text element.
     *
     * @param {SVGTextElement} element - The SVG text element
     * @param {Object} config - Style configuration
     * @param {string} config.fill - Fill color
     * @param {number} config.fontSize - Font size in pixels
     * @param {string} config.fontFamily - Font family name
     * @param {boolean} config.bold - Whether text is bold
     * @param {boolean} config.italic - Whether text is italic
     * @param {boolean} config.underline - Whether text is underlined
     * @param {string} config.dominantBaseline - Dominant baseline (default: 'central')
     * @param {string} config.textAnchor - Text anchor (default: 'middle')
     */
    static applyTextStyling(element, config) {
        const {
            fill,
            fontSize,
            fontFamily,
            bold = false,
            italic = false,
            underline = false,
            dominantBaseline = 'central',
            textAnchor
        } = config;

        if (fill !== undefined) element.style.fill = fill;
        if (fontSize !== undefined) element.style.fontSize = `${fontSize}px`;
        if (fontFamily !== undefined) element.style.fontFamily = fontFamily;
        if (dominantBaseline) element.style.dominantBaseline = dominantBaseline;
        if (textAnchor) element.style.textAnchor = textAnchor;

        element.style.fontWeight = bold ? 'bold' : 'normal';
        element.style.fontStyle = italic ? 'italic' : 'normal';
        element.style.textDecoration = underline ? 'underline' : 'none';
    }

    /**
     * Toggle visibility and attributes on multiple SVG elements.
     *
     * @param {Document} svgDoc - The SVG document
     * @param {string[]} elementIds - Array of element IDs to update
     * @param {boolean} enabled - Whether elements are enabled/visible
     * @param {Object} attributes - Attributes to set when enabled
     */
    static toggleElements(svgDoc, elementIds, enabled, attributes = {}) {
        elementIds.forEach(id => {
            const element = svgDoc?.querySelector(`#${id}`);
            if (!element) return;

            if (enabled) {
                Object.entries(attributes).forEach(([key, value]) => {
                    element.setAttribute(key, value);
                });
            } else {
                // Set fill and stroke to none when disabled
                if (attributes.fill !== undefined) element.setAttribute('fill', 'none');
                if (attributes.stroke !== undefined) element.setAttribute('stroke', 'none');
            }
        });
    }

    /**
     * Apply a transform with scale and translation around a center point.
     *
     * @param {SVGElement} element - The SVG element to transform
     * @param {Object} center - Center point { x, y }
     * @param {number} scale - Scale factor
     * @param {number} offsetX - X offset
     * @param {number} offsetY - Y offset
     * @param {boolean} visible - Whether element is visible
     */
    static applyScaleTransform(element, center, scale, offsetX, offsetY, visible = true) {
        element.style.display = visible ? '' : 'none';
        if (!visible || !center) return;

        // Calculate translation to scale around center point
        const tx = (1 - scale) * center.x + offsetX;
        const ty = (1 - scale) * center.y + offsetY;

        element.setAttribute('transform', `translate(${tx}, ${ty}) scale(${scale})`);
    }

    /**
     * Set visibility of an SVG element.
     *
     * @param {SVGElement} element - The SVG element
     * @param {boolean} visible - Whether element is visible
     */
    static setVisibility(element, visible) {
        if (element) {
            element.style.display = visible ? '' : 'none';
        }
    }

    /**
     * Get or create a style element in an SVG document.
     *
     * @param {Document} svgDoc - The SVG document
     * @param {string} styleId - The ID for the style element
     * @param {Element} parentElement - Parent to append to (optional, defaults to svgDoc)
     * @returns {SVGStyleElement} The style element
     */
    static getOrCreateStyle(svgDoc, styleId, parentElement = null) {
        let styleEl = svgDoc.querySelector(`#${styleId}`);
        if (!styleEl) {
            styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
            styleEl.setAttribute('id', styleId);
            const parent = parentElement || svgDoc;
            if (parent === svgDoc) {
                svgDoc.insertBefore(styleEl, svgDoc.firstChild);
            } else {
                parent.appendChild(styleEl);
            }
        }
        return styleEl;
    }

    /**
     * Calculate position with offset.
     *
     * @param {Object} basePos - Base position { x, y }
     * @param {Object} offset - Offset { x, y }
     * @param {number} precision - Decimal places (default: 2)
     * @returns {Object} { x, y } as formatted strings
     */
    static calculatePosition(basePos, offset, precision = 2) {
        return {
            x: (basePos.x + offset.x).toFixed(precision),
            y: (basePos.y + offset.y).toFixed(precision)
        };
    }

    /**
     * Batch update positions for multiple elements.
     *
     * @param {Document} svgDoc - The SVG document
     * @param {Object} positions - Map of element ID to base position { x, y }
     * @param {Object} offset - Offset to apply { x, y }
     * @param {Function} callback - Optional callback(element, newPos) for additional updates
     */
    static batchUpdatePositions(svgDoc, positions, offset, callback = null) {
        Object.entries(positions).forEach(([id, basePos]) => {
            const element = svgDoc?.querySelector(`#${id}`);
            if (!element) return;

            const newPos = SVGHelpers.calculatePosition(basePos, offset);
            element.setAttribute('x', newPos.x);
            element.setAttribute('y', newPos.y);

            // Update tspans if it's a text element
            element.querySelectorAll?.('tspan').forEach(tspan => {
                tspan.setAttribute('x', newPos.x);
            });

            if (callback) {
                callback(element, newPos);
            }
        });
    }
}
