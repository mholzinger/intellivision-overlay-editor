/**
 * Intellivision Overlay Editor - Main Entry Point
 * Coordinates all modules and sets up event handlers
 */

import { SVGManager } from './modules/svgManager.js';
import { FontManager } from './modules/fontManager.js';
import { TitleEditor } from './modules/titleEditor.js';
import { ButtonEditor } from './modules/buttonEditor.js';
import { ButtonArtwork } from './modules/buttonArtwork.js';
import { MainArtwork } from './modules/mainArtwork.js';
import { ActionButtons } from './modules/actionButtons.js';
import { BottomControls } from './modules/bottomControls.js';
import { ExportManager } from './modules/exportManager.js';

/**
 * Initialize the application
 */
function initializeApp() {
    // Load the SVG template
    SVGManager.loadTemplate();

    // Set up event handlers
    setupEventHandlers();
}

/**
 * Set up all event handlers for UI controls
 */
function setupEventHandlers() {
    // Title controls
    const titleInput = document.getElementById('title');
    if (titleInput) {
        titleInput.addEventListener('input', () => TitleEditor.updateTitle());
    }

    const fontColorInput = document.getElementById('font-color');
    if (fontColorInput) {
        fontColorInput.addEventListener('input', () => TitleEditor.updateTitleColor());
    }

    const fontSelect = document.getElementById('font-select');
    if (fontSelect) {
        fontSelect.addEventListener('change', () => FontManager.updateTitleFont());
    }

    const titleFontSize = document.getElementById('title-font-size');
    if (titleFontSize) {
        titleFontSize.addEventListener('input', () => TitleEditor.updateTitleSize());
    }

    const titleBgEnabled = document.getElementById('title-bg-enabled');
    if (titleBgEnabled) {
        titleBgEnabled.addEventListener('change', () => TitleEditor.updateTitleBackground());
    }

    const titleBgColor = document.getElementById('title-bg-color');
    if (titleBgColor) {
        titleBgColor.addEventListener('input', () => TitleEditor.updateTitleBackground());
    }

    // Button label controls
    const buttonLabelColor = document.getElementById('button-label-color');
    if (buttonLabelColor) {
        buttonLabelColor.addEventListener('input', () => ButtonEditor.updateAllButtonLabels());
    }

    const buttonLabelSize = document.getElementById('button-label-size');
    if (buttonLabelSize) {
        buttonLabelSize.addEventListener('input', () => ButtonEditor.updateAllButtonLabels());
    }

    const buttonFontSelect = document.getElementById('button-font-select');
    if (buttonFontSelect) {
        buttonFontSelect.addEventListener('change', () => FontManager.updateButtonFont());
    }

    // Individual button inputs
    const buttons = [1, 2, 3, 4, 5, 6, 7, 8, 9, 'clear', 0, 'enter'];
    buttons.forEach(num => {
        const input = document.getElementById(`btn-input-${num}`);
        if (input) {
            input.addEventListener('input', () => ButtonEditor.updateButton(num));
        }

        const bgEnabled = document.getElementById(`btn-bg-enabled-${num}`);
        if (bgEnabled) {
            bgEnabled.addEventListener('change', () => ButtonEditor.updateButtonBackground(num));
        }

        const bgColor = document.getElementById(`btn-bg-color-${num}`);
        if (bgColor) {
            bgColor.addEventListener('input', () => ButtonEditor.updateButtonBackground(num));
        }
    });

    // Action button controls
    const actionTop = document.getElementById('action-top');
    if (actionTop) {
        actionTop.addEventListener('input', () => ActionButtons.updateActionButton('top'));
    }

    const actionBottomLeft = document.getElementById('action-bottom-left');
    if (actionBottomLeft) {
        actionBottomLeft.addEventListener('input', () => ActionButtons.updateActionButton('bottom-left'));
    }

    const actionBottomRight = document.getElementById('action-bottom-right');
    if (actionBottomRight) {
        actionBottomRight.addEventListener('input', () => ActionButtons.updateActionButton('bottom-right'));
    }

    const actionLabelColor = document.getElementById('action-label-color');
    if (actionLabelColor) {
        actionLabelColor.addEventListener('input', () => ActionButtons.updateAllActionButtons());
    }

    const actionLabelSize = document.getElementById('action-label-size');
    if (actionLabelSize) {
        actionLabelSize.addEventListener('input', () => ActionButtons.updateAllActionButtons());
    }

    const actionFontSelect = document.getElementById('action-font-select');
    if (actionFontSelect) {
        actionFontSelect.addEventListener('change', () => FontManager.updateActionFont());
    }

    const actionArrowFillEnabled = document.getElementById('action-arrow-fill-enabled');
    if (actionArrowFillEnabled) {
        actionArrowFillEnabled.addEventListener('change', () => ActionButtons.updateActionArrowColor());
    }

    const actionArrowColor = document.getElementById('action-arrow-color');
    if (actionArrowColor) {
        actionArrowColor.addEventListener('input', () => ActionButtons.updateActionArrowColor());
    }

    // Bottom controls
    const bottomTextInput = document.getElementById('bottom-text-input');
    if (bottomTextInput) {
        bottomTextInput.addEventListener('input', () => BottomControls.updateBottomText());
    }

    const bottomTextFontSelect = document.getElementById('bottom-text-font-select');
    if (bottomTextFontSelect) {
        bottomTextFontSelect.addEventListener('change', () => FontManager.updateBottomTextFont());
    }

    const bottomTextColor = document.getElementById('bottom-text-color');
    if (bottomTextColor) {
        bottomTextColor.addEventListener('input', () => BottomControls.updateBottomTextColor());
    }

    const bottomTextSize = document.getElementById('bottom-text-size');
    if (bottomTextSize) {
        bottomTextSize.addEventListener('input', () => BottomControls.updateBottomTextSize());
    }

    const bottomArrowFillEnabled = document.getElementById('bottom-arrow-fill-enabled');
    if (bottomArrowFillEnabled) {
        bottomArrowFillEnabled.addEventListener('change', () => BottomControls.updateBottomArrowColor());
    }

    const bottomArrowColor = document.getElementById('bottom-arrow-color');
    if (bottomArrowColor) {
        bottomArrowColor.addEventListener('input', () => BottomControls.updateBottomArrowColor());
    }

    // Main artwork controls
    const artworkUpload = document.getElementById('artwork-upload');
    if (artworkUpload) {
        artworkUpload.addEventListener('change', (e) => MainArtwork.handleArtworkUpload(e));
    }

    const artworkXPos = document.getElementById('artwork-x-pos');
    if (artworkXPos) {
        artworkXPos.addEventListener('input', () => MainArtwork.updateArtworkPosition());
    }

    const artworkYPos = document.getElementById('artwork-y-pos');
    if (artworkYPos) {
        artworkYPos.addEventListener('input', () => MainArtwork.updateArtworkPosition());
    }

    const artworkScale = document.getElementById('artwork-scale');
    if (artworkScale) {
        artworkScale.addEventListener('input', () => MainArtwork.updateArtworkScale());
    }

    const artworkOpacity = document.getElementById('artwork-opacity');
    if (artworkOpacity) {
        artworkOpacity.addEventListener('input', () => MainArtwork.updateArtworkOpacity());
    }

    // Button artwork controls
    const buttonArtworkSelect = document.getElementById('button-artwork-select');
    if (buttonArtworkSelect) {
        buttonArtworkSelect.addEventListener('change', () => ButtonArtwork.selectButtonForArtwork());
    }

    const buttonArtworkUpload = document.getElementById('button-artwork-upload');
    if (buttonArtworkUpload) {
        buttonArtworkUpload.addEventListener('change', (e) => ButtonArtwork.handleButtonArtworkUpload(e));
    }

    const btnArtRemoveWhite = document.getElementById('btn-art-remove-white');
    if (btnArtRemoveWhite) {
        btnArtRemoveWhite.addEventListener('change', () => ButtonArtwork.reprocessButtonArtwork());
    }

    const btnArtThreshold = document.getElementById('btn-art-threshold');
    if (btnArtThreshold) {
        btnArtThreshold.addEventListener('input', () => ButtonArtwork.reprocessButtonArtwork());
    }

    const btnArtXPos = document.getElementById('btn-art-x-pos');
    if (btnArtXPos) {
        btnArtXPos.addEventListener('input', () => ButtonArtwork.updateButtonArtwork());
    }

    const btnArtYPos = document.getElementById('btn-art-y-pos');
    if (btnArtYPos) {
        btnArtYPos.addEventListener('input', () => ButtonArtwork.updateButtonArtwork());
    }

    const btnArtScale = document.getElementById('btn-art-scale');
    if (btnArtScale) {
        btnArtScale.addEventListener('input', () => ButtonArtwork.updateButtonArtwork());
    }

    const btnArtRotation = document.getElementById('btn-art-rotation');
    if (btnArtRotation) {
        btnArtRotation.addEventListener('input', () => ButtonArtwork.updateButtonArtwork());
    }

    const btnArtOpacity = document.getElementById('btn-art-opacity');
    if (btnArtOpacity) {
        btnArtOpacity.addEventListener('input', () => ButtonArtwork.updateButtonArtwork());
    }
}

// Expose functions to window for inline event handlers (for backward compatibility)
window.updateTitle = () => TitleEditor.updateTitle();
window.updateTitleColor = () => TitleEditor.updateTitleColor();
window.updateTitleFont = () => FontManager.updateTitleFont();
window.updateTitleSize = () => TitleEditor.updateTitleSize();
window.toggleTitleBackground = () => TitleEditor.toggleTitleBackground();
window.updateButton = (num) => ButtonEditor.updateButton(num);
window.updateAllButtonLabels = () => ButtonEditor.updateAllButtonLabels();
window.updateButtonFont = () => FontManager.updateButtonFont();
window.toggleButtonBackground = (num) => ButtonEditor.toggleButtonBackground(num);
window.updateActionButton = (position) => ActionButtons.updateActionButton(position);
window.updateAllActionButtons = () => ActionButtons.updateAllActionButtons();
window.updateActionFont = () => FontManager.updateActionFont();
window.toggleActionArrowFill = () => ActionButtons.toggleActionArrowFill();
window.updateBottomText = () => BottomControls.updateBottomText();
window.updateBottomTextFont = () => FontManager.updateBottomTextFont();
window.updateBottomTextColor = () => BottomControls.updateBottomTextColor();
window.updateBottomTextSize = () => BottomControls.updateBottomTextSize();
window.toggleBottomArrowFill = () => BottomControls.toggleBottomArrowFill();
window.handleArtworkUpload = (e) => MainArtwork.handleArtworkUpload(e);
window.clearArtwork = () => MainArtwork.clearArtwork();
window.moveArtworkX = (delta) => MainArtwork.moveArtworkX(delta);
window.moveArtworkY = (delta) => MainArtwork.moveArtworkY(delta);
window.scaleArtwork = (delta) => MainArtwork.scaleArtwork(delta);
window.selectButtonForArtwork = () => ButtonArtwork.selectButtonForArtwork();
window.handleButtonArtworkUpload = (e) => ButtonArtwork.handleButtonArtworkUpload(e);
window.reprocessButtonArtwork = () => ButtonArtwork.reprocessButtonArtwork();
window.moveButtonArtworkX = (delta) => ButtonArtwork.moveButtonArtworkX(delta);
window.moveButtonArtworkY = (delta) => ButtonArtwork.moveButtonArtworkY(delta);
window.rotateButtonArtwork = (delta) => ButtonArtwork.rotateButtonArtwork(delta);
window.scaleButtonArtwork = (delta) => ButtonArtwork.scaleButtonArtwork(delta);
window.clearButtonArtwork = () => ButtonArtwork.clearButtonArtwork();
window.exportPNG = () => ExportManager.exportPNG();
window.resetOverlay = () => ExportManager.resetOverlay();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);
