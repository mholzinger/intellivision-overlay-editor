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
        this.artworkXOffset = 0;
        this.artworkYOffset = 0;
        this.artworkScale = 1.0;
        this.artworkOpacity = 0.9;

        // Button artwork state
        this.buttonArtwork = {}; // Maps button IDs to artwork data
        this.selectedButtonForArtwork = null;

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
        this.artworkXOffset = 0;
        this.artworkYOffset = 0;
        this.artworkScale = 1.0;
        this.artworkOpacity = 0.9;
        this.buttonArtwork = {};
        this.selectedButtonForArtwork = null;
        // Keep loaded fonts and available fonts
    }
}

// Export singleton instance
export const appState = new StateManager();
