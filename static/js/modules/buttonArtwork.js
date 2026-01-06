/**
 * Button Artwork Module
 * Handles individual button artwork upload and manipulation
 */

import { appState } from '../services/stateManager.js';
import { UIManager } from './uiManager.js';
import { ImageProcessor } from './imageProcessor.js';

export class ButtonArtwork {
    /**
     * Handle button selection for artwork
     */
    static selectButtonForArtwork() {
        const select = document.getElementById('button-artwork-select');
        const selectedButton = select.value;
        appState.setSelectedButton(selectedButton);

        if (selectedButton) {
            document.getElementById('button-artwork-controls').style.display = 'block';

            // Load existing artwork data if available
            const art = appState.getButtonArtwork(selectedButton);
            if (art) {
                document.getElementById('btn-art-x-pos').value = art.x;
                document.getElementById('btn-art-y-pos').value = art.y;
                document.getElementById('btn-art-scale').value = art.scale;
                document.getElementById('btn-art-rotation').value = art.rotation;
                document.getElementById('btn-art-opacity').value = art.opacity;
                document.getElementById('btn-art-x-value').textContent = art.x.toFixed(1);
                document.getElementById('btn-art-y-value').textContent = art.y.toFixed(1);
                document.getElementById('btn-art-scale-value').textContent = Math.round(art.scale * 100);
                document.getElementById('btn-art-rotation-value').textContent = art.rotation;
                document.getElementById('btn-art-opacity-value').textContent = Math.round(art.opacity * 100);

                // Check if this button has transparency enabled (dataURL differs from original)
                const hasTransparency = art.dataURL !== art.originalDataURL;
                document.getElementById('btn-art-remove-white').checked = hasTransparency;
                document.getElementById('btn-art-threshold-control').style.display = hasTransparency ? 'block' : 'none';
            } else {
                // Reset to defaults
                document.getElementById('btn-art-x-pos').value = 0;
                document.getElementById('btn-art-y-pos').value = 0;
                document.getElementById('btn-art-scale').value = 1.0;
                document.getElementById('btn-art-rotation').value = 0;
                document.getElementById('btn-art-opacity').value = 1.0;
                document.getElementById('btn-art-x-value').textContent = '0.0';
                document.getElementById('btn-art-y-value').textContent = '0.0';
                document.getElementById('btn-art-scale-value').textContent = '100';
                document.getElementById('btn-art-rotation-value').textContent = '0';
                document.getElementById('btn-art-opacity-value').textContent = '100';
                document.getElementById('btn-art-remove-white').checked = false;
                document.getElementById('btn-art-threshold-control').style.display = 'none';
            }
        } else {
            document.getElementById('button-artwork-controls').style.display = 'none';
        }
    }

    /**
     * Handle button artwork file upload
     * @param {Event} event - File input change event
     */
    static handleButtonArtworkUpload(event) {
        const selectedButton = appState.getSelectedButton();
        if (!selectedButton) return;

        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const originalDataURL = e.target.result;

            // Initialize button artwork data with defaults
            appState.setButtonArtwork(selectedButton, {
                dataURL: originalDataURL,
                originalDataURL: originalDataURL,  // Store original for reprocessing
                x: 0,
                y: 0,
                scale: 1.0,
                rotation: 0,
                opacity: 1.0
            });

            // Reset UI controls
            document.getElementById('btn-art-x-pos').value = 0;
            document.getElementById('btn-art-y-pos').value = 0;
            document.getElementById('btn-art-scale').value = 1.0;
            document.getElementById('btn-art-rotation').value = 0;
            document.getElementById('btn-art-opacity').value = 1.0;
            document.getElementById('btn-art-x-value').textContent = '0.0';
            document.getElementById('btn-art-y-value').textContent = '0.0';
            document.getElementById('btn-art-scale-value').textContent = '100';
            document.getElementById('btn-art-rotation-value').textContent = '0';
            document.getElementById('btn-art-opacity-value').textContent = '100';

            // Apply transparency if checkbox is enabled
            ButtonArtwork.reprocessButtonArtwork();
        };
        reader.readAsDataURL(file);
    }

    /**
     * Reprocess button artwork with transparency settings
     */
    static reprocessButtonArtwork() {
        const selectedButton = appState.getSelectedButton();
        if (!selectedButton) return;

        const art = appState.getButtonArtwork(selectedButton);
        if (!art) return;

        const removeWhite = document.getElementById('btn-art-remove-white').checked;
        const threshold = parseInt(document.getElementById('btn-art-threshold').value);

        // Update threshold display and show/hide threshold control
        document.getElementById('btn-art-threshold-value').textContent = threshold;
        document.getElementById('btn-art-threshold-control').style.display = removeWhite ? 'block' : 'none';

        if (removeWhite && art.originalDataURL) {
            // Process the original image to remove white background
            ImageProcessor.removeWhiteBackground(art.originalDataURL, threshold, function(processedDataURL) {
                art.dataURL = processedDataURL;
                appState.setButtonArtwork(selectedButton, art);
                ButtonArtwork.insertButtonArtwork(selectedButton);
            });
        } else {
            // Use original image without processing
            art.dataURL = art.originalDataURL;
            appState.setButtonArtwork(selectedButton, art);
            ButtonArtwork.insertButtonArtwork(selectedButton);
        }
    }

    /**
     * Insert button artwork into SVG
     * @param {string} buttonNum - Button identifier
     */
    static insertButtonArtwork(buttonNum) {
        const art = appState.getButtonArtwork(buttonNum);
        if (!art) return;

        const svgDoc = appState.getSvgDoc();

        // Button center coordinates
        const buttonCenters = {
            1: {cx: 12.90, cy: 31.75}, 2: {cx: 26.80, cy: 31.75}, 3: {cx: 40.70, cy: 31.75},
            4: {cx: 12.90, cy: 46.89}, 5: {cx: 26.80, cy: 46.89}, 6: {cx: 40.70, cy: 46.89},
            7: {cx: 12.90, cy: 62.03}, 8: {cx: 26.80, cy: 62.03}, 9: {cx: 40.70, cy: 62.03},
            'clear': {cx: 12.90, cy: 77.18}, 0: {cx: 26.80, cy: 77.18}, 'enter': {cx: 40.70, cy: 77.18}
        };

        const center = buttonCenters[buttonNum];
        if (!center) return;

        // Remove existing artwork for this button
        const existingArt = svgDoc.querySelector(`#btn-art-${buttonNum}`);
        if (existingArt) {
            existingArt.remove();
        }

        // Create image element
        const xlinkNS = 'http://www.w3.org/1999/xlink';
        const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        image.setAttribute('id', `btn-art-${buttonNum}`);
        image.setAttributeNS(xlinkNS, 'xlink:href', art.dataURL);

        // Size artwork to fit button (11.4mm button size)
        const artSize = 11.4;
        image.setAttributeNS(null, 'width', artSize.toString());
        image.setAttributeNS(null, 'height', artSize.toString());
        image.setAttributeNS(null, 'preserveAspectRatio', 'xMidYMid meet');
        image.setAttributeNS(null, 'opacity', art.opacity.toString());

        // Position at button center (offset by half the size to center)
        const baseX = center.cx - (artSize / 2);
        const baseY = center.cy - (artSize / 2);
        image.setAttributeNS(null, 'x', baseX.toString());
        image.setAttributeNS(null, 'y', baseY.toString());

        // Apply transforms: translate to center, rotate, scale, translate offset, translate back
        let transforms = [];

        // Translate to center of button for rotation/scale
        transforms.push(`translate(${center.cx}, ${center.cy})`);

        // Apply rotation
        if (art.rotation !== 0) {
            transforms.push(`rotate(${art.rotation})`);
        }

        // Apply scale
        if (art.scale !== 1.0) {
            transforms.push(`scale(${art.scale})`);
        }

        // Apply position offset
        if (art.x !== 0 || art.y !== 0) {
            transforms.push(`translate(${art.x}, ${art.y})`);
        }

        // Translate back (negative of center)
        transforms.push(`translate(${-center.cx}, ${-center.cy})`);

        if (transforms.length > 0) {
            image.setAttributeNS(null, 'transform', transforms.join(' '));
        }

        // Insert button artwork AFTER button background but BEFORE button text
        // Z-order: bg color → artwork → text
        const btnText = svgDoc.querySelector(`#btn-${buttonNum}`);
        const btnBg = svgDoc.querySelector(`#btn-bg-${buttonNum}`);

        if (btnText && btnText.parentNode) {
            btnText.parentNode.insertBefore(image, btnText);
        } else if (btnBg && btnBg.parentNode) {
            btnBg.parentNode.insertBefore(image, btnBg.nextSibling);
        }
    }

    /**
     * Update button artwork from UI controls
     */
    static updateButtonArtwork() {
        const selectedButton = appState.getSelectedButton();
        if (!selectedButton) return;

        const art = appState.getButtonArtwork(selectedButton);
        if (!art) return;

        // Update artwork data from controls
        art.x = parseFloat(document.getElementById('btn-art-x-pos').value);
        art.y = parseFloat(document.getElementById('btn-art-y-pos').value);
        art.scale = parseFloat(document.getElementById('btn-art-scale').value);
        art.rotation = parseFloat(document.getElementById('btn-art-rotation').value);
        art.opacity = parseFloat(document.getElementById('btn-art-opacity').value);

        appState.setButtonArtwork(selectedButton, art);

        // Update UI labels
        document.getElementById('btn-art-x-value').textContent = art.x.toFixed(1);
        document.getElementById('btn-art-y-value').textContent = art.y.toFixed(1);
        document.getElementById('btn-art-scale-value').textContent = Math.round(art.scale * 100);
        document.getElementById('btn-art-rotation-value').textContent = art.rotation;
        document.getElementById('btn-art-opacity-value').textContent = Math.round(art.opacity * 100);

        // Re-insert artwork with new transforms
        ButtonArtwork.insertButtonArtwork(selectedButton);
    }

    /**
     * Move button artwork horizontally
     * @param {number} delta - Change in X position
     */
    static moveButtonArtworkX(delta) {
        const selectedButton = appState.getSelectedButton();
        if (!selectedButton) return;
        const slider = document.getElementById('btn-art-x-pos');
        const newValue = parseFloat(slider.value) + delta;
        slider.value = Math.max(-11.4, Math.min(11.4, newValue));
        ButtonArtwork.updateButtonArtwork();
    }

    /**
     * Move button artwork vertically
     * @param {number} delta - Change in Y position
     */
    static moveButtonArtworkY(delta) {
        const selectedButton = appState.getSelectedButton();
        if (!selectedButton) return;
        const slider = document.getElementById('btn-art-y-pos');
        const newValue = parseFloat(slider.value) + delta;
        slider.value = Math.max(-11.4, Math.min(11.4, newValue));
        ButtonArtwork.updateButtonArtwork();
    }

    /**
     * Rotate button artwork
     * @param {number} delta - Change in rotation
     */
    static rotateButtonArtwork(delta) {
        const selectedButton = appState.getSelectedButton();
        if (!selectedButton) return;
        const slider = document.getElementById('btn-art-rotation');
        let newValue = parseFloat(slider.value) + delta;
        // Wrap around at -180/180
        if (newValue > 180) newValue = -180 + (newValue - 180);
        if (newValue < -180) newValue = 180 + (newValue + 180);
        slider.value = newValue;
        ButtonArtwork.updateButtonArtwork();
    }

    /**
     * Scale button artwork
     * @param {number} delta - Change in scale
     */
    static scaleButtonArtwork(delta) {
        const selectedButton = appState.getSelectedButton();
        if (!selectedButton) return;
        const slider = document.getElementById('btn-art-scale');
        const newValue = parseFloat(slider.value) + delta;
        slider.value = Math.max(0.1, Math.min(3.0, newValue));
        ButtonArtwork.updateButtonArtwork();
    }

    /**
     * Clear button artwork
     */
    static clearButtonArtwork() {
        const selectedButton = appState.getSelectedButton();
        if (!selectedButton) return;

        const svgDoc = appState.getSvgDoc();
        // Remove artwork from SVG
        const artElement = svgDoc.querySelector(`#btn-art-${selectedButton}`);
        if (artElement) {
            artElement.remove();
        }

        // Remove from storage
        appState.removeButtonArtwork(selectedButton);

        // Reset file input
        document.getElementById('button-artwork-upload').value = '';

        UIManager.showStatus(`Artwork cleared for button ${selectedButton}`, 'success');
    }
}
