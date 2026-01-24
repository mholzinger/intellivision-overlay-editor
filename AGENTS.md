# AGENTS.md - AI Agent Instructions

This file provides instructions for AI agents (Claude, GPT, Copilot, Cursor, etc.) working on this codebase.

## Quick Context

**Project**: Intellivision Overlay Editor - creates custom controller overlays for retro gaming
**Stack**: Flask (Python) + Vanilla JS (ES6 modules) + CairoSVG
**No frameworks**: No React, Vue, Angular, npm, or node

## Before Making Changes

1. **Read CLAUDE.md** for deep architectural context
2. **Check stateManager.js** to understand state model
3. **Check overlay_editor.js** to see how modules wire to UI
4. **Check configManager.js** if changes need to be saved/loaded

## Decision Tree

```
Need to modify text styling?
  → titleEditor.js, buttonEditor.js, actionButtons.js, or rowDescriptions.js

Need to modify artwork handling?
  → mainArtwork.js (overlay), titleArtwork.js (title area), buttonArtwork.js (buttons)

Need to modify export output?
  → exportManager.js (and possibly pre-render logic)

Need to add a new control?
  → overlay_editor.html (UI) + relevant module + overlay_editor.js (wiring)

Need to save/restore a setting?
  → configManager.js collectConfig() and applyConfig()

Need to add a font?
  → Just drop .ttf/.otf in sf_intellivised/ directory

Need to add controller template?
  → Add PNG to templates/, add menu items in overlay_editor.html
```

## Critical Knowledge

### The Font Bug Fix
```javascript
// WRONG - causes fonts not to render
const fontData = JSON.parse(fontSelect.value);
element.style.fontFamily = fontData.family;

// CORRECT - use FontManager
const { fontFamily } = FontManager.parseFontData(fontSelect.value);
element.style.fontFamily = fontFamily;
```

### The Artwork Clearing Bug Fix
```javascript
// WRONG - state not cleared if SVG element not found
if (artwork) {
    artwork.remove();
    appState.setArtworkData(null);
}

// CORRECT - always clear state
if (artwork) artwork.remove();
appState.setArtworkData(null);  // Unconditional
appState.setArtworkOriginalData(null);  // Don't forget original
```

### The Export Pipeline
CairoSVG has limitations. We work around them by pre-rendering:
1. Text → canvas images (fonts)
2. Gradients → canvas images
3. Tiled patterns → single image
4. Then clone SVG, replace elements, send to server

## Module Import Pattern

```javascript
// Standard imports at top of module
import { appState } from '../services/stateManager.js';
import { UIManager } from './uiManager.js';
import { FontManager } from './fontManager.js';
import { TextUtils } from '../utils/textUtils.js';
import { UIHelpers } from '../utils/uiHelpers.js';
import { SVGHelpers } from '../utils/svgHelpers.js';
```

## Testing Your Changes

1. **Preview**: Does it look right in the browser preview?
2. **Export PNG**: Does the export match the preview?
3. **Save/Load**: If you added settings, do they survive project export/import?
4. **Reset**: Does the Reset button restore defaults?
5. **Docker**: Does it work in the container?

## Environment

```bash
# Local development
python overlay_editor_app.py
# http://127.0.0.1:5001

# Docker
docker-compose up
# http://localhost:5000

# Production
fly deploy
# https://intellivision-overlay-editor.fly.dev
```

## Don't Do These Things

- Don't add npm/yarn/node dependencies
- Don't install frontend frameworks
- Don't change SVG element IDs without grep-ing all references
- Don't store image data in multiple state locations
- Don't skip the pre-render step for export
- Don't use `fontData.family` directly - use `FontManager.parseFontData()`
- Don't conditionally clear state based on SVG element existence

## Ask User to Clarify

- "Is this for the overlay editor or box art editor?"
- "Should this setting be saved in project files?"
- "Does this need gradient support?"
- "Should this affect preview only, export only, or both?"
