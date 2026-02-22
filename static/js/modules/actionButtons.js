/**
 * Action Buttons Module
 * Handles action button labels and arrow styling
 */

import { appState } from '../services/stateManager.js';
import { UIManager } from './uiManager.js';
import { FontManager } from './fontManager.js';
import { TextUtils } from '../utils/textUtils.js';
import { UIHelpers } from '../utils/uiHelpers.js';
import { SVGHelpers } from '../utils/svgHelpers.js';

// Base positions for action labels (rotated text along edges)
const LABEL_POSITIONS = {
    'top-left-label': { x: 2.82, y: 45.06 },
    'top-right-label': { x: 47.78, y: 45.19 },
    'bottom-left-label': { x: 4.4, y: 65.33 },
    'bottom-right-label': { x: 50.28, y: 66.13 }
};

// Action description positions
const DESC_POSITIONS = {
    'left': { x: 2.0, y: 55.0 },
    'right': { x: 53.6, y: 55.0 }
};

// Arrow center positions for transform origin calculation
const ARROW_CENTERS = {
    'top-left-arrow': { x: 4.1, y: 48.39 },
    'top-right-arrow': { x: 50.04, y: 48.39 },
    'bottom-left-arrow': { x: 4.1, y: 63.53 },
    'bottom-right-arrow': { x: 49.95, y: 63.53 }
};

export class ActionButtons {
    /**
     * Set multiline text content on an SVG text element using tspan elements
     * @param {SVGTextElement} textElement - The text element to update
     * @param {string} text - Text with | as line separator
     * @param {string} side - 'left' or 'right' to determine line stacking direction
     * @param {number} fontSize - Current font size for calculating line spacing
     */
    static setMultilineText(textElement, text, side, fontSize) {
        // Use shared TextUtils but with sequential (not centered) positioning
        TextUtils.setMultilineText(textElement, text, fontSize, { centerVertically: false });
    }

    /**
     * Update action button label
     * @param {string} position - Position ('top', 'bottom-left', 'bottom-right')
     */
    static updateActionButton(position) {
        const value = UIHelpers.getTextValue(`action-${position}`);
        const svgDoc = appState.getSvgDoc();
        const fontSize = UIHelpers.getNumericValue('action-label-size', null, 1, 2);

        if (position === 'top') {
            // Update both top-left and top-right labels
            const topLeftLabel = svgDoc?.querySelector('#top-left-label');
            const topRightLabel = svgDoc?.querySelector('#top-right-label');
            if (topLeftLabel) {
                ActionButtons.setMultilineText(topLeftLabel, value, 'left', fontSize);
                ActionButtons.applyActionButtonStyling(topLeftLabel);
            }
            if (topRightLabel) {
                ActionButtons.setMultilineText(topRightLabel, value, 'right', fontSize);
                ActionButtons.applyActionButtonStyling(topRightLabel);
            }
        } else {
            // Update individual bottom labels
            const labelElement = svgDoc?.querySelector(`#${position}-label`);
            const side = position.includes('left') ? 'left' : 'right';
            if (labelElement) {
                ActionButtons.setMultilineText(labelElement, value, side, fontSize);
                ActionButtons.applyActionButtonStyling(labelElement);
            }
        }
    }

    /**
     * Apply styling to action button element
     * @param {Element} element - SVG element to style
     */
    static applyActionButtonStyling(element) {
        if (!element) return;

        const size = UIHelpers.getNumericValue('action-label-size', null, 1, 2);
        const fontSelect = document.getElementById('action-font-select');
        let fontFamily = 'Arial, sans-serif';

        if (fontSelect?.value) {
            try {
                const { fontFamily: parsedFamily } = FontManager.parseFontData(fontSelect.value);
                fontFamily = parsedFamily;
            } catch (e) {
                console.error('Error parsing action button font:', e);
            }
        }

        const styles = TextUtils.getTextStyles('action-label');

        SVGHelpers.applyTextStyling(element, {
            fill: UIManager.getActionLabelFillValue(),
            fontSize: size,
            fontFamily: fontFamily,
            ...styles
        });
    }

    /**
     * Update all action button labels
     */
    static updateAllActionButtons() {
        const size = UIHelpers.getNumericValue('action-label-size', 'action-label-size-value', 1, 2);
        const svgDoc = appState.getSvgDoc();
        if (!svgDoc) return;

        // Get individual offsets for each action label group
        const topOffset = {
            x: UIHelpers.getNumericValue('action-top-offset-x', 'action-top-offset-x-value', 1, 0),
            y: UIHelpers.getNumericValue('action-top-offset-y', 'action-top-offset-y-value', 1, 0)
        };
        const bottomLeftOffset = {
            x: UIHelpers.getNumericValue('action-bottom-left-offset-x', 'action-bottom-left-offset-x-value', 1, 0),
            y: UIHelpers.getNumericValue('action-bottom-left-offset-y', 'action-bottom-left-offset-y-value', 1, 0)
        };
        const bottomRightOffset = {
            x: UIHelpers.getNumericValue('action-bottom-right-offset-x', 'action-bottom-right-offset-x-value', 1, 0),
            y: UIHelpers.getNumericValue('action-bottom-right-offset-y', 'action-bottom-right-offset-y-value', 1, 0)
        };

        // Map label IDs to their offset values
        const labelOffsets = {
            'top-left-label': topOffset,
            'top-right-label': topOffset,
            'bottom-left-label': bottomLeftOffset,
            'bottom-right-label': bottomRightOffset
        };

        // Update all four action button labels
        Object.entries(LABEL_POSITIONS).forEach(([labelId, pos]) => {
            const labelElement = svgDoc.querySelector(`#${labelId}`);
            if (labelElement) {
                const offset = labelOffsets[labelId];
                const isLeft = labelId.includes('left');

                // For rotated text: X offset affects vertical position, Y offset affects horizontal
                const newX = (pos.x + (isLeft ? offset.y : -offset.y)).toFixed(2);
                const newY = (pos.y + offset.x).toFixed(2);

                labelElement.setAttribute('x', newX);
                labelElement.setAttribute('y', newY);
                TextUtils.updateTspanPositions(labelElement, newX);
                ActionButtons.applyActionButtonStyling(labelElement);
            }
        });

        // Get individual offsets for action descriptions
        const descLeftOffset = {
            x: UIHelpers.getNumericValue('action-desc-left-offset-x', 'action-desc-left-offset-x-value', 1, 0),
            y: UIHelpers.getNumericValue('action-desc-left-offset-y', 'action-desc-left-offset-y-value', 1, 0)
        };
        const descRightOffset = {
            x: UIHelpers.getNumericValue('action-desc-right-offset-x', 'action-desc-right-offset-x-value', 1, 0),
            y: UIHelpers.getNumericValue('action-desc-right-offset-y', 'action-desc-right-offset-y-value', 1, 0)
        };

        const descOffsets = { 'left': descLeftOffset, 'right': descRightOffset };

        // Update action descriptions with individual offsets
        ['left', 'right'].forEach(side => {
            const descElement = svgDoc.querySelector(`#action-desc-${side}`);
            const value = UIHelpers.getTextValue(`action-desc-${side}-input`);

            if (descElement) {
                const pos = DESC_POSITIONS[side];
                const offset = descOffsets[side];
                const isLeft = side === 'left';

                // Same rotation logic as labels
                const newX = (pos.x + (isLeft ? offset.y : -offset.y)).toFixed(2);
                const newY = (pos.y + offset.x).toFixed(2);

                descElement.setAttribute('x', newX);
                descElement.setAttribute('y', newY);

                ActionButtons.setMultilineText(descElement, value, side, size);
                TextUtils.updateTspanPositions(descElement, newX);
                ActionButtons.applyActionButtonStyling(descElement);
            }
        });
    }

    /**
     * Update action arrow color
     */
    static updateActionArrowColor() {
        if (UIHelpers.getCheckboxValue('action-arrow-fill-enabled')) {
            ActionButtons.toggleActionArrowFill();
        }
    }

    /**
     * Toggle action arrow fill
     */
    static toggleActionArrowFill() {
        const enabled = UIHelpers.getCheckboxValue('action-arrow-fill-enabled');
        const color = UIHelpers.getColorValue('action-arrow-color');
        const svgDoc = appState.getSvgDoc();

        SVGHelpers.toggleElements(svgDoc,
            ['top-left-arrow', 'top-right-arrow', 'bottom-left-arrow', 'bottom-right-arrow'],
            enabled, { fill: color });
    }

    /**
     * Update action arrow stroke color and width
     */
    static updateActionArrowStroke() {
        const color = UIHelpers.getColorValue('action-arrow-stroke-color', '#000000');
        const width = UIHelpers.getNumericValue('action-arrow-stroke-width', 'action-arrow-stroke-width-value', 2, 0.2);
        const svgDoc = appState.getSvgDoc();

        const arrowIds = ['top-left-arrow', 'top-right-arrow', 'bottom-left-arrow', 'bottom-right-arrow'];
        arrowIds.forEach(arrowId => {
            const arrow = svgDoc?.querySelector(`#${arrowId}`);
            if (arrow) {
                arrow.setAttribute('stroke', color);
                arrow.setAttribute('stroke-width', width.toString());
            }
        });
    }

    /**
     * Update action arrow transforms (scale, position, visibility)
     */
    static updateActionArrowTransforms() {
        const svgDoc = appState.getSvgDoc();
        if (!svgDoc) return;

        // Top arrows (linked controls)
        const topVisible = UIHelpers.getCheckboxValue('top-arrows-visible', true);
        const topScale = UIHelpers.getNumericValue('top-arrows-scale', 'top-arrows-scale-value', 0, 100) / 100;
        const topX = UIHelpers.getNumericValue('top-arrows-x', 'top-arrows-x-value', 1, 0);
        const topY = UIHelpers.getNumericValue('top-arrows-y', 'top-arrows-y-value', 1, 0);

        // Apply to top-left and top-right arrows (mirror X offset so arrows move symmetrically)
        ['top-left-arrow', 'top-right-arrow'].forEach(arrowId => {
            const arrow = svgDoc.querySelector(`#${arrowId}`);
            if (arrow) {
                const mirroredX = arrowId === 'top-right-arrow' ? -topX : topX;
                SVGHelpers.applyScaleTransform(arrow, ARROW_CENTERS[arrowId], topScale, mirroredX, topY, topVisible);
            }
        });

        // Bottom-left arrow (independent controls)
        const bottomLeftVisible = UIHelpers.getCheckboxValue('bottom-left-arrow-visible', true);
        const bottomLeftScale = UIHelpers.getNumericValue('bottom-left-arrow-scale', 'bottom-left-arrow-scale-value', 0, 100) / 100;
        const bottomLeftX = UIHelpers.getNumericValue('bottom-left-arrow-x', 'bottom-left-arrow-x-value', 1, 0);
        const bottomLeftY = UIHelpers.getNumericValue('bottom-left-arrow-y', 'bottom-left-arrow-y-value', 1, 0);

        const bottomLeftArrow = svgDoc.querySelector('#bottom-left-arrow');
        if (bottomLeftArrow) {
            SVGHelpers.applyScaleTransform(bottomLeftArrow, ARROW_CENTERS['bottom-left-arrow'],
                bottomLeftScale, bottomLeftX, bottomLeftY, bottomLeftVisible);
        }

        // Bottom-right arrow (independent controls)
        const bottomRightVisible = UIHelpers.getCheckboxValue('bottom-right-arrow-visible', true);
        const bottomRightScale = UIHelpers.getNumericValue('bottom-right-arrow-scale', 'bottom-right-arrow-scale-value', 0, 100) / 100;
        const bottomRightX = UIHelpers.getNumericValue('bottom-right-arrow-x', 'bottom-right-arrow-x-value', 1, 0);
        const bottomRightY = UIHelpers.getNumericValue('bottom-right-arrow-y', 'bottom-right-arrow-y-value', 1, 0);

        const bottomRightArrow = svgDoc.querySelector('#bottom-right-arrow');
        if (bottomRightArrow) {
            SVGHelpers.applyScaleTransform(bottomRightArrow, ARROW_CENTERS['bottom-right-arrow'],
                bottomRightScale, bottomRightX, bottomRightY, bottomRightVisible);
        }
    }

    /**
     * Update action button description text
     * @param {string} side - 'left' or 'right'
     */
    static updateActionDescription(side) {
        const value = UIHelpers.getTextValue(`action-desc-${side}-input`);
        const svgDoc = appState.getSvgDoc();
        const descElement = svgDoc?.querySelector(`#action-desc-${side}`);
        const fontSize = UIHelpers.getNumericValue('action-label-size', null, 1, 2);

        if (descElement) {
            ActionButtons.setMultilineText(descElement, value, side, fontSize);
            ActionButtons.applyActionButtonStyling(descElement);
        }
    }

    /**
     * Initialize action descriptions (clear placeholder text)
     */
    static initActionDescriptions() {
        const svgDoc = appState.getSvgDoc();
        if (!svgDoc) return;

        ['left', 'right'].forEach(side => {
            const descElement = svgDoc.querySelector(`#action-desc-${side}`);
            if (descElement) {
                descElement.textContent = '';
            }
        });
    }

    // Keep static reference for compatibility
    static ARROW_CENTERS = ARROW_CENTERS;
}
