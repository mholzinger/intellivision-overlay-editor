# Intellivision Overlay Editor

Professional web-based tool for creating custom Intellivision controller overlays for Sprint USB controllers.

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Docker](https://img.shields.io/badge/Docker-Ready-brightgreen.svg)

## Features

- **Live SVG Preview** - Real-time visualization of your overlay design
- **Game Title Editor** - Customize the title bar text
- **Artwork Upload** - Upload PNG/JPG artwork that fills the entire overlay
- **Artwork Positioning** - Move artwork vertically with slider or arrow buttons
- **Artwork Scaling** - Zoom artwork in/out from 50% to 250% scale
- **Font Selection** - Choose from custom Intellivision fonts or system fonts
- **Button Label Editor** - Customize all 12 button labels with visual grid
- **Export Options**:
  - Download as PNG (300×478px - standard `big_overlay` format)
  - Download as SVG (editable vector format for further customization)
- **Reset & Clear** - Reset everything or just clear artwork

## Quick Start with Docker

The easiest way to run the application is with Docker:

```bash
# Build and run with docker-compose
docker-compose up

# Or build manually
docker build -t intellivision-overlay-editor .
docker run -p 5000:5000 intellivision-overlay-editor
```

Then open your browser to: **http://localhost:5000**

## Local Development

### Prerequisites

- Python 3.11 or higher
- Cairo graphics library (for SVG rendering)

### Installation

1. **Install system dependencies:**

   **macOS:**
   ```bash
   brew install cairo pkg-config
   ```

   **Ubuntu/Debian:**
   ```bash
   sudo apt-get update
   sudo apt-get install libcairo2 libpango-1.0-0 libpangocairo-1.0-0 libgdk-pixbuf-2.0-0 fontconfig
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application:**
   ```bash
   python overlay_editor_app.py
   ```

4. **Open in your browser:**
   ```
   http://127.0.0.1:5000
   ```

## Usage

1. **Enter game title** in the title field
2. **Upload artwork** (optional) - PNG or JPG that fills the overlay area
3. **Adjust artwork position** using Y-axis slider or arrow buttons (⬆/⬇)
4. **Scale artwork** using zoom slider or +/- buttons (50%-250%)
5. **Select font** for button labels from custom or system fonts
6. **Customize button labels** - All 12 buttons (1-9, CLR, 0, ENT)
7. **Style button labels** - Font size, color, stroke, opacity
8. **Upload custom button artwork** - Per-button PNG/JPG images
9. **Preview in real-time** - See changes instantly
10. **Export** - Download as PNG or SVG

## Deployment

### Fly.io

1. **Install Fly.io CLI:**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login and launch:**
   ```bash
   fly auth login
   fly launch
   ```

3. **Deploy:**
   ```bash
   fly deploy
   ```

### Environment Variables

The application supports these environment variables for deployment:

- `PORT` - Server port (default: 5000)
- `OVL_HOST` - Host address (default: 127.0.0.1, use 0.0.0.0 for containers)
- `OVL_PORT` - Alternative port setting
- `OVL_DEBUG` - Enable debug mode (set to 1 or true)

### Health Check

The application includes a health check endpoint at `/health` for monitoring:

```bash
curl http://localhost:5000/health
# Response: {"status":"ok"}
```

## Project Structure

```
intellivision-overlay-editor/
├── overlay_editor_app.py              # Flask backend
├── templates/
│   └── overlay_editor.html            # Web interface
├── sf_intellivised/                   # Custom Intellivision fonts
│   ├── SF Intellivised Bold.ttf
│   ├── SF Intellivised Extended.ttf
│   ├── SF Intellivised Outline.ttf
│   └── ...
├── intellivision_overlay_RECTANGULAR.svg  # SVG template
├── fonts.conf                         # Font configuration for CairoSVG
├── requirements.txt                   # Python dependencies
├── Dockerfile                         # Container definition
├── docker-compose.yml                 # Docker Compose configuration
└── README.md                          # This file
```

## Output Files

Generated overlays are named based on your game title:
- `{game_title}_big_overlay.png` - 300×478px PNG for controller
- `{game_title}_overlay.svg` - Editable SVG source

## Technical Details

### SVG Template

The editor uses a perfected SVG template with:
- Precise 55.6mm × 90.4mm dimensions (300×478 pixels)
- Independent top/bottom rounded corners (2.26mm top, 10.0mm bottom)
- Accurately positioned 3×4 button grid (11.4mm buttons)
- Title bar area with separator lines
- Perfect alignment with official Intellivision Sprint overlays

### Font Rendering

Custom fonts are embedded in the Docker image and served to the browser. CairoSVG uses these fonts for PNG export through fontconfig.

## Troubleshooting

**Port already in use:**
```bash
# Kill existing Flask process
lsof -ti:5000 | xargs kill -9
```

**CairoSVG installation issues on macOS:**
```bash
brew install cairo pkg-config
pip install --upgrade cairosvg
```

**Docker build fails:**
```bash
# Clean Docker cache and rebuild
docker system prune -a
docker-compose build --no-cache
```

## License

MIT License - feel free to use this for your Intellivision projects!

## Credits

- Built for the Intellivision Sprint USB controller platform
- Custom fonts from the SF Intellivised collection
- Overlay dimensions and specifications from official Intellivision documentation
