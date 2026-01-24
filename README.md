# Intellivision Overlay Editor

Professional web-based tool for creating custom Intellivision controller overlays and box art for Sprint USB controllers.

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Docker](https://img.shields.io/badge/Docker-Ready-brightgreen.svg)
![Python 3.11+](https://img.shields.io/badge/Python-3.11+-blue.svg)

**Live Demo:** [https://intellivision-overlay-editor.fly.dev](https://intellivision-overlay-editor.fly.dev)

## Features

### Overlay Editor
- **Live SVG Preview** - Real-time visualization with click-to-navigate (click any element to jump to its controls)
- **Game Title Editor** - Customize title text, font, size, color, and position with gradient support
- **Title Area Dimensions** - Fully adjustable title area size and position (X, Y, width, height)
- **Title Space Artwork** - Upload artwork for the title bar area with positioning, tiling, and white background removal
- **Copyright Text** - Customizable copyright/subtitle text with full styling options
- **Background Fill** - Solid color or gradient backgrounds with adjustable opacity
- **Main Overlay Artwork** - Full overlay artwork with scale, position, rotation, tiling, and white background removal
- **Keypad Labels** - Edit all 12 button labels (1-9, CLR, 0, ENT) with multiline support (use `|` separator)
- **Row Descriptions** - Configurable labels for each button row
- **Button Editor** - Custom button shapes, background colors, and per-button artwork
- **Action Buttons** - Configure side action buttons with arrows, labels, and individual positioning
- **Bottom Arrows** - Disc direction arrows with customizable text and styling
- **Text Styling** - Bold, italic, underline, and gradient effects on all text elements

### Box Art Editor (Beta)
- **Header/Branding** - Intellivision logo and tagline
- **Game Title** - Title and subtitle with font controls
- **Content Frame** - Decorative border stripes (1-3 stripes with color customization)
- **Main Artwork** - Background artwork with positioning controls
- **Vignette Frame** - Optional circular/oval vignette with inner ring
- **Badges** - Intellivoice badge and player count indicators

### Export Options
- **PNG Export** - High-resolution 300 DPI output with proper overlay mask (rounded corners)
- **Framed Export** - Export with controller frame templates:
  - Sprint Controller (blue)
  - INTV Controller (brown/wood grain)
  - Sears Controller (gold)
  - INTV II Controller (silver/white)
- **Sprint Bundle** - ZIP containing both `big_overlay.png` and framed overlay
- **Project Save/Load** - Export/import complete projects as ZIP files (preserves all artwork and settings)

### Bundled Fonts
The editor includes a curated collection of fonts optimized for overlay design:
- **SF Intellivised** family (Regular, Bold, Extended variants)
- **Eurostile Bold Extended** - Classic tech/gaming font
- **Archivo Black** - Bold display font
- **Liberation Sans** - Clean sans-serif
- **Barlow** family (18 variants from Thin to Black)
- **Bebas Neue** - Tall condensed display font
- **Be Vietnam Pro** family (18 variants)
- **Atkinson Hyperlegible** - Accessibility-focused font

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
- Cairo graphics library (for PNG export)

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

Open **http://127.0.0.1:5001** in your browser (default port is 5001).

## Configuration

The application supports enterprise deployment with environment variable configuration. All settings have sensible defaults for local development.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OVL_HOST` | `0.0.0.0` | Server bind address |
| `OVL_PORT` | `5001` | Server port |
| `OVL_DEBUG` | `false` | Enable Flask debug mode |
| `OVL_MAX_UPLOAD_MB` | `16` | Maximum upload size in MB |
| `OVL_TEMPLATE_PATH` | `intellivision_overlay_RECTANGULAR.svg` | Main SVG template path |
| `OVL_FONT_DIR` | `sf_intellivised` | Custom fonts directory |
| `OVL_SHAPES_DIR` | `svg-templates` | Button shape templates directory |
| `OVL_LAYOUT_TEMPLATES_DIR` | `layout-templates` | Example overlay projects directory |
| `OVL_BOXART_TEMPLATES_DIR` | `boxart-templates` | Example box art projects directory |
| `OVL_CORS_ENABLED` | `true` | Enable CORS support |
| `OVL_CORS_ORIGINS` | `*` | Allowed CORS origins (comma-separated) |
| `OVL_RATE_LIMIT_ENABLED` | `false` | Enable rate limiting |
| `OVL_RATE_LIMIT_DEFAULT` | `60 per minute` | Default rate limit |
| `OVL_RATE_LIMIT_EXPORT` | `10 per minute` | Export endpoint rate limit |
| `OVL_FONT_CACHE_ENABLED` | `true` | Cache font scanning results |
| `OVL_LOG_LEVEL` | `INFO` | Logging level |
| `GIT_COMMIT_HASH` | | Git version for display in UI |
| `GIT_COMMIT_DATE` | | Git commit date for display |

### Optional Dependencies

For enterprise deployments, you can enable additional features:

```bash
# CORS support
pip install flask-cors

# Rate limiting
pip install flask-limiter
```

These are automatically detected and enabled if `OVL_CORS_ENABLED` or `OVL_RATE_LIMIT_ENABLED` are set.

## Project Structure

```
intellivision-overlay-editor/
├── overlay_editor_app.py          # Flask backend server
├── config.py                      # Centralized configuration
├── intellivision_overlay_RECTANGULAR.svg  # Overlay SVG template
│
├── templates/
│   ├── overlay_editor.html        # Main web interface
│   ├── box_art_template.svg       # Box art SVG template
│   ├── controller_template_sprint.png   # Sprint controller frame
│   ├── controller_template_intv.png     # INTV controller frame
│   ├── controller_template_sears.png    # Sears controller frame
│   └── controller_template_intv_ii.png  # INTV II controller frame
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
│       ├── services/
│       │   ├── api.js             # Backend API calls
│       │   └── stateManager.js    # Application state
│       │
│       └── utils/
│           ├── textUtils.js       # Text manipulation helpers
│           ├── svgHelpers.js      # SVG DOM utilities
│           └── uiHelpers.js       # UI helper functions
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
├── sf_intellivised/               # Bundled fonts (58 font files)
│   ├── SF Intellivised.ttf
│   ├── Eurostile Bold Extended.otf
│   ├── ArchivoBlack-Regular.ttf
│   ├── Barlow-*.ttf (18 variants)
│   ├── BebasNeue-Regular.ttf
│   ├── BeVietnamPro-*.ttf (18 variants)
│   ├── AtkinsonHyperlegible-*.ttf (4 variants)
│   └── ...
│
├── Dockerfile                     # Container definition
├── docker-compose.yml             # Docker Compose config
├── fly.toml                       # Fly.io deployment config
├── requirements.txt               # Python dependencies
└── fonts.conf                     # Font config for CairoSVG
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Main editor interface |
| `/health` | GET | Health check (`{"status": "ok"}`) |
| `/config` | GET | Current configuration (for debugging) |
| `/get_svg_template` | GET | Fetch the main SVG template |
| `/fonts` | GET | List available fonts |
| `/fonts/<filename>` | GET | Serve font file |
| `/fonts/refresh` | POST | Refresh font cache |
| `/export_png` | POST | Export overlay as PNG |
| `/get_shapes` | GET | List button shape templates |
| `/get_shape/<name>` | GET | Fetch specific shape SVG |
| `/get_examples` | GET | List layout templates |
| `/get_example/<name>` | GET | Download layout template ZIP |
| `/templates/<path>` | GET | Serve controller template images |

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

### Docker Compose

```yaml
version: '3.8'
services:
  overlay-editor:
    build:
      context: .
      args:
        GIT_COMMIT_HASH: ${GIT_COMMIT_HASH:-}
        GIT_COMMIT_DATE: ${GIT_COMMIT_DATE:-}
    ports:
      - "5000:5000"
    environment:
      - OVL_HOST=0.0.0.0
      - OVL_PORT=5000
      - OVL_CORS_ENABLED=true
```

### Enterprise Deployment

For hosting in an enterprise environment:

1. **Set environment variables** for your deployment (see Configuration section)
2. **Enable CORS** if the editor will be accessed from different domains
3. **Enable rate limiting** to prevent abuse
4. **Configure font caching** for better performance
5. **Use a reverse proxy** (nginx, Traefik) for SSL termination

Example nginx configuration:
```nginx
server {
    listen 443 ssl;
    server_name overlays.example.com;

    location / {
        proxy_pass http://localhost:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 16M;
    }
}
```

## Usage Guide

### Creating an Overlay

1. **Set Game Title** - Enter title text, choose font, size, color, and styling (bold/italic/gradient)
2. **Adjust Title Area** - Resize and position the title bar if needed
3. **Upload Artwork** (optional) - Add main artwork and/or title artwork
4. **Customize Buttons** - Edit labels (use `|` for multiple lines), add shapes or per-button artwork
5. **Configure Action Buttons** - Set side button labels, arrows, and positions
6. **Adjust Bottom Section** - Direction text and arrow styling
7. **Preview** - Click any element in the preview to navigate to its controls
8. **Export** - Download PNG, framed overlay, or Sprint bundle

### Multiline Button Labels

Use the pipe character `|` to create multiline labels:
- `FIRE|LASER` displays as two lines
- `1|2|3` displays as three lines (auto-sized to fit)

### Project Files

Save your work as a project ZIP that includes:
- `config.json` - All settings and configuration
- `title_artwork.png` - Title area artwork (if uploaded)
- `main_artwork.png` - Main overlay artwork (if uploaded)
- `button_artwork/` - Per-button artwork images

Load projects later to continue editing or share with others.

### Loading Templates

Click **Templates** in the toolbar to load pre-made overlay designs as starting points.

## Technical Details

### SVG Template Specifications

**Overlay:**
- Dimensions: 55.6mm × 90.4mm (300×478 pixels at 300 DPI)
- Top corners: 2.26mm radius
- Bottom corners: 9.0mm radius
- Button grid: 3×4 layout, 11.4mm square buttons
- Title area default: 48.6mm × 11.5mm (expandable to 20mm height)

**Box Art:**
- Dimensions: 186mm × 256mm
- Content frame with rounded corners
- Optional vignette frame (circle/oval)

### Font Rendering

Custom fonts are:
- Bundled in the Docker image and installed to system font directories
- Served via `/fonts/` endpoint for browser preview
- Used by CairoSVG for accurate PNG export
- Cached for performance (invalidated when font directory changes)

### Export Pipeline

1. Pre-render all text elements using browser fonts (captures exact rendering)
2. Pre-render tiled artwork to single image (better CairoSVG compatibility)
3. Pre-render backgrounds with gradients baked in
4. Clone SVG and replace elements with pre-rendered images
5. Send to backend for CairoSVG conversion to PNG
6. Apply overlay mask for rounded corners (client-side)

## Troubleshooting

**Port in use:**
```bash
lsof -ti:5001 | xargs kill -9
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

**Fonts not appearing:**
- Refresh the page to reload font list
- Check browser console for font loading errors
- For Docker: ensure fonts are copied in Dockerfile

**Artwork persists after clearing:**
- This was fixed in recent updates
- Ensure you're using the latest version

## Development

### Adding New Fonts

1. Place `.ttf` or `.otf` files in `sf_intellivised/` directory
2. Restart the server (or call `/fonts/refresh`)
3. Fonts appear automatically in all font dropdowns

### Adding Button Shapes

1. Create an SVG file with a single `<path>` element
2. Use viewBox `0 0 100 100` for consistent scaling
3. Place in `svg-templates/` directory
4. Shapes appear in the Button Shapes dropdown

### Creating Layout Templates

1. Design an overlay in the editor
2. Export as project (ZIP)
3. Place in `layout-templates/` directory
4. Templates appear in the Templates dropdown

## License

MIT License - feel free to use this for your Intellivision projects!

## Credits

- Built for the Intellivision Sprint USB controller platform
- Custom fonts from the SF Intellivised collection
- Controller templates by James "IMBerzerk" Romano
- Overlay specifications from official Intellivision documentation
- Open source fonts from Google Fonts (Barlow, Bebas Neue, Be Vietnam Pro, Atkinson Hyperlegible)
