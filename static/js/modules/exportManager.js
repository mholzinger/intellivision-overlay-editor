/**
 * Export Manager Module
 * Handles PNG export and overlay reset functionality
 */

import { appState } from '../services/stateManager.js';
import { UIManager } from './uiManager.js';
import { APIService } from '../services/api.js';

export class ExportManager {
    /**
     * Export the overlay as PNG with all configured settings
     */
    static async exportPNG() {
        try {
            const svgDoc = appState.getSvgDoc();
            if (!svgDoc) {
                UIManager.showStatus('No SVG loaded', 'error');
                return;
            }

            // Clone preview SVG and include page-level preview fonts (if any)
            const exportCopy = svgDoc.cloneNode(true);
            const headStyle = document.getElementById('preview-embedded-font-style');
            if (headStyle) {
                let styleEl = exportCopy.querySelector('#embedded-font-style');
                if (!styleEl) {
                    styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
                    styleEl.setAttribute('id', 'embedded-font-style');
                    exportCopy.insertBefore(styleEl, exportCopy.firstChild);
                }
                styleEl.textContent = (styleEl.textContent || '') + '\n' + headStyle.textContent;
            }

            // Ensure exported title uses selected color
            const exportTitle = exportCopy.querySelector('#title-text');
            if (exportTitle) {
                exportTitle.setAttribute('fill', UIManager.getSelectedFontColor());
            }

            // Ensure title background is applied if enabled
            const exportTitleBg = exportCopy.querySelector('#title-background');
            const bgEnabled = document.getElementById('title-bg-enabled').checked;
            if (exportTitleBg && bgEnabled) {
                const bgColor = document.getElementById('title-bg-color').value;
                exportTitleBg.setAttribute('fill', bgColor);
            } else if (exportTitleBg) {
                exportTitleBg.setAttribute('fill', 'none');
            }

            // Ensure button labels use selected styling and text content
            const buttonLabelColor = document.getElementById('button-label-color').value;
            const buttonLabelSize = document.getElementById('button-label-size').value;
            const buttonFontSelect = document.getElementById('button-font-select');
            const buttonFontValue = buttonFontSelect.value;
            let buttonFontFamily = 'Arial, sans-serif';
            if (buttonFontValue) {
                try {
                    const fontData = JSON.parse(buttonFontValue);
                    buttonFontFamily = fontData.family;
                } catch (e) {
                    console.error('Error parsing button font for export:', e);
                }
            }

            const buttonConfigs = [
                {id: 'btn-1', inputId: 'btn-input-1'},
                {id: 'btn-2', inputId: 'btn-input-2'},
                {id: 'btn-3', inputId: 'btn-input-3'},
                {id: 'btn-4', inputId: 'btn-input-4'},
                {id: 'btn-5', inputId: 'btn-input-5'},
                {id: 'btn-6', inputId: 'btn-input-6'},
                {id: 'btn-7', inputId: 'btn-input-7'},
                {id: 'btn-8', inputId: 'btn-input-8'},
                {id: 'btn-9', inputId: 'btn-input-9'},
                {id: 'btn-clear', inputId: 'btn-input-clear'},
                {id: 'btn-0', inputId: 'btn-input-0'},
                {id: 'btn-enter', inputId: 'btn-input-enter'}
            ];
            buttonConfigs.forEach(config => {
                const btnElement = exportCopy.querySelector(`#${config.id}`);
                const inputElement = document.getElementById(config.inputId);
                if (btnElement && inputElement) {
                    // Set the text content from the input field
                    btnElement.textContent = inputElement.value;
                    // Apply styling using style attribute to override CSS classes and ensure serialization
                    btnElement.setAttribute('style', `fill: ${buttonLabelColor}; font-size: ${buttonLabelSize}px; font-family: ${buttonFontFamily};`);
                }
            });

            // Ensure action button labels are applied
            // Get action button styling
            const actionLabelColor = document.getElementById('action-label-color').value;
            const actionLabelSize = document.getElementById('action-label-size').value;
            const actionFontSelect = document.getElementById('action-font-select');
            const actionFontValue = actionFontSelect.value;
            let actionFontFamily = 'Arial, sans-serif';
            if (actionFontValue) {
                try {
                    const fontData = JSON.parse(actionFontValue);
                    actionFontFamily = fontData.family;
                } catch (e) {
                    console.error('Error parsing action button font for export:', e);
                }
            }

            // Top buttons share the same label
            const topValue = document.getElementById('action-top').value || 'FIRE';
            const topLeftLabel = exportCopy.querySelector('#top-left-label');
            const topRightLabel = exportCopy.querySelector('#top-right-label');
            if (topLeftLabel) {
                topLeftLabel.textContent = topValue;
                topLeftLabel.setAttribute('style', `fill: ${actionLabelColor}; font-size: ${actionLabelSize}px; font-family: ${actionFontFamily};`);
            }
            if (topRightLabel) {
                topRightLabel.textContent = topValue;
                topRightLabel.setAttribute('style', `fill: ${actionLabelColor}; font-size: ${actionLabelSize}px; font-family: ${actionFontFamily};`);
            }

            // Bottom buttons are independent
            const bottomLeftValue = document.getElementById('action-bottom-left').value || 'FIRE';
            const bottomRightValue = document.getElementById('action-bottom-right').value || 'FIRE';
            const bottomLeftLabel = exportCopy.querySelector('#bottom-left-label');
            const bottomRightLabel = exportCopy.querySelector('#bottom-right-label');
            if (bottomLeftLabel) {
                bottomLeftLabel.textContent = bottomLeftValue;
                bottomLeftLabel.setAttribute('style', `fill: ${actionLabelColor}; font-size: ${actionLabelSize}px; font-family: ${actionFontFamily};`);
            }
            if (bottomRightLabel) {
                bottomRightLabel.textContent = bottomRightValue;
                bottomRightLabel.setAttribute('style', `fill: ${actionLabelColor}; font-size: ${actionLabelSize}px; font-family: ${actionFontFamily};`);
            }

            // Apply action arrow fill color if enabled
            const arrowFillEnabled = document.getElementById('action-arrow-fill-enabled').checked;
            const arrowFillColor = document.getElementById('action-arrow-color').value;
            const arrowIds = ['top-left-arrow', 'top-right-arrow', 'bottom-left-arrow', 'bottom-right-arrow'];
            arrowIds.forEach(arrowId => {
                const arrow = exportCopy.querySelector(`#${arrowId}`);
                if (arrow) {
                    if (arrowFillEnabled) {
                        arrow.setAttribute('fill', arrowFillColor);
                    } else {
                        arrow.setAttribute('fill', 'none');
                    }
                }
            });

            // Apply bottom arrow text and fill color if enabled
            const bottomText = document.getElementById('bottom-text-input').value || 'DIRECTION';
            const bottomTextElement = exportCopy.querySelector('#bottom-text');
            if (bottomTextElement) {
                bottomTextElement.textContent = bottomText;

                // Apply bottom text styling
                const bottomTextColor = document.getElementById('bottom-text-color').value;
                const bottomTextSize = document.getElementById('bottom-text-size').value;
                bottomTextElement.style.fill = bottomTextColor;
                bottomTextElement.style.fontSize = bottomTextSize + 'px';

                // Apply font if selected
                const bottomFontSelect = document.getElementById('bottom-text-font-select');
                if (bottomFontSelect.value) {
                    const fontData = JSON.parse(bottomFontSelect.value);
                    bottomTextElement.style.fontFamily = fontData.family;
                }
            }

            const bottomArrowFillEnabled = document.getElementById('bottom-arrow-fill-enabled').checked;
            const bottomArrowFillColor = document.getElementById('bottom-arrow-color').value;
            const bottomArrowIds = ['disc-left-arrow', 'disc-right-arrow'];
            bottomArrowIds.forEach(arrowId => {
                const arrow = exportCopy.querySelector(`#${arrowId}`);
                if (arrow) {
                    if (bottomArrowFillEnabled) {
                        arrow.setAttribute('fill', bottomArrowFillColor);
                    } else {
                        arrow.setAttribute('fill', 'none');
                    }
                }
            });

            // Ensure button backgrounds are applied if enabled
            const buttonNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 'clear', 0, 'enter'];
            const buttonCoords = {
                1: {x: 7.20, y: 26.05}, 2: {x: 21.10, y: 26.05}, 3: {x: 35.00, y: 26.05},
                4: {x: 7.20, y: 41.19}, 5: {x: 21.10, y: 41.19}, 6: {x: 35.00, y: 41.19},
                7: {x: 7.20, y: 56.33}, 8: {x: 21.10, y: 56.33}, 9: {x: 35.00, y: 56.33},
                'clear': {x: 7.20, y: 71.48}, 0: {x: 21.10, y: 71.48}, 'enter': {x: 35.00, y: 71.48}
            };
            buttonNumbers.forEach(num => {
                const bgEnabled = document.getElementById(`btn-bg-enabled-${num}`).checked;
                const bgColor = document.getElementById(`btn-bg-color-${num}`).value;
                const btnElement = exportCopy.querySelector(`#btn-${num}`);

                if (bgEnabled && btnElement) {
                    // Create or update background rectangle in export copy
                    let bgRect = exportCopy.querySelector(`#btn-bg-${num}`);
                    if (!bgRect) {
                        const coords = buttonCoords[num];
                        if (coords) {
                            bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                            bgRect.setAttribute('id', `btn-bg-${num}`);
                            bgRect.setAttribute('x', coords.x);
                            bgRect.setAttribute('y', coords.y);
                            bgRect.setAttribute('width', '11.4');
                            bgRect.setAttribute('height', '11.4');
                            bgRect.setAttribute('rx', '1.5');
                            bgRect.setAttribute('ry', '1.5');
                            // Insert before the button text element so it appears behind
                            btnElement.parentNode.insertBefore(bgRect, btnElement);
                        }
                    }
                    if (bgRect) {
                        bgRect.setAttribute('fill', bgColor);
                        bgRect.setAttribute('opacity', '1.0');
                    }
                }
            });

            // Ensure button artwork is applied if exists
            const buttonCenters = {
                1: {cx: 12.90, cy: 31.75}, 2: {cx: 26.80, cy: 31.75}, 3: {cx: 40.70, cy: 31.75},
                4: {cx: 12.90, cy: 46.89}, 5: {cx: 26.80, cy: 46.89}, 6: {cx: 40.70, cy: 46.89},
                7: {cx: 12.90, cy: 62.03}, 8: {cx: 26.80, cy: 62.03}, 9: {cx: 40.70, cy: 62.03},
                'clear': {cx: 12.90, cy: 77.18}, 0: {cx: 26.80, cy: 77.18}, 'enter': {cx: 40.70, cy: 77.18}
            };

            const buttonArtwork = appState.getAllButtonArtwork();
            buttonNumbers.forEach(num => {
                if (buttonArtwork[num]) {
                    const art = buttonArtwork[num];
                    const center = buttonCenters[num];
                    const btnElement = exportCopy.querySelector(`#btn-${num}`);

                    if (center && btnElement) {
                        // Create or update button artwork in export copy
                        let artImage = exportCopy.querySelector(`#btn-art-${num}`);
                        if (!artImage) {
                            const xlinkNS = 'http://www.w3.org/1999/xlink';
                            artImage = document.createElementNS('http://www.w3.org/2000/svg', 'image');
                            artImage.setAttribute('id', `btn-art-${num}`);
                            artImage.setAttributeNS(xlinkNS, 'xlink:href', art.dataURL);

                            // Size artwork to fit button (11.4mm button size)
                            const artSize = 11.4;
                            artImage.setAttributeNS(null, 'width', artSize.toString());
                            artImage.setAttributeNS(null, 'height', artSize.toString());
                            artImage.setAttributeNS(null, 'preserveAspectRatio', 'xMidYMid meet');

                            // Position at button center (offset by half the size to center)
                            const baseX = center.cx - (artSize / 2);
                            const baseY = center.cy - (artSize / 2);
                            artImage.setAttributeNS(null, 'x', baseX.toString());
                            artImage.setAttributeNS(null, 'y', baseY.toString());

                            // Insert before button text
                            btnElement.parentNode.insertBefore(artImage, btnElement);
                        }

                        // Apply transforms and opacity
                        artImage.setAttributeNS(null, 'opacity', art.opacity.toString());

                        let transforms = [];
                        transforms.push(`translate(${center.cx}, ${center.cy})`);
                        if (art.rotation !== 0) {
                            transforms.push(`rotate(${art.rotation})`);
                        }
                        if (art.scale !== 1.0) {
                            transforms.push(`scale(${art.scale})`);
                        }
                        if (art.x !== 0 || art.y !== 0) {
                            transforms.push(`translate(${art.x}, ${art.y})`);
                        }
                        transforms.push(`translate(${-center.cx}, ${-center.cy})`);

                        if (transforms.length > 0) {
                            artImage.setAttributeNS(null, 'transform', transforms.join(' '));
                        }
                    }
                }
            });

            // Hide overlay template if not requested
            const includeTemplate = document.getElementById('export-include-template').checked;
            if (!includeTemplate) {
                // Remove actual template SVG elements by their real IDs
                // DON'T remove keypad_buttons group or action button groups - we need to keep the text and arrow elements
                const templateIds = ['outer_boundary', 'title_bar_zone', 'title-border', 'grid_info'];
                templateIds.forEach(id => {
                    const el = exportCopy.querySelector(`#${id}`);
                    if (el) el.remove();
                });
                // Remove template elements by class (outline, guide, button, label, zone)
                // BUT preserve the title text (#title-text), button labels (btn-1, btn-2, etc.), action button labels, and bottom text
                const buttonLabelIds = ['btn-1', 'btn-2', 'btn-3', 'btn-4', 'btn-5', 'btn-6', 'btn-7', 'btn-8', 'btn-9', 'btn-clear', 'btn-0', 'btn-enter'];
                const actionLabelIds = ['top-left-label', 'top-right-label', 'bottom-left-label', 'bottom-right-label'];
                const bottomLabelIds = ['bottom-text'];
                const classSelectors = ['.outline', '.guide', '.button', '.button_center', '.label', '.label_small', '.zone'];
                classSelectors.forEach(selector => {
                    const elements = exportCopy.querySelectorAll(selector);
                    elements.forEach(el => {
                        // Don't remove the title text element, button labels, action button labels, or bottom text
                        if (el.id !== 'title-text' && !buttonLabelIds.includes(el.id) && !actionLabelIds.includes(el.id) && !bottomLabelIds.includes(el.id)) {
                            el.remove();
                        }
                    });
                });
                // Remove other template rects and lines (separator lines, hidden area, etc.)
                const rects = exportCopy.querySelectorAll('rect[fill="#E0E0E0"]');
                rects.forEach(el => el.remove());
                const lines = exportCopy.querySelectorAll('line');
                lines.forEach(el => el.remove());
            }

            const svgString = new XMLSerializer().serializeToString(exportCopy);
            const title = document.getElementById('title').value.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'overlay';

            const response = await fetch('/export_png', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    svg: svgString,
                    filename: title,
                    include_template: includeTemplate
                })
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${title}_big_overlay.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                UIManager.showStatus('PNG downloaded successfully!', 'success');
            } else {
                UIManager.showStatus('Error exporting PNG', 'error');
            }
        } catch (error) {
            UIManager.showStatus('Error: ' + error.message, 'error');
        }
    }

    /**
     * Reset the overlay to its initial state
     * Prompts for confirmation before reloading the page
     */
    static resetOverlay() {
        if (confirm('Reset all changes? This cannot be undone.')) {
            location.reload();
        }
    }
}
