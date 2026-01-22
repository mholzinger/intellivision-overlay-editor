/**
 * State Management Module
 * Centralized application state management
 */

export class StateManager {
    constructor() {
        // SVG state
        this.svgDoc = null;

        // Main artwork state
        this.artworkDataURL = null;
        this.artworkOriginalDataURL = null;  // Original unprocessed image
        this.artworkXOffset = 0;
        this.artworkYOffset = 0;
        this.artworkScale = 1.0;
        this.artworkOpacity = 0.9;
        this.artworkRotation = 0;
        this.artworkTiled = false;
        this.artworkRemoveWhite = false;
        this.artworkWhiteThreshold = 245;

        // Title artwork state
        this.titleArtworkDataURL = null;
        this.titleArtworkOriginalDataURL = null;
        this.titleArtworkXOffset = 0;
        this.titleArtworkYOffset = 0;
        this.titleArtworkScale = 1.0;
        this.titleArtworkOpacity = 1.0;
        this.titleArtworkRotation = 0;
        this.titleArtworkTiled = false;
        this.titleArtworkRemoveWhite = false;
        this.titleArtworkWhiteThreshold = 245;

        // Button artwork state
        this.buttonArtwork = {}; // Maps button IDs to artwork data
        this.selectedButtonForArtwork = null;

        // Button shape state
        this.buttonShapes = {}; // Maps button IDs to shape config
        this.selectedButtonForShape = null;
        this.shapeTemplates = {}; // Cache of loaded SVG shape templates

        // Unified button editor state
        this.selectedButtonForEditor = null;

        // Font state
        this.loadedFonts = new Set();
        this.availableFonts = [];

        // Box Art Editor state
        this.boxArtSvgDoc = null;
        this.boxArtArtworkDataURL = null;
        this.boxArtArtworkX = 0;
        this.boxArtArtworkY = 0;
        this.boxArtArtworkScale = 1.0;
        this.boxArtArtworkOpacity = 1.0;
        this.boxArtVignetteEnabled = false;
        this.boxArtVignetteX = 93;
        this.boxArtVignetteY = 136;
        this.boxArtVignetteRx = 68;
        this.boxArtVignetteRy = 58;
        this.boxArtVignetteStrokeColor = '#666666';
        this.boxArtVignetteStrokeWidth = 2;
    }

    /**
     * Set the SVG document
     * @param {Document} doc - SVG document
     */
    setSvgDoc(doc) {
        this.svgDoc = doc;
    }

    /**
     * Get the SVG document
     * @returns {Document} SVG document
     */
    getSvgDoc() {
        return this.svgDoc;
    }

    /**
     * Set main artwork data
     * @param {string} dataURL - Image data URL
     */
    setArtworkData(dataURL) {
        this.artworkDataURL = dataURL;
    }

    /**
     * Get main artwork data
     * @returns {string} Image data URL
     */
    getArtworkData() {
        return this.artworkDataURL;
    }

    /**
     * Update artwork position
     * @param {number} x - X offset
     * @param {number} y - Y offset
     */
    setArtworkPosition(x, y) {
        this.artworkXOffset = x;
        this.artworkYOffset = y;
    }

    /**
     * Get artwork position
     * @returns {{x: number, y: number}} Position
     */
    getArtworkPosition() {
        return {
            x: this.artworkXOffset,
            y: this.artworkYOffset
        };
    }

    /**
     * Set artwork scale
     * @param {number} scale - Scale factor
     */
    setArtworkScale(scale) {
        this.artworkScale = scale;
    }

    /**
     * Get artwork scale
     * @returns {number} Scale factor
     */
    getArtworkScale() {
        return this.artworkScale;
    }

    /**
     * Set artwork opacity
     * @param {number} opacity - Opacity value (0-1)
     */
    setArtworkOpacity(opacity) {
        this.artworkOpacity = opacity;
    }

    /**
     * Get artwork opacity
     * @returns {number} Opacity value
     */
    getArtworkOpacity() {
        return this.artworkOpacity;
    }

    /**
     * Set artwork rotation
     * @param {number} rotation - Rotation in degrees
     */
    setArtworkRotation(rotation) {
        this.artworkRotation = rotation;
    }

    /**
     * Get artwork rotation
     * @returns {number} Rotation in degrees
     */
    getArtworkRotation() {
        return this.artworkRotation;
    }

    /**
     * Set artwork tiled state
     * @param {boolean} tiled - Whether artwork is tiled
     */
    setArtworkTiled(tiled) {
        this.artworkTiled = tiled;
    }

    /**
     * Get artwork tiled state
     * @returns {boolean} Tiled state
     */
    getArtworkTiled() {
        return this.artworkTiled;
    }

    /**
     * Set original artwork data (unprocessed)
     * @param {string} dataURL - Image data URL
     */
    setArtworkOriginalData(dataURL) {
        this.artworkOriginalDataURL = dataURL;
    }

    /**
     * Get original artwork data
     * @returns {string} Image data URL
     */
    getArtworkOriginalData() {
        return this.artworkOriginalDataURL;
    }

    /**
     * Set artwork remove white state
     * @param {boolean} removeWhite - Whether to remove white backgrounds
     */
    setArtworkRemoveWhite(removeWhite) {
        this.artworkRemoveWhite = removeWhite;
    }

    /**
     * Get artwork remove white state
     * @returns {boolean} Remove white state
     */
    getArtworkRemoveWhite() {
        return this.artworkRemoveWhite;
    }

    /**
     * Set artwork white threshold
     * @param {number} threshold - Threshold value (0-255)
     */
    setArtworkWhiteThreshold(threshold) {
        this.artworkWhiteThreshold = threshold;
    }

    /**
     * Get artwork white threshold
     * @returns {number} Threshold value
     */
    getArtworkWhiteThreshold() {
        return this.artworkWhiteThreshold;
    }

    // ========== Title Artwork Methods ==========

    /**
     * Set title artwork data
     * @param {string} dataURL - Image data URL
     */
    setTitleArtworkData(dataURL) {
        this.titleArtworkDataURL = dataURL;
    }

    /**
     * Get title artwork data
     * @returns {string} Image data URL
     */
    getTitleArtworkData() {
        return this.titleArtworkDataURL;
    }

    /**
     * Set original title artwork data (unprocessed)
     * @param {string} dataURL - Image data URL
     */
    setTitleArtworkOriginalData(dataURL) {
        this.titleArtworkOriginalDataURL = dataURL;
    }

    /**
     * Get original title artwork data
     * @returns {string} Image data URL
     */
    getTitleArtworkOriginalData() {
        return this.titleArtworkOriginalDataURL;
    }

    /**
     * Update title artwork position
     * @param {number} x - X offset
     * @param {number} y - Y offset
     */
    setTitleArtworkPosition(x, y) {
        this.titleArtworkXOffset = x;
        this.titleArtworkYOffset = y;
    }

    /**
     * Get title artwork position
     * @returns {{x: number, y: number}} Position
     */
    getTitleArtworkPosition() {
        return {
            x: this.titleArtworkXOffset,
            y: this.titleArtworkYOffset
        };
    }

    /**
     * Set title artwork scale
     * @param {number} scale - Scale factor
     */
    setTitleArtworkScale(scale) {
        this.titleArtworkScale = scale;
    }

    /**
     * Get title artwork scale
     * @returns {number} Scale factor
     */
    getTitleArtworkScale() {
        return this.titleArtworkScale;
    }

    /**
     * Set title artwork opacity
     * @param {number} opacity - Opacity value (0-1)
     */
    setTitleArtworkOpacity(opacity) {
        this.titleArtworkOpacity = opacity;
    }

    /**
     * Get title artwork opacity
     * @returns {number} Opacity value
     */
    getTitleArtworkOpacity() {
        return this.titleArtworkOpacity;
    }

    /**
     * Set title artwork rotation
     * @param {number} rotation - Rotation in degrees
     */
    setTitleArtworkRotation(rotation) {
        this.titleArtworkRotation = rotation;
    }

    /**
     * Get title artwork rotation
     * @returns {number} Rotation in degrees
     */
    getTitleArtworkRotation() {
        return this.titleArtworkRotation;
    }

    /**
     * Set title artwork tiled state
     * @param {boolean} tiled - Whether artwork is tiled
     */
    setTitleArtworkTiled(tiled) {
        this.titleArtworkTiled = tiled;
    }

    /**
     * Get title artwork tiled state
     * @returns {boolean} Tiled state
     */
    getTitleArtworkTiled() {
        return this.titleArtworkTiled;
    }

    /**
     * Set title artwork remove white state
     * @param {boolean} removeWhite - Whether to remove white backgrounds
     */
    setTitleArtworkRemoveWhite(removeWhite) {
        this.titleArtworkRemoveWhite = removeWhite;
    }

    /**
     * Get title artwork remove white state
     * @returns {boolean} Remove white state
     */
    getTitleArtworkRemoveWhite() {
        return this.titleArtworkRemoveWhite;
    }

    /**
     * Set title artwork white threshold
     * @param {number} threshold - Threshold value (0-255)
     */
    setTitleArtworkWhiteThreshold(threshold) {
        this.titleArtworkWhiteThreshold = threshold;
    }

    /**
     * Get title artwork white threshold
     * @returns {number} Threshold value
     */
    getTitleArtworkWhiteThreshold() {
        return this.titleArtworkWhiteThreshold;
    }

    /**
     * Set button artwork
     * @param {string} buttonId - Button identifier
     * @param {Object} artwork - Artwork data
     */
    setButtonArtwork(buttonId, artwork) {
        this.buttonArtwork[buttonId] = artwork;
    }

    /**
     * Get button artwork
     * @param {string} buttonId - Button identifier
     * @returns {Object} Artwork data
     */
    getButtonArtwork(buttonId) {
        return this.buttonArtwork[buttonId];
    }

    /**
     * Remove button artwork
     * @param {string} buttonId - Button identifier
     */
    removeButtonArtwork(buttonId) {
        delete this.buttonArtwork[buttonId];
    }

    /**
     * Get all button artwork
     * @returns {Object} All button artwork data
     */
    getAllButtonArtwork() {
        return this.buttonArtwork;
    }

    /**
     * Set selected button for artwork
     * @param {string} buttonId - Button identifier
     */
    setSelectedButton(buttonId) {
        this.selectedButtonForArtwork = buttonId;
    }

    /**
     * Get selected button for artwork
     * @returns {string} Button identifier
     */
    getSelectedButton() {
        return this.selectedButtonForArtwork;
    }

    // ========== Button Shape Methods ==========

    /**
     * Set button shape configuration
     * @param {string} buttonId - Button identifier
     * @param {Object} shapeConfig - Shape configuration
     */
    setButtonShape(buttonId, shapeConfig) {
        this.buttonShapes[buttonId] = shapeConfig;
    }

    /**
     * Get button shape configuration
     * @param {string} buttonId - Button identifier
     * @returns {Object} Shape configuration
     */
    getButtonShape(buttonId) {
        return this.buttonShapes[buttonId];
    }

    /**
     * Remove button shape
     * @param {string} buttonId - Button identifier
     */
    removeButtonShape(buttonId) {
        delete this.buttonShapes[buttonId];
    }

    /**
     * Get all button shapes
     * @returns {Object} All button shape configurations
     */
    getAllButtonShapes() {
        return this.buttonShapes;
    }

    /**
     * Set selected button for shape editing
     * @param {string} buttonId - Button identifier
     */
    setSelectedButtonForShape(buttonId) {
        this.selectedButtonForShape = buttonId;
    }

    /**
     * Get selected button for shape editing
     * @returns {string} Button identifier
     */
    getSelectedButtonForShape() {
        return this.selectedButtonForShape;
    }

    /**
     * Set shape templates (cached from API)
     * @param {Object} templates - Map of shape name to SVG content
     */
    setShapeTemplates(templates) {
        this.shapeTemplates = templates;
    }

    /**
     * Get shape templates
     * @returns {Object} Map of shape name to SVG content
     */
    getShapeTemplates() {
        return this.shapeTemplates;
    }

    /**
     * Get a specific shape template
     * @param {string} name - Shape name
     * @returns {string} SVG content
     */
    getShapeTemplate(name) {
        return this.shapeTemplates[name];
    }

    /**
     * Add a shape template to cache
     * @param {string} name - Shape name
     * @param {string} svgContent - SVG content
     */
    addShapeTemplate(name, svgContent) {
        this.shapeTemplates[name] = svgContent;
    }

    // ========== Unified Button Editor Methods ==========

    /**
     * Set selected button for unified editor
     * @param {string} buttonId - Button identifier
     */
    setSelectedButtonForEditor(buttonId) {
        this.selectedButtonForEditor = buttonId;
        // Keep artwork and shape selections in sync
        this.selectedButtonForArtwork = buttonId;
        this.selectedButtonForShape = buttonId;
    }

    /**
     * Get selected button for unified editor
     * @returns {string} Button identifier
     */
    getSelectedButtonForEditor() {
        return this.selectedButtonForEditor;
    }

    /**
     * Add a loaded font
     * @param {string} fontName - Font name
     */
    addLoadedFont(fontName) {
        this.loadedFonts.add(fontName);
    }

    /**
     * Check if font is loaded
     * @param {string} fontName - Font name
     * @returns {boolean} True if loaded
     */
    isFontLoaded(fontName) {
        return this.loadedFonts.has(fontName);
    }

    /**
     * Set available fonts
     * @param {Array<string>} fonts - Array of font filenames
     */
    setAvailableFonts(fonts) {
        this.availableFonts = fonts;
    }

    /**
     * Get available fonts
     * @returns {Array<string>} Array of font filenames
     */
    getAvailableFonts() {
        return this.availableFonts;
    }

    // ========== Box Art Editor Methods ==========

    /**
     * Set box art SVG document
     * @param {Document} doc - SVG document
     */
    setBoxArtSvgDoc(doc) {
        this.boxArtSvgDoc = doc;
    }

    /**
     * Get box art SVG document
     * @returns {Document} SVG document
     */
    getBoxArtSvgDoc() {
        return this.boxArtSvgDoc;
    }

    /**
     * Set box art artwork data
     * @param {string} dataURL - Image data URL
     */
    setBoxArtArtworkData(dataURL) {
        this.boxArtArtworkDataURL = dataURL;
    }

    /**
     * Get box art artwork data
     * @returns {string} Image data URL
     */
    getBoxArtArtworkData() {
        return this.boxArtArtworkDataURL;
    }

    /**
     * Set box art artwork position
     * @param {number} x - X offset
     * @param {number} y - Y offset
     */
    setBoxArtArtworkPosition(x, y) {
        this.boxArtArtworkX = x;
        this.boxArtArtworkY = y;
    }

    /**
     * Get box art artwork position
     * @returns {{x: number, y: number}} Position
     */
    getBoxArtArtworkPosition() {
        return { x: this.boxArtArtworkX, y: this.boxArtArtworkY };
    }

    /**
     * Set box art artwork scale
     * @param {number} scale - Scale factor
     */
    setBoxArtArtworkScale(scale) {
        this.boxArtArtworkScale = scale;
    }

    /**
     * Get box art artwork scale
     * @returns {number} Scale factor
     */
    getBoxArtArtworkScale() {
        return this.boxArtArtworkScale;
    }

    /**
     * Set box art artwork opacity
     * @param {number} opacity - Opacity value (0-1)
     */
    setBoxArtArtworkOpacity(opacity) {
        this.boxArtArtworkOpacity = opacity;
    }

    /**
     * Get box art artwork opacity
     * @returns {number} Opacity value
     */
    getBoxArtArtworkOpacity() {
        return this.boxArtArtworkOpacity;
    }

    /**
     * Set box art vignette enabled state
     * @param {boolean} enabled - Whether vignette is enabled
     */
    setBoxArtVignetteEnabled(enabled) {
        this.boxArtVignetteEnabled = enabled;
    }

    /**
     * Get box art vignette enabled state
     * @returns {boolean} Enabled state
     */
    getBoxArtVignetteEnabled() {
        return this.boxArtVignetteEnabled;
    }

    /**
     * Set box art vignette position
     * @param {number} x - Center X
     * @param {number} y - Center Y
     */
    setBoxArtVignettePosition(x, y) {
        this.boxArtVignetteX = x;
        this.boxArtVignetteY = y;
    }

    /**
     * Get box art vignette position
     * @returns {{x: number, y: number}} Position
     */
    getBoxArtVignettePosition() {
        return { x: this.boxArtVignetteX, y: this.boxArtVignetteY };
    }

    /**
     * Set box art vignette size
     * @param {number} rx - Horizontal radius
     * @param {number} ry - Vertical radius
     */
    setBoxArtVignetteSize(rx, ry) {
        this.boxArtVignetteRx = rx;
        this.boxArtVignetteRy = ry;
    }

    /**
     * Get box art vignette size
     * @returns {{rx: number, ry: number}} Size
     */
    getBoxArtVignetteSize() {
        return { rx: this.boxArtVignetteRx, ry: this.boxArtVignetteRy };
    }

    /**
     * Set box art vignette stroke color
     * @param {string} color - Stroke color
     */
    setBoxArtVignetteStrokeColor(color) {
        this.boxArtVignetteStrokeColor = color;
    }

    /**
     * Get box art vignette stroke color
     * @returns {string} Stroke color
     */
    getBoxArtVignetteStrokeColor() {
        return this.boxArtVignetteStrokeColor;
    }

    /**
     * Set box art vignette stroke width
     * @param {number} width - Stroke width
     */
    setBoxArtVignetteStrokeWidth(width) {
        this.boxArtVignetteStrokeWidth = width;
    }

    /**
     * Get box art vignette stroke width
     * @returns {number} Stroke width
     */
    getBoxArtVignetteStrokeWidth() {
        return this.boxArtVignetteStrokeWidth;
    }

    /**
     * Reset box art state
     */
    resetBoxArt() {
        this.boxArtSvgDoc = null;
        this.boxArtArtworkDataURL = null;
        this.boxArtArtworkX = 0;
        this.boxArtArtworkY = 0;
        this.boxArtArtworkScale = 1.0;
        this.boxArtArtworkOpacity = 1.0;
        this.boxArtVignetteEnabled = false;
        this.boxArtVignetteX = 93;
        this.boxArtVignetteY = 136;
        this.boxArtVignetteRx = 68;
        this.boxArtVignetteRy = 58;
        this.boxArtVignetteStrokeColor = '#666666';
        this.boxArtVignetteStrokeWidth = 2;
        // Clear vignette artwork (used via direct property access)
        this._boxArtVignetteArtworkData = null;
        this._boxArtVignetteArtworkOriginal = null;
    }

    /**
     * Reset all state
     */
    reset() {
        this.svgDoc = null;
        // Main artwork
        this.artworkDataURL = null;
        this.artworkOriginalDataURL = null;
        this.artworkXOffset = 0;
        this.artworkYOffset = 0;
        this.artworkScale = 1.0;
        this.artworkOpacity = 0.9;
        this.artworkRotation = 0;
        this.artworkTiled = false;
        this.artworkRemoveWhite = false;
        this.artworkWhiteThreshold = 245;
        // Title artwork
        this.titleArtworkDataURL = null;
        this.titleArtworkOriginalDataURL = null;
        this.titleArtworkXOffset = 0;
        this.titleArtworkYOffset = 0;
        this.titleArtworkScale = 1.0;
        this.titleArtworkOpacity = 1.0;
        this.titleArtworkRotation = 0;
        this.titleArtworkTiled = false;
        this.titleArtworkRemoveWhite = false;
        this.titleArtworkWhiteThreshold = 245;
        // Button artwork and shapes
        this.buttonArtwork = {};
        this.selectedButtonForArtwork = null;
        this.buttonShapes = {};
        this.selectedButtonForShape = null;
        // Keep loaded fonts, available fonts, and shape templates (they're static)
    }
}

// Export singleton instance
export const appState = new StateManager();
