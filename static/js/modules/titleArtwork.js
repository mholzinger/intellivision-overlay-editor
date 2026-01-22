/**
 * Title Artwork Module
 * Handles title space artwork upload and manipulation
 */

import { appState } from '../services/stateManager.js';
import { UIManager } from './uiManager.js';

export class TitleArtwork {
    // Title area dimensions - dynamic getter that reads from state
    static get TITLE_AREA() {
        return {
            x: appState.getTitleAreaX() ?? 3.5,
            y: appState.getTitleAreaY() ?? 2.4,
            width: appState.getTitleAreaWidth() ?? 48.6,
            height: appState.getTitleAreaHeight() ?? 11.5
        };
    }

    /**
     * Handle title artwork file upload
     * @param {Event} event - File input change event
     */
    static handleTitleArtworkUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const dataURL = e.target.result;
            appState.setTitleArtworkOriginalData(dataURL);
            appState.setTitleArtworkData(dataURL);
            appState.setTitleArtworkPosition(0, 0);
            appState.setTitleArtworkScale(1.0);
            appState.setTitleArtworkOpacity(1.0);
            appState.setTitleArtworkRotation(0);
            appState.setTitleArtworkTiled(false);
            appState.setTitleArtworkRemoveWhite(false);
            appState.setTitleArtworkWhiteThreshold(245);

            // Reset UI controls
            document.getElementById('title-artwork-x-pos').value = 0;
            document.getElementById('title-artwork-y-pos').value = 0;
            document.getElementById('title-artwork-scale').value = 1.0;
            document.getElementById('title-artwork-opacity').value = 1.0;
            document.getElementById('title-artwork-rotation').value = 0;
            document.getElementById('title-artwork-tile').checked = false;
            document.getElementById('title-artwork-remove-white').checked = false;
            document.getElementById('title-artwork-threshold').value = 245;
            document.getElementById('title-artwork-threshold-value').textContent = '245';
            document.getElementById('title-artwork-threshold-control').style.display = 'none';
            document.getElementById('title-artwork-x-value').textContent = '0.0';
            document.getElementById('title-artwork-y-value').textContent = '0.0';
            document.getElementById('title-artwork-scale-value').textContent = '100';
            document.getElementById('title-artwork-opacity-value').textContent = '100';
            document.getElementById('title-artwork-rotation-value').textContent = '0';

            TitleArtwork.insertTitleArtwork(dataURL);
            document.getElementById('title-artwork-controls').style.display = 'block';
            UIManager.showStatus('Title artwork uploaded successfully!', 'success');
        };
        reader.readAsDataURL(file);
    }

    /**
     * Insert title artwork into SVG
     * @param {string} dataURL - Image data URL
     */
    static insertTitleArtwork(dataURL) {
        const svgDoc = appState.getSvgDoc();
        if (!svgDoc) return;

        const svgNS = "http://www.w3.org/2000/svg";
        const xlinkNS = "http://www.w3.org/1999/xlink";

        // Remove existing title artwork group if present
        const existingGroup = svgDoc.querySelector('#title-artwork-group');
        if (existingGroup) {
            existingGroup.remove();
        }
        // Remove existing pattern if present
        const existingPattern = svgDoc.querySelector('#title-artwork-pattern');
        if (existingPattern) {
            existingPattern.remove();
        }

        const area = TitleArtwork.TITLE_AREA;
        const position = appState.getTitleArtworkPosition();
        const scale = appState.getTitleArtworkScale();
        const rotation = appState.getTitleArtworkRotation();
        const opacity = appState.getTitleArtworkOpacity();
        const isTiled = appState.getTitleArtworkTiled();

        // Insert after title background but before title text
        const titleBackground = svgDoc.querySelector('#title-background');
        const insertAfter = titleBackground || svgDoc.querySelector('#title_bar_zone');

        if (!insertAfter) return;

        // Create clip path for title area
        let defs = svgDoc.querySelector('defs');
        if (!defs) {
            defs = document.createElementNS(svgNS, 'defs');
            svgDoc.insertBefore(defs, svgDoc.firstChild);
        }

        // Create or update clip path
        let clipPath = svgDoc.querySelector('#title-artwork-clip');
        if (!clipPath) {
            clipPath = document.createElementNS(svgNS, 'clipPath');
            clipPath.setAttributeNS(null, 'id', 'title-artwork-clip');
            const clipRect = document.createElementNS(svgNS, 'rect');
            clipRect.setAttributeNS(null, 'x', area.x.toString());
            clipRect.setAttributeNS(null, 'y', area.y.toString());
            clipRect.setAttributeNS(null, 'width', area.width.toString());
            clipRect.setAttributeNS(null, 'height', area.height.toString());
            clipRect.setAttributeNS(null, 'rx', '1.5');
            clipRect.setAttributeNS(null, 'ry', '1.5');
            clipPath.appendChild(clipRect);
            defs.appendChild(clipPath);
        }

        // Center of the title area for transforms
        const centerX = area.x + area.width / 2;
        const centerY = area.y + area.height / 2;

        // Create wrapper group with clip-path - this keeps artwork inside title bounds
        const wrapperGroup = document.createElementNS(svgNS, 'g');
        wrapperGroup.setAttributeNS(null, 'id', 'title-artwork-group');
        wrapperGroup.setAttributeNS(null, 'clip-path', 'url(#title-artwork-clip)');

        if (isTiled) {
            // Create a pattern for tiling
            const pattern = document.createElementNS(svgNS, 'pattern');
            pattern.setAttributeNS(null, 'id', 'title-artwork-pattern');
            pattern.setAttributeNS(null, 'patternUnits', 'userSpaceOnUse');

            // Pattern size based on scale
            const tileSize = 10 * scale; // Smaller base for title area
            pattern.setAttributeNS(null, 'width', tileSize.toString());
            pattern.setAttributeNS(null, 'height', tileSize.toString());

            // Build patternTransform for position and rotation
            let patternTransforms = [];

            if (position.x !== 0 || position.y !== 0) {
                patternTransforms.push(`translate(${position.x}, ${position.y})`);
            }

            if (rotation !== 0) {
                patternTransforms.push(`rotate(${rotation}, ${centerX}, ${centerY})`);
            }

            if (patternTransforms.length > 0) {
                pattern.setAttributeNS(null, 'patternTransform', patternTransforms.join(' '));
            }

            // Create image inside pattern
            const patternImage = document.createElementNS(svgNS, 'image');
            patternImage.setAttributeNS(xlinkNS, 'xlink:href', dataURL);
            patternImage.setAttributeNS(null, 'width', tileSize.toString());
            patternImage.setAttributeNS(null, 'height', tileSize.toString());
            patternImage.setAttributeNS(null, 'preserveAspectRatio', 'xMidYMid meet');

            pattern.appendChild(patternImage);
            defs.appendChild(pattern);

            // Create rect that uses the pattern (inside the clipped group)
            const tiledRect = document.createElementNS(svgNS, 'rect');
            tiledRect.setAttributeNS(null, 'id', 'custom-title-artwork-tiled');
            tiledRect.setAttributeNS(null, 'x', area.x.toString());
            tiledRect.setAttributeNS(null, 'y', area.y.toString());
            tiledRect.setAttributeNS(null, 'width', area.width.toString());
            tiledRect.setAttributeNS(null, 'height', area.height.toString());
            tiledRect.setAttributeNS(null, 'rx', '1.5');
            tiledRect.setAttributeNS(null, 'ry', '1.5');
            tiledRect.setAttributeNS(null, 'fill', 'url(#title-artwork-pattern)');
            tiledRect.setAttributeNS(null, 'opacity', opacity.toString());

            wrapperGroup.appendChild(tiledRect);
        } else {
            // Single image mode - image inside clipped group
            const image = document.createElementNS(svgNS, 'image');
            image.setAttributeNS(null, 'id', 'custom-title-artwork');
            image.setAttributeNS(xlinkNS, 'xlink:href', dataURL);
            image.setAttributeNS(null, 'x', area.x.toString());
            image.setAttributeNS(null, 'y', area.y.toString());
            image.setAttributeNS(null, 'width', area.width.toString());
            image.setAttributeNS(null, 'height', area.height.toString());
            image.setAttributeNS(null, 'preserveAspectRatio', 'xMidYMid meet');
            image.setAttributeNS(null, 'opacity', opacity.toString());

            // Build transform with position, scale, and rotation
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

            wrapperGroup.appendChild(image);
        }

        // Insert the clipped group after title background
        insertAfter.parentNode.insertBefore(wrapperGroup, insertAfter.nextSibling);
    }

    /**
     * Clear title artwork from SVG
     */
    static clearTitleArtwork() {
        const svgDoc = appState.getSvgDoc();
        const artworkGroup = svgDoc?.querySelector('#title-artwork-group');
        const pattern = svgDoc?.querySelector('#title-artwork-pattern');

        if (artworkGroup) artworkGroup.remove();
        if (pattern) pattern.remove();

        if (artworkGroup) {
            appState.setTitleArtworkData(null);
            appState.setTitleArtworkOriginalData(null);
            appState.setTitleArtworkPosition(0, 0);
            appState.setTitleArtworkScale(1.0);
            appState.setTitleArtworkOpacity(1.0);
            appState.setTitleArtworkRotation(0);
            appState.setTitleArtworkTiled(false);
            document.getElementById('title-artwork-upload').value = '';
            document.getElementById('title-artwork-controls').style.display = 'none';
            UIManager.showStatus('Title artwork cleared', 'success');
        }
    }

    /**
     * Move title artwork horizontally
     * @param {number} delta - Change in X position
     */
    static moveTitleArtworkX(delta) {
        const slider = document.getElementById('title-artwork-x-pos');
        const newValue = parseFloat(slider.value) + delta;
        slider.value = Math.max(-25, Math.min(25, newValue));
        TitleArtwork.updateTitleArtworkPosition();
    }

    /**
     * Move title artwork vertically
     * @param {number} delta - Change in Y position
     */
    static moveTitleArtworkY(delta) {
        const slider = document.getElementById('title-artwork-y-pos');
        const newValue = parseFloat(slider.value) + delta;
        slider.value = Math.max(-10, Math.min(10, newValue));
        TitleArtwork.updateTitleArtworkPosition();
    }

    /**
     * Update title artwork position from UI controls
     */
    static updateTitleArtworkPosition() {
        const xSlider = document.getElementById('title-artwork-x-pos');
        const ySlider = document.getElementById('title-artwork-y-pos');
        const x = parseFloat(xSlider.value);
        const y = parseFloat(ySlider.value);

        appState.setTitleArtworkPosition(x, y);
        document.getElementById('title-artwork-x-value').textContent = x.toFixed(1);
        document.getElementById('title-artwork-y-value').textContent = y.toFixed(1);

        const dataURL = appState.getTitleArtworkData();
        if (dataURL) {
            TitleArtwork.insertTitleArtwork(dataURL);
        }
    }

    /**
     * Scale title artwork
     * @param {number} delta - Change in scale
     */
    static scaleTitleArtwork(delta) {
        const slider = document.getElementById('title-artwork-scale');
        const newValue = parseFloat(slider.value) + delta;
        slider.value = Math.max(0.5, Math.min(3.0, newValue));
        TitleArtwork.updateTitleArtworkScale();
    }

    /**
     * Update title artwork scale from UI controls
     */
    static updateTitleArtworkScale() {
        const slider = document.getElementById('title-artwork-scale');
        const scale = parseFloat(slider.value);

        appState.setTitleArtworkScale(scale);
        document.getElementById('title-artwork-scale-value').textContent = Math.round(scale * 100);

        const dataURL = appState.getTitleArtworkData();
        if (dataURL) {
            TitleArtwork.insertTitleArtwork(dataURL);
        }
    }

    /**
     * Update title artwork opacity from UI controls
     */
    static updateTitleArtworkOpacity() {
        const slider = document.getElementById('title-artwork-opacity');
        const opacity = parseFloat(slider.value);

        appState.setTitleArtworkOpacity(opacity);
        document.getElementById('title-artwork-opacity-value').textContent = Math.round(opacity * 100);

        const dataURL = appState.getTitleArtworkData();
        if (dataURL) {
            TitleArtwork.insertTitleArtwork(dataURL);
        }
    }

    /**
     * Rotate title artwork by delta
     * @param {number} delta - Change in rotation degrees
     */
    static rotateTitleArtwork(delta) {
        const slider = document.getElementById('title-artwork-rotation');
        const newValue = parseFloat(slider.value) + delta;
        slider.value = Math.max(-180, Math.min(180, newValue));
        TitleArtwork.updateTitleArtworkRotation();
    }

    /**
     * Update title artwork rotation from UI controls
     */
    static updateTitleArtworkRotation() {
        const slider = document.getElementById('title-artwork-rotation');
        const rotation = parseFloat(slider.value);

        appState.setTitleArtworkRotation(rotation);
        document.getElementById('title-artwork-rotation-value').textContent = rotation;

        const dataURL = appState.getTitleArtworkData();
        if (dataURL) {
            TitleArtwork.insertTitleArtwork(dataURL);
        }
    }

    /**
     * Toggle title artwork tiling
     */
    static toggleTitleArtworkTile() {
        const checkbox = document.getElementById('title-artwork-tile');
        const isTiled = checkbox.checked;

        appState.setTitleArtworkTiled(isTiled);

        const dataURL = appState.getTitleArtworkData();
        if (dataURL) {
            TitleArtwork.insertTitleArtwork(dataURL);
        }
    }

    /**
     * Toggle white background removal
     */
    static toggleTitleArtworkRemoveWhite() {
        const checkbox = document.getElementById('title-artwork-remove-white');
        const removeWhite = checkbox.checked;
        const thresholdControl = document.getElementById('title-artwork-threshold-control');

        appState.setTitleArtworkRemoveWhite(removeWhite);

        // Show/hide threshold slider
        thresholdControl.style.display = removeWhite ? 'block' : 'none';

        // Reprocess the artwork
        TitleArtwork.reprocessTitleArtwork();
    }

    /**
     * Update white detection threshold
     */
    static updateTitleArtworkThreshold() {
        const slider = document.getElementById('title-artwork-threshold');
        const threshold = parseInt(slider.value);

        appState.setTitleArtworkWhiteThreshold(threshold);
        document.getElementById('title-artwork-threshold-value').textContent = threshold;

        // Reprocess the artwork
        TitleArtwork.reprocessTitleArtwork();
    }

    /**
     * Reprocess title artwork with current white removal settings
     */
    static reprocessTitleArtwork() {
        const originalDataURL = appState.getTitleArtworkOriginalData();
        if (!originalDataURL) return;

        const removeWhite = appState.getTitleArtworkRemoveWhite();

        if (removeWhite) {
            const threshold = appState.getTitleArtworkWhiteThreshold();
            TitleArtwork.removeWhiteBackground(originalDataURL, threshold, (processedDataURL) => {
                appState.setTitleArtworkData(processedDataURL);
                TitleArtwork.insertTitleArtwork(processedDataURL);
            });
        } else {
            appState.setTitleArtworkData(originalDataURL);
            TitleArtwork.insertTitleArtwork(originalDataURL);
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
