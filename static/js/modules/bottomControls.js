/**
 * Bottom Controls Module
 * Handles bottom text and arrow styling
 */

import { appState } from '../services/stateManager.js';
import { UIManager } from './uiManager.js';
import { TextUtils } from '../utils/textUtils.js';
import { UIHelpers } from '../utils/uiHelpers.js';
import { SVGHelpers } from '../utils/svgHelpers.js';

// Base position for bottom text
const BOTTOM_TEXT_BASE = { x: 27.3, y: 85.8 };

export class BottomControls {
    /**
     * Update bottom text
     */
    static updateBottomText() {
        const value = UIHelpers.getTextValue('bottom-text-input');
        const svgDoc = appState.getSvgDoc();
        const textElement = svgDoc?.querySelector('#bottom-text');
        const fontSize = UIHelpers.getNumericValue('bottom-text-size', null, 1, 1.2);

        if (textElement) {
            TextUtils.setMultilineText(textElement, value, fontSize);
            BottomControls.applyBottomTextStyling(textElement);
        }
    }

    /**
     * Apply styling to bottom text element (supports gradient)
     * @param {SVGTextElement} textElement - The text element to style
     */
    static applyBottomTextStyling(textElement) {
        if (!textElement) return;

        const size = UIHelpers.getNumericValue('bottom-text-size', null, 1, 1.2);
        const styles = TextUtils.getTextStyles('bottom-text');

        SVGHelpers.applyTextStyling(textElement, {
            fill: UIManager.getBottomTextFillValue(),
            fontSize: size,
            ...styles
        });
    }

    /**
     * Update bottom text style (bold, italic, underline)
     */
    static updateBottomTextStyle() {
        const svgDoc = appState.getSvgDoc();
        const textElement = svgDoc?.querySelector('#bottom-text');
        if (textElement) {
            BottomControls.applyBottomTextStyling(textElement);
        }
    }

    /**
     * Update bottom text color
     */
    static updateBottomTextColor() {
        const svgDoc = appState.getSvgDoc();
        const textElement = svgDoc?.querySelector('#bottom-text');
        if (textElement) {
            BottomControls.applyBottomTextStyling(textElement);
        }
    }

    /**
     * Update bottom text size
     */
    static updateBottomTextSize() {
        const size = UIHelpers.getNumericValue('bottom-text-size', 'bottom-text-size-value', 0);
        const value = UIHelpers.getTextValue('bottom-text-input');
        const svgDoc = appState.getSvgDoc();
        const textElement = svgDoc?.querySelector('#bottom-text');

        if (textElement) {
            TextUtils.setMultilineText(textElement, value, size);
            BottomControls.applyBottomTextStyling(textElement);
            BottomControls.updateBottomTextPosition();
        }
    }

    /**
     * Update bottom text position with X/Y offset
     */
    static updateBottomTextPosition() {
        const svgDoc = appState.getSvgDoc();
        const textElement = svgDoc?.querySelector('#bottom-text');
        if (!textElement) return;

        const offset = UIHelpers.getOffsetValues('bottom-text');
        UIHelpers.updateOffsetDisplays('bottom-text', offset.x, offset.y);

        const newPos = SVGHelpers.calculatePosition(BOTTOM_TEXT_BASE, offset);
        SVGHelpers.updateTextPosition(textElement, newPos.x, newPos.y);
    }

    /**
     * Update bottom arrow color
     */
    static updateBottomArrowColor() {
        if (UIHelpers.getCheckboxValue('bottom-arrow-fill-enabled')) {
            BottomControls.toggleBottomArrowFill();
        }
    }

    /**
     * Toggle bottom arrow fill
     */
    static toggleBottomArrowFill() {
        const enabled = UIHelpers.getCheckboxValue('bottom-arrow-fill-enabled');
        const color = UIHelpers.getColorValue('bottom-arrow-color');
        const svgDoc = appState.getSvgDoc();

        SVGHelpers.toggleElements(svgDoc, ['disc-left-arrow', 'disc-right-arrow'], enabled, {
            fill: color
        });
    }

    /**
     * Update disc arrow stroke color and width
     */
    static updateDiscArrowStroke() {
        const color = UIHelpers.getColorValue('disc-arrow-stroke-color', '#000000');
        const width = UIHelpers.getNumericValue('disc-arrow-stroke-width', 'disc-arrow-stroke-width-value', 2, 0.2);
        const svgDoc = appState.getSvgDoc();

        const arrowIds = ['disc-left-arrow', 'disc-right-arrow'];
        arrowIds.forEach(arrowId => {
            const arrow = svgDoc?.querySelector(`#${arrowId}`);
            if (arrow) {
                arrow.setAttribute('stroke', color);
                arrow.setAttribute('stroke-width', width.toString());
            }
        });
    }

    /**
     * Disc arrow center positions for transform origin calculation
     */
    static DISC_ARROW_CENTERS = {
        'disc-left-arrow': { x: 16, y: 85.25 },
        'disc-right-arrow': { x: 38.6, y: 85.25 }
    };

    /**
     * Update disc arrow transforms (scale, position, spacing, visibility)
     */
    static updateDiscArrowTransforms() {
        const svgDoc = appState.getSvgDoc();
        if (!svgDoc) return;

        // Get control values
        const visible = UIHelpers.getCheckboxValue('disc-arrows-visible', true);
        const scale = UIHelpers.getNumericValue('disc-arrows-scale', 'disc-arrows-scale-value', 0, 100) / 100;
        const spacing = UIHelpers.getNumericValue('disc-arrows-spacing', 'disc-arrows-spacing-value', 1, 0);
        const offsetX = UIHelpers.getNumericValue('disc-arrows-x', 'disc-arrows-x-value', 1, 0);
        const offsetY = UIHelpers.getNumericValue('disc-arrows-y', 'disc-arrows-y-value', 1, 0);

        // Apply transforms to disc arrows
        const leftArrow = svgDoc.querySelector('#disc-left-arrow');
        const rightArrow = svgDoc.querySelector('#disc-right-arrow');

        if (leftArrow) {
            SVGHelpers.applyScaleTransform(
                leftArrow,
                BottomControls.DISC_ARROW_CENTERS['disc-left-arrow'],
                scale,
                offsetX - spacing,
                offsetY,
                visible
            );
        }

        if (rightArrow) {
            SVGHelpers.applyScaleTransform(
                rightArrow,
                BottomControls.DISC_ARROW_CENTERS['disc-right-arrow'],
                scale,
                offsetX + spacing,
                offsetY,
                visible
            );
        }
    }
}
