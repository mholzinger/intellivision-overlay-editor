/**
 * Bottom Controls Module
 * Handles bottom text and arrow styling
 */

import { appState } from '../services/stateManager.js';

export class BottomControls {
    /**
     * Update bottom text
     */
    static updateBottomText() {
        const value = document.getElementById('bottom-text-input').value;
        const svgDoc = appState.getSvgDoc();
        const textElement = svgDoc?.querySelector('#bottom-text');
        if (textElement) {
            textElement.textContent = value || 'DIRECTION';
        }
    }

    /**
     * Update bottom text color
     */
    static updateBottomTextColor() {
        const color = document.getElementById('bottom-text-color').value;
        const svgDoc = appState.getSvgDoc();
        const textElement = svgDoc?.querySelector('#bottom-text');
        if (textElement) {
            textElement.style.fill = color;
        }
    }

    /**
     * Update bottom text size
     */
    static updateBottomTextSize() {
        const size = parseFloat(document.getElementById('bottom-text-size').value);
        document.getElementById('bottom-text-size-value').textContent = size;
        const svgDoc = appState.getSvgDoc();
        const textElement = svgDoc?.querySelector('#bottom-text');
        if (textElement) {
            textElement.style.fontSize = size + 'px';
        }
    }

    /**
     * Update bottom arrow color
     */
    static updateBottomArrowColor() {
        const enabled = document.getElementById('bottom-arrow-fill-enabled').checked;
        if (enabled) {
            BottomControls.toggleBottomArrowFill();
        }
    }

    /**
     * Toggle bottom arrow fill
     */
    static toggleBottomArrowFill() {
        const enabled = document.getElementById('bottom-arrow-fill-enabled').checked;
        const color = document.getElementById('bottom-arrow-color').value;
        const svgDoc = appState.getSvgDoc();

        const arrowIds = ['disc-left-arrow', 'disc-right-arrow'];
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
}
