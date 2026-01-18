/**
 * Action Buttons Module
 * Handles action button labels and arrow styling
 */

import { appState } from '../services/stateManager.js';
import { UIManager } from './uiManager.js';

// Default line spacing in pixels for multiline text
const DEFAULT_LINE_SPACING = 1.2;

export class ActionButtons {
    /**
     * Set multiline text content on an SVG text element using tspan elements
     * @param {SVGTextElement} textElement - The text element to update
     * @param {string} text - Text with | as line separator
     * @param {string} side - 'left' or 'right' to determine line stacking direction
     * @param {number} fontSize - Current font size for calculating line spacing
     */
    static setMultilineText(textElement, text, side, fontSize) {
        // Clear existing content
        textElement.textContent = '';

        const lines = text.split('|').map(line => line.trim());
        const lineSpacing = fontSize * DEFAULT_LINE_SPACING;

        // For rotated text on the sides:
        // Left side (rotate 90°): dy moves text perpendicular to reading direction
        // Right side (rotate -90°): dy moves text perpendicular to reading direction
        // Since text is rotated, we use dy to create horizontal spacing in final view

        lines.forEach((line, index) => {
            const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
            tspan.textContent = line;

            // For the first line, no offset. For subsequent lines, add spacing
            if (index === 0) {
                tspan.setAttribute('x', textElement.getAttribute('x'));
                tspan.setAttribute('dy', '0');
            } else {
                tspan.setAttribute('x', textElement.getAttribute('x'));
                // dy shifts perpendicular to the text baseline
                // For left side (90° rotation), positive dy moves right (toward edge)
                // For right side (-90° rotation), positive dy moves left (toward edge)
                // Both should expand toward the edges (away from center)
                tspan.setAttribute('dy', lineSpacing + 'px');
            }

            textElement.appendChild(tspan);
        });
    }

    /**
     * Update action button label
     * @param {string} position - Position ('top', 'bottom-left', 'bottom-right')
     */
    static updateActionButton(position) {
        const value = document.getElementById(`action-${position}`).value;
        const svgDoc = appState.getSvgDoc();
        const fontSize = parseFloat(document.getElementById('action-label-size').value);

        if (position === 'top') {
            // Update both top-left and top-right labels
            const topLeftLabel = svgDoc?.querySelector('#top-left-label');
            const topRightLabel = svgDoc?.querySelector('#top-right-label');
            const text = value || 'FIRE';

            if (topLeftLabel) {
                ActionButtons.setMultilineText(topLeftLabel, text, 'left', fontSize);
                ActionButtons.applyActionButtonStyling(topLeftLabel);
            }
            if (topRightLabel) {
                ActionButtons.setMultilineText(topRightLabel, text, 'right', fontSize);
                ActionButtons.applyActionButtonStyling(topRightLabel);
            }
        } else {
            // Update individual bottom labels
            const labelElement = svgDoc?.querySelector(`#${position}-label`);
            const side = position.includes('left') ? 'left' : 'right';
            if (labelElement) {
                ActionButtons.setMultilineText(labelElement, value || 'FIRE', side, fontSize);
                ActionButtons.applyActionButtonStyling(labelElement);
            }
        }
    }

    /**
     * Apply styling to action button element (supports gradient)
     * @param {Element} element - SVG element to style
     */
    static applyActionButtonStyling(element) {
        if (!element) return;

        const size = parseFloat(document.getElementById('action-label-size').value);
        const fontSelect = document.getElementById('action-font-select');
        const fontValue = fontSelect.value;
        let fontFamily = 'Arial, sans-serif';

        if (fontValue) {
            try {
                const fontData = JSON.parse(fontValue);
                fontFamily = fontData.family;
            } catch (e) {
                console.error('Error parsing action button font:', e);
            }
        }

        element.style.fill = UIManager.getActionLabelFillValue();
        element.style.fontSize = size + 'px';
        element.style.fontFamily = fontFamily;
        element.style.dominantBaseline = 'central';
    }

    /**
     * Update all action button labels
     */
    static updateAllActionButtons() {
        const size = parseFloat(document.getElementById('action-label-size').value);
        document.getElementById('action-label-size-value').textContent = size.toFixed(1);

        const svgDoc = appState.getSvgDoc();
        if (!svgDoc) return;

        // Base positions for action labels (rotated text along edges)
        const labelPositions = {
            'top-left-label': {x: 4.0, y: 44.89},
            'top-right-label': {x: 50.48, y: 44.89},
            'bottom-left-label': {x: 4.0, y: 66.03},
            'bottom-right-label': {x: 50.48, y: 66.03}
        };

        // Get individual offsets for each action label group
        // Top (both sides share the same offset)
        const topOffsetX = parseFloat(document.getElementById('action-top-offset-x')?.value || 0);
        const topOffsetY = parseFloat(document.getElementById('action-top-offset-y')?.value || 0);
        ActionButtons.updateOffsetDisplay('action-top-offset-x-value', topOffsetX);
        ActionButtons.updateOffsetDisplay('action-top-offset-y-value', topOffsetY);

        // Bottom-left (independent)
        const bottomLeftOffsetX = parseFloat(document.getElementById('action-bottom-left-offset-x')?.value || 0);
        const bottomLeftOffsetY = parseFloat(document.getElementById('action-bottom-left-offset-y')?.value || 0);
        ActionButtons.updateOffsetDisplay('action-bottom-left-offset-x-value', bottomLeftOffsetX);
        ActionButtons.updateOffsetDisplay('action-bottom-left-offset-y-value', bottomLeftOffsetY);

        // Bottom-right (independent)
        const bottomRightOffsetX = parseFloat(document.getElementById('action-bottom-right-offset-x')?.value || 0);
        const bottomRightOffsetY = parseFloat(document.getElementById('action-bottom-right-offset-y')?.value || 0);
        ActionButtons.updateOffsetDisplay('action-bottom-right-offset-x-value', bottomRightOffsetX);
        ActionButtons.updateOffsetDisplay('action-bottom-right-offset-y-value', bottomRightOffsetY);

        // Map label IDs to their offset values
        const labelOffsets = {
            'top-left-label': {x: topOffsetX, y: topOffsetY},
            'top-right-label': {x: topOffsetX, y: topOffsetY},
            'bottom-left-label': {x: bottomLeftOffsetX, y: bottomLeftOffsetY},
            'bottom-right-label': {x: bottomRightOffsetX, y: bottomRightOffsetY}
        };

        // Update all four action button labels
        const actionLabels = ['top-left-label', 'top-right-label', 'bottom-left-label', 'bottom-right-label'];
        actionLabels.forEach(labelId => {
            const labelElement = svgDoc.querySelector(`#${labelId}`);
            if (labelElement) {
                const pos = labelPositions[labelId];
                const offset = labelOffsets[labelId];
                const isLeft = labelId.includes('left');

                // For rotated text: X offset affects vertical position, Y offset affects horizontal
                // For left labels (rotated 90°), positive Y moves right (toward edge)
                // For right labels (rotated -90°), positive Y moves left (toward edge)
                const newX = (pos.x + (isLeft ? offset.y : -offset.y)).toFixed(2);
                const newY = (pos.y + offset.x).toFixed(2);

                labelElement.setAttribute('x', newX);
                labelElement.setAttribute('y', newY);

                // Update tspan x coordinates
                labelElement.querySelectorAll('tspan').forEach(tspan => {
                    tspan.setAttribute('x', newX);
                });

                ActionButtons.applyActionButtonStyling(labelElement);
            }
        });

        // Action description positions
        const descPositions = {
            'left': {x: 2.0, y: 55.0},
            'right': {x: 53.6, y: 55.0}
        };

        // Get individual offsets for action descriptions
        const descLeftOffsetX = parseFloat(document.getElementById('action-desc-left-offset-x')?.value || 0);
        const descLeftOffsetY = parseFloat(document.getElementById('action-desc-left-offset-y')?.value || 0);
        ActionButtons.updateOffsetDisplay('action-desc-left-offset-x-value', descLeftOffsetX);
        ActionButtons.updateOffsetDisplay('action-desc-left-offset-y-value', descLeftOffsetY);

        const descRightOffsetX = parseFloat(document.getElementById('action-desc-right-offset-x')?.value || 0);
        const descRightOffsetY = parseFloat(document.getElementById('action-desc-right-offset-y')?.value || 0);
        ActionButtons.updateOffsetDisplay('action-desc-right-offset-x-value', descRightOffsetX);
        ActionButtons.updateOffsetDisplay('action-desc-right-offset-y-value', descRightOffsetY);

        const descOffsets = {
            'left': {x: descLeftOffsetX, y: descLeftOffsetY},
            'right': {x: descRightOffsetX, y: descRightOffsetY}
        };

        // Update action descriptions with individual offsets
        ['left', 'right'].forEach(side => {
            const descElement = svgDoc.querySelector(`#action-desc-${side}`);
            const input = document.getElementById(`action-desc-${side}-input`);
            if (descElement && input) {
                const pos = descPositions[side];
                const offset = descOffsets[side];
                const isLeft = side === 'left';

                // Same rotation logic as labels
                const newX = (pos.x + (isLeft ? offset.y : -offset.y)).toFixed(2);
                const newY = (pos.y + offset.x).toFixed(2);

                descElement.setAttribute('x', newX);
                descElement.setAttribute('y', newY);

                ActionButtons.setMultilineText(descElement, input.value, side, size);

                // Update tspan x coordinates
                descElement.querySelectorAll('tspan').forEach(tspan => {
                    tspan.setAttribute('x', newX);
                });

                ActionButtons.applyActionButtonStyling(descElement);
            }
        });
    }

    /**
     * Helper to update offset display value
     * @param {string} elementId - ID of the display element
     * @param {number} value - Offset value
     */
    static updateOffsetDisplay(elementId, value) {
        const el = document.getElementById(elementId);
        if (el) el.textContent = value.toFixed(1);
    }

    /**
     * Update action arrow color
     */
    static updateActionArrowColor() {
        const enabled = document.getElementById('action-arrow-fill-enabled').checked;
        if (enabled) {
            ActionButtons.toggleActionArrowFill();
        }
    }

    /**
     * Toggle action arrow fill
     */
    static toggleActionArrowFill() {
        const enabled = document.getElementById('action-arrow-fill-enabled').checked;
        const color = document.getElementById('action-arrow-color').value;
        const svgDoc = appState.getSvgDoc();

        const arrowIds = ['top-left-arrow', 'top-right-arrow', 'bottom-left-arrow', 'bottom-right-arrow'];
        arrowIds.forEach(arrowId => {
            const arrow = svgDoc?.querySelector(`#${arrowId}`);
            if (arrow) {
                if (enabled) {
                    arrow.setAttribute('fill', color);
                } else {
                    arrow.setAttribute('fill', 'none');
                }
            }
        });
    }

    /**
     * Update action arrow stroke color and width
     */
    static updateActionArrowStroke() {
        const color = document.getElementById('action-arrow-stroke-color')?.value || '#000000';
        const width = parseFloat(document.getElementById('action-arrow-stroke-width')?.value) || 0.2;
        const svgDoc = appState.getSvgDoc();

        // Update display value
        const widthDisplay = document.getElementById('action-arrow-stroke-width-value');
        if (widthDisplay) widthDisplay.textContent = width.toFixed(2);

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
     * Arrow center positions for transform origin calculation
     * These are the geometric centers of each arrow polygon
     */
    static ARROW_CENTERS = {
        'top-left-arrow': { x: 4.1, y: 48.39 },
        'top-right-arrow': { x: 50.04, y: 48.39 },
        'bottom-left-arrow': { x: 4.1, y: 63.53 },
        'bottom-right-arrow': { x: 49.95, y: 63.53 }
    };

    /**
     * Update action arrow transforms (scale, position, visibility)
     * Top arrows are linked, bottom-left and bottom-right are independent
     */
    static updateActionArrowTransforms() {
        const svgDoc = appState.getSvgDoc();
        if (!svgDoc) return;

        // Top arrows (linked controls)
        const topVisible = document.getElementById('top-arrows-visible')?.checked ?? true;
        const topScale = parseFloat(document.getElementById('top-arrows-scale')?.value || 100) / 100;
        const topX = parseFloat(document.getElementById('top-arrows-x')?.value || 0);
        const topY = parseFloat(document.getElementById('top-arrows-y')?.value || 0);

        // Update display values
        ActionButtons.updateOffsetDisplay('top-arrows-scale-value', topScale * 100);
        ActionButtons.updateOffsetDisplay('top-arrows-x-value', topX);
        ActionButtons.updateOffsetDisplay('top-arrows-y-value', topY);

        // Apply to top-left and top-right arrows
        ['top-left-arrow', 'top-right-arrow'].forEach(arrowId => {
            const arrow = svgDoc.querySelector(`#${arrowId}`);
            if (arrow) {
                ActionButtons.applyArrowTransform(arrow, arrowId, topScale, topX, topY, topVisible);
            }
        });

        // Bottom-left arrow (independent controls)
        const bottomLeftVisible = document.getElementById('bottom-left-arrow-visible')?.checked ?? true;
        const bottomLeftScale = parseFloat(document.getElementById('bottom-left-arrow-scale')?.value || 100) / 100;
        const bottomLeftX = parseFloat(document.getElementById('bottom-left-arrow-x')?.value || 0);
        const bottomLeftY = parseFloat(document.getElementById('bottom-left-arrow-y')?.value || 0);

        ActionButtons.updateOffsetDisplay('bottom-left-arrow-scale-value', bottomLeftScale * 100);
        ActionButtons.updateOffsetDisplay('bottom-left-arrow-x-value', bottomLeftX);
        ActionButtons.updateOffsetDisplay('bottom-left-arrow-y-value', bottomLeftY);

        const bottomLeftArrow = svgDoc.querySelector('#bottom-left-arrow');
        if (bottomLeftArrow) {
            ActionButtons.applyArrowTransform(bottomLeftArrow, 'bottom-left-arrow', bottomLeftScale, bottomLeftX, bottomLeftY, bottomLeftVisible);
        }

        // Bottom-right arrow (independent controls)
        const bottomRightVisible = document.getElementById('bottom-right-arrow-visible')?.checked ?? true;
        const bottomRightScale = parseFloat(document.getElementById('bottom-right-arrow-scale')?.value || 100) / 100;
        const bottomRightX = parseFloat(document.getElementById('bottom-right-arrow-x')?.value || 0);
        const bottomRightY = parseFloat(document.getElementById('bottom-right-arrow-y')?.value || 0);

        ActionButtons.updateOffsetDisplay('bottom-right-arrow-scale-value', bottomRightScale * 100);
        ActionButtons.updateOffsetDisplay('bottom-right-arrow-x-value', bottomRightX);
        ActionButtons.updateOffsetDisplay('bottom-right-arrow-y-value', bottomRightY);

        const bottomRightArrow = svgDoc.querySelector('#bottom-right-arrow');
        if (bottomRightArrow) {
            ActionButtons.applyArrowTransform(bottomRightArrow, 'bottom-right-arrow', bottomRightScale, bottomRightX, bottomRightY, bottomRightVisible);
        }
    }

    /**
     * Apply transform to an arrow element
     * @param {Element} arrow - The arrow SVG element
     * @param {string} arrowId - The arrow ID for center lookup
     * @param {number} scale - Scale factor (1.0 = 100%)
     * @param {number} offsetX - X offset in mm
     * @param {number} offsetY - Y offset in mm
     * @param {boolean} visible - Whether the arrow should be visible
     */
    static applyArrowTransform(arrow, arrowId, scale, offsetX, offsetY, visible) {
        if (!arrow) return;

        // Handle visibility
        arrow.style.display = visible ? '' : 'none';

        if (!visible) return;

        const center = ActionButtons.ARROW_CENTERS[arrowId];
        if (!center) return;

        // Build transform: translate to origin, scale, translate back, then apply offset
        // transform = translate(cx + offsetX, cy + offsetY) scale(s) translate(-cx, -cy)
        // Simplified: translate((1-s)*cx + offsetX, (1-s)*cy + offsetY) scale(s)
        const tx = (1 - scale) * center.x + offsetX;
        const ty = (1 - scale) * center.y + offsetY;

        arrow.setAttribute('transform', `translate(${tx.toFixed(3)}, ${ty.toFixed(3)}) scale(${scale})`);
    }

    /**
     * Update action button description text
     * @param {string} side - 'left' or 'right'
     */
    static updateActionDescription(side) {
        const input = document.getElementById(`action-desc-${side}-input`);
        const value = input ? input.value : '';
        const svgDoc = appState.getSvgDoc();
        const descElement = svgDoc?.querySelector(`#action-desc-${side}`);
        const fontSize = parseFloat(document.getElementById('action-label-size')?.value || '2');

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
}
