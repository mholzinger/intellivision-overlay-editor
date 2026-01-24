# CLAUDE.md - Intellivision Overlay Editor

This document provides context for Claude AI sessions working on this codebase.

## Project Overview

**What this is:** A professional web-based editor for creating custom Intellivision controller overlays and box art. The Intellivision was a 1980s game console with unique controllers that used interchangeable overlay cards to label the 12-button keypad for each game.

**Who uses it:** Retro gaming enthusiasts, homebrew game developers, and collectors creating overlays for the Sprint USB controller (a modern recreation of the Intellivision controller).

**Live deployment:** https://intellivision-overlay-editor.fly.dev

## Architecture

### Stack
- **Backend:** Python 3.11+ with Flask
- **Frontend:** Vanilla JavaScript (ES6 modules), HTML5, CSS3
- **Export:** CairoSVG for server-side PNG rendering
- **Containerization:** Docker with Fly.io deployment

### Key Design Decisions

1. **No frontend framework** - Vanilla JS with ES6 modules keeps it simple and fast
2. **SVG-based editing** - All overlay elements are SVG, manipulated via DOM
3. **Client-side preview, server-side export** - Browser renders preview; CairoSVG renders final PNG
4. **Pre-rendering for export** - Text and gradients are pre-rendered to images before export for CairoSVG compatibility
5. **State management** - Centralized `appState` object in `stateManager.js`
6. **Modular architecture** - Each feature area has its own module

### Directory Structure

```
/
├── overlay_editor_app.py      # Flask server - routes, API endpoints
├── config.py                  # Centralized configuration with env var support
├── intellivision_overlay_RECTANGULAR.svg  # Master SVG template
│
├── templates/
│   ├── overlay_editor.html    # Main HTML - UI controls, layout
│   ├── box_art_template.svg   # Box art SVG template
│   └── controller_template_*.png  # Controller frame images for export
│
├── static/js/
│   ├── overlay_editor.js      # Entry point - wires modules to window functions
│   ├── modules/               # Feature modules (see below)
│   ├── services/              # API and state management
│   └── utils/                 # Shared utilities
│
├── sf_intellivised/           # Bundled fonts (58 files)
├── svg-templates/             # Button shape SVGs
├── layout-templates/          # Example overlay projects (ZIP)
└── boxart-templates/          # Example box art projects (ZIP)
```

## Module Reference

### Core Modules (`static/js/modules/`)

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| `svgManager.js` | Loads SVG template into preview iframe | `SVGManager.loadTemplate()` |
| `titleEditor.js` | Title text, font, color, background, area dimensions | `TitleEditor` class |
| `titleArtwork.js` | Title area artwork with clipping | `TitleArtwork` class |
| `mainArtwork.js` | Full overlay background artwork | `MainArtwork` class |
| `buttonEditor.js` | Button labels, styling, backgrounds | `ButtonEditor` class |
| `buttonArtwork.js` | Per-button artwork images | `ButtonArtwork` class |
| `buttonShape.js` | SVG shape overlays on buttons | `ButtonShape` class |
| `actionButtons.js` | Side action button labels and arrows | `ActionButtons` class |
| `bottomControls.js` | Disc direction arrows and text | `BottomControls` class |
| `rowDescriptions.js` | Row description labels | `RowDescriptions` class |
| `backgroundControls.js` | Overlay background fill | `BackgroundControls` class |
| `fontManager.js` | Font loading, dropdown population | `FontManager` class |
| `gradientManager.js` | SVG gradient definitions | `GradientManager` class |
| `exportManager.js` | PNG/ZIP export with pre-rendering | `ExportManager` class |
| `configManager.js` | Project save/load (ZIP format) | `ConfigManager` class |
| `uiManager.js` | Status messages, UI helpers | `UIManager` class |
| `previewInteraction.js` | Click-to-navigate in preview | `PreviewInteraction` class |
| `boxArtEditor.js` | Box art editor (separate tab) | `BoxArtEditor` class |

### Services (`static/js/services/`)

| Service | Purpose |
|---------|---------|
| `stateManager.js` | Central state object (`appState`) - artwork data, positions, settings |
| `api.js` | Backend API calls (fetch wrappers) |

### Utilities (`static/js/utils/`)

| Utility | Purpose |
|---------|---------|
| `textUtils.js` | Multiline text, tspan management |
| `svgHelpers.js` | SVG DOM manipulation helpers |
| `uiHelpers.js` | Form value getters, UI helpers |

## State Management

All application state lives in `appState` (singleton from `stateManager.js`):

```javascript
// Key state areas:
appState.getSvgDoc()           // The live SVG document in the preview iframe
appState.getArtworkData()      // Main artwork base64 data URL
appState.getArtworkOriginalData()  // Original before white removal
appState.getTitleArtworkData() // Title area artwork
appState.getButtonArtwork(id)  // Per-button artwork objects
appState.getButtonShape(id)    // Per-button shape configs
appState.getTitleAreaDimensions()  // {x, y, width, height}
```

**Important:** When clearing artwork, always clear BOTH the processed data AND original data, and do so unconditionally (not just when SVG elements are found). This prevents stale data from appearing in exports.

## SVG Template Structure

The main template (`intellivision_overlay_RECTANGULAR.svg`) has these key elements:

```
#overlay-background     - Background fill rect
#title-background       - Title bar background rect
#title-border          - Title bar border stroke
#title-text            - Title text element
#copyright-text        - Copyright/subtitle text
#btn-1 through #btn-9, #btn-clear, #btn-0, #btn-enter  - Button labels
#row-desc-1 through #row-desc-4  - Row descriptions
#top-left-arrow, #top-right-arrow, #bottom-left-arrow, #bottom-right-arrow  - Action arrows
#top-left-label, #top-right-label, #bottom-left-label, #bottom-right-label  - Action labels
#disc-left-arrow, #disc-right-arrow  - Disc direction arrows
#bottom-text           - Direction text
```

Dynamically created elements:
```
#custom-artwork        - Main artwork image (single)
#custom-artwork-tiled  - Main artwork rect (tiled mode)
#artwork-pattern       - Pattern definition for tiling
#title-artwork-group   - Title artwork container with clip path
#btn-art-{id}         - Button artwork images
#btn-bg-{id}          - Button background rects
#btn-shape-{id}       - Button shape paths
```

## Export Pipeline

The export process (in `exportManager.js`) handles CairoSVG limitations:

1. **Pre-render text** - Each text element is rendered to a canvas image using browser fonts, then replaced with `<image>` elements
2. **Pre-render gradients** - Background and title gradients are rendered to canvas images
3. **Pre-render tiled artwork** - Tiled patterns are rendered to a single image
4. **Clone and transform** - SVG is cloned, transformed elements are replaced
5. **Server-side render** - Cleaned SVG sent to `/export_png` endpoint
6. **Apply overlay mask** - Client-side canvas clips to rounded-corner overlay shape

## Common Patterns

### Adding a new text styling feature

1. Add UI control in `overlay_editor.html`
2. Add state getter/setter in `stateManager.js` if needed
3. Add update function in relevant module (e.g., `titleEditor.js`)
4. Wire to window in `overlay_editor.js`: `window.updateX = () => Module.updateX()`
5. Add to `configManager.js` `collectConfig()` and `applyConfig()`
6. Update export logic in `exportManager.js` if needed

### Adding a new font

1. Place `.ttf` or `.otf` in `sf_intellivised/`
2. Restart server (or POST to `/fonts/refresh`)
3. Font appears automatically in all dropdowns

### Adding a controller template

1. Add PNG to `templates/controller_template_{name}.png`
2. Add menu items in `overlay_editor.html` for both framed export and bundle
3. The `exportFramedOverlay()` and `exportSprintBundle()` functions dynamically construct the path

## Configuration

All config in `config.py` with `OVL_` prefixed environment variables:

```python
Config.HOST                    # OVL_HOST (default: 0.0.0.0)
Config.PORT                    # OVL_PORT (default: 5001)
Config.get_font_dir()          # OVL_FONT_DIR (default: sf_intellivised)
Config.get_shapes_dir()        # OVL_SHAPES_DIR (default: svg-templates)
Config.CORS_ENABLED            # OVL_CORS_ENABLED (default: true)
Config.FONT_CACHE_ENABLED      # OVL_FONT_CACHE_ENABLED (default: true)
```

## Testing Locally

```bash
# Install dependencies
pip install -r requirements.txt

# Run server
python overlay_editor_app.py

# Or with Docker
docker-compose up
```

Server runs at http://127.0.0.1:5001 (or port 5000 in Docker).

## Common Issues and Solutions

### Artwork persists after clearing
**Cause:** State wasn't cleared because SVG elements weren't found
**Solution:** `clearArtwork()` now clears state unconditionally

### Fonts not rendering in export
**Cause:** CairoSVG can't find the font
**Solution:** Fonts are pre-rendered to images before export

### Button fonts not matching preview
**Cause:** Using `fontData.family` instead of `fontData.displayName`
**Solution:** Use `FontManager.parseFontData()` to get correct font family name

### Gradients not appearing in export
**Cause:** CairoSVG gradient support is limited
**Solution:** Gradients are pre-rendered to canvas images

## Code Style

- ES6 modules with explicit imports/exports
- Static class methods (no instantiation needed)
- JSDoc comments on public methods
- Prefer `const` over `let`
- Use `?.` optional chaining for DOM queries
- All UI wiring goes through `window.` functions in `overlay_editor.js`

## Key Files to Understand First

1. `overlay_editor.js` - See how modules connect to UI
2. `stateManager.js` - Understand the state model
3. `exportManager.js` - Understand the export pipeline
4. `configManager.js` - Understand project save/load
5. `titleEditor.js` - Good example of a typical feature module

## Recent Changes (as of Jan 2025)

- Added INTV II controller template support
- Added enterprise configuration (`config.py`) with env var support
- Added font caching for performance
- Added optional CORS and rate limiting
- Fixed artwork clearing bug (state now cleared unconditionally)
- Added Barlow, Bebas Neue, Be Vietnam Pro, Atkinson Hyperlegible fonts
- Fixed button font rendering (using `FontManager.parseFontData()`)

## Deployment

Production is on Fly.io. Deploy with:

```bash
fly deploy
```

The Dockerfile:
1. Installs Cairo and font dependencies
2. Copies fonts to system font directories
3. Runs `fc-cache` to register fonts
4. Copies application files
5. Runs Flask server

## Questions to Ask the User

When working on this project, clarify:
- Are they working on the **overlay editor** or **box art editor**?
- Do they need changes to affect **preview only** or **export too**?
- For new features: should settings be **saved in project files**?
- For styling: does it need **gradient support**?
