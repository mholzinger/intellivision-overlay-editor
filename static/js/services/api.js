/**
 * API Service Module
 * Handles all HTTP requests to backend endpoints
 */

export class APIService {
    /**
     * Fetch the SVG template
     * @returns {Promise<string>} SVG template content
     */
    static async getTemplate() {
        try {
            const response = await fetch('/get_template');
            if (!response.ok) {
                throw new Error(`Failed to load template: ${response.statusText}`);
            }
            return await response.text();
        } catch (error) {
            console.error('Error fetching template:', error);
            throw error;
        }
    }

    /**
     * Get list of available fonts
     * @returns {Promise<Array<string>>} Array of font filenames
     */
    static async listFonts() {
        try {
            const response = await fetch('/fonts/list');
            if (!response.ok) {
                throw new Error(`Failed to load fonts: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching font list:', error);
            throw error;
        }
    }

    /**
     * Fetch a specific font file
     * @param {string} fontFile - Font filename
     * @returns {Promise<ArrayBuffer>} Font file data
     */
    static async getFont(fontFile) {
        try {
            const response = await fetch(`/fonts/${fontFile}`);
            if (!response.ok) {
                throw new Error(`Failed to load font ${fontFile}: ${response.statusText}`);
            }
            return await response.arrayBuffer();
        } catch (error) {
            console.error(`Error fetching font ${fontFile}:`, error);
            throw error;
        }
    }

    /**
     * Export SVG as PNG
     * @param {string} svgContent - SVG content to export
     * @returns {Promise<Blob>} PNG image blob
     */
    static async exportPNG(svgContent) {
        try {
            const response = await fetch('/export_png', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ svg: svgContent })
            });

            if (!response.ok) {
                throw new Error(`Export failed: ${response.statusText}`);
            }

            return await response.blob();
        } catch (error) {
            console.error('Error exporting PNG:', error);
            throw error;
        }
    }
}
