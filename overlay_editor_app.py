#!/usr/bin/env python3
"""
Flask-based Intellivision Overlay Editor
Interactive web application for creating custom controller overlays
"""

from flask import Flask, render_template, request, jsonify, send_file
from pathlib import Path
import base64
from io import BytesIO
from PIL import Image
import cairosvg
import os
import subprocess

# Configure fontconfig to find our custom fonts BEFORE importing cairosvg
FONTS_CONF = Path(__file__).parent / "fonts.conf"
if FONTS_CONF.exists():
    os.environ['FONTCONFIG_FILE'] = str(FONTS_CONF)
    os.environ['FONTCONFIG_PATH'] = str(Path(__file__).parent)



app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload

# Path to the SVG template
TEMPLATE_PATH = Path(__file__).parent / "intellivision_overlay_RECTANGULAR.svg"

# Path to shape templates
SHAPES_DIR = Path(__file__).parent / "svg-templates"


def get_git_info():
    """Get git commit hash and date for version display.

    First checks environment variables (set at Docker build time),
    then falls back to git commands (for local development).
    """
    # Check environment variables first (Docker deployment)
    env_hash = os.environ.get('GIT_COMMIT_HASH', '').strip()
    env_date = os.environ.get('GIT_COMMIT_DATE', '').strip()

    if env_hash:
        return {'hash': env_hash, 'date': env_date or None}

    # Fall back to git commands (local development)
    try:
        commit_hash = subprocess.check_output(
            ['git', 'rev-parse', '--short=7', 'HEAD'],
            cwd=Path(__file__).parent,
            stderr=subprocess.DEVNULL
        ).decode('utf-8').strip()

        commit_date = subprocess.check_output(
            ['git', 'log', '-1', '--format=%cd', '--date=short'],
            cwd=Path(__file__).parent,
            stderr=subprocess.DEVNULL
        ).decode('utf-8').strip()

        return {'hash': commit_hash, 'date': commit_date}
    except (subprocess.CalledProcessError, FileNotFoundError):
        return {'hash': None, 'date': None}


@app.route('/')
def index():
    """Serve the main editor interface"""
    git_info = get_git_info()
    return render_template('overlay_editor.html', git_info=git_info)

@app.route('/get_template')
def get_template():
    """Return the SVG template"""
    if TEMPLATE_PATH.exists():
        with open(TEMPLATE_PATH, 'r') as f:
            return jsonify({'svg': f.read()})
    return jsonify({'error': 'Template not found'}), 404


@app.route('/get_shape_templates')
def get_shape_templates():
    """Return list of available button shape templates"""
    shapes = []
    if SHAPES_DIR.exists():
        for p in sorted(SHAPES_DIR.iterdir()):
            if p.suffix.lower() == '.svg' and p.is_file():
                # Use filename without extension as the shape name
                shapes.append({
                    'name': p.stem,
                    'file': p.name
                })
    return jsonify({'shapes': shapes}), 200


@app.route('/get_shape/<name>')
def get_shape(name):
    """Return SVG content for a specific shape template"""
    # Sanitize name to prevent path traversal
    safe_name = Path(name).name
    if not safe_name.endswith('.svg'):
        safe_name += '.svg'

    shape_path = (SHAPES_DIR / safe_name).resolve()

    # Security check: ensure path is within SHAPES_DIR
    try:
        if not str(shape_path).startswith(str(SHAPES_DIR.resolve())):
            return jsonify({'error': 'Invalid shape path'}), 400
        if not shape_path.exists() or not shape_path.is_file():
            return jsonify({'error': 'Shape not found'}), 404

        with open(shape_path, 'r') as f:
            return jsonify({'svg': f.read(), 'name': Path(safe_name).stem})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Path to layout templates (pre-made overlay projects)
LAYOUT_TEMPLATES_DIR = Path(__file__).parent / "layout-templates"


@app.route('/get_examples')
def get_examples():
    """Return list of available example overlay projects"""
    examples = []
    if LAYOUT_TEMPLATES_DIR.exists():
        for p in sorted(LAYOUT_TEMPLATES_DIR.iterdir()):
            if p.suffix.lower() == '.zip' and p.is_file():
                # Use filename without extension as the example name
                # Convert underscores to spaces and title case for display
                display_name = p.stem.replace('_', ' ').replace('overlay project', '').strip().title()
                examples.append({
                    'name': p.stem,
                    'file': p.name,
                    'displayName': display_name
                })
    return jsonify({'examples': examples}), 200


@app.route('/get_example/<name>')
def get_example(name):
    """Return the zip file for a specific example overlay"""
    # Sanitize name to prevent path traversal
    safe_name = Path(name).name
    if not safe_name.endswith('.zip'):
        safe_name += '.zip'

    example_path = (LAYOUT_TEMPLATES_DIR / safe_name).resolve()

    # Security check: ensure path is within LAYOUT_TEMPLATES_DIR
    try:
        if not str(example_path).startswith(str(LAYOUT_TEMPLATES_DIR.resolve())):
            return jsonify({'error': 'Invalid example path'}), 400
        if not example_path.exists() or not example_path.is_file():
            return jsonify({'error': 'Example not found'}), 404

        return send_file(
            example_path,
            mimetype='application/zip',
            as_attachment=True,
            download_name=safe_name
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/export_png', methods=['POST'])
def export_png():
    """Convert SVG to PNG and return as download.

    Behavior: when exporting PNG we apply the overlay mask (outer_boundary)
    so any artwork outside the overlay shape becomes transparent. The final
    PNG is rendered at 300 DPI for high quality print output and preserves
    the overlay's visible contents with transparency outside the shape.
    Honors the 'include_template' flag to optionally remove template SVG elements.
    """
    try:
        data = request.get_json()
        svg_content = data.get('svg')
        filename = data.get('filename', 'overlay')
        include_template = data.get('include_template', True)

        # Output dimensions for the overlay PNG at true 300 DPI
        # SVG is 55.6mm × 90.4mm, at 300 DPI (300/25.4 pixels per mm):
        # Width: 55.6 × 11.811 = 657 pixels
        # Height: 90.4 × 11.811 = 1068 pixels
        OUTPUT_WIDTH = 657
        OUTPUT_HEIGHT = 1068

        # No need to remove template overlay elements if we never merge them in the first place
        # Only use the template SVG to extract the mask (outer_boundary path and viewBox)
        # The incoming svg_content is the user's artwork/text only

        # Debug: check for font references before processing
        import re
        import sys
        font_refs = re.findall(r"/fonts/[^'\"\)]+\.(ttf|otf)", svg_content or '')
        if font_refs:
            print(f"Found font references before processing: {font_refs}", file=sys.stderr)

        # For PNG export, inline fonts as base64 for Chrome headless
        # Chrome supports @font-face with data: URIs properly
        if svg_content:
            svg_content = _inline_fonts(svg_content)

            # Debug: Save the processed SVG
            debug_svg_path = Path(__file__).parent / 'debug_cairo_input.svg'
            debug_svg_path.write_text(svg_content)
            print(f"DEBUG: Saved Chrome input SVG to {debug_svg_path}", file=sys.stderr)

        # Helper to extract outer_boundary path 'd' attribute
        def extract_outer_d(svg_text):
            # look for a path with id="outer_boundary" and capture d="..."
            m = re.search(
                r"id=['\"]outer_boundary['\"][^>]*d=['\"]([^'\"]+)['\"]",
                svg_text,
                re.S,
            )
            if m:
                return m.group(1)
            # fallback: find the whole path element and then its d attribute
            m2 = re.search(
                r"<path[^>]*id=['\"]outer_boundary['\"][^>]*>",
                svg_text,
                re.S,
            )
            if m2:
                m3 = re.search(
                    r"d=['\"]([^'\"]+)['\"]",
                    m2.group(0),
                )
                if m3:
                    return m3.group(1)
            return None

        # Attempt to get path 'd' from incoming SVG; fallback to canonical template
        d = extract_outer_d(svg_content) if svg_content else None
        if not d and TEMPLATE_PATH.exists():
            d = extract_outer_d(TEMPLATE_PATH.read_text())

        # Attempt to get viewBox from incoming SVG, otherwise the template, otherwise default
        vb_match = re.search(
            r"viewBox=['\"]([^'\"]+)['\"]",
            svg_content or '',
        )
        if not vb_match and TEMPLATE_PATH.exists():
            vb_match = re.search(
                r"viewBox=['\"]([^'\"]+)['\"]",
                svg_content or '',
            )
        viewbox = vb_match.group(1) if vb_match else '0 0 55.6 90.4'

        # Build mask image from the outer_boundary path if we have it; otherwise try a luminance fallback
        if d:
            mask_svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{viewbox}"><path d="{d}" fill="#ffffff" stroke="none"/></svg>'
            mask_png = cairosvg.svg2png(bytestring=mask_svg.encode('utf-8'), output_width=OUTPUT_WIDTH, output_height=OUTPUT_HEIGHT)
            mask_img = Image.open(BytesIO(mask_png)).convert('L')
            # Convert to strict binary mask (use small threshold to tolerate anti-aliasing)
            mask = mask_img.point(lambda p: 255 if p > 10 else 0)
        else:
            # Fallback: render the full SVG and derive mask by non-white pixels
            rendered_png = cairosvg.svg2png(bytestring=(svg_content or '').encode('utf-8'), output_width=OUTPUT_WIDTH, output_height=OUTPUT_HEIGHT)
            rendered = Image.open(BytesIO(rendered_png)).convert('RGBA')
            lumin = rendered.convert('L')
            # Non-nearly-white pixels become opaque in mask
            mask = lumin.point(lambda p: 255 if p < 250 else 0)

        # Render full SVG using CairoSVG (handles transforms correctly, artwork won't be clipped)
        # NOTE: Custom fonts won't render with CairoSVG, will fall back to system fonts
        print(f"Rendering SVG with CairoSVG at {OUTPUT_WIDTH}x{OUTPUT_HEIGHT}...", file=sys.stderr)
        full_png = cairosvg.svg2png(bytestring=(svg_content or '').encode('utf-8'), output_width=OUTPUT_WIDTH, output_height=OUTPUT_HEIGHT)
        full_img = Image.open(BytesIO(full_png)).convert('RGBA')

        # Ensure mask matches image size
        if mask.size != full_img.size:
            mask = mask.resize(full_img.size, Image.LANCZOS)

        # Apply mask as alpha channel
        r, g, b, _ = full_img.split()
        out_img = Image.merge('RGBA', (r, g, b, mask))

        out_io = BytesIO()
        out_img.save(out_io, 'PNG')
        out_io.seek(0)

        return send_file(
            out_io,
            mimetype='image/png',
            as_attachment=True,
            download_name=f'{filename}_big_overlay.png'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Create fonts directory path
FONT_DIR = Path(__file__).parent / 'sf_intellivised'

@app.route('/fonts/list')
def fonts_list():
    """Return list of available fonts (custom fonts + system fonts that work with CairoSVG)"""
    fonts = []

    # Add custom fonts from sf_intellivised folder
    custom_fonts = []
    if FONT_DIR.exists():
        for p in sorted(FONT_DIR.iterdir()):
            if p.suffix.lower() in ['.ttf', '.otf'] and p.is_file():
                custom_fonts.append({
                    'file': p.name,
                    'family': p.stem,  # Filename without extension
                    'type': 'custom'
                })

    # Add common system fonts that CairoSVG can render
    system_fonts = [
        {'family': 'Arial', 'type': 'system'},
        {'family': 'Arial Black', 'type': 'system'},
        {'family': 'Courier', 'type': 'system'},
        {'family': 'Courier New', 'type': 'system'},
        {'family': 'Georgia', 'type': 'system'},
        {'family': 'Helvetica', 'type': 'system'},
        {'family': 'Helvetica Neue', 'type': 'system'},
        {'family': 'Impact', 'type': 'system'},
        {'family': 'Times', 'type': 'system'},
        {'family': 'Times New Roman', 'type': 'system'},
        {'family': 'Verdana', 'type': 'system'},
        {'family': 'Eurostile BQ', 'type': 'system'},  # Our installed custom font
    ]

    fonts = custom_fonts + system_fonts
    return jsonify({'fonts': fonts}), 200


@app.route('/fonts/<path:font_name>')
def serve_font(font_name):
    """Serve a TTF or OTF font file from the sf_intellivised folder"""
    safe_path = (FONT_DIR / font_name).resolve()
    try:
        if not str(safe_path).startswith(str(FONT_DIR.resolve())):
            return jsonify({'error': 'invalid font path'}), 400
        if not safe_path.exists() or not safe_path.is_file():
            return jsonify({'error': 'font not found'}), 404
        # Determine mimetype based on extension
        mimetype = 'font/otf' if safe_path.suffix.lower() == '.otf' else 'font/ttf'
        return send_file(str(safe_path), mimetype=mimetype)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def _prepare_fonts_for_cairo(svg_text: str) -> str:
    """Replace /fonts/ references with file:// URLs for CairoSVG rendering.

    CairoSVG doesn't properly support @font-face with data: URIs, but it does
    support file:// URLs pointing to actual font files on disk.
    """
    import re

    def repl(match):
        filename = match.group(1)
        font_path = (FONT_DIR / filename).resolve()
        try:
            if not str(font_path).startswith(str(FONT_DIR.resolve())) or not font_path.exists():
                import sys
                print(f"Font file not found or invalid: {filename}", file=sys.stderr)
                return match.group(0)  # leave as-is
            # Convert to file:// URL for Cairo
            file_url = font_path.as_uri()
            import sys
            print(f"Converted font to file URL: {filename} -> {file_url}", file=sys.stderr)
            return f"url({file_url})"
        except Exception as e:
            import sys
            print(f"Error preparing font {filename} for Cairo: {e}", file=sys.stderr)
            return match.group(0)

    # Match url('/fonts/SomeFont.ttf') or url("/fonts/SomeFont.ttf") or url(/fonts/SomeFont.ttf)
    svg_text = re.sub(r"url\(['\"]?/fonts/([^'\")]+\.ttf)['\"]?\)", repl, svg_text)

    return svg_text


def _inline_fonts(svg_text: str) -> str:
    """Replace references to /fonts/<file.ttf|otf> with data:font/...;base64,... in the SVG text."""
    import re

    def repl(match):
        filename = match.group(1)
        font_path = (FONT_DIR / filename).resolve()
        try:
            if not str(font_path).startswith(str(FONT_DIR.resolve())) or not font_path.exists():
                return match.group(0)  # leave as-is
            with open(font_path, 'rb') as fh:
                b = fh.read()
            b64 = base64.b64encode(b).decode('ascii')
            # Use appropriate MIME type based on extension
            mime_type = 'font/otf' if filename.lower().endswith('.otf') else 'font/ttf'
            return f"url(data:{mime_type};base64,{b64})"
        except Exception as e:
            import sys
            print(f"Error inlining font {filename}: {e}", file=sys.stderr)
            return match.group(0)

    # Match url('/fonts/SomeFont.ttf') or url('/fonts/SomeFont.otf') with optional quotes
    svg_text = re.sub(r"url\(['\"]?/fonts/([^'\")]+\.(ttf|otf))['\"]?\)", repl, svg_text, flags=re.IGNORECASE)

    return svg_text


if __name__ == '__main__':
    # Create templates directory if it doesn't exist
    templates_dir = Path(__file__).parent / 'templates'
    templates_dir.mkdir(exist_ok=True)

    print("=" * 70)
    print("Intellivision Overlay Editor - Flask Application")
    print("=" * 70)
    print(f"\nTemplate: {TEMPLATE_PATH}")
    # Determine host/port from environment so we can avoid ports claimed by other processes.
    host = os.environ.get('OVL_HOST', '127.0.0.1')
    port = int(os.environ.get('OVL_PORT', os.environ.get('PORT', '5000')))

    print(f"\nStarting server at http://{host}:{port}")
    print("Press CTRL+C to quit\n")

    # Health endpoint
    @app.route('/health')
    def health():
        return jsonify({'status': 'ok'}), 200

    # Determine debug mode from environment (default: disabled). Set OVL_DEBUG=1 to opt-in.
    debug_mode = os.environ.get('OVL_DEBUG', '0').lower() in ('1', 'true', 'yes')
    if debug_mode:
        # Disable Werkzeug's debug PIN requirement when intentionally running in debug mode locally
        os.environ['WERKZEUG_DEBUG_PIN'] = 'off'

    app.run(debug=debug_mode, host=host, port=port)
