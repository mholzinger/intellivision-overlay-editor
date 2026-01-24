/**
 * Draggable Artwork Module
 * Handles mouse drag for repositioning and scroll wheel for scaling artwork
 * Supports overlay editor (main/title artwork) and box art editor (main/vignette artwork)
 */

import { appState } from '../services/stateManager.js';
import { MainArtwork } from './mainArtwork.js';
import { TitleArtwork } from './titleArtwork.js';

export class DraggableArtwork {
    // Overlay editor state
    static overlayInitialized = false;
    // Box art editor state
    static boxartInitialized = false;
    // Shared drag state
    static isDragging = false;
    static dragTarget = null;      // 'main' | 'title' | 'boxart-main' | 'boxart-vignette' | null
    static dragStartPos = { x: 0, y: 0 };
    static artworkStartPos = { x: 0, y: 0 };
    static activeSvgElement = null;
    static activePreviewId = null; // 'svg-preview' | 'boxart-svg-preview'

    /**
     * Initialize drag functionality for the overlay preview
     * Should be called after SVG is loaded
     */
    static init() {
        DraggableArtwork.initOverlay();
    }

    /**
     * Initialize drag functionality for the overlay editor
     */
    static initOverlay() {
        const previewContainer = document.getElementById('svg-preview');
        if (!previewContainer) {
            console.warn('DraggableArtwork: svg-preview container not found');
            return;
        }

        // Remove existing listeners if re-initializing
        if (DraggableArtwork.overlayInitialized) {
            previewContainer.removeEventListener('mousedown', DraggableArtwork.handleOverlayMouseDown);
            previewContainer.removeEventListener('wheel', DraggableArtwork.handleOverlayWheel);
        }

        previewContainer.addEventListener('mousedown', DraggableArtwork.handleOverlayMouseDown);
        previewContainer.addEventListener('wheel', DraggableArtwork.handleOverlayWheel, { passive: false });

        // Global listeners only need to be added once
        if (!DraggableArtwork.overlayInitialized && !DraggableArtwork.boxartInitialized) {
            document.addEventListener('mousemove', DraggableArtwork.handleMouseMove);
            document.addEventListener('mouseup', DraggableArtwork.handleMouseUp);
        }

        DraggableArtwork.overlayInitialized = true;
    }

    /**
     * Initialize drag functionality for the box art editor
     */
    static initBoxArt() {
        const previewContainer = document.getElementById('boxart-svg-preview');
        if (!previewContainer) {
            console.warn('DraggableArtwork: boxart-svg-preview container not found');
            return;
        }

        // Remove existing listeners if re-initializing
        if (DraggableArtwork.boxartInitialized) {
            previewContainer.removeEventListener('mousedown', DraggableArtwork.handleBoxArtMouseDown);
            previewContainer.removeEventListener('wheel', DraggableArtwork.handleBoxArtWheel);
        }

        previewContainer.addEventListener('mousedown', DraggableArtwork.handleBoxArtMouseDown);
        previewContainer.addEventListener('wheel', DraggableArtwork.handleBoxArtWheel, { passive: false });

        // Global listeners only need to be added once
        if (!DraggableArtwork.overlayInitialized && !DraggableArtwork.boxartInitialized) {
            document.addEventListener('mousemove', DraggableArtwork.handleMouseMove);
            document.addEventListener('mouseup', DraggableArtwork.handleMouseUp);
        }

        DraggableArtwork.boxartInitialized = true;
    }

    /**
     * Get the SVG element from the specified preview container
     * @param {string} previewId - The preview container ID
     * @returns {SVGSVGElement|null}
     */
    static getSvgElement(previewId = 'svg-preview') {
        const previewContainer = document.getElementById(previewId);
        return previewContainer?.querySelector('svg');
    }

    /**
     * Convert screen coordinates to SVG coordinates
     * @param {number} screenX - Screen X position
     * @param {number} screenY - Screen Y position
     * @param {string} previewId - The preview container ID
     * @returns {{x: number, y: number}} SVG coordinates
     */
    static screenToSvgCoords(screenX, screenY, previewId = 'svg-preview') {
        const svg = DraggableArtwork.getSvgElement(previewId);
        if (!svg) return { x: 0, y: 0 };

        const point = svg.createSVGPoint();
        point.x = screenX;
        point.y = screenY;

        const ctm = svg.getScreenCTM();
        if (!ctm) return { x: 0, y: 0 };

        const inverseCTM = ctm.inverse();
        const svgPoint = point.matrixTransform(inverseCTM);

        return { x: svgPoint.x, y: svgPoint.y };
    }

    /**
     * Check if an element is a draggable artwork element (overlay editor)
     * @param {Element} element - The clicked element
     * @returns {'main'|'title'|null} The artwork type or null
     */
    static getOverlayDraggableType(element) {
        if (!element) return null;

        // Check for main artwork
        if (element.id === 'custom-artwork' || element.id === 'custom-artwork-tiled') {
            return 'main';
        }

        // Check for title artwork
        if (element.id === 'custom-title-artwork' || element.id === 'custom-title-artwork-tiled') {
            return 'title';
        }

        // Walk up to check parent groups
        let current = element.parentElement;
        let depth = 0;
        const maxDepth = 5;

        while (current && depth < maxDepth) {
            if (current.id === 'title-artwork-group') {
                return 'title';
            }
            current = current.parentElement;
            depth++;
        }

        return null;
    }

    /**
     * Check if an element is a draggable artwork element (box art editor)
     * @param {Element} element - The clicked element
     * @returns {'boxart-main'|'boxart-vignette'|null} The artwork type or null
     */
    static getBoxArtDraggableType(element) {
        if (!element) return null;

        // Check for main box art artwork
        if (element.id === 'boxart-main-artwork') {
            return 'boxart-main';
        }

        // Check for vignette artwork
        if (element.id === 'boxart-vignette-artwork') {
            return 'boxart-vignette';
        }

        // Walk up to check parent groups
        let current = element.parentElement;
        let depth = 0;
        const maxDepth = 5;

        while (current && depth < maxDepth) {
            if (current.id === 'vignette-artwork-group') {
                return 'boxart-vignette';
            }
            current = current.parentElement;
            depth++;
        }

        return null;
    }

    /**
     * Handle mouse wheel for scaling artwork (overlay)
     * @param {WheelEvent} event
     */
    static handleOverlayWheel(event) {
        const target = event.target;
        const dragType = DraggableArtwork.getOverlayDraggableType(target);

        if (!dragType) return;

        // Prevent page scroll when over artwork
        event.preventDefault();

        DraggableArtwork.applyWheelZoom(event, dragType);
    }

    /**
     * Handle mouse wheel for scaling artwork (box art)
     * @param {WheelEvent} event
     */
    static handleBoxArtWheel(event) {
        const target = event.target;
        const dragType = DraggableArtwork.getBoxArtDraggableType(target);

        if (!dragType) return;

        // Prevent page scroll when over artwork
        event.preventDefault();

        DraggableArtwork.applyWheelZoom(event, dragType);
    }

    /**
     * Apply zoom from wheel event
     * @param {WheelEvent} event
     * @param {string} dragType - The artwork type
     */
    static applyWheelZoom(event, dragType) {
        // deltaY is positive when scrolling down (zoom out), negative when scrolling up (zoom in)
        const zoomFactor = event.deltaY > 0 ? 0.95 : 1.05;

        if (dragType === 'main') {
            let scale = appState.getArtworkScale();
            scale = Math.max(0.5, Math.min(2.5, scale * zoomFactor));

            appState.setArtworkScale(scale);

            const slider = document.getElementById('artwork-scale');
            if (slider) slider.value = scale;

            const display = document.getElementById('scale-value');
            if (display) display.textContent = Math.round(scale * 100);

            const dataURL = appState.getArtworkData();
            if (dataURL) {
                MainArtwork.insertArtwork(dataURL);
            }

        } else if (dragType === 'title') {
            let scale = appState.getTitleArtworkScale();
            scale = Math.max(0.5, Math.min(3.0, scale * zoomFactor));

            appState.setTitleArtworkScale(scale);

            const slider = document.getElementById('title-artwork-scale');
            if (slider) slider.value = scale;

            const display = document.getElementById('title-artwork-scale-value');
            if (display) display.textContent = Math.round(scale * 100);

            const dataURL = appState.getTitleArtworkData();
            if (dataURL) {
                TitleArtwork.insertTitleArtwork(dataURL);
            }

        } else if (dragType === 'boxart-main') {
            let scale = appState.getBoxArtArtworkScale();
            scale = Math.max(0.1, Math.min(3.0, scale * zoomFactor));

            appState.setBoxArtArtworkScale(scale);

            const slider = document.getElementById('boxart-art-scale');
            if (slider) slider.value = scale;

            const display = document.getElementById('boxart-art-scale-value');
            if (display) display.textContent = Math.round(scale * 100);

            const dataURL = appState.getBoxArtArtworkData();
            if (dataURL) {
                DraggableArtwork.updateBoxArtMainArtwork(dataURL);
            }

        } else if (dragType === 'boxart-vignette') {
            let scale = appState._boxArtVignetteArtworkScale ?? 1;
            scale = Math.max(0.1, Math.min(3.0, scale * zoomFactor));

            appState._boxArtVignetteArtworkScale = scale;

            const slider = document.getElementById('boxart-vignette-art-scale');
            if (slider) slider.value = scale;

            const display = document.getElementById('boxart-vignette-art-scale-value');
            if (display) display.textContent = Math.round(scale * 100);

            const dataURL = appState._boxArtVignetteArtworkData;
            if (dataURL) {
                DraggableArtwork.updateBoxArtVignetteArtwork();
            }
        }
    }

    /**
     * Handle mousedown event for overlay editor
     * @param {MouseEvent} event
     */
    static handleOverlayMouseDown(event) {
        const target = event.target;
        const dragType = DraggableArtwork.getOverlayDraggableType(target);

        if (!dragType) return;

        event.preventDefault();

        DraggableArtwork.isDragging = true;
        DraggableArtwork.dragTarget = dragType;
        DraggableArtwork.activePreviewId = 'svg-preview';
        DraggableArtwork.activeSvgElement = DraggableArtwork.getSvgElement('svg-preview');

        const svgCoords = DraggableArtwork.screenToSvgCoords(event.clientX, event.clientY, 'svg-preview');
        DraggableArtwork.dragStartPos = svgCoords;

        if (dragType === 'main') {
            const pos = appState.getArtworkPosition();
            DraggableArtwork.artworkStartPos = { x: pos.x, y: pos.y };
        } else if (dragType === 'title') {
            const pos = appState.getTitleArtworkPosition();
            DraggableArtwork.artworkStartPos = { x: pos.x, y: pos.y };
        }

        document.body.classList.add('artwork-dragging');
    }

    /**
     * Handle mousedown event for box art editor
     * @param {MouseEvent} event
     */
    static handleBoxArtMouseDown(event) {
        const target = event.target;
        const dragType = DraggableArtwork.getBoxArtDraggableType(target);

        if (!dragType) return;

        event.preventDefault();

        DraggableArtwork.isDragging = true;
        DraggableArtwork.dragTarget = dragType;
        DraggableArtwork.activePreviewId = 'boxart-svg-preview';
        DraggableArtwork.activeSvgElement = DraggableArtwork.getSvgElement('boxart-svg-preview');

        const svgCoords = DraggableArtwork.screenToSvgCoords(event.clientX, event.clientY, 'boxart-svg-preview');
        DraggableArtwork.dragStartPos = svgCoords;

        if (dragType === 'boxart-main') {
            const pos = appState.getBoxArtArtworkPosition();
            DraggableArtwork.artworkStartPos = { x: pos.x, y: pos.y };
        } else if (dragType === 'boxart-vignette') {
            const x = appState._boxArtVignetteArtworkX ?? 0;
            const y = appState._boxArtVignetteArtworkY ?? 0;
            DraggableArtwork.artworkStartPos = { x, y };
        }

        document.body.classList.add('artwork-dragging');
    }

    /**
     * Handle mousemove event - update position during drag
     * @param {MouseEvent} event
     */
    static handleMouseMove(event) {
        if (!DraggableArtwork.isDragging) return;

        event.preventDefault();

        const svgCoords = DraggableArtwork.screenToSvgCoords(
            event.clientX,
            event.clientY,
            DraggableArtwork.activePreviewId
        );

        const deltaX = svgCoords.x - DraggableArtwork.dragStartPos.x;
        const deltaY = svgCoords.y - DraggableArtwork.dragStartPos.y;

        let newX = DraggableArtwork.artworkStartPos.x + deltaX;
        let newY = DraggableArtwork.artworkStartPos.y + deltaY;

        const dragTarget = DraggableArtwork.dragTarget;

        if (dragTarget === 'main') {
            newX = Math.max(-55, Math.min(55, newX));
            newY = Math.max(-90, Math.min(90, newY));

            appState.setArtworkPosition(newX, newY);

            const xSlider = document.getElementById('artwork-x-pos');
            const ySlider = document.getElementById('artwork-y-pos');
            if (xSlider) xSlider.value = newX;
            if (ySlider) ySlider.value = newY;

            const xValue = document.getElementById('x-position-value');
            const yValue = document.getElementById('y-position-value');
            if (xValue) xValue.textContent = newX.toFixed(1);
            if (yValue) yValue.textContent = newY.toFixed(1);

            const dataURL = appState.getArtworkData();
            if (dataURL) {
                MainArtwork.insertArtwork(dataURL);
            }

        } else if (dragTarget === 'title') {
            newX = Math.max(-25, Math.min(25, newX));
            newY = Math.max(-10, Math.min(10, newY));

            appState.setTitleArtworkPosition(newX, newY);

            const xSlider = document.getElementById('title-artwork-x-pos');
            const ySlider = document.getElementById('title-artwork-y-pos');
            if (xSlider) xSlider.value = newX;
            if (ySlider) ySlider.value = newY;

            const xValue = document.getElementById('title-artwork-x-value');
            const yValue = document.getElementById('title-artwork-y-value');
            if (xValue) xValue.textContent = newX.toFixed(1);
            if (yValue) yValue.textContent = newY.toFixed(1);

            const dataURL = appState.getTitleArtworkData();
            if (dataURL) {
                TitleArtwork.insertTitleArtwork(dataURL);
            }

        } else if (dragTarget === 'boxart-main') {
            newX = Math.max(-200, Math.min(200, newX));
            newY = Math.max(-200, Math.min(200, newY));

            appState.setBoxArtArtworkPosition(newX, newY);

            const xSlider = document.getElementById('boxart-art-x');
            const ySlider = document.getElementById('boxart-art-y');
            if (xSlider) xSlider.value = newX;
            if (ySlider) ySlider.value = newY;

            const xValue = document.getElementById('boxart-art-x-value');
            const yValue = document.getElementById('boxart-art-y-value');
            if (xValue) xValue.textContent = newX.toFixed(0);
            if (yValue) yValue.textContent = newY.toFixed(0);

            const dataURL = appState.getBoxArtArtworkData();
            if (dataURL) {
                DraggableArtwork.updateBoxArtMainArtwork(dataURL);
            }

        } else if (dragTarget === 'boxart-vignette') {
            newX = Math.max(-100, Math.min(100, newX));
            newY = Math.max(-100, Math.min(100, newY));

            appState._boxArtVignetteArtworkX = newX;
            appState._boxArtVignetteArtworkY = newY;

            const xSlider = document.getElementById('boxart-vignette-art-x');
            const ySlider = document.getElementById('boxart-vignette-art-y');
            if (xSlider) xSlider.value = newX;
            if (ySlider) ySlider.value = newY;

            const xValue = document.getElementById('boxart-vignette-art-x-value');
            const yValue = document.getElementById('boxart-vignette-art-y-value');
            if (xValue) xValue.textContent = newX.toFixed(0);
            if (yValue) yValue.textContent = newY.toFixed(0);

            const dataURL = appState._boxArtVignetteArtworkData;
            if (dataURL) {
                DraggableArtwork.updateBoxArtVignetteArtwork();
            }
        }
    }

    /**
     * Update box art main artwork (calls BoxArtEditor dynamically)
     * @param {string} dataURL - Image data URL
     */
    static async updateBoxArtMainArtwork(dataURL) {
        const { BoxArtEditor } = await import('./boxArtEditor.js');
        BoxArtEditor.insertArtwork(dataURL);
    }

    /**
     * Update box art vignette artwork (calls BoxArtEditor dynamically)
     */
    static async updateBoxArtVignetteArtwork() {
        const { BoxArtEditor } = await import('./boxArtEditor.js');
        BoxArtEditor.insertVignetteArtwork(appState._boxArtVignetteArtworkData);
    }

    /**
     * Handle mouseup event - end drag
     * @param {MouseEvent} event
     */
    static handleMouseUp(event) {
        if (!DraggableArtwork.isDragging) return;

        DraggableArtwork.isDragging = false;
        DraggableArtwork.dragTarget = null;
        DraggableArtwork.activeSvgElement = null;
        DraggableArtwork.activePreviewId = null;

        document.body.classList.remove('artwork-dragging');
    }
}
