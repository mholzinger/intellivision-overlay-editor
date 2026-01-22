/**
 * Export Manager Module
 * Handles PNG export and overlay reset functionality
 */

import { appState } from '../services/stateManager.js';
import { UIManager } from './uiManager.js';
import { APIService } from '../services/api.js';

export class ExportManager {
    /**
     * Cache for fetched font data URLs to avoid re-fetching
     */
    static fontCache = new Map();

    /**
     * Overlay shape path data (from outer_boundary in SVG template)
     * Coordinates are in mm (SVG viewBox is 55.6 x 90.4)
     */
    static OVERLAY_SHAPE = {
        // Path commands matching outer_boundary: M 2.26 0 L 53.34 0 Q 55.6 0 55.6 2.26 ...
        topLeftRadius: 2.26,
        topRightX: 53.34,
        bottomCornerRadius: 9.0,  // Large radius at bottom corners
        bottomY: 81.4,            // Where the large radius starts
        width: 55.6,
        height: 90.4
    };

    /**
     * Apply the overlay mask (rounded corners) to a canvas context
     * This clips the canvas to match the Intellivision overlay shape
     * @param {CanvasRenderingContext2D} ctx - Canvas context to apply mask to
     * @param {number} canvasWidth - Canvas width in pixels
     * @param {number} canvasHeight - Canvas height in pixels
     */
    static applyOverlayMask(ctx, canvasWidth, canvasHeight) {
        const shape = ExportManager.OVERLAY_SHAPE;
        const scaleX = canvasWidth / shape.width;
        const scaleY = canvasHeight / shape.height;

        ctx.beginPath();
        // M 2.26 0 - start at top-left rounded corner
        ctx.moveTo(shape.topLeftRadius * scaleX, 0);
        // L 53.34 0 - line to top-right
        ctx.lineTo(shape.topRightX * scaleX, 0);
        // Q 55.6 0 55.6 2.26 - top-right corner
        ctx.quadraticCurveTo(shape.width * scaleX, 0, shape.width * scaleX, shape.topLeftRadius * scaleY);
        // L 55.6 81.4 - right side
        ctx.lineTo(shape.width * scaleX, shape.bottomY * scaleY);
        // Q 55.6 90.4 46.6 90.4 - bottom-right corner (large radius)
        ctx.quadraticCurveTo(shape.width * scaleX, shape.height * scaleY, (shape.width - shape.bottomCornerRadius) * scaleX, shape.height * scaleY);
        // L 9.0 90.4 - bottom edge
        ctx.lineTo(shape.bottomCornerRadius * scaleX, shape.height * scaleY);
        // Q 0 90.4 0 81.4 - bottom-left corner (large radius)
        ctx.quadraticCurveTo(0, shape.height * scaleY, 0, shape.bottomY * scaleY);
        // L 0 2.26 - left side
        ctx.lineTo(0, shape.topLeftRadius * scaleY);
        // Q 0 0 2.26 0 - top-left corner
        ctx.quadraticCurveTo(0, 0, shape.topLeftRadius * scaleX, 0);
        ctx.closePath();
        ctx.clip();
    }

    /**
     * Convert hex color and opacity to RGBA string
     * This bakes opacity into the color for better CairoSVG compatibility
     * @param {string} hexColor - Hex color (e.g., '#3fe628')
     * @param {number} opacity - Opacity value (0-1)
     * @returns {string} RGBA color string (e.g., 'rgba(63, 230, 40, 0.4)')
     */
    static hexToRGBA(hexColor, opacity) {
        // Remove # if present
        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    /**
     * Fetch a font file and convert it to a base64 data URL
     * @param {string} fontUrl - The URL of the font file (e.g., '/fonts/SomeFont.ttf')
     * @returns {Promise<string>} Base64 data URL of the font
     */
    static async fetchFontAsDataURL(fontUrl) {
        // Check cache first
        if (ExportManager.fontCache.has(fontUrl)) {
            return ExportManager.fontCache.get(fontUrl);
        }

        try {
            const response = await fetch(fontUrl);
            if (!response.ok) {
                console.error(`Failed to fetch font: ${fontUrl}`);
                return null;
            }

            const blob = await response.blob();
            const mimeType = fontUrl.toLowerCase().endsWith('.otf') ? 'font/otf' : 'font/ttf';

            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const dataUrl = reader.result;
                    // Cache the result
                    ExportManager.fontCache.set(fontUrl, dataUrl);
                    resolve(dataUrl);
                };
                reader.onerror = () => {
                    console.error(`Failed to read font blob: ${fontUrl}`);
                    resolve(null);
                };
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            console.error(`Error fetching font ${fontUrl}:`, e);
            return null;
        }
    }

    /**
     * Replace font URL references in CSS with inline base64 data URLs
     * @param {string} cssText - The CSS text containing @font-face rules
     * @returns {Promise<string>} CSS text with inlined fonts
     */
    static async inlineFontsInCSS(cssText) {
        if (!cssText) return cssText;

        // Find all url('/fonts/...') references
        const fontUrlRegex = /url\(['"]?(\/fonts\/[^'")]+)['"]?\)/g;
        const matches = [...cssText.matchAll(fontUrlRegex)];

        if (matches.length === 0) {
            return cssText;
        }

        let result = cssText;
        for (const match of matches) {
            const fontUrl = match[1];
            const dataUrl = await ExportManager.fetchFontAsDataURL(fontUrl);
            if (dataUrl) {
                // Replace the url('/fonts/...') with url('data:...')
                result = result.replace(match[0], `url('${dataUrl}')`);
            }
        }

        return result;
    }

    /**
     * Pre-render a text element to an image using the browser's font rendering
     * This ensures fonts display correctly in export even if CairoSVG can't find them
     * @param {SVGTextElement} textEl - The text element to render
     * @param {number} scale - Scale factor for rendering quality
     * @returns {Promise<{dataURL: string, x: number, y: number, width: number, height: number}|null>}
     */
    static async preRenderTextElement(textEl, scale = 10) {
        if (!textEl || !textEl.textContent?.trim()) {
            return null;
        }

        try {
            // Get the bounding box in SVG coordinates after transforms are applied
            // getBoundingClientRect gives us the actual rendered position including transforms
            const svgEl = textEl.ownerSVGElement;
            const ctm = svgEl.getScreenCTM();
            const textCtm = textEl.getScreenCTM();

            // Get the bounding box in local coordinates (before transform)
            const localBbox = textEl.getBBox();

            // Check if this element has a transform
            const transform = textEl.getAttribute('transform');
            const hasTransform = transform && transform.includes('rotate');

            let renderBbox;
            if (hasTransform) {
                // For rotated text, we need to get the screen bounding box and convert back to SVG coords
                const screenRect = textEl.getBoundingClientRect();
                const svgRect = svgEl.getBoundingClientRect();

                // Convert screen coordinates to SVG coordinates
                const svgPoint1 = svgEl.createSVGPoint();
                svgPoint1.x = screenRect.left;
                svgPoint1.y = screenRect.top;
                const svgCoord1 = svgPoint1.matrixTransform(ctm.inverse());

                const svgPoint2 = svgEl.createSVGPoint();
                svgPoint2.x = screenRect.right;
                svgPoint2.y = screenRect.bottom;
                const svgCoord2 = svgPoint2.matrixTransform(ctm.inverse());

                renderBbox = {
                    x: Math.min(svgCoord1.x, svgCoord2.x),
                    y: Math.min(svgCoord1.y, svgCoord2.y),
                    width: Math.abs(svgCoord2.x - svgCoord1.x),
                    height: Math.abs(svgCoord2.y - svgCoord1.y)
                };
            } else {
                renderBbox = localBbox;
            }

            // Create a temporary SVG to render just this text element
            const svgNS = 'http://www.w3.org/2000/svg';
            const tempSvg = document.createElementNS(svgNS, 'svg');

            // Set viewBox to match the rendered bbox with some padding
            const padding = 0.5; // SVG units
            tempSvg.setAttribute('viewBox', `${renderBbox.x - padding} ${renderBbox.y - padding} ${renderBbox.width + padding * 2} ${renderBbox.height + padding * 2}`);
            tempSvg.setAttribute('width', (renderBbox.width + padding * 2) * scale);
            tempSvg.setAttribute('height', (renderBbox.height + padding * 2) * scale);
            tempSvg.setAttribute('xmlns', svgNS);

            // Clone the text element with all its styles (including transform)
            const clonedText = textEl.cloneNode(true);
            tempSvg.appendChild(clonedText);

            // Also copy any relevant style elements and defs (for gradients) from the parent SVG
            // and inline any font references as base64
            const parentSvg = textEl.ownerSVGElement;
            if (parentSvg) {
                // Copy defs section (contains gradient definitions)
                const defsEl = parentSvg.querySelector('defs');
                if (defsEl) {
                    const clonedDefs = defsEl.cloneNode(true);
                    tempSvg.insertBefore(clonedDefs, tempSvg.firstChild);
                }

                const styleEls = parentSvg.querySelectorAll('style');
                for (const style of styleEls) {
                    const clonedStyle = style.cloneNode(true);
                    // Inline fonts referenced in the style
                    clonedStyle.textContent = await ExportManager.inlineFontsInCSS(clonedStyle.textContent);
                    tempSvg.insertBefore(clonedStyle, tempSvg.firstChild);
                }
            }

            // Convert SVG to data URL
            const svgString = new XMLSerializer().serializeToString(tempSvg);
            const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);

            // Render SVG to canvas
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);

                    resolve({
                        dataURL: canvas.toDataURL('image/png'),
                        x: renderBbox.x - padding,
                        y: renderBbox.y - padding,
                        width: (renderBbox.width + padding * 2),
                        height: (renderBbox.height + padding * 2),
                        hasTransform: hasTransform
                    });
                };
                img.onerror = function() {
                    console.error('Failed to render text element to image');
                    resolve(null);
                };
                img.src = svgDataUrl;
            });
        } catch (e) {
            console.error('Error pre-rendering text element:', e);
            return null;
        }
    }

    /**
     * Pre-render all text elements to images for export
     * @param {SVGElement} svgDoc - The SVG document
     * @returns {Promise<Map<string, {dataURL: string, x: number, y: number, width: number, height: number}>>}
     */
    static async preRenderAllText(svgDoc) {
        const textRenderings = new Map();
        const scale = 10; // Render at 10x for quality

        // List of text element IDs to pre-render
        const textIds = [
            'title-text',
            'bottom-text',
            'copyright-text',
            'btn-1', 'btn-2', 'btn-3', 'btn-4', 'btn-5', 'btn-6',
            'btn-7', 'btn-8', 'btn-9', 'btn-clear', 'btn-0', 'btn-enter',
            'top-left-label', 'top-right-label', 'bottom-left-label', 'bottom-right-label',
            'row-desc-1', 'row-desc-2', 'row-desc-3', 'row-desc-4',
            'action-desc-left', 'action-desc-right'
        ];

        for (const id of textIds) {
            const textEl = svgDoc.querySelector(`#${id}`);
            if (textEl && textEl.textContent?.trim()) {
                const rendered = await ExportManager.preRenderTextElement(textEl, scale);
                if (rendered) {
                    textRenderings.set(id, rendered);
                }
            }
        }

        return textRenderings;
    }

    /**
     * Replace text elements with pre-rendered images in the export copy
     * @param {SVGElement} exportCopy - The cloned SVG for export
     * @param {Map} textRenderings - Map of element IDs to rendered image data
     */
    static replaceTextWithImages(exportCopy, textRenderings) {
        const svgNS = 'http://www.w3.org/2000/svg';
        const xlinkNS = 'http://www.w3.org/1999/xlink';

        for (const [id, rendering] of textRenderings) {
            const textEl = exportCopy.querySelector(`#${id}`);
            if (!textEl) continue;

            // Create an image element to replace the text
            const img = document.createElementNS(svgNS, 'image');
            img.setAttribute('id', `${id}-rendered`);
            img.setAttributeNS(xlinkNS, 'xlink:href', rendering.dataURL);
            img.setAttribute('x', rendering.x.toString());
            img.setAttribute('y', rendering.y.toString());
            img.setAttribute('width', rendering.width.toString());
            img.setAttribute('height', rendering.height.toString());
            img.setAttribute('preserveAspectRatio', 'none');

            // Only copy transform if the element was NOT pre-rendered with transform applied
            // For rotated text, the transform is already baked into the rendered image
            if (!rendering.hasTransform) {
                const transform = textEl.getAttribute('transform');
                if (transform) {
                    img.setAttribute('transform', transform);
                }
            }

            // Insert the image and remove the text element
            textEl.parentNode.insertBefore(img, textEl);
            textEl.remove();
        }
    }

    /**
     * Convert hex color to RGBA with opacity
     * @param {string} hexColor - Hex color string
     * @param {number} opacity - Opacity value 0-1
     * @returns {string} RGBA color string
     */
    static hexToRGBAString(hexColor, opacity) {
        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    /**
     * Pre-render background fill with opacity to a flat image
     * This ensures CairoSVG renders the opacity correctly by baking it in
     * Supports both solid colors and gradients
     * The opacity is simulated by compositing against white, resulting in a solid opaque image
     * @returns {Promise<{dataURL: string, enabled: boolean}|null>}
     */
    static async preRenderBackground() {
        const bgFillEnabled = document.getElementById('bg-fill-enabled')?.checked;
        const bgFillColor = document.getElementById('bg-fill-color')?.value || '#FFFFFF';
        const bgFillOpacity = parseFloat(document.getElementById('bg-fill-opacity')?.value || '1');
        const gradientEnabled = document.getElementById('bg-fill-gradient-enabled')?.checked;
        const gradientEnd = document.getElementById('bg-fill-gradient-end')?.value || '#000000';
        const gradientDirection = document.getElementById('bg-fill-gradient-direction')?.value || 'left-to-right';

        // SVG dimensions in mm
        const width = 55.6;
        const height = 90.4;

        // Render at higher resolution (pixels per mm)
        const pixelsPerMm = 10;
        const canvasWidth = Math.round(width * pixelsPerMm);
        const canvasHeight = Math.round(height * pixelsPerMm);

        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');

        // Always start with white background - opacity will be composited on top
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        if (bgFillEnabled) {
            // Set global alpha for opacity effect
            ctx.globalAlpha = bgFillOpacity;

            if (gradientEnabled) {
                // Create gradient fill
                let gradient;
                if (gradientDirection === 'center-h' || gradientDirection === 'center-v') {
                    // Radial gradient from center
                    const centerX = canvasWidth / 2;
                    const centerY = canvasHeight / 2;
                    const radius = Math.max(canvasWidth, canvasHeight) / 2;
                    gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
                } else if (gradientDirection === 'top-to-bottom') {
                    gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
                } else {
                    // left-to-right (default)
                    gradient = ctx.createLinearGradient(0, 0, canvasWidth, 0);
                }
                gradient.addColorStop(0, bgFillColor);
                gradient.addColorStop(1, gradientEnd);
                ctx.fillStyle = gradient;
            } else {
                // Solid color
                ctx.fillStyle = bgFillColor;
            }

            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            ctx.globalAlpha = 1.0; // Reset
        }

        return {
            dataURL: canvas.toDataURL('image/png'),
            enabled: bgFillEnabled,
            opacity: bgFillOpacity
        };
    }

    /**
     * Pre-render title background with gradient support and rounded corners
     * @returns {Promise<{dataURL: string, x: number, y: number, width: number, height: number}|null>}
     */
    static async preRenderTitleBackground() {
        const bgEnabled = document.getElementById('title-bg-enabled')?.checked;
        if (!bgEnabled) return null;

        const bgColor = document.getElementById('title-bg-color')?.value || '#0000ff';
        const gradientEnabled = document.getElementById('title-bg-gradient-enabled')?.checked;
        const gradientEnd = document.getElementById('title-bg-gradient-end')?.value || '#000000';
        const gradientDirection = document.getElementById('title-bg-gradient-direction')?.value || 'left-to-right';

        // Title background dimensions - read from UI controls (dynamic title area)
        const x = parseFloat(document.getElementById('title-area-x')?.value) || 3.5;
        const y = parseFloat(document.getElementById('title-area-y')?.value) || 2.4;
        const width = parseFloat(document.getElementById('title-area-width')?.value) || 48.6;
        const height = parseFloat(document.getElementById('title-area-height')?.value) || 11.5;
        const cornerRadius = 1.5; // rx and ry from SVG

        // Render at higher resolution
        const pixelsPerMm = 10;
        const canvasWidth = Math.round(width * pixelsPerMm);
        const canvasHeight = Math.round(height * pixelsPerMm);
        const scaledRadius = cornerRadius * pixelsPerMm;

        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');

        if (gradientEnabled) {
            let gradient;
            if (gradientDirection === 'center-h' || gradientDirection === 'center-v') {
                const centerX = canvasWidth / 2;
                const centerY = canvasHeight / 2;
                const radius = Math.max(canvasWidth, canvasHeight) / 2;
                gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
            } else if (gradientDirection === 'top-to-bottom') {
                gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
            } else {
                gradient = ctx.createLinearGradient(0, 0, canvasWidth, 0);
            }
            gradient.addColorStop(0, bgColor);
            gradient.addColorStop(1, gradientEnd);
            ctx.fillStyle = gradient;
        } else {
            ctx.fillStyle = bgColor;
        }

        // Draw rounded rectangle
        ctx.beginPath();
        ctx.moveTo(scaledRadius, 0);
        ctx.lineTo(canvasWidth - scaledRadius, 0);
        ctx.quadraticCurveTo(canvasWidth, 0, canvasWidth, scaledRadius);
        ctx.lineTo(canvasWidth, canvasHeight - scaledRadius);
        ctx.quadraticCurveTo(canvasWidth, canvasHeight, canvasWidth - scaledRadius, canvasHeight);
        ctx.lineTo(scaledRadius, canvasHeight);
        ctx.quadraticCurveTo(0, canvasHeight, 0, canvasHeight - scaledRadius);
        ctx.lineTo(0, scaledRadius);
        ctx.quadraticCurveTo(0, 0, scaledRadius, 0);
        ctx.closePath();
        ctx.fill();

        return {
            dataURL: canvas.toDataURL('image/png'),
            x: x,
            y: y,
            width: width,
            height: height
        };
    }

    /**
     * Pre-render tiled artwork to a single image for better export quality
     * @returns {Promise<string|null>} Data URL of pre-rendered tiles, or null if not tiled
     */
    static async preRenderTiledArtwork() {
        const isTiled = appState.getArtworkTiled();
        const dataURL = appState.getArtworkData();

        if (!isTiled || !dataURL) {
            return null;
        }

        return new Promise((resolve) => {
            const img = new Image();
            img.onload = function() {
                // SVG dimensions in mm
                const artworkWidth = 55.6;
                const artworkHeight = 90.4;

                // Render at higher resolution for quality (pixels per mm)
                const pixelsPerMm = 10; // 10 pixels per mm = ~254 DPI
                const canvasWidth = Math.round(artworkWidth * pixelsPerMm);
                const canvasHeight = Math.round(artworkHeight * pixelsPerMm);

                const canvas = document.createElement('canvas');
                canvas.width = canvasWidth;
                canvas.height = canvasHeight;
                const ctx = canvas.getContext('2d');

                // Get current artwork settings
                const scale = appState.getArtworkScale();
                const position = appState.getArtworkPosition();
                const rotation = appState.getArtworkRotation();

                // Tile size in pixels (30mm base * scale * pixelsPerMm)
                const tileSizeMm = 30 * scale;
                const tileSizePx = tileSizeMm * pixelsPerMm;

                // Apply transforms
                ctx.save();

                // Apply position offset (convert mm to pixels)
                ctx.translate(position.x * pixelsPerMm, position.y * pixelsPerMm);

                // Apply rotation around center
                if (rotation !== 0) {
                    const centerX = canvasWidth / 2;
                    const centerY = canvasHeight / 2;
                    ctx.translate(centerX, centerY);
                    ctx.rotate(rotation * Math.PI / 180);
                    ctx.translate(-centerX, -centerY);
                }

                // Calculate how many tiles we need (with extra for rotation overflow)
                const tilesX = Math.ceil(canvasWidth / tileSizePx) + 4;
                const tilesY = Math.ceil(canvasHeight / tileSizePx) + 4;
                const startX = -2 * tileSizePx;
                const startY = -2 * tileSizePx;

                // Draw tiles
                for (let y = 0; y < tilesY; y++) {
                    for (let x = 0; x < tilesX; x++) {
                        ctx.drawImage(
                            img,
                            startX + x * tileSizePx,
                            startY + y * tileSizePx,
                            tileSizePx,
                            tileSizePx
                        );
                    }
                }

                ctx.restore();

                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = function() {
                console.error('Failed to load artwork image for pre-rendering');
                resolve(null);
            };
            img.src = dataURL;
        });
    }

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

            // Pre-render all text elements using browser fonts BEFORE cloning
            // This captures the browser's font rendering as images
            const textRenderings = await ExportManager.preRenderAllText(svgDoc);

            // Pre-render tiled artwork if needed
            const preRenderedTiles = await ExportManager.preRenderTiledArtwork();

            // Pre-render background with opacity baked in (supports gradients)
            const preRenderedBg = await ExportManager.preRenderBackground();

            // Pre-render title background with gradient support
            const preRenderedTitleBg = await ExportManager.preRenderTitleBackground();

            // Clone preview SVG and include page-level preview fonts (if any)
            const exportCopy = svgDoc.cloneNode(true);

            // Replace background rect with pre-rendered image to ensure opacity works
            const bgRect = exportCopy.querySelector('#overlay-background');
            if (bgRect && preRenderedBg) {
                const xlinkNS = 'http://www.w3.org/1999/xlink';
                const svgNS = 'http://www.w3.org/2000/svg';
                const bgImage = document.createElementNS(svgNS, 'image');
                bgImage.setAttribute('id', 'overlay-background-rendered');
                bgImage.setAttributeNS(xlinkNS, 'xlink:href', preRenderedBg.dataURL);
                bgImage.setAttribute('x', '0');
                bgImage.setAttribute('y', '0');
                bgImage.setAttribute('width', '55.6');
                bgImage.setAttribute('height', '90.4');
                bgImage.setAttribute('preserveAspectRatio', 'none');

                // Replace the rect with the image
                bgRect.parentNode.insertBefore(bgImage, bgRect);
                bgRect.remove();
                console.log('Replaced background rect with pre-rendered image, opacity:', preRenderedBg.opacity);
            }

            // Replace text elements with pre-rendered images for reliable font display
            ExportManager.replaceTextWithImages(exportCopy, textRenderings);

            // If we have pre-rendered tiles, replace the pattern-based tiled rect with a simple image
            if (preRenderedTiles) {
                const tiledRect = exportCopy.querySelector('#custom-artwork-tiled');
                const pattern = exportCopy.querySelector('#artwork-pattern');

                if (tiledRect) {
                    // Create a new image element to replace the pattern-filled rect
                    const xlinkNS = 'http://www.w3.org/1999/xlink';
                    const svgNS = 'http://www.w3.org/2000/svg';
                    const newImage = document.createElementNS(svgNS, 'image');
                    newImage.setAttribute('id', 'custom-artwork-prerendered');
                    newImage.setAttributeNS(xlinkNS, 'xlink:href', preRenderedTiles);
                    newImage.setAttribute('x', '0');
                    newImage.setAttribute('y', '0');
                    newImage.setAttribute('width', '55.6');
                    newImage.setAttribute('height', '90.4');
                    newImage.setAttribute('preserveAspectRatio', 'none');
                    newImage.setAttribute('opacity', appState.getArtworkOpacity().toString());

                    // Replace the tiled rect with the pre-rendered image
                    tiledRect.parentNode.insertBefore(newImage, tiledRect);
                    tiledRect.remove();
                }

                // Remove the pattern definition as it's no longer needed
                if (pattern) {
                    pattern.remove();
                }
            }
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

            // Ensure exported title uses selected color and font
            const exportTitle = exportCopy.querySelector('#title-text');
            if (exportTitle) {
                exportTitle.setAttribute('fill', UIManager.getSelectedFontColor());
                // Apply font from selector
                const fontSelect = document.getElementById('font-select');
                if (fontSelect.value) {
                    try {
                        const fontData = JSON.parse(fontSelect.value);
                        exportTitle.setAttribute('font-family', fontData.family);
                    } catch (e) {
                        console.error('Error parsing title font for export:', e);
                    }
                }
            }

            // Ensure title background is applied if enabled (with gradient support)
            const exportTitleBg = exportCopy.querySelector('#title-background');
            const titleBgEnabled = document.getElementById('title-bg-enabled').checked;
            if (exportTitleBg && titleBgEnabled && preRenderedTitleBg) {
                // Replace the rect with a pre-rendered image to support gradients
                const xlinkNS = 'http://www.w3.org/1999/xlink';
                const svgNS = 'http://www.w3.org/2000/svg';
                const titleBgImage = document.createElementNS(svgNS, 'image');
                titleBgImage.setAttribute('id', 'title-background-rendered');
                titleBgImage.setAttributeNS(xlinkNS, 'xlink:href', preRenderedTitleBg.dataURL);
                titleBgImage.setAttribute('x', preRenderedTitleBg.x.toString());
                titleBgImage.setAttribute('y', preRenderedTitleBg.y.toString());
                titleBgImage.setAttribute('width', preRenderedTitleBg.width.toString());
                titleBgImage.setAttribute('height', preRenderedTitleBg.height.toString());
                titleBgImage.setAttribute('preserveAspectRatio', 'none');
                exportTitleBg.parentNode.insertBefore(titleBgImage, exportTitleBg);
                exportTitleBg.remove();
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
            const topValue = document.getElementById('action-top').value;
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
            const bottomLeftValue = document.getElementById('action-bottom-left').value;
            const bottomRightValue = document.getElementById('action-bottom-right').value;
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

            // Apply action arrow fill color if enabled, or remove if hidden
            const arrowFillEnabled = document.getElementById('action-arrow-fill-enabled').checked;
            const arrowFillColor = document.getElementById('action-arrow-color').value;
            const topArrowsVisible = document.getElementById('top-arrows-visible')?.checked ?? true;
            const bottomLeftArrowVisible = document.getElementById('bottom-left-arrow-visible')?.checked ?? true;
            const bottomRightArrowVisible = document.getElementById('bottom-right-arrow-visible')?.checked ?? true;

            // Map arrow IDs to their visibility state
            const arrowVisibility = {
                'top-left-arrow': topArrowsVisible,
                'top-right-arrow': topArrowsVisible,
                'bottom-left-arrow': bottomLeftArrowVisible,
                'bottom-right-arrow': bottomRightArrowVisible
            };

            const arrowIds = ['top-left-arrow', 'top-right-arrow', 'bottom-left-arrow', 'bottom-right-arrow'];
            arrowIds.forEach(arrowId => {
                const arrow = exportCopy.querySelector(`#${arrowId}`);
                if (arrow) {
                    if (!arrowVisibility[arrowId]) {
                        // Remove hidden arrows from export
                        arrow.remove();
                    } else if (arrowFillEnabled) {
                        arrow.setAttribute('fill', arrowFillColor);
                    } else {
                        arrow.setAttribute('fill', 'none');
                    }
                }
            });

            // Apply bottom arrow text and fill color if enabled
            const bottomText = document.getElementById('bottom-text-input').value;
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
            const discArrowsVisible = document.getElementById('disc-arrows-visible')?.checked ?? true;
            const bottomArrowIds = ['disc-left-arrow', 'disc-right-arrow'];
            bottomArrowIds.forEach(arrowId => {
                const arrow = exportCopy.querySelector(`#${arrowId}`);
                if (arrow) {
                    if (!discArrowsVisible) {
                        // Remove hidden disc arrows from export
                        arrow.remove();
                    } else if (bottomArrowFillEnabled) {
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

    /**
     * Controller template frame dimensions
     * Based on Intellivision Sprint carousel spec
     */
    static FRAME_CONFIG = {
        // Output dimensions for framed overlay
        OUTPUT_WIDTH: 228,
        OUTPUT_HEIGHT: 478,
        // Window area inside the controller frame (where overlay goes)
        // Based on analysis of official Sprint overlays (e.g., Astrosmash)
        // The overlay top slides into a notch, but the bottom content (arrows/DIRECTION text)
        // must remain visible in the window
        WINDOW_HEIGHT: 280,    // Height of visible window area (above disc bezel)
        WINDOW_OFFSET_Y: 12,   // Window starts below top frame edge
        // Big overlay (raw export) dimensions
        BIG_OVERLAY_WIDTH: 300,
        BIG_OVERLAY_HEIGHT: 478
    };

    /**
     * Export overlay with a controller frame (framed overlay for Sprint carousel)
     * @param {string} frameType - 'sprint', 'intv', or 'sears'
     */
    static async exportFramedOverlay(frameType) {
        try {
            const svgDoc = appState.getSvgDoc();
            if (!svgDoc) {
                UIManager.showStatus('No SVG loaded', 'error');
                return;
            }

            UIManager.showStatus('Generating framed overlay...', 'success');

            // First, get the big overlay PNG data by calling the server export
            const bigOverlayDataURL = await ExportManager.generateBigOverlayDataURL();
            if (!bigOverlayDataURL) {
                UIManager.showStatus('Failed to generate overlay', 'error');
                return;
            }

            // Load the controller template frame
            const templatePath = `/templates/controller_template_${frameType}.png`;
            const templateImg = await ExportManager.loadImage(templatePath);
            if (!templateImg) {
                UIManager.showStatus(`Failed to load ${frameType} controller template`, 'error');
                return;
            }

            // Load the big overlay image
            const overlayImg = await ExportManager.loadImage(bigOverlayDataURL);
            if (!overlayImg) {
                UIManager.showStatus('Failed to process overlay image', 'error');
                return;
            }

            // Create canvas for compositing
            const canvas = document.createElement('canvas');
            canvas.width = ExportManager.FRAME_CONFIG.OUTPUT_WIDTH;
            canvas.height = ExportManager.FRAME_CONFIG.OUTPUT_HEIGHT;
            const ctx = canvas.getContext('2d');

            // Scale overlay proportionally to fit window height
            const windowHeight = ExportManager.FRAME_CONFIG.WINDOW_HEIGHT;
            const scale = windowHeight / overlayImg.height;
            const scaledWidth = overlayImg.width * scale;
            const scaledHeight = windowHeight;

            // Center the overlay horizontally
            const x = (canvas.width - scaledWidth) / 2;
            const y = ExportManager.FRAME_CONFIG.WINDOW_OFFSET_Y;

            // Draw the overlay first (behind the frame)
            ctx.drawImage(overlayImg, x, y, scaledWidth, scaledHeight);

            // Draw the controller template frame on top (it has transparency for the window)
            ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);

            // Convert to blob and download
            canvas.toBlob((blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const title = document.getElementById('title').value.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'overlay';
                a.download = `${title}_overlay_${frameType}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                UIManager.showStatus(`Framed overlay (${frameType}) downloaded!`, 'success');
            }, 'image/png');

        } catch (error) {
            console.error('Error exporting framed overlay:', error);
            UIManager.showStatus('Error: ' + error.message, 'error');
        }
    }

    /**
     * Generate the big overlay as a data URL (client-side rendering)
     * This creates the 300x478 overlay image
     * @returns {Promise<string|null>} Data URL of the rendered overlay
     */
    static async generateBigOverlayDataURL() {
        try {
            const svgDoc = appState.getSvgDoc();
            if (!svgDoc) return null;

            // Pre-render all text elements
            const textRenderings = await ExportManager.preRenderAllText(svgDoc);
            const preRenderedTiles = await ExportManager.preRenderTiledArtwork();
            const preRenderedBg = await ExportManager.preRenderBackground();
            const preRenderedTitleBg = await ExportManager.preRenderTitleBackground();

            // Clone the SVG
            const exportCopy = svgDoc.cloneNode(true);

            // Apply all the same transformations as exportPNG
            // Replace background rect
            const bgRect = exportCopy.querySelector('#overlay-background');
            if (bgRect && preRenderedBg) {
                const xlinkNS = 'http://www.w3.org/1999/xlink';
                const svgNS = 'http://www.w3.org/2000/svg';
                const bgImage = document.createElementNS(svgNS, 'image');
                bgImage.setAttribute('id', 'overlay-background-rendered');
                bgImage.setAttributeNS(xlinkNS, 'xlink:href', preRenderedBg.dataURL);
                bgImage.setAttribute('x', '0');
                bgImage.setAttribute('y', '0');
                bgImage.setAttribute('width', '55.6');
                bgImage.setAttribute('height', '90.4');
                bgImage.setAttribute('preserveAspectRatio', 'none');
                bgRect.parentNode.insertBefore(bgImage, bgRect);
                bgRect.remove();
            }

            // Replace text with pre-rendered images
            ExportManager.replaceTextWithImages(exportCopy, textRenderings);

            // Handle tiled artwork
            if (preRenderedTiles) {
                const tiledRect = exportCopy.querySelector('#custom-artwork-tiled');
                const pattern = exportCopy.querySelector('#artwork-pattern');
                if (tiledRect) {
                    const xlinkNS = 'http://www.w3.org/1999/xlink';
                    const svgNS = 'http://www.w3.org/2000/svg';
                    const newImage = document.createElementNS(svgNS, 'image');
                    newImage.setAttribute('id', 'custom-artwork-prerendered');
                    newImage.setAttributeNS(xlinkNS, 'xlink:href', preRenderedTiles);
                    newImage.setAttribute('x', '0');
                    newImage.setAttribute('y', '0');
                    newImage.setAttribute('width', '55.6');
                    newImage.setAttribute('height', '90.4');
                    newImage.setAttribute('preserveAspectRatio', 'none');
                    newImage.setAttribute('opacity', appState.getArtworkOpacity().toString());
                    tiledRect.parentNode.insertBefore(newImage, tiledRect);
                    tiledRect.remove();
                }
                if (pattern) pattern.remove();
            }

            // Handle title background
            const exportTitleBg = exportCopy.querySelector('#title-background');
            const titleBgEnabled = document.getElementById('title-bg-enabled')?.checked;
            if (exportTitleBg && titleBgEnabled && preRenderedTitleBg) {
                const xlinkNS = 'http://www.w3.org/1999/xlink';
                const svgNS = 'http://www.w3.org/2000/svg';
                const titleBgImage = document.createElementNS(svgNS, 'image');
                titleBgImage.setAttribute('id', 'title-background-rendered');
                titleBgImage.setAttributeNS(xlinkNS, 'xlink:href', preRenderedTitleBg.dataURL);
                titleBgImage.setAttribute('x', preRenderedTitleBg.x.toString());
                titleBgImage.setAttribute('y', preRenderedTitleBg.y.toString());
                titleBgImage.setAttribute('width', preRenderedTitleBg.width.toString());
                titleBgImage.setAttribute('height', preRenderedTitleBg.height.toString());
                titleBgImage.setAttribute('preserveAspectRatio', 'none');
                exportTitleBg.parentNode.insertBefore(titleBgImage, exportTitleBg);
                exportTitleBg.remove();
            } else if (exportTitleBg) {
                exportTitleBg.setAttribute('fill', 'none');
            }

            // Remove template elements (we don't want the guides in the framed export)
            const templateIds = ['outer_boundary', 'title_bar_zone', 'title-border', 'grid_info'];
            templateIds.forEach(id => {
                const el = exportCopy.querySelector(`#${id}`);
                if (el) el.remove();
            });

            // Remove template classes but keep text elements
            const buttonLabelIds = ['btn-1', 'btn-2', 'btn-3', 'btn-4', 'btn-5', 'btn-6', 'btn-7', 'btn-8', 'btn-9', 'btn-clear', 'btn-0', 'btn-enter'];
            const actionLabelIds = ['top-left-label', 'top-right-label', 'bottom-left-label', 'bottom-right-label'];
            const bottomLabelIds = ['bottom-text'];
            const classSelectors = ['.outline', '.guide', '.button', '.button_center', '.label', '.label_small', '.zone'];
            classSelectors.forEach(selector => {
                const elements = exportCopy.querySelectorAll(selector);
                elements.forEach(el => {
                    if (el.id !== 'title-text' && !buttonLabelIds.includes(el.id) && !actionLabelIds.includes(el.id) && !bottomLabelIds.includes(el.id)) {
                        el.remove();
                    }
                });
            });

            // Convert SVG to data URL
            const svgString = new XMLSerializer().serializeToString(exportCopy);
            const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);

            // Render to canvas at big_overlay size (300x478) with overlay mask for rounded corners
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    canvas.width = ExportManager.FRAME_CONFIG.BIG_OVERLAY_WIDTH;
                    canvas.height = ExportManager.FRAME_CONFIG.BIG_OVERLAY_HEIGHT;
                    const ctx = canvas.getContext('2d');

                    // Apply the overlay mask (rounded corners)
                    ExportManager.applyOverlayMask(ctx, canvas.width, canvas.height);

                    // Draw the overlay image within the clipped region
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    resolve(canvas.toDataURL('image/png'));
                };
                img.onerror = function() {
                    console.error('Failed to render SVG to image');
                    resolve(null);
                };
                img.src = svgDataUrl;
            });
        } catch (error) {
            console.error('Error generating big overlay:', error);
            return null;
        }
    }

    /**
     * Load an image from URL or data URL
     * @param {string} src - Image source URL
     * @returns {Promise<HTMLImageElement|null>}
     */
    static loadImage(src) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => {
                console.error('Failed to load image:', src.substring(0, 100));
                resolve(null);
            };
            img.src = src;
        });
    }

    /**
     * Export Sprint bundle as ZIP containing big_overlay and framed overlay
     * @param {string} frameType - 'sprint', 'intv', or 'sears'
     */
    static async exportSprintBundle(frameType) {
        try {
            const svgDoc = appState.getSvgDoc();
            if (!svgDoc) {
                UIManager.showStatus('No SVG loaded', 'error');
                return;
            }

            // Check if JSZip is available
            if (typeof JSZip === 'undefined') {
                UIManager.showStatus('ZIP library not loaded', 'error');
                return;
            }

            UIManager.showStatus('Generating Sprint bundle...', 'success');

            // Generate the big overlay PNG data URL
            const bigOverlayDataURL = await ExportManager.generateBigOverlayDataURL();
            if (!bigOverlayDataURL) {
                UIManager.showStatus('Failed to generate overlay', 'error');
                return;
            }

            // Load the controller template frame
            const templatePath = `/templates/controller_template_${frameType}.png`;
            const templateImg = await ExportManager.loadImage(templatePath);
            if (!templateImg) {
                UIManager.showStatus(`Failed to load ${frameType} controller template`, 'error');
                return;
            }

            // Load the big overlay image for framing
            const overlayImg = await ExportManager.loadImage(bigOverlayDataURL);
            if (!overlayImg) {
                UIManager.showStatus('Failed to process overlay image', 'error');
                return;
            }

            // Create framed overlay
            const framedCanvas = document.createElement('canvas');
            framedCanvas.width = ExportManager.FRAME_CONFIG.OUTPUT_WIDTH;
            framedCanvas.height = ExportManager.FRAME_CONFIG.OUTPUT_HEIGHT;
            const framedCtx = framedCanvas.getContext('2d');

            // Scale overlay proportionally to fit window height
            const windowHeight = ExportManager.FRAME_CONFIG.WINDOW_HEIGHT;
            const scale = windowHeight / overlayImg.height;
            const scaledWidth = overlayImg.width * scale;
            const scaledHeight = windowHeight;

            // Center the overlay horizontally
            const x = (framedCanvas.width - scaledWidth) / 2;
            const y = ExportManager.FRAME_CONFIG.WINDOW_OFFSET_Y;

            // Draw the overlay first (behind the frame)
            framedCtx.drawImage(overlayImg, x, y, scaledWidth, scaledHeight);

            // Draw the controller template frame on top
            framedCtx.drawImage(templateImg, 0, 0, framedCanvas.width, framedCanvas.height);

            // Get title for filenames
            const title = document.getElementById('title').value.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'overlay';

            // Convert images to blobs
            const bigOverlayBlob = await ExportManager.dataURLToBlob(bigOverlayDataURL);
            const framedOverlayBlob = await new Promise(resolve => {
                framedCanvas.toBlob(resolve, 'image/png');
            });

            // Create ZIP file
            const zip = new JSZip();
            zip.file(`${title}_big_overlay.png`, bigOverlayBlob);
            zip.file(`${title}_overlay.png`, framedOverlayBlob);

            // Generate and download ZIP
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const url = window.URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title}_sprint_${frameType}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            UIManager.showStatus(`Sprint bundle (${frameType}) downloaded!`, 'success');

        } catch (error) {
            console.error('Error exporting Sprint bundle:', error);
            UIManager.showStatus('Error: ' + error.message, 'error');
        }
    }

    /**
     * Convert a data URL to a Blob
     * @param {string} dataURL - The data URL to convert
     * @returns {Promise<Blob>}
     */
    static async dataURLToBlob(dataURL) {
        const response = await fetch(dataURL);
        return response.blob();
    }
}
