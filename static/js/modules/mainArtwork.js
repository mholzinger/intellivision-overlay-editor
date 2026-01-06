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
            appState.setArtworkData(dataURL);
            appState.setArtworkPosition(0, 0);
            appState.setArtworkScale(1.0);
            appState.setArtworkOpacity(0.9);

            document.getElementById('artwork-x-pos').value = 0;
            document.getElementById('artwork-y-pos').value = 0;
            document.getElementById('artwork-scale').value = 1.0;
            document.getElementById('artwork-opacity').value = 0.9;
            document.getElementById('x-position-value').textContent = '0';
            document.getElementById('y-position-value').textContent = '0';
            document.getElementById('scale-value').textContent = '100';
            document.getElementById('opacity-value').textContent = '90';

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
        // Remove existing artwork if present
        const existingArtwork = svgDoc.querySelector('#custom-artwork');
        if (existingArtwork) {
            existingArtwork.remove();
        }

        // Create new image element that fills the entire overlay
        const svgNS = "http://www.w3.org/2000/svg";
        const xlinkNS = "http://www.w3.org/1999/xlink";
        const image = document.createElementNS(svgNS, 'image');

        // Set all attributes BEFORE inserting into DOM for better compatibility
        image.setAttributeNS(null, 'id', 'custom-artwork');
        image.setAttributeNS(xlinkNS, 'xlink:href', dataURL);

        // Fill the entire overlay area (55.6mm x 90.4mm)
        // The mask will handle transparency for rounded corners
        const artworkWidth = 55.6;
        const artworkHeight = 90.4;

        // Use setAttributeNS(null, ...) to ensure attributes are properly serialized
        image.setAttributeNS(null, 'x', '0');
        image.setAttributeNS(null, 'y', '0');
        image.setAttributeNS(null, 'width', artworkWidth.toString());
        image.setAttributeNS(null, 'height', artworkHeight.toString());
        // Preserve aspect ratio so artwork isn't distorted
        image.setAttributeNS(null, 'preserveAspectRatio', 'xMidYMid meet');
        image.setAttributeNS(null, 'opacity', appState.getArtworkOpacity().toString());

        // Apply position and scale transforms
        const centerX = artworkWidth / 2;
        const centerY = artworkHeight / 2;
        const position = appState.getArtworkPosition();
        const scale = appState.getArtworkScale();

        // Build transform: translate to center, apply scale, translate back, then apply position offset
        let transforms = [];
        if (scale !== 1.0 || position.x !== 0 || position.y !== 0) {
            transforms.push(`translate(${position.x}, ${position.y})`);
            if (scale !== 1.0) {
                transforms.push(`translate(${centerX}, ${centerY})`);
                transforms.push(`scale(${scale})`);
                transforms.push(`translate(${-centerX}, ${-centerY})`);
            }
        }

        if (transforms.length > 0) {
            image.setAttributeNS(null, 'transform', transforms.join(' '));
        }

        // Insert after background but before other elements
        const background = svgDoc.querySelector('rect[fill="#FFFFFF"]');
        background.parentNode.insertBefore(image, background.nextSibling);

        // Debug: verify attributes were set
        console.log('IMAGE INSERTED INTO DOM:');
        console.log('  x:', image.getAttributeNS(null, 'x'));
        console.log('  y:', image.getAttributeNS(null, 'y'));
        console.log('  width:', image.getAttributeNS(null, 'width'));
        console.log('  height:', image.getAttributeNS(null, 'height'));
        console.log('  transform:', image.getAttributeNS(null, 'transform'));
    }

    /**
     * Clear artwork from SVG
     */
    static clearArtwork() {
        const svgDoc = appState.getSvgDoc();
        const artwork = svgDoc.querySelector('#custom-artwork');
        if (artwork) {
            artwork.remove();
            appState.setArtworkData(null);
            appState.setArtworkPosition(0, 0);
            appState.setArtworkScale(1.0);
            document.getElementById('artwork-upload').value = '';
            document.getElementById('artwork-controls').style.display = 'none';
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
}
