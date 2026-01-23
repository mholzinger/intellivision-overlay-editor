/**
 * Draggable Artwork Module
 * Handles mouse drag interactions for repositioning and resizing artwork in the SVG preview
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
    static isResizing = false;
    static dragTarget = null;      // 'main' | 'title' | 'boxart-main' | 'boxart-vignette' | null
    static resizeHandle = null;    // 'nw' | 'ne' | 'sw' | 'se' | null
    static dragStartPos = { x: 0, y: 0 };
    static artworkStartPos = { x: 0, y: 0 };
    static artworkStartScale = 1.0;
    static artworkCenter = { x: 0, y: 0 };
    static activeSvgElement = null;
    static activePreviewId = null; // 'svg-preview' | 'boxart-svg-preview'

    // Resize handle configuration
    static HANDLE_SIZE = 1.5;  // Size in SVG units (mm for overlay)
    static HANDLE_COLOR = '#3b82f6';  // Blue color for handles
    static HANDLE_HOVER_COLOR = '#60a5fa';

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
            previewContainer.removeEventListener('mousemove', DraggableArtwork.handleOverlayHover);
        }

        previewContainer.addEventListener('mousedown', DraggableArtwork.handleOverlayMouseDown);
        previewContainer.addEventListener('mousemove', DraggableArtwork.handleOverlayHover);

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
            previewContainer.removeEventListener('mousemove', DraggableArtwork.handleBoxArtHover);
        }

        previewContainer.addEventListener('mousedown', DraggableArtwork.handleBoxArtMouseDown);
        previewContainer.addEventListener('mousemove', DraggableArtwork.handleBoxArtHover);

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
     * Get artwork bounds in SVG coordinates
     * Uses getBBox() to get actual rendered bounds of the image element
     * @param {string} artworkType - The artwork type
     * @param {string} previewId - The preview container ID
     * @returns {{x: number, y: number, width: number, height: number, scale: number, centerX: number, centerY: number}|null}
     */
    static getArtworkBounds(artworkType, previewId) {
        const svg = DraggableArtwork.getSvgElement(previewId);
        if (!svg) return null;

        let artworkId, scale;

        if (artworkType === 'main') {
            artworkId = 'custom-artwork';
            scale = appState.getArtworkScale();
            // Also check for tiled version
            if (!svg.querySelector(`#${artworkId}`)) {
                artworkId = 'custom-artwork-tiled';
            }
        } else if (artworkType === 'title') {
            artworkId = 'custom-title-artwork';
            scale = appState.getTitleArtworkScale();
            if (!svg.querySelector(`#${artworkId}`)) {
                artworkId = 'custom-title-artwork-tiled';
            }
        } else if (artworkType === 'boxart-main') {
            artworkId = 'boxart-main-artwork';
            scale = appState.getBoxArtArtworkScale();
        } else if (artworkType === 'boxart-vignette') {
            artworkId = 'boxart-vignette-artwork';
            scale = appState._boxArtVignetteArtworkScale ?? 1;
        } else {
            return null;
        }

        // Find the artwork element
        const artworkElement = svg.querySelector(`#${artworkId}`);
        if (!artworkElement) return null;

        try {
            // Get the bounding box of the element (includes transforms)
            const bbox = artworkElement.getBBox();

            // For transformed elements, we need to apply the transform to get screen coords
            // Get the element's transform matrix
            const ctm = artworkElement.getCTM();
            const svgCTM = svg.getCTM();

            if (ctm && svgCTM) {
                // Calculate the transformed corners
                const svgPoint = svg.createSVGPoint();

                // Transform all 4 corners and find the bounding rectangle
                const corners = [
                    { x: bbox.x, y: bbox.y },
                    { x: bbox.x + bbox.width, y: bbox.y },
                    { x: bbox.x, y: bbox.y + bbox.height },
                    { x: bbox.x + bbox.width, y: bbox.y + bbox.height }
                ];

                // Apply element's local transform relative to SVG
                const localTransform = artworkElement.getScreenCTM();
                const svgInverse = svg.getScreenCTM().inverse();

                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

                for (const corner of corners) {
                    svgPoint.x = corner.x;
                    svgPoint.y = corner.y;
                    // Transform from element coords to SVG coords
                    const transformed = svgPoint.matrixTransform(localTransform).matrixTransform(svgInverse);
                    minX = Math.min(minX, transformed.x);
                    minY = Math.min(minY, transformed.y);
                    maxX = Math.max(maxX, transformed.x);
                    maxY = Math.max(maxY, transformed.y);
                }

                const width = maxX - minX;
                const height = maxY - minY;

                return {
                    x: minX,
                    y: minY,
                    width: width,
                    height: height,
                    centerX: minX + width / 2,
                    centerY: minY + height / 2,
                    scale
                };
            }

            // Fallback: use bbox directly
            return {
                x: bbox.x,
                y: bbox.y,
                width: bbox.width,
                height: bbox.height,
                centerX: bbox.x + bbox.width / 2,
                centerY: bbox.y + bbox.height / 2,
                scale
            };
        } catch (e) {
            // getBBox can throw if element isn't rendered
            console.warn('Could not get artwork bounds:', e);
            return null;
        }
    }

    /**
     * Check if a point is near a resize handle
     * @param {number} x - SVG X coordinate
     * @param {number} y - SVG Y coordinate
     * @param {string} artworkType - The artwork type
     * @param {string} previewId - The preview container ID
     * @returns {'nw'|'ne'|'sw'|'se'|null} Handle position or null
     */
    static getResizeHandle(x, y, artworkType, previewId) {
        const bounds = DraggableArtwork.getArtworkBounds(artworkType, previewId);
        if (!bounds) return null;

        const handleSize = DraggableArtwork.HANDLE_SIZE * 2; // Hit area
        const corners = {
            nw: { x: bounds.x, y: bounds.y },
            ne: { x: bounds.x + bounds.width, y: bounds.y },
            sw: { x: bounds.x, y: bounds.y + bounds.height },
            se: { x: bounds.x + bounds.width, y: bounds.y + bounds.height }
        };

        for (const [handle, corner] of Object.entries(corners)) {
            if (Math.abs(x - corner.x) < handleSize && Math.abs(y - corner.y) < handleSize) {
                return handle;
            }
        }

        return null;
    }

    /**
     * Create or update resize handles for an artwork element
     * @param {string} artworkType - The artwork type
     * @param {string} previewId - The preview container ID
     */
    static updateResizeHandles(artworkType, previewId) {
        const svg = DraggableArtwork.getSvgElement(previewId);
        if (!svg) return;

        const bounds = DraggableArtwork.getArtworkBounds(artworkType, previewId);
        if (!bounds) {
            DraggableArtwork.removeResizeHandles(previewId);
            return;
        }

        const svgNS = "http://www.w3.org/2000/svg";
        const handleSize = DraggableArtwork.HANDLE_SIZE;
        const handleId = `resize-handles-${previewId}`;

        // Remove existing handles
        const existing = svg.querySelector(`#${handleId}`);
        if (existing) existing.remove();

        // Create handle group
        const group = document.createElementNS(svgNS, 'g');
        group.id = handleId;
        group.setAttribute('class', 'resize-handles');

        const corners = {
            nw: { x: bounds.x, y: bounds.y, cursor: 'nw-resize' },
            ne: { x: bounds.x + bounds.width, y: bounds.y, cursor: 'ne-resize' },
            sw: { x: bounds.x, y: bounds.y + bounds.height, cursor: 'sw-resize' },
            se: { x: bounds.x + bounds.width, y: bounds.y + bounds.height, cursor: 'se-resize' }
        };

        for (const [handle, corner] of Object.entries(corners)) {
            const rect = document.createElementNS(svgNS, 'rect');
            rect.setAttribute('x', (corner.x - handleSize / 2).toString());
            rect.setAttribute('y', (corner.y - handleSize / 2).toString());
            rect.setAttribute('width', handleSize.toString());
            rect.setAttribute('height', handleSize.toString());
            rect.setAttribute('fill', DraggableArtwork.HANDLE_COLOR);
            rect.setAttribute('stroke', '#ffffff');
            rect.setAttribute('stroke-width', '0.3');
            rect.setAttribute('class', `resize-handle resize-handle-${handle}`);
            rect.setAttribute('data-handle', handle);
            rect.style.cursor = corner.cursor;
            group.appendChild(rect);
        }

        svg.appendChild(group);
    }

    /**
     * Remove resize handles from preview
     * @param {string} previewId - The preview container ID
     */
    static removeResizeHandles(previewId) {
        const svg = DraggableArtwork.getSvgElement(previewId);
        if (!svg) return;

        const handleId = `resize-handles-${previewId}`;
        const existing = svg.querySelector(`#${handleId}`);
        if (existing) existing.remove();
    }

    /**
     * Check if an element is a draggable artwork element (overlay editor)
     * @param {Element} element - The clicked element
     * @returns {'main'|'title'|null} The artwork type or null
     */
    static getOverlayDraggableType(element) {
        if (!element) return null;

        // Check for resize handle first
        if (element.classList?.contains('resize-handle')) {
            // Return the artwork type the handle belongs to
            // Determine by checking which artwork exists
            if (appState.getArtworkData()) return 'main';
            if (appState.getTitleArtworkData()) return 'title';
            return null;
        }

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

        // Check for resize handle first
        if (element.classList?.contains('resize-handle')) {
            if (appState.getBoxArtArtworkData()) return 'boxart-main';
            if (appState._boxArtVignetteArtworkData) return 'boxart-vignette';
            return null;
        }

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
     * Handle hover for showing resize handles (overlay)
     * @param {MouseEvent} event
     */
    static handleOverlayHover(event) {
        if (DraggableArtwork.isDragging || DraggableArtwork.isResizing) return;

        const target = event.target;
        const dragType = DraggableArtwork.getOverlayDraggableType(target);

        if (dragType) {
            DraggableArtwork.updateResizeHandles(dragType, 'svg-preview');
        } else if (!target.classList?.contains('resize-handle')) {
            // Only remove if not hovering a handle
            DraggableArtwork.removeResizeHandles('svg-preview');
        }
    }

    /**
     * Handle hover for showing resize handles (box art)
     * @param {MouseEvent} event
     */
    static handleBoxArtHover(event) {
        if (DraggableArtwork.isDragging || DraggableArtwork.isResizing) return;

        const target = event.target;
        const dragType = DraggableArtwork.getBoxArtDraggableType(target);

        if (dragType) {
            DraggableArtwork.updateResizeHandles(dragType, 'boxart-svg-preview');
        } else if (!target.classList?.contains('resize-handle')) {
            DraggableArtwork.removeResizeHandles('boxart-svg-preview');
        }
    }

    /**
     * Handle mousedown event for overlay editor
     * @param {MouseEvent} event
     */
    static handleOverlayMouseDown(event) {
        const target = event.target;

        // Check for resize handle click
        if (target.classList?.contains('resize-handle')) {
            const handle = target.getAttribute('data-handle');
            const dragType = DraggableArtwork.getOverlayDraggableType(target);

            if (handle && dragType) {
                event.preventDefault();
                DraggableArtwork.startResize(event, dragType, handle, 'svg-preview');
                return;
            }
        }

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

        // Check for resize handle click
        if (target.classList?.contains('resize-handle')) {
            const handle = target.getAttribute('data-handle');
            const dragType = DraggableArtwork.getBoxArtDraggableType(target);

            if (handle && dragType) {
                event.preventDefault();
                DraggableArtwork.startResize(event, dragType, handle, 'boxart-svg-preview');
                return;
            }
        }

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
            const x = appState._boxArtVignetteArtworkX ?? 0;
            const y = appState._boxArtVignetteArtworkY ?? 0;
            DraggableArtwork.artworkStartPos = { x, y };
        }

        // Add dragging class for cursor feedback
        document.body.classList.add('artwork-dragging');
    }

    /**
     * Start resize operation
     * @param {MouseEvent} event
     * @param {string} dragType - The artwork type
     * @param {string} handle - The handle being dragged
     * @param {string} previewId - The preview container ID
     */
    static startResize(event, dragType, handle, previewId) {
        DraggableArtwork.isResizing = true;
        DraggableArtwork.dragTarget = dragType;
        DraggableArtwork.resizeHandle = handle;
        DraggableArtwork.activePreviewId = previewId;
        DraggableArtwork.activeSvgElement = DraggableArtwork.getSvgElement(previewId);

        // Store starting position
        const svgCoords = DraggableArtwork.screenToSvgCoords(event.clientX, event.clientY, previewId);
        DraggableArtwork.dragStartPos = svgCoords;

        // Get current scale and center
        const bounds = DraggableArtwork.getArtworkBounds(dragType, previewId);
        if (bounds) {
            DraggableArtwork.artworkStartScale = bounds.scale;
            DraggableArtwork.artworkCenter = { x: bounds.centerX, y: bounds.centerY };
        }

        document.body.classList.add('artwork-resizing');
    }

    /**
     * Handle mousemove event - update position or scale during drag/resize
     * @param {MouseEvent} event
     */
    static handleMouseMove(event) {
        if (DraggableArtwork.isResizing) {
            DraggableArtwork.handleResizeMove(event);
            return;
        }

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
                DraggableArtwork.updateResizeHandles('main', 'svg-preview');
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
                DraggableArtwork.updateResizeHandles('title', 'svg-preview');
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
     * Handle resize mouse move
     * @param {MouseEvent} event
     */
    static handleResizeMove(event) {
        event.preventDefault();

        const svgCoords = DraggableArtwork.screenToSvgCoords(
            event.clientX,
            event.clientY,
            DraggableArtwork.activePreviewId
        );

        const center = DraggableArtwork.artworkCenter;
        const startScale = DraggableArtwork.artworkStartScale;

        // Calculate distance from center at start and now
        const startDist = Math.sqrt(
            Math.pow(DraggableArtwork.dragStartPos.x - center.x, 2) +
            Math.pow(DraggableArtwork.dragStartPos.y - center.y, 2)
        );
        const currentDist = Math.sqrt(
            Math.pow(svgCoords.x - center.x, 2) +
            Math.pow(svgCoords.y - center.y, 2)
        );

        // Calculate new scale based on distance ratio
        let newScale = startScale * (currentDist / startDist);

        const dragTarget = DraggableArtwork.dragTarget;

        // Apply scale constraints and update based on type
        if (dragTarget === 'main') {
            newScale = Math.max(0.5, Math.min(2.5, newScale));

            appState.setArtworkScale(newScale);

            const slider = document.getElementById('artwork-scale');
            if (slider) slider.value = newScale;

            const display = document.getElementById('scale-value');
            if (display) display.textContent = Math.round(newScale * 100);

            const dataURL = appState.getArtworkData();
            if (dataURL) {
                MainArtwork.insertArtwork(dataURL);
                DraggableArtwork.updateResizeHandles('main', 'svg-preview');
            }

        } else if (dragTarget === 'title') {
            newScale = Math.max(0.5, Math.min(3.0, newScale));

            appState.setTitleArtworkScale(newScale);

            const slider = document.getElementById('title-artwork-scale');
            if (slider) slider.value = newScale;

            const display = document.getElementById('title-artwork-scale-value');
            if (display) display.textContent = Math.round(newScale * 100);

            const dataURL = appState.getTitleArtworkData();
            if (dataURL) {
                TitleArtwork.insertTitleArtwork(dataURL);
                DraggableArtwork.updateResizeHandles('title', 'svg-preview');
            }

        } else if (dragTarget === 'boxart-main') {
            newScale = Math.max(0.1, Math.min(3.0, newScale));

            appState.setBoxArtArtworkScale(newScale);

            const slider = document.getElementById('boxart-art-scale');
            if (slider) slider.value = newScale;

            const display = document.getElementById('boxart-art-scale-value');
            if (display) display.textContent = Math.round(newScale * 100);

            const dataURL = appState.getBoxArtArtworkData();
            if (dataURL) {
                DraggableArtwork.updateBoxArtMainArtwork(dataURL);
            }

        } else if (dragTarget === 'boxart-vignette') {
            newScale = Math.max(0.1, Math.min(3.0, newScale));

            appState._boxArtVignetteArtworkScale = newScale;

            const slider = document.getElementById('boxart-vignette-art-scale');
            if (slider) slider.value = newScale;

            const display = document.getElementById('boxart-vignette-art-scale-value');
            if (display) display.textContent = Math.round(newScale * 100);

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
        DraggableArtwork.updateResizeHandles('boxart-main', 'boxart-svg-preview');
    }

    /**
     * Update box art vignette artwork (calls BoxArtEditor dynamically)
     */
    static async updateBoxArtVignetteArtwork() {
        const { BoxArtEditor } = await import('./boxArtEditor.js');
        BoxArtEditor.insertVignetteArtwork(appState._boxArtVignetteArtworkData);
        DraggableArtwork.updateResizeHandles('boxart-vignette', 'boxart-svg-preview');
    }

    /**
     * Handle mouseup event - end drag or resize
     * @param {MouseEvent} event
     */
    static handleMouseUp(event) {
        if (DraggableArtwork.isResizing) {
            DraggableArtwork.isResizing = false;
            DraggableArtwork.resizeHandle = null;
            document.body.classList.remove('artwork-resizing');
        }

        if (DraggableArtwork.isDragging) {
            DraggableArtwork.isDragging = false;
            document.body.classList.remove('artwork-dragging');
        }

        DraggableArtwork.dragTarget = null;
        DraggableArtwork.activeSvgElement = null;
        DraggableArtwork.activePreviewId = null;
    }
}
