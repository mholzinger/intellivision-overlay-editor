/**
 * Preview Interaction Module
 * Handles click-to-navigate functionality for the SVG preview
 * Clicking on elements in the preview scrolls to and highlights the relevant control section
 */

/**
 * Mapping of SVG element selectors to control section identifiers for OVERLAY EDITOR
 * The section identifier is matched against h2 text content
 */
const OVERLAY_ELEMENT_TO_SECTION = {
    // Title section
    '#title-text': 'Game Title',
    '#title-border': 'Game Title',
    '#title-background': 'Game Title',
    '#custom-title-artwork': 'Title Space Artwork',
    '#custom-title-artwork-tiled': 'Title Space Artwork',

    // Copyright
    '#copyright-text': 'Copyright Text',

    // Background
    '#overlay-background': 'Background Fill',
    '#custom-artwork': 'Main Overlay Artwork',
    '#custom-artwork-tiled': 'Main Overlay Artwork',

    // Keypad buttons - map to Button Editor for shape/fill clicks, Keypad Labels for text
    '#btn-1': 'Keypad Labels',
    '#btn-2': 'Keypad Labels',
    '#btn-3': 'Keypad Labels',
    '#btn-4': 'Keypad Labels',
    '#btn-5': 'Keypad Labels',
    '#btn-6': 'Keypad Labels',
    '#btn-7': 'Keypad Labels',
    '#btn-8': 'Keypad Labels',
    '#btn-9': 'Keypad Labels',
    '#btn-0': 'Keypad Labels',
    '#btn-clear': 'Keypad Labels',
    '#btn-enter': 'Keypad Labels',

    // Row descriptions
    '#row-desc-1': 'Keypad Labels',
    '#row-desc-2': 'Keypad Labels',
    '#row-desc-3': 'Keypad Labels',
    '#row-desc-4': 'Keypad Labels',

    // Action buttons
    '#top-left-action': 'Action Buttons',
    '#bottom-left-action': 'Action Buttons',
    '#top-right-action': 'Action Buttons',
    '#bottom-right-action': 'Action Buttons',
    '#top-left-arrow': 'Action Buttons',
    '#bottom-left-arrow': 'Action Buttons',
    '#top-right-arrow': 'Action Buttons',
    '#bottom-right-arrow': 'Action Buttons',
    '#top-left-label': 'Action Buttons',
    '#bottom-left-label': 'Action Buttons',
    '#top-right-label': 'Action Buttons',
    '#bottom-right-label': 'Action Buttons',
    '#action-desc-left': 'Action Buttons',
    '#action-desc-right': 'Action Buttons',

    // Bottom arrows
    '#bottom_arrows': 'Bottom Arrows',
    '#disc-left-arrow': 'Bottom Arrows',
    '#disc-right-arrow': 'Bottom Arrows',
    '#bottom-text': 'Bottom Arrows',
};

/**
 * Mapping of SVG element selectors to control section identifiers for BOX ART EDITOR
 */
const BOXART_ELEMENT_TO_SECTION = {
    // Header / Branding
    '#brand-logo': 'Header / Branding',
    '#brand-tagline': 'Header / Branding',

    // Game Title
    '#game-title': 'Game Title',
    '#game-subtitle': 'Game Title',
    '#title-area': 'Game Title',

    // Content Frame
    '#content-frame': 'Content Frame',
    '#box-background': 'Content Frame',
    '#box-outer-border': 'Content Frame',

    // Main Artwork
    '#background-artwork-placeholder': 'Main Artwork',
    '#boxart-custom-artwork': 'Main Artwork',

    // Vignette Frame
    '#vignette-outer': 'Vignette Frame (Optional)',
    '#vignette-inner': 'Vignette Frame (Optional)',
    '#vignette-clip-shape': 'Vignette Frame (Optional)',

    // Badges
    '#voice-badge-area': 'Badges (Optional)',
    '#player-badge-area': 'Badges (Optional)',
};

/**
 * Additional mappings for parent groups when direct element isn't matched - OVERLAY
 */
const OVERLAY_GROUP_TO_SECTION = {
    'keypad_buttons': 'Keypad Labels',
    'row_descriptions': 'Keypad Labels',
    'bottom_arrows': 'Bottom Arrows',
};

/**
 * Additional mappings for parent groups when direct element isn't matched - BOX ART
 */
const BOXART_GROUP_TO_SECTION = {
    'background-layer': 'Content Frame',
    'content-frame-layer': 'Content Frame',
    'artwork-layer': 'Main Artwork',
    'frame-stripes-layer': 'Content Frame',
    'branding-layer': 'Header / Branding',
    'title-layer': 'Game Title',
    'vignette-layer': 'Vignette Frame (Optional)',
    'badge-layer': 'Badges (Optional)',
};

export class PreviewInteraction {
    static overlayInitialized = false;
    static boxartInitialized = false;
    static highlightTimeout = null;

    /**
     * Initialize click-to-navigate for the overlay preview
     * Should be called after SVG is loaded
     */
    static init() {
        PreviewInteraction.initOverlay();
    }

    /**
     * Initialize click-to-navigate for the overlay editor preview
     */
    static initOverlay() {
        const previewContainer = document.getElementById('svg-preview');
        if (!previewContainer) {
            console.warn('PreviewInteraction: svg-preview container not found');
            return;
        }

        // Remove existing listener if re-initializing
        if (PreviewInteraction.overlayInitialized) {
            previewContainer.removeEventListener('click', PreviewInteraction.handleOverlayClick);
        }

        previewContainer.addEventListener('click', PreviewInteraction.handleOverlayClick);
        PreviewInteraction.overlayInitialized = true;
    }

    /**
     * Initialize click-to-navigate for the box art editor preview
     */
    static initBoxArt() {
        const previewContainer = document.getElementById('boxart-svg-preview');
        if (!previewContainer) {
            console.warn('PreviewInteraction: boxart-svg-preview container not found');
            return;
        }

        // Remove existing listener if re-initializing
        if (PreviewInteraction.boxartInitialized) {
            previewContainer.removeEventListener('click', PreviewInteraction.handleBoxArtClick);
        }

        previewContainer.addEventListener('click', PreviewInteraction.handleBoxArtClick);
        PreviewInteraction.boxartInitialized = true;
    }

    /**
     * Handle click events on the overlay preview
     * @param {MouseEvent} event
     */
    static handleOverlayClick(event) {
        const target = event.target;

        // Ignore clicks on the container itself
        if (target.id === 'svg-preview') return;

        // Find which section this element belongs to
        const sectionName = PreviewInteraction.findSectionForElement(
            target,
            OVERLAY_ELEMENT_TO_SECTION,
            OVERLAY_GROUP_TO_SECTION
        );

        if (sectionName) {
            PreviewInteraction.navigateToSection(sectionName, '#overlay-editor-content');
            PreviewInteraction.highlightElement(target);
        }
    }

    /**
     * Handle click events on the box art preview
     * @param {MouseEvent} event
     */
    static handleBoxArtClick(event) {
        const target = event.target;

        // Ignore clicks on the container itself
        if (target.id === 'boxart-svg-preview') return;

        // Find which section this element belongs to
        const sectionName = PreviewInteraction.findSectionForElement(
            target,
            BOXART_ELEMENT_TO_SECTION,
            BOXART_GROUP_TO_SECTION
        );

        if (sectionName) {
            PreviewInteraction.navigateToSection(sectionName, '#boxart-editor-content');
            PreviewInteraction.highlightElement(target);
        }
    }

    /**
     * Find the control section name for a clicked element
     * @param {Element} element - The clicked SVG element
     * @param {Object} elementMapping - Element ID to section mapping
     * @param {Object} groupMapping - Group ID to section mapping
     * @returns {string|null} Section name or null
     */
    static findSectionForElement(element, elementMapping, groupMapping) {
        // First try direct ID match
        if (element.id) {
            const directMatch = elementMapping['#' + element.id];
            if (directMatch) return directMatch;
        }

        // Check if element has a class that maps to a section (overlay-specific)
        if (element.classList) {
            // Button backgrounds/shapes should go to Button Editor
            if (element.classList.contains('button-background') ||
                element.classList.contains('button-shape')) {
                return 'Button Editor';
            }
        }

        // Walk up the DOM to find a parent with a known ID or group
        let current = element.parentElement;
        let depth = 0;
        const maxDepth = 10;

        while (current && depth < maxDepth) {
            if (current.id) {
                // Check direct mapping
                const parentMatch = elementMapping['#' + current.id];
                if (parentMatch) return parentMatch;

                // Check group mapping
                const groupMatch = groupMapping[current.id];
                if (groupMatch) return groupMatch;
            }

            // Check for group-level matches
            if (current.tagName === 'g' && current.id) {
                const groupMatch = groupMapping[current.id];
                if (groupMatch) return groupMatch;
            }

            current = current.parentElement;
            depth++;
        }

        return null;
    }

    /**
     * Navigate to and highlight a control section
     * @param {string} sectionName - The section header text to find
     * @param {string} editorSelector - CSS selector for the editor content container
     */
    static navigateToSection(sectionName, editorSelector) {
        // Find the controls panel within the specified editor
        const controlsPanel = document.querySelector(`${editorSelector} .controls-panel`);
        if (!controlsPanel) return;

        const headers = controlsPanel.querySelectorAll('.control-section h2');

        for (const header of headers) {
            // Match the section name (handle variations like "Vignette Frame (Optional)")
            const headerText = header.textContent.trim();
            if (headerText === sectionName || headerText.startsWith(sectionName.split(' (')[0])) {
                const section = header.closest('.control-section');
                if (section) {
                    // Expand the section if it's collapsible and collapsed
                    const content = section.querySelector('.section-content');
                    if (content && content.style.display === 'none') {
                        // Toggle visibility
                        content.style.display = '';
                        const toggleBtn = header.querySelector('.collapse-toggle');
                        if (toggleBtn) toggleBtn.textContent = '−';
                    }

                    // Scroll to section
                    section.scrollIntoView({ behavior: 'smooth', block: 'center' });

                    // Highlight the section briefly
                    PreviewInteraction.highlightSection(section);
                }
                return;
            }
        }
    }

    /**
     * Briefly highlight a control section
     * @param {Element} section
     */
    static highlightSection(section) {
        // Clear any existing highlight
        if (PreviewInteraction.highlightTimeout) {
            clearTimeout(PreviewInteraction.highlightTimeout);
            document.querySelectorAll('.section-highlight').forEach(el => {
                el.classList.remove('section-highlight');
            });
        }

        section.classList.add('section-highlight');

        PreviewInteraction.highlightTimeout = setTimeout(() => {
            section.classList.remove('section-highlight');
        }, 1500);
    }

    /**
     * Briefly highlight the clicked SVG element
     * @param {Element} element
     */
    static highlightElement(element) {
        // Add a brief visual feedback on the clicked element
        const originalFilter = element.style.filter;
        element.style.filter = 'brightness(1.3) drop-shadow(0 0 2px rgba(59, 130, 246, 0.8))';

        setTimeout(() => {
            element.style.filter = originalFilter;
        }, 300);
    }
}
