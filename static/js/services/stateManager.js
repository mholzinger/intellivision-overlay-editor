/**
 * State Management Module
 * Centralized application state management
 */

export class StateManager {
    constructor() {
        // SVG state
        this.svgDoc = null;

        // Artwork state
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

        // Button artwork state
        this.buttonArtwork = {}; // Maps button IDs to artwork data
        this.selectedButtonForArtwork = null;

        // Button shape state
        this.buttonShapes = {}; // Maps button IDs to shape config
        this.selectedButtonForShape = null;
        this.shapeTemplates = {}; // Cache of loaded SVG shape templates

        // Font state
        this.loadedFonts = new Set();
        this.availableFonts = [];
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

    /**
     * Reset all state
     */
    reset() {
        this.svgDoc = null;
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
        this.buttonArtwork = {};
        this.selectedButtonForArtwork = null;
        this.buttonShapes = {};
        this.selectedButtonForShape = null;
        // Keep loaded fonts, available fonts, and shape templates (they're static)
    }
}

// Export singleton instance
export const appState = new StateManager();
