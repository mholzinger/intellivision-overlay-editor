# Intellivision Overlay Editor

Professional web-based tool for creating custom Intellivision controller overlays and box art for Sprint USB controllers.

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Docker](https://img.shields.io/badge/Docker-Ready-brightgreen.svg)

**Live Demo:** [https://intellivision-overlay-editor.fly.dev](https://intellivision-overlay-editor.fly.dev)

## Features

### Overlay Editor
- **Live SVG Preview** - Real-time visualization with click-to-navigate (click any element to jump to its controls)
- **Game Title Editor** - Customize title text, font, size, color, and position
- **Title Area Dimensions** - Adjustable title area size and position
- **Title Space Artwork** - Upload artwork for the title bar area with positioning controls
- **Copyright Text** - Customizable copyright/subtitle text
- **Background Fill** - Solid color or gradient backgrounds
- **Main Overlay Artwork** - Full overlay artwork with scale, position, rotation, and tiling options
- **Keypad Labels** - Edit all 12 button labels (1-9, CLR, 0, ENT) with row descriptions
- **Button Editor** - Custom button shapes, colors, and per-button artwork
- **Action Buttons** - Configure side action buttons with arrows and labels
- **Bottom Arrows** - Disc direction arrows with customizable text
- **Sprint Export** - Export with controller frame templates (Sprint, INTV, Sears)

### Box Art Editor (Beta)
- **Header/Branding** - Intellivision logo and tagline
- **Game Title** - Title and subtitle with font controls
- **Content Frame** - Decorative border stripes (1-3 stripes)
- **Main Artwork** - Background artwork with positioning
- **Vignette Frame** - Optional circular/oval vignette with inner ring
- **Badges** - Intellivoice badge and player count indicators

### Export Options
- **PNG Export** - High-resolution 300 DPI output with overlay mask
- **SVG Export** - Editable vector format
- **Sprint Bundle** - ZIP with `big_overlay.png` and framed overlay
- **Project Save/Load** - Export/import complete projects as ZIP files

## Quick Start

### Live Demo
Visit [https://intellivision-overlay-editor.fly.dev](https://intellivision-overlay-editor.fly.dev) to use the editor immediately.

### Docker (Recommended)
```bash
# Build and run with docker-compose
docker-compose up

# Or build manually
docker build -t intellivision-overlay-editor .
docker run -p 5000:5000 intellivision-overlay-editor
```

Then open your browser to: **http://localhost:5000**

### Local Development

**Prerequisites:**
- Python 3.11+
- Cairo graphics library

**macOS:**
```bash
brew install cairo pkg-config
pip install -r requirements.txt
python overlay_editor_app.py
```

**Ubuntu/Debian:**
```bash
sudo apt-get install libcairo2 libpango-1.0-0 libpangocairo-1.0-0 libgdk-pixbuf-2.0-0 fontconfig
pip install -r requirements.txt
python overlay_editor_app.py
```

Open **http://127.0.0.1:5000** in your browser.

## Project Structure

```
intellivision-overlay-editor/
├── overlay_editor_app.py          # Flask backend server
├── intellivision_overlay_RECTANGULAR.svg  # Overlay SVG template
│
├── templates/
│   ├── overlay_editor.html        # Main web interface
│   ├── box_art_template.svg       # Box art SVG template
│   ├── controller_template_sprint.png   # Sprint controller frame
│   ├── controller_template_intv.png     # INTV controller frame
│   └── controller_template_sears.png    # Sears controller frame
│
├── static/
│   ├── css/
│   │   ├── main.css               # Main layout styles
│   │   ├── components.css         # UI component styles
│   │   └── theme.css              # CSS variables and theming
│   │
│   └── js/
│       ├── overlay_editor.js      # Main entry point
│       │
│       ├── modules/
│       │   ├── svgManager.js      # SVG template loading
│       │   ├── titleEditor.js     # Title text controls
│       │   ├── titleArtwork.js    # Title area artwork
│       │   ├── buttonEditor.js    # Button label editing
│       │   ├── buttonArtwork.js   # Per-button artwork
│       │   ├── buttonShape.js     # Custom button shapes
│       │   ├── buttonEditorUI.js  # Button editor UI helpers
│       │   ├── mainArtwork.js     # Main overlay artwork
│       │   ├── actionButtons.js   # Side action buttons
│       │   ├── bottomControls.js  # Bottom arrows/text
│       │   ├── backgroundControls.js  # Background fill
│       │   ├── rowDescriptions.js # Row description labels
│       │   ├── fontManager.js     # Font loading/selection
│       │   ├── gradientManager.js # Gradient backgrounds
│       │   ├── exportManager.js   # PNG/SVG/ZIP export
│       │   ├── configManager.js   # Project save/load
│       │   ├── uiManager.js       # UI utilities
│       │   ├── imageProcessor.js  # Image manipulation
│       │   ├── boxArtEditor.js    # Box art editor module
│       │   └── previewInteraction.js  # Click-to-navigate
│       │
│       └── services/
│           ├── api.js             # Backend API calls
│           └── stateManager.js    # Application state
│
├── svg-templates/                 # Button shape templates
│   ├── arrow.svg
│   ├── ladder.svg
│   ├── rounded-rect.svg
│   └── tsr-square.svg
│
├── layout-templates/              # Example overlay projects
│   ├── minotaur_overlay_project.zip
│   └── title_space_overlay_project.zip
│
├── boxart-templates/              # Example box art projects
│   └── viking_songs_boxart_project.zip
│
├── sf_intellivised/               # Custom Intellivision fonts
│   ├── SF Intellivised.ttf
│   ├── SF Intellivised Bold.ttf
│   ├── SF Intellivised Extended.ttf
│   └── ...
│
├── Dockerfile                     # Container definition
├── docker-compose.yml             # Docker Compose config
├── fly.toml                       # Fly.io deployment config
├── requirements.txt               # Python dependencies
├── fonts.conf                     # Font config for CairoSVG
└── README.md
```

## Deployment

### Fly.io (Production)

The app is deployed at **https://intellivision-overlay-editor.fly.dev**

To deploy your own instance:

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login and deploy
fly auth login
fly launch
fly deploy
```

The `fly.toml` configures:
- Auto-scaling with stop/start
- Health checks at `/health`
- 1GB memory allocation

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 5000 | Server port |
| `OVL_HOST` | 127.0.0.1 | Host address (use 0.0.0.0 for containers) |
| `OVL_PORT` | 5000 | Alternative port setting |
| `OVL_DEBUG` | 0 | Enable debug mode (1 or true) |
| `GIT_COMMIT_HASH` | | Git version for display |
| `GIT_COMMIT_DATE` | | Git commit date for display |

### Health Check

```bash
curl https://intellivision-overlay-editor.fly.dev/health
# Response: {"status":"ok"}
```

## Usage Guide

### Creating an Overlay

1. **Set Game Title** - Enter title text, choose font and styling
2. **Upload Artwork** (optional) - Main artwork fills the overlay area
3. **Customize Buttons** - Edit labels, add per-button artwork or shapes
4. **Configure Action Buttons** - Set side button labels and arrows
5. **Adjust Bottom Section** - Direction text and arrow styling
6. **Preview** - Click any element to navigate to its controls
7. **Export** - Download PNG, SVG, or Sprint bundle

### Project Files

Save your work as a project ZIP that includes:
- `config.json` - All settings and configuration
- `artwork/` - Uploaded images (title, main, button artwork)

Load projects later to continue editing.

## Technical Details

### SVG Template Specifications

**Overlay:**
- Dimensions: 55.6mm × 90.4mm (300×478 pixels at 300 DPI)
- Top corners: 2.26mm radius
- Bottom corners: 9.0mm radius
- Button grid: 3×4 layout, 11.4mm buttons

**Box Art:**
- Dimensions: 186mm × 256mm
- Content frame with rounded corners
- Optional vignette frame (circle/oval)

### Font Rendering

Custom SF Intellivised fonts are:
- Embedded in Docker image
- Served via `/fonts/` endpoint
- Used by CairoSVG for PNG export

## Troubleshooting

**Port in use:**
```bash
lsof -ti:5000 | xargs kill -9
```

**CairoSVG on macOS:**
```bash
brew install cairo pkg-config
pip install --upgrade cairosvg
```

**Docker build issues:**
```bash
docker system prune -a
docker-compose build --no-cache
```

## License

MIT License - feel free to use this for your Intellivision projects!

## Credits

- Built for the Intellivision Sprint USB controller platform
- Custom fonts from the SF Intellivised collection
- Controller templates by James "IMBerzerk" Romano
- Overlay specifications from official Intellivision documentation
