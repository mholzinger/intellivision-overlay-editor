/**
 * Intellivision Overlay Editor - Main Entry Point
 * Coordinates all modules and sets up event handlers
 */

import { SVGManager } from './modules/svgManager.js';
import { FontManager } from './modules/fontManager.js';
import { TitleEditor } from './modules/titleEditor.js';
import { TitleArtwork } from './modules/titleArtwork.js';
import { ButtonEditor } from './modules/buttonEditor.js';
import { ButtonArtwork } from './modules/buttonArtwork.js';
import { ButtonShape } from './modules/buttonShape.js';
import { ButtonEditorUI } from './modules/buttonEditorUI.js';
import { MainArtwork } from './modules/mainArtwork.js';
import { ActionButtons } from './modules/actionButtons.js';
import { BottomControls } from './modules/bottomControls.js';
import { BackgroundControls } from './modules/backgroundControls.js';
import { ExportManager } from './modules/exportManager.js';
import { RowDescriptions } from './modules/rowDescriptions.js';
import { UIManager } from './modules/uiManager.js';
import { ConfigManager } from './modules/configManager.js';
import { ImageProcessor } from './modules/imageProcessor.js';
import { BoxArtEditor } from './modules/boxArtEditor.js';
import { SpriteEditor } from './modules/spriteEditor.js';
import { DSOverlayEditor } from './modules/dsOverlayEditor.js';
import { VoiceEditor } from './modules/voiceEditor.js';

/**
 * Initialize the application
 */
function initializeApp() {
    // Load the SVG template (suppress status message on initial load)
    SVGManager.loadTemplate(false);

    // Initialize button shape templates
    ButtonShape.initialize();

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

    // Copyright text controls
    const copyrightInput = document.getElementById('copyright-input');
    if (copyrightInput) {
        copyrightInput.addEventListener('input', () => TitleEditor.updateCopyrightText());
    }

    const copyrightColor = document.getElementById('copyright-color');
    if (copyrightColor) {
        copyrightColor.addEventListener('input', () => TitleEditor.updateCopyrightColor());
    }

    const copyrightFontSelect = document.getElementById('copyright-font-select');
    if (copyrightFontSelect) {
        copyrightFontSelect.addEventListener('change', () => FontManager.updateCopyrightFont());
    }

    const copyrightFontSize = document.getElementById('copyright-font-size');
    if (copyrightFontSize) {
        copyrightFontSize.addEventListener('input', () => TitleEditor.updateCopyrightSize());
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

    // Row description controls
    const rowDescColor = document.getElementById('row-desc-color');
    if (rowDescColor) {
        rowDescColor.addEventListener('input', () => RowDescriptions.updateAllRowDescriptions());
    }

    const rowDescSize = document.getElementById('row-desc-size');
    if (rowDescSize) {
        rowDescSize.addEventListener('input', () => RowDescriptions.updateAllRowDescriptions());
    }

    const rowDescFontSelect = document.getElementById('row-desc-font-select');
    if (rowDescFontSelect) {
        rowDescFontSelect.addEventListener('change', () => RowDescriptions.updateRowDescFont());
    }

    // Individual row description inputs
    for (let i = 1; i <= 4; i++) {
        const input = document.getElementById(`row-desc-input-${i}`);
        if (input) {
            input.addEventListener('input', () => RowDescriptions.updateRowDescription(i));
        }
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

    // Action button description inputs
    const actionDescLeftInput = document.getElementById('action-desc-left-input');
    if (actionDescLeftInput) {
        actionDescLeftInput.addEventListener('input', () => ActionButtons.updateActionDescription('left'));
    }

    const actionDescRightInput = document.getElementById('action-desc-right-input');
    if (actionDescRightInput) {
        actionDescRightInput.addEventListener('input', () => ActionButtons.updateActionDescription('right'));
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

    // Background fill controls
    const bgFillEnabled = document.getElementById('bg-fill-enabled');
    if (bgFillEnabled) {
        bgFillEnabled.addEventListener('change', () => BackgroundControls.toggleBackgroundFill());
    }

    const bgFillColor = document.getElementById('bg-fill-color');
    if (bgFillColor) {
        bgFillColor.addEventListener('input', () => BackgroundControls.updateBackgroundFill());
    }

    const bgFillOpacity = document.getElementById('bg-fill-opacity');
    if (bgFillOpacity) {
        bgFillOpacity.addEventListener('input', () => BackgroundControls.updateBackgroundOpacity());
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

    const artworkRemoveWhite = document.getElementById('artwork-remove-white');
    if (artworkRemoveWhite) {
        artworkRemoveWhite.addEventListener('change', () => MainArtwork.toggleArtworkRemoveWhite());
    }

    const artworkThreshold = document.getElementById('artwork-threshold');
    if (artworkThreshold) {
        artworkThreshold.addEventListener('input', () => MainArtwork.updateArtworkThreshold());
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
window.updateTitlePosition = () => TitleEditor.updateTitlePosition();
window.updateTitleStyle = () => TitleEditor.updateTitleStyle();
window.updateTitleAreaX = () => TitleEditor.updateTitleAreaX();
window.updateTitleAreaY = () => TitleEditor.updateTitleAreaY();
window.updateTitleAreaWidth = () => TitleEditor.updateTitleAreaWidth();
window.updateTitleAreaHeight = () => TitleEditor.updateTitleAreaHeight();
window.resetTitleAreaDimensions = () => TitleEditor.resetTitleAreaDimensions();
window.toggleTitleBackground = () => TitleEditor.toggleTitleBackground();
window.updateTitleBackground = () => TitleEditor.updateTitleBackground();
window.toggleGradientControls = (baseId) => UIManager.toggleGradientControls(baseId);
window.updateCopyrightText = () => TitleEditor.updateCopyrightText();
window.updateCopyrightColor = () => TitleEditor.updateCopyrightColor();
window.updateCopyrightFont = () => FontManager.updateCopyrightFont();
window.updateCopyrightSize = () => TitleEditor.updateCopyrightSize();
window.updateCopyrightPosition = () => TitleEditor.updateCopyrightPosition();
window.updateCopyrightStyle = () => TitleEditor.updateCopyrightStyle();
window.updateButton = (num) => ButtonEditor.updateButton(num);
window.updateAllButtonLabels = () => ButtonEditor.updateAllButtonLabels();
window.updateButtonFont = () => FontManager.updateButtonFont();
window.toggleButtonBackground = (num) => ButtonEditor.toggleButtonBackground(num);
window.updateActionButton = (position) => ActionButtons.updateActionButton(position);
window.updateAllActionButtons = () => ActionButtons.updateAllActionButtons();
window.updateActionFont = () => FontManager.updateActionFont();
window.toggleActionArrowFill = () => ActionButtons.toggleActionArrowFill();
window.updateActionArrowColor = () => ActionButtons.updateActionArrowColor();
window.updateActionArrowStroke = () => ActionButtons.updateActionArrowStroke();
window.updateActionArrowTransforms = () => ActionButtons.updateActionArrowTransforms();
window.updateActionDescription = (side) => ActionButtons.updateActionDescription(side);
window.updateBottomText = () => BottomControls.updateBottomText();
window.updateBottomTextFont = () => FontManager.updateBottomTextFont();
window.updateBottomTextColor = () => BottomControls.updateBottomTextColor();
window.updateBottomTextSize = () => BottomControls.updateBottomTextSize();
window.updateBottomTextPosition = () => BottomControls.updateBottomTextPosition();
window.updateBottomTextStyle = () => BottomControls.updateBottomTextStyle();
window.toggleBottomArrowFill = () => BottomControls.toggleBottomArrowFill();
window.updateBottomArrowColor = () => BottomControls.updateBottomArrowColor();
window.updateDiscArrowStroke = () => BottomControls.updateDiscArrowStroke();
window.updateDiscArrowTransforms = () => BottomControls.updateDiscArrowTransforms();
window.toggleBackgroundFill = () => BackgroundControls.toggleBackgroundFill();
window.updateBackgroundFill = () => BackgroundControls.updateBackgroundFill();
window.updateBackgroundOpacity = () => BackgroundControls.updateBackgroundOpacity();
// Title artwork functions
window.handleTitleArtworkUpload = (e) => TitleArtwork.handleTitleArtworkUpload(e);
window.clearTitleArtwork = () => TitleArtwork.clearTitleArtwork();
window.moveTitleArtworkX = (delta) => TitleArtwork.moveTitleArtworkX(delta);
window.moveTitleArtworkY = (delta) => TitleArtwork.moveTitleArtworkY(delta);
window.scaleTitleArtwork = (delta) => TitleArtwork.scaleTitleArtwork(delta);
window.rotateTitleArtwork = (delta) => TitleArtwork.rotateTitleArtwork(delta);
window.updateTitleArtworkPosition = () => TitleArtwork.updateTitleArtworkPosition();
window.updateTitleArtworkScale = () => TitleArtwork.updateTitleArtworkScale();
window.updateTitleArtworkOpacity = () => TitleArtwork.updateTitleArtworkOpacity();
window.updateTitleArtworkRotation = () => TitleArtwork.updateTitleArtworkRotation();
window.toggleTitleArtworkTile = () => TitleArtwork.toggleTitleArtworkTile();
window.toggleTitleArtworkRemoveWhite = () => TitleArtwork.toggleTitleArtworkRemoveWhite();
window.updateTitleArtworkThreshold = () => TitleArtwork.updateTitleArtworkThreshold();
window.insertTitleArtwork = (dataURL) => TitleArtwork.insertTitleArtwork(dataURL);

// Main overlay artwork functions
window.handleArtworkUpload = (e) => MainArtwork.handleArtworkUpload(e);
window.clearArtwork = () => MainArtwork.clearArtwork();
window.moveArtworkX = (delta) => MainArtwork.moveArtworkX(delta);
window.moveArtworkY = (delta) => MainArtwork.moveArtworkY(delta);
window.scaleArtwork = (delta) => MainArtwork.scaleArtwork(delta);
window.rotateArtwork = (delta) => MainArtwork.rotateArtwork(delta);
window.updateArtworkRotation = () => MainArtwork.updateArtworkRotation();
window.toggleArtworkTile = () => MainArtwork.toggleArtworkTile();
window.toggleArtworkRemoveWhite = () => MainArtwork.toggleArtworkRemoveWhite();
window.updateArtworkThreshold = () => MainArtwork.updateArtworkThreshold();
window.selectButtonForArtwork = () => ButtonArtwork.selectButtonForArtwork();
window.handleButtonArtworkUpload = (e) => ButtonArtwork.handleButtonArtworkUpload(e);
window.reprocessButtonArtwork = () => ButtonArtwork.reprocessButtonArtwork();
window.moveButtonArtworkX = (delta) => ButtonArtwork.moveButtonArtworkX(delta);
window.moveButtonArtworkY = (delta) => ButtonArtwork.moveButtonArtworkY(delta);
window.rotateButtonArtwork = (delta) => ButtonArtwork.rotateButtonArtwork(delta);
window.scaleButtonArtwork = (delta) => ButtonArtwork.scaleButtonArtwork(delta);
window.clearButtonArtwork = () => ButtonArtwork.clearButtonArtwork();
window.insertArtwork = (dataURL) => MainArtwork.insertArtwork(dataURL);
window.insertButtonArtwork = (buttonNum) => ButtonArtwork.insertButtonArtwork(buttonNum);
window.selectButtonForShape = () => ButtonShape.selectButtonForShape();
window.onShapeTemplateChange = () => ButtonShape.onTemplateChange();
window.updateButtonShape = () => ButtonShape.updateButtonShape();
window.toggleShapeFill = () => ButtonShape.toggleFillEnabled();
window.clearButtonShape = () => ButtonShape.clearButtonShape();
window.moveShapeX = (delta) => ButtonShape.moveShapeX(delta);
window.moveShapeY = (delta) => ButtonShape.moveShapeY(delta);
window.scaleShape = (delta) => ButtonShape.scaleShape(delta);
window.rotateShape = (delta) => ButtonShape.rotateShape(delta);
window.selectButtonForEditor = () => ButtonEditorUI.selectButtonForEditor();
window.updateButtonEditorBackground = () => ButtonEditorUI.updateButtonEditorBackground();
window.exportPNG = () => ExportManager.exportPNG();
window.exportFramedOverlay = (frameType) => ExportManager.exportFramedOverlay(frameType);
window.exportSprintBundle = (frameType) => ExportManager.exportSprintBundle(frameType);
window.resetOverlay = () => ExportManager.resetOverlay();

// Toggle controller frame dropdown
window.toggleControllerFrameDropdown = () => {
    const menu = document.getElementById('controller-frame-dropdown-menu');
    if (menu) {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
};

// Close controller frame dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.querySelector('.controller-frame-dropdown');
    const menu = document.getElementById('controller-frame-dropdown-menu');
    if (dropdown && menu && !dropdown.contains(event.target)) {
        menu.style.display = 'none';
    }
});
window.updateRowDescription = (rowNum) => RowDescriptions.updateRowDescription(rowNum);
window.updateAllRowDescriptions = () => RowDescriptions.updateAllRowDescriptions();
window.updateRowDescFont = () => RowDescriptions.updateRowDescFont();
window.ImageProcessor = ImageProcessor;

// Known tab slugs and their canonical URL paths.
const _TAB_SLUGS = new Set(['overlay', 'boxart', 'sprite', 'ds', 'voice']);

// Tab switching — call with pushState=false when restoring from history.
window.switchEditorTab = (tabName, pushState = true) => {
    if (!_TAB_SLUGS.has(tabName)) tabName = 'overlay';

    // Update tab buttons
    document.querySelectorAll('.editor-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Update content panels
    document.querySelectorAll('.editor-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}-editor-content`);
    });

    // Update toolbars (show the appropriate action buttons)
    document.querySelectorAll('.editor-toolbar').forEach(toolbar => {
        toolbar.classList.toggle('active', toolbar.id === `${tabName}-toolbar`);
    });

    // Initialize box art editor on first switch to that tab
    if (tabName === 'boxart' && !window._boxArtInitialized) {
        BoxArtEditor.init();
        window._boxArtInitialized = true;
    }

    // Initialize sprite editor on first switch to that tab
    if (tabName === 'sprite' && !window._spriteEditorInitialized) {
        SpriteEditor.init();
        window._spriteEditorInitialized = true;
    }

    // Initialize DS overlay editor on first switch to that tab
    if (tabName === 'ds' && !window._dsEditorInitialized) {
        DSOverlayEditor.init();
        window._dsEditorInitialized = true;
    }

    // Initialize IntelliVoice builder on first switch to that tab
    if (tabName === 'voice' && !window._voiceEditorInitialized) {
        VoiceEditor.init();
        window._voiceEditorInitialized = true;
    }

    // Sync the browser URL.
    if (pushState) {
        const url = tabName === 'overlay' ? '/' : `/${tabName}`;
        history.pushState({ tab: tabName }, '', url);
    }
};

// On page load: activate the tab matching the URL path, then set initial history state.
{
    const slug = window.location.pathname.replace(/^\//, '') || 'overlay';
    const initial = _TAB_SLUGS.has(slug) ? slug : 'overlay';
    switchEditorTab(initial, false);
    history.replaceState({ tab: initial }, '', window.location.pathname || '/');
}

// Handle browser back / forward.
window.addEventListener('popstate', (e) => {
    switchEditorTab(e.state?.tab ?? 'overlay', false);
});

// Box Art Editor functions
window.updateBoxArtBrand = () => BoxArtEditor.updateBrand();
window.updateBoxArtTagline = () => BoxArtEditor.updateTagline();
window.updateBoxArtBrandFont = () => BoxArtEditor.updateBrandFont();
window.updateBoxArtBrandSize = () => BoxArtEditor.updateBrandSize();
window.updateBoxArtBrandColor = () => BoxArtEditor.updateBrandColor();
window.updateBoxArtBrandStyle = () => BoxArtEditor.updateBrandStyle();
window.updateBoxArtBrandPosition = () => BoxArtEditor.updateBrandPosition();
window.updateBoxArtTaglineFont = () => BoxArtEditor.updateTaglineFont();
window.updateBoxArtTaglineSize = () => BoxArtEditor.updateTaglineSize();
window.updateBoxArtTaglineColor = () => BoxArtEditor.updateTaglineColor();
window.updateBoxArtTaglineStyle = () => BoxArtEditor.updateTaglineStyle();
window.updateBoxArtTaglinePosition = () => BoxArtEditor.updateTaglinePosition();
window.updateBoxArtHeaderColor = () => BoxArtEditor.updateHeaderColor();
window.updateBoxArtTitle = () => BoxArtEditor.updateTitle();
window.updateBoxArtSubtitle = () => BoxArtEditor.updateSubtitle();
window.updateBoxArtTitleFont = () => BoxArtEditor.updateTitleFont();
window.updateBoxArtSubtitleFont = () => BoxArtEditor.updateSubtitleFont();
window.updateBoxArtTitleColor = () => BoxArtEditor.updateTitleColor();
window.updateBoxArtTitleSize = () => BoxArtEditor.updateTitleSize();
window.updateBoxArtTitleStyle = () => BoxArtEditor.updateTitleStyle();
window.updateBoxArtTitleAnchor = () => BoxArtEditor.updateTitleAnchor();
window.updateBoxArtTitlePosition = () => BoxArtEditor.updateTitlePosition();
window.updateBoxArtSubtitleColor = () => BoxArtEditor.updateSubtitleColor();
window.updateBoxArtSubtitleSize = () => BoxArtEditor.updateSubtitleSize();
window.updateBoxArtSubtitleStyle = () => BoxArtEditor.updateSubtitleStyle();
window.updateBoxArtSubtitleAnchor = () => BoxArtEditor.updateSubtitleAnchor();
window.updateBoxArtSubtitlePosition = () => BoxArtEditor.updateSubtitlePosition();
window.updateBoxArtFrameColor = () => BoxArtEditor.updateFrameColor();
window.updateBoxArtFrameStroke = () => BoxArtEditor.updateFrameStroke();
window.updateBoxArtFrameTop = () => BoxArtEditor.updateFrameTop();
window.updateBoxArtStripes = () => BoxArtEditor.updateStripes();
window.updateBoxArtStripesLayer = () => BoxArtEditor.updateStripesLayer();
window.updateBoxArtFrameFill = () => BoxArtEditor.updateFrameFill();
window.handleBoxArtArtworkUpload = (e) => BoxArtEditor.handleArtworkUpload(e);
window.updateBoxArtArtwork = () => BoxArtEditor.updateArtwork();
window.clearBoxArtArtwork = () => BoxArtEditor.clearArtwork();
window.toggleBoxArtVignette = () => BoxArtEditor.toggleVignette();
window.updateBoxArtVignette = () => BoxArtEditor.updateVignette();
window.updateBoxArtVignetteSize = (axis) => BoxArtEditor.updateVignetteSize(axis);
window.handleBoxArtVignetteArtworkUpload = (e) => BoxArtEditor.handleVignetteArtworkUpload(e);
window.updateBoxArtVignetteArtwork = () => BoxArtEditor.updateVignetteArtwork();
window.reprocessBoxArtVignetteArtwork = () => BoxArtEditor.reprocessVignetteArtwork();
window.moveVignetteArtworkX = (delta) => BoxArtEditor.moveVignetteArtworkX(delta);
window.moveVignetteArtworkY = (delta) => BoxArtEditor.moveVignetteArtworkY(delta);
window.scaleVignetteArtwork = (delta) => BoxArtEditor.scaleVignetteArtwork(delta);
window.rotateVignetteArtwork = (delta) => BoxArtEditor.rotateVignetteArtwork(delta);
window.clearBoxArtVignetteArtwork = () => BoxArtEditor.clearVignetteArtwork();
window.toggleBoxArtVoiceBadge = () => BoxArtEditor.toggleVoiceBadge();
window.updateBoxArtVoiceBadgeStyle = () => BoxArtEditor.updateVoiceBadge();
window.updateBoxArtVoiceBadgePosition = () => BoxArtEditor.updateVoiceBadgePosition();
window.updateBoxArtVoiceBadgeColors = () => BoxArtEditor.updateVoiceBadgeColors();
window.updateBoxArtVoiceBadgeText = () => BoxArtEditor.updateVoiceBadgeText();
window.updateBoxArtPlayerCount = () => BoxArtEditor.updatePlayerCount();
window.exportBoxArtPNG = () => BoxArtEditor.exportPNG();
window.resetBoxArt = () => BoxArtEditor.reset();
window.exportBoxArtProject = () => BoxArtEditor.exportProject();
window.importBoxArtProject = () => BoxArtEditor.importProject();

// Sprite Editor functions
window.setSpriteSize = (w, h) => SpriteEditor.setSpriteSize(w, h);
window.spriteClear = () => SpriteEditor.clearSprite();
window.spriteFill = () => SpriteEditor.fillSprite();
window.spriteInvert = () => SpriteEditor.invertSprite();
window.spriteFlipH = () => SpriteEditor.flipHorizontal();
window.spriteFlipV = () => SpriteEditor.flipVertical();
window.spriteRotate = () => SpriteEditor.rotateClockwise();
window.spriteShiftUp = () => SpriteEditor.shiftSprite('up');
window.spriteShiftDown = () => SpriteEditor.shiftSprite('down');
window.spriteShiftLeft = () => SpriteEditor.shiftSprite('left');
window.spriteShiftRight = () => SpriteEditor.shiftSprite('right');
window.addNewSprite = () => SpriteEditor.addSprite();
window.duplicateCurrentSprite = () => SpriteEditor.duplicateSprite();
window.deleteCurrentSprite = () => SpriteEditor.deleteSprite();
window.updateSpriteName = () => SpriteEditor.updateSpriteName();
window.copySpriteBitmap = () => SpriteEditor.copyOutputToClipboard();
window.copyAllSprites = () => SpriteEditor.copyAllToClipboard();
window.importSpriteImage = (e) => SpriteEditor.importImage(e);
window.exportSpriteProject = () => SpriteEditor.exportProject();
window.importSpriteProject = () => SpriteEditor.importProject();
window.clearAllSprites = () => SpriteEditor.reset();

// Animation functions
window.addAllToAnimation = () => SpriteEditor.addAllToAnimation();
window.clearAnimationSequence = () => SpriteEditor.clearAnimation();
window.toggleAnimation = () => SpriteEditor.toggleAnimation();
window.stopAnimation = () => SpriteEditor.stopAnimation();
window.updateAnimationFps = () => SpriteEditor.updateAnimationFps();
window.addSpriteToAnimation = (index) => SpriteEditor.addToAnimation(index);

// BITMAP import
window.pasteBitmapText = () => SpriteEditor.showPasteBitmapDialog();

// Sprite properties panel
window.updateSpriteGramCard = (val)     => SpriteEditor.updateGramCard(val);
window.updateSpriteMode     = (mode)    => SpriteEditor.updateSpriteMode(mode);
window.updateMobColor       = (idx)     => SpriteEditor.updateMobColor(idx);
window.updateCsColor        = (idx)     => SpriteEditor.updateCsColor(idx);
window.updateCsAdvance      = (checked) => SpriteEditor.updateCsAdvance(checked);
window.updateFgbgFg         = (idx)     => SpriteEditor.updateFgbgFg(idx);
window.updateFgbgBg         = (idx)     => SpriteEditor.updateFgbgBg(idx);

// DS Overlay Editor functions
window.loadDSTemplate       = () => DSOverlayEditor.loadTemplate();
window.loadDSBackground     = (e) => DSOverlayEditor.loadBackground(e);
window.toggleDSHotspot      = (idx) => DSOverlayEditor.toggleHotspot(idx);
window.updateDSHotspot      = (idx, field, val) => DSOverlayEditor.updateCoord(idx, field, val);
window.exportDSOvl          = () => DSOverlayEditor.downloadOvl();
window.exportDSOvlWithImage = () => DSOverlayEditor.exportWithImage();

// IntelliVoice Builder functions
window.voicePlay        = () => VoiceEditor.playSequence();
window.voiceStop        = () => VoiceEditor.stopPlayback();
window.voiceCopy        = () => VoiceEditor.copyOutput();
window.voiceAddWord     = () => VoiceEditor.submitWord();
window.voiceWordKey     = (e) => VoiceEditor.handleWordInput(e);
window.voiceRemoveAt    = (pos) => VoiceEditor.removeAllophone(pos);
window.voiceClear       = () => VoiceEditor.clearSequence();
window.voiceSetChannel  = (ch) => VoiceEditor.setChannel(ch);
window.voiceDiagnose    = () => VoiceEditor.runDiagnostics();
window.voiceDiagnoseAll = () => VoiceEditor.runDiagnostics([...Array(64).keys()]);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);
