/**
 * Draggable Artwork Module
 * Handles mouse drag interactions for repositioning artwork in the SVG preview
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
        }

        previewContainer.addEventListener('mousedown', DraggableArtwork.handleOverlayMouseDown);

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
        }

        previewContainer.addEventListener('mousedown', DraggableArtwork.handleBoxArtMouseDown);

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

        // Create an SVG point and transform it
        const point = svg.createSVGPoint();
        point.x = screenX;
        point.y = screenY;

        // Get the inverse of the screen transformation matrix
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
            // Check if we're inside the vignette artwork clip group
            if (current.id === 'vignette-artwork-group') {
                return 'boxart-vignette';
            }
            current = current.parentElement;
            depth++;
        }

        return null;
    }

    /**
     * Handle mousedown event for overlay editor
     * @param {MouseEvent} event
     */
    static handleOverlayMouseDown(event) {
        const target = event.target;
        const dragType = DraggableArtwork.getOverlayDraggableType(target);

        if (!dragType) return;

        // Prevent default to avoid text selection
        event.preventDefault();

        DraggableArtwork.isDragging = true;
        DraggableArtwork.dragTarget = dragType;
        DraggableArtwork.activePreviewId = 'svg-preview';
        DraggableArtwork.activeSvgElement = DraggableArtwork.getSvgElement('svg-preview');

        // Store starting positions
        const svgCoords = DraggableArtwork.screenToSvgCoords(event.clientX, event.clientY, 'svg-preview');
        DraggableArtwork.dragStartPos = svgCoords;

        // Get current artwork position based on type
        if (dragType === 'main') {
            const pos = appState.getArtworkPosition();
            DraggableArtwork.artworkStartPos = { x: pos.x, y: pos.y };
        } else if (dragType === 'title') {
            const pos = appState.getTitleArtworkPosition();
            DraggableArtwork.artworkStartPos = { x: pos.x, y: pos.y };
        }

        // Add dragging class for cursor feedback
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

        // Prevent default to avoid text selection
        event.preventDefault();

        DraggableArtwork.isDragging = true;
        DraggableArtwork.dragTarget = dragType;
        DraggableArtwork.activePreviewId = 'boxart-svg-preview';
        DraggableArtwork.activeSvgElement = DraggableArtwork.getSvgElement('boxart-svg-preview');

        // Store starting positions
        const svgCoords = DraggableArtwork.screenToSvgCoords(event.clientX, event.clientY, 'boxart-svg-preview');
        DraggableArtwork.dragStartPos = svgCoords;

        // Get current artwork position based on type
        if (dragType === 'boxart-main') {
            const pos = appState.getBoxArtArtworkPosition();
            DraggableArtwork.artworkStartPos = { x: pos.x, y: pos.y };
        } else if (dragType === 'boxart-vignette') {
            // Get vignette artwork position from state
            const x = appState._boxArtVignetteArtworkX ?? 0;
            const y = appState._boxArtVignetteArtworkY ?? 0;
            DraggableArtwork.artworkStartPos = { x, y };
        }

        // Add dragging class for cursor feedback
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

        // Calculate delta from start
        const deltaX = svgCoords.x - DraggableArtwork.dragStartPos.x;
        const deltaY = svgCoords.y - DraggableArtwork.dragStartPos.y;

        // Calculate new position
        let newX = DraggableArtwork.artworkStartPos.x + deltaX;
        let newY = DraggableArtwork.artworkStartPos.y + deltaY;

        const dragTarget = DraggableArtwork.dragTarget;

        // Apply constraints and update based on drag type
        if (dragTarget === 'main') {
            // Overlay main artwork limits: -55 to 55 for X, -90 to 90 for Y
            newX = Math.max(-55, Math.min(55, newX));
            newY = Math.max(-90, Math.min(90, newY));

            // Update state and UI
            appState.setArtworkPosition(newX, newY);

            // Update sliders
            const xSlider = document.getElementById('artwork-x-pos');
            const ySlider = document.getElementById('artwork-y-pos');
            if (xSlider) xSlider.value = newX;
            if (ySlider) ySlider.value = newY;

            // Update display values
            const xValue = document.getElementById('x-position-value');
            const yValue = document.getElementById('y-position-value');
            if (xValue) xValue.textContent = newX.toFixed(1);
            if (yValue) yValue.textContent = newY.toFixed(1);

            // Re-render artwork
            const dataURL = appState.getArtworkData();
            if (dataURL) {
                MainArtwork.insertArtwork(dataURL);
            }

        } else if (dragTarget === 'title') {
            // Title artwork limits: -25 to 25 for X, -10 to 10 for Y
            newX = Math.max(-25, Math.min(25, newX));
            newY = Math.max(-10, Math.min(10, newY));

            // Update state and UI
            appState.setTitleArtworkPosition(newX, newY);

            // Update sliders
            const xSlider = document.getElementById('title-artwork-x-pos');
            const ySlider = document.getElementById('title-artwork-y-pos');
            if (xSlider) xSlider.value = newX;
            if (ySlider) ySlider.value = newY;

            // Update display values
            const xValue = document.getElementById('title-artwork-x-value');
            const yValue = document.getElementById('title-artwork-y-value');
            if (xValue) xValue.textContent = newX.toFixed(1);
            if (yValue) yValue.textContent = newY.toFixed(1);

            // Re-render artwork
            const dataURL = appState.getTitleArtworkData();
            if (dataURL) {
                TitleArtwork.insertTitleArtwork(dataURL);
            }

        } else if (dragTarget === 'boxart-main') {
            // Box art main artwork limits: -200 to 200 for both axes
            newX = Math.max(-200, Math.min(200, newX));
            newY = Math.max(-200, Math.min(200, newY));

            // Update state
            appState.setBoxArtArtworkPosition(newX, newY);

            // Update sliders
            const xSlider = document.getElementById('boxart-art-x');
            const ySlider = document.getElementById('boxart-art-y');
            if (xSlider) xSlider.value = newX;
            if (ySlider) ySlider.value = newY;

            // Update display values
            const xValue = document.getElementById('boxart-art-x-value');
            const yValue = document.getElementById('boxart-art-y-value');
            if (xValue) xValue.textContent = newX.toFixed(0);
            if (yValue) yValue.textContent = newY.toFixed(0);

            // Re-render artwork - need to dynamically import BoxArtEditor to avoid circular deps
            const dataURL = appState.getBoxArtArtworkData();
            if (dataURL) {
                DraggableArtwork.updateBoxArtMainArtwork(dataURL);
            }

        } else if (dragTarget === 'boxart-vignette') {
            // Vignette artwork limits: -100 to 100 for both axes
            newX = Math.max(-100, Math.min(100, newX));
            newY = Math.max(-100, Math.min(100, newY));

            // Update state (using direct property access like BoxArtEditor does)
            appState._boxArtVignetteArtworkX = newX;
            appState._boxArtVignetteArtworkY = newY;

            // Update sliders
            const xSlider = document.getElementById('boxart-vignette-art-x');
            const ySlider = document.getElementById('boxart-vignette-art-y');
            if (xSlider) xSlider.value = newX;
            if (ySlider) ySlider.value = newY;

            // Update display values
            const xValue = document.getElementById('boxart-vignette-art-x-value');
            const yValue = document.getElementById('boxart-vignette-art-y-value');
            if (xValue) xValue.textContent = newX.toFixed(0);
            if (yValue) yValue.textContent = newY.toFixed(0);

            // Re-render vignette artwork
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
        // Dynamically import to avoid circular dependency
        const { BoxArtEditor } = await import('./boxArtEditor.js');
        BoxArtEditor.insertArtwork(dataURL);
    }

    /**
     * Update box art vignette artwork (calls BoxArtEditor dynamically)
     */
    static async updateBoxArtVignetteArtwork() {
        // Dynamically import to avoid circular dependency
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

        // Remove dragging class
        document.body.classList.remove('artwork-dragging');
    }
}
