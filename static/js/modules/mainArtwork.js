/**
 * Main Artwork Module
 * Handles main overlay artwork upload and manipulation
 */

import { appState } from '../services/stateManager.js';
import { UIManager } from './uiManager.js';

export class MainArtwork {
    /**
     * Handle artwork file upload
     * @param {Event} event - File input change event
     */
    static handleArtworkUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const dataURL = e.target.result;
            appState.setArtworkOriginalData(dataURL);  // Store original
            appState.setArtworkData(dataURL);
            appState.setArtworkPosition(0, 0);
            appState.setArtworkScale(1.0);
            appState.setArtworkOpacity(0.9);
            appState.setArtworkRotation(0);
            appState.setArtworkTiled(false);
            appState.setArtworkRemoveWhite(false);
            appState.setArtworkWhiteThreshold(245);

            document.getElementById('artwork-x-pos').value = 0;
            document.getElementById('artwork-y-pos').value = 0;
            document.getElementById('artwork-scale').value = 1.0;
            document.getElementById('artwork-opacity').value = 0.9;
            document.getElementById('artwork-rotation').value = 0;
            document.getElementById('artwork-tile').checked = false;
            document.getElementById('artwork-remove-white').checked = false;
            document.getElementById('artwork-threshold').value = 245;
            document.getElementById('artwork-threshold-value').textContent = '245';
            document.getElementById('artwork-threshold-control').style.display = 'none';
            document.getElementById('x-position-value').textContent = '0';
            document.getElementById('y-position-value').textContent = '0';
            document.getElementById('scale-value').textContent = '100';
            document.getElementById('opacity-value').textContent = '90';
            document.getElementById('rotation-value').textContent = '0';

            MainArtwork.insertArtwork(dataURL);
            document.getElementById('artwork-controls').style.display = 'block';
            UIManager.showStatus('Artwork uploaded successfully!', 'success');
        };
        reader.readAsDataURL(file);
    }

    /**
     * Insert artwork into SVG
     * @param {string} dataURL - Image data URL
     */
    static insertArtwork(dataURL) {
        const svgDoc = appState.getSvgDoc();
        const svgNS = "http://www.w3.org/2000/svg";
        const xlinkNS = "http://www.w3.org/1999/xlink";

        // Remove existing artwork if present
        const existingArtwork = svgDoc.querySelector('#custom-artwork');
        if (existingArtwork) {
            existingArtwork.remove();
        }
        // Remove existing pattern if present
        const existingPattern = svgDoc.querySelector('#artwork-pattern');
        if (existingPattern) {
            existingPattern.remove();
        }
        const existingPatternRect = svgDoc.querySelector('#custom-artwork-tiled');
        if (existingPatternRect) {
            existingPatternRect.remove();
        }

        const artworkWidth = 55.6;
        const artworkHeight = 90.4;
        const position = appState.getArtworkPosition();
        const scale = appState.getArtworkScale();
        const rotation = appState.getArtworkRotation();
        const opacity = appState.getArtworkOpacity();
        const isTiled = appState.getArtworkTiled();

        // Insert after background but before other elements
        const background = svgDoc.querySelector('#overlay-background') ||
                          svgDoc.querySelector('rect[x="0"][y="0"][width="55.6"][height="90.4"]');

        if (isTiled) {
            // Create a pattern for tiling
            let defs = svgDoc.querySelector('defs');
            if (!defs) {
                defs = document.createElementNS(svgNS, 'defs');
                svgDoc.insertBefore(defs, svgDoc.firstChild);
            }

            // Create pattern element
            const pattern = document.createElementNS(svgNS, 'pattern');
            pattern.setAttributeNS(null, 'id', 'artwork-pattern');
            pattern.setAttributeNS(null, 'patternUnits', 'userSpaceOnUse');

            // Pattern size based on scale (larger base for better default appearance)
            const tileSize = 30 * scale; // Base tile size of 30mm (about half the overlay width)
            pattern.setAttributeNS(null, 'width', tileSize.toString());
            pattern.setAttributeNS(null, 'height', tileSize.toString());

            // Build patternTransform for position and rotation
            // Rotation is applied to entire pattern (like rotating a single bitmap)
            const centerX = artworkWidth / 2;
            const centerY = artworkHeight / 2;
            let patternTransforms = [];

            if (position.x !== 0 || position.y !== 0) {
                patternTransforms.push(`translate(${position.x}, ${position.y})`);
            }

            if (rotation !== 0) {
                // Rotate around the center of the overlay area
                patternTransforms.push(`rotate(${rotation}, ${centerX}, ${centerY})`);
            }

            if (patternTransforms.length > 0) {
                pattern.setAttributeNS(null, 'patternTransform', patternTransforms.join(' '));
            }

            // Create image inside pattern (no individual tile rotation)
            const patternImage = document.createElementNS(svgNS, 'image');
            patternImage.setAttributeNS(xlinkNS, 'xlink:href', dataURL);
            patternImage.setAttributeNS(null, 'width', tileSize.toString());
            patternImage.setAttributeNS(null, 'height', tileSize.toString());
            patternImage.setAttributeNS(null, 'preserveAspectRatio', 'xMidYMid meet');

            pattern.appendChild(patternImage);
            defs.appendChild(pattern);

            // Create rect that uses the pattern
            const tiledRect = document.createElementNS(svgNS, 'rect');
            tiledRect.setAttributeNS(null, 'id', 'custom-artwork-tiled');
            tiledRect.setAttributeNS(null, 'x', '0');
            tiledRect.setAttributeNS(null, 'y', '0');
            tiledRect.setAttributeNS(null, 'width', artworkWidth.toString());
            tiledRect.setAttributeNS(null, 'height', artworkHeight.toString());
            tiledRect.setAttributeNS(null, 'fill', 'url(#artwork-pattern)');
            tiledRect.setAttributeNS(null, 'opacity', opacity.toString());
            // Honor the controller's rounded corners in the preview (same
            // clipPath the static overlay-background uses). Export ignores
            // this — exportManager pre-renders + applies its own canvas mask.
            tiledRect.setAttributeNS(null, 'clip-path', 'url(#overlay-shape-clip)');

            background.parentNode.insertBefore(tiledRect, background.nextSibling);
        } else {
            // Single image mode
            const image = document.createElementNS(svgNS, 'image');
            image.setAttributeNS(null, 'id', 'custom-artwork');
            image.setAttributeNS(xlinkNS, 'xlink:href', dataURL);
            image.setAttributeNS(null, 'x', '0');
            image.setAttributeNS(null, 'y', '0');
            image.setAttributeNS(null, 'width', artworkWidth.toString());
            image.setAttributeNS(null, 'height', artworkHeight.toString());
            image.setAttributeNS(null, 'preserveAspectRatio', 'xMidYMid meet');
            image.setAttributeNS(null, 'opacity', opacity.toString());
            image.setAttributeNS(null, 'clip-path', 'url(#overlay-shape-clip)');

            // Build transform with position, scale, and rotation
            const centerX = artworkWidth / 2;
            const centerY = artworkHeight / 2;
            let transforms = [];

            // Apply position offset
            if (position.x !== 0 || position.y !== 0) {
                transforms.push(`translate(${position.x}, ${position.y})`);
            }

            // Apply rotation around center
            if (rotation !== 0) {
                transforms.push(`rotate(${rotation}, ${centerX}, ${centerY})`);
            }

            // Apply scale from center
            if (scale !== 1.0) {
                transforms.push(`translate(${centerX}, ${centerY})`);
                transforms.push(`scale(${scale})`);
                transforms.push(`translate(${-centerX}, ${-centerY})`);
            }

            if (transforms.length > 0) {
                image.setAttributeNS(null, 'transform', transforms.join(' '));
            }

            background.parentNode.insertBefore(image, background.nextSibling);
        }
    }

    /**
     * Clear artwork from SVG
     */
    static clearArtwork() {
        const svgDoc = appState.getSvgDoc();
        const artwork = svgDoc.querySelector('#custom-artwork');
        const tiledArtwork = svgDoc.querySelector('#custom-artwork-tiled');
        const pattern = svgDoc.querySelector('#artwork-pattern');

        // Remove SVG elements if they exist
        if (artwork) artwork.remove();
        if (tiledArtwork) tiledArtwork.remove();
        if (pattern) pattern.remove();

        // Always clear state, even if SVG elements weren't found
        // (e.g., artwork may have been loaded from imported project but element IDs differ)
        const hadArtwork = artwork || tiledArtwork || appState.getArtworkData();

        appState.setArtworkData(null);
        appState.setArtworkOriginalData(null);
        appState.setArtworkPosition(0, 0);
        appState.setArtworkScale(1.0);
        appState.setArtworkOpacity(0.9);
        appState.setArtworkRotation(0);
        appState.setArtworkTiled(false);
        appState.setArtworkRemoveWhite(false);
        appState.setArtworkWhiteThreshold(245);

        // Reset UI
        document.getElementById('artwork-upload').value = '';
        document.getElementById('artwork-controls').style.display = 'none';

        if (hadArtwork) {
            UIManager.showStatus('Artwork cleared', 'success');
        }
    }

    /**
     * Move artwork horizontally
     * @param {number} delta - Change in X position
     */
    static moveArtworkX(delta) {
        const slider = document.getElementById('artwork-x-pos');
        const newValue = parseFloat(slider.value) + delta;
        slider.value = Math.max(-55, Math.min(55, newValue));
        MainArtwork.updateArtworkPosition();
    }

    /**
     * Move artwork vertically
     * @param {number} delta - Change in Y position
     */
    static moveArtworkY(delta) {
        const slider = document.getElementById('artwork-y-pos');
        const newValue = parseFloat(slider.value) + delta;
        slider.value = Math.max(-90, Math.min(90, newValue));
        MainArtwork.updateArtworkPosition();
    }

    /**
     * Update artwork position from UI controls
     */
    static updateArtworkPosition() {
        const xSlider = document.getElementById('artwork-x-pos');
        const ySlider = document.getElementById('artwork-y-pos');
        const x = parseFloat(xSlider.value);
        const y = parseFloat(ySlider.value);

        appState.setArtworkPosition(x, y);
        document.getElementById('x-position-value').textContent = x.toFixed(1);
        document.getElementById('y-position-value').textContent = y.toFixed(1);

        const dataURL = appState.getArtworkData();
        if (dataURL) {
            MainArtwork.insertArtwork(dataURL);
        }
    }

    /**
     * Scale artwork
     * @param {number} delta - Change in scale
     */
    static scaleArtwork(delta) {
        const slider = document.getElementById('artwork-scale');
        const newValue = parseFloat(slider.value) + delta;
        slider.value = Math.max(0.5, Math.min(2.5, newValue));
        MainArtwork.updateArtworkScale();
    }

    /**
     * Update artwork scale from UI controls
     */
    static updateArtworkScale() {
        const slider = document.getElementById('artwork-scale');
        const scale = parseFloat(slider.value);

        appState.setArtworkScale(scale);
        document.getElementById('scale-value').textContent = Math.round(scale * 100);

        const dataURL = appState.getArtworkData();
        if (dataURL) {
            MainArtwork.insertArtwork(dataURL);
        }
    }

    /**
     * Update artwork opacity from UI controls
     */
    static updateArtworkOpacity() {
        const slider = document.getElementById('artwork-opacity');
        const opacity = parseFloat(slider.value);

        appState.setArtworkOpacity(opacity);
        document.getElementById('opacity-value').textContent = Math.round(opacity * 100);

        const dataURL = appState.getArtworkData();
        if (dataURL) {
            MainArtwork.insertArtwork(dataURL);
        }
    }

    /**
     * Rotate artwork by delta
     * @param {number} delta - Change in rotation degrees
     */
    static rotateArtwork(delta) {
        const slider = document.getElementById('artwork-rotation');
        const newValue = parseFloat(slider.value) + delta;
        slider.value = Math.max(-180, Math.min(180, newValue));
        MainArtwork.updateArtworkRotation();
    }

    /**
     * Update artwork rotation from UI controls
     */
    static updateArtworkRotation() {
        const slider = document.getElementById('artwork-rotation');
        const rotation = parseFloat(slider.value);

        appState.setArtworkRotation(rotation);
        document.getElementById('rotation-value').textContent = rotation;

        const dataURL = appState.getArtworkData();
        if (dataURL) {
            MainArtwork.insertArtwork(dataURL);
        }
    }

    /**
     * Toggle artwork tiling
     */
    static toggleArtworkTile() {
        const checkbox = document.getElementById('artwork-tile');
        const isTiled = checkbox.checked;

        appState.setArtworkTiled(isTiled);

        const dataURL = appState.getArtworkData();
        if (dataURL) {
            MainArtwork.insertArtwork(dataURL);
        }
    }

    /**
     * Toggle white background removal
     */
    static toggleArtworkRemoveWhite() {
        const checkbox = document.getElementById('artwork-remove-white');
        const removeWhite = checkbox.checked;
        const thresholdControl = document.getElementById('artwork-threshold-control');

        appState.setArtworkRemoveWhite(removeWhite);

        // Show/hide threshold slider
        thresholdControl.style.display = removeWhite ? 'block' : 'none';

        // Reprocess the artwork
        MainArtwork.reprocessArtwork();
    }

    /**
     * Update white detection threshold
     */
    static updateArtworkThreshold() {
        const slider = document.getElementById('artwork-threshold');
        const threshold = parseInt(slider.value);

        appState.setArtworkWhiteThreshold(threshold);
        document.getElementById('artwork-threshold-value').textContent = threshold;

        // Reprocess the artwork
        MainArtwork.reprocessArtwork();
    }

    /**
     * Reprocess artwork with current white removal settings
     */
    static reprocessArtwork() {
        const originalDataURL = appState.getArtworkOriginalData();
        if (!originalDataURL) return;

        const removeWhite = appState.getArtworkRemoveWhite();

        if (removeWhite) {
            const threshold = appState.getArtworkWhiteThreshold();
            MainArtwork.removeWhiteBackground(originalDataURL, threshold, (processedDataURL) => {
                appState.setArtworkData(processedDataURL);
                MainArtwork.insertArtwork(processedDataURL);
            });
        } else {
            appState.setArtworkData(originalDataURL);
            MainArtwork.insertArtwork(originalDataURL);
        }
    }

    /**
     * Remove white/light background from image
     * @param {string} dataURL - Original image data URL
     * @param {number} threshold - White detection threshold (0-255)
     * @param {Function} callback - Callback with processed data URL
     */
    static removeWhiteBackground(dataURL, threshold, callback) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = img.width;
            canvas.height = img.height;

            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Process each pixel
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                // Check if pixel is white/light (all RGB values above threshold)
                if (r >= threshold && g >= threshold && b >= threshold) {
                    // Make pixel transparent
                    data[i + 3] = 0;
                }
            }

            ctx.putImageData(imageData, 0, 0);

            const processedDataURL = canvas.toDataURL('image/png');
            callback(processedDataURL);
        };
        img.src = dataURL;
    }
}
