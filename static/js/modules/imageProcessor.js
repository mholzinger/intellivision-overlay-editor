/**
 * Image Processor Module
 * Handles canvas-based image processing operations
 */

export class ImageProcessor {
    /**
     * Remove white background from an image
     * @param {string} imageDataURL - Image data URL
     * @param {number} threshold - White threshold (0-255)
     * @param {Function} callback - Callback function receiving processed data URL
     */
    static removeWhiteBackground(imageDataURL, threshold, callback) {
        const img = new Image();
        img.onload = function() {
            // Create canvas
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            // Draw image
            ctx.drawImage(img, 0, 0);

            // Get image data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imageData.data;

            // Process pixels (RGBA format: r, g, b, a, r, g, b, a, ...)
            for (let i = 0; i < pixels.length; i += 4) {
                const r = pixels[i];
                const g = pixels[i + 1];
                const b = pixels[i + 2];

                // If pixel is white/light (above threshold), make it transparent
                if (r > threshold && g > threshold && b > threshold) {
                    pixels[i + 3] = 0;  // Set alpha to 0 (transparent)
                }
            }

            // Put processed data back
            ctx.putImageData(imageData, 0, 0);

            // Convert to data URL
            callback(canvas.toDataURL('image/png'));
        };
        img.src = imageDataURL;
    }
}
