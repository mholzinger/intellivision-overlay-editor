#!/usr/bin/env python3
"""
Flask-based Intellivision Overlay Editor
Interactive web application for creating custom controller overlays
"""

from flask import Flask, render_template, request, jsonify, send_file, send_from_directory, redirect
from pathlib import Path
import base64
from io import BytesIO
from PIL import Image
import cairosvg
import os
import subprocess
import logging
import mimetypes

mimetypes.add_type('application/wasm', '.wasm')

# Import configuration
from config import Config

# Configure fontconfig to find our custom fonts BEFORE importing cairosvg
FONTS_CONF = Path(__file__).parent / "fonts.conf"
if FONTS_CONF.exists():
    os.environ['FONTCONFIG_FILE'] = str(FONTS_CONF)
    os.environ['FONTCONFIG_PATH'] = str(Path(__file__).parent)

# Configure logging
logging.basicConfig(level=getattr(logging, Config.LOG_LEVEL), format=Config.LOG_FORMAT)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = Config.MAX_CONTENT_LENGTH

# Optional CORS support (install with: pip install flask-cors)
try:
    from flask_cors import CORS
    if Config.CORS_ENABLED:
        CORS(app, origins=Config.CORS_ORIGINS)
        logger.info(f"CORS enabled for origins: {Config.CORS_ORIGINS}")
except ImportError:
    logger.debug("flask-cors not installed, CORS support disabled")

# Optional rate limiting (install with: pip install flask-limiter)
try:
    from flask_limiter import Limiter
    from flask_limiter.util import get_remote_address
    if Config.RATE_LIMIT_ENABLED:
        limiter = Limiter(
            get_remote_address,
            app=app,
            default_limits=[Config.RATE_LIMIT_DEFAULT],
            storage_uri="memory://"
        )
        logger.info(f"Rate limiting enabled: {Config.RATE_LIMIT_DEFAULT}")
    else:
        limiter = None
except ImportError:
    limiter = None
    logger.debug("flask-limiter not installed, rate limiting disabled")

# Paths from configuration
TEMPLATE_PATH = Config.get_template_path()
BOXART_TEMPLATE_PATH = Config.get_boxart_template_path()
SHAPES_DIR = Config.get_shapes_dir()
LAYOUT_TEMPLATES_DIR = Config.get_layout_templates_dir()
BOXART_TEMPLATES_DIR = Config.get_boxart_templates_dir()
FONT_DIR = Config.get_font_dir()

# Font cache (populated at startup, refreshed on demand)
_font_cache = None
_font_cache_mtime = None


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


@app.route('/get_boxart_template')
def get_boxart_template():
    """Return the box art SVG template"""
    if BOXART_TEMPLATE_PATH.exists():
        with open(BOXART_TEMPLATE_PATH, 'r') as f:
            return jsonify({'svg': f.read()})
    return jsonify({'error': 'Box art template not found'}), 404


@app.route('/templates/<path:filename>')
def serve_template_file(filename):
    """Serve static files from templates directory (controller templates, etc.)"""
    templates_dir = Path(__file__).parent / 'templates'
    safe_path = (templates_dir / filename).resolve()
    try:
        # Security check: ensure path is within templates directory
        if not str(safe_path).startswith(str(templates_dir.resolve())):
            return jsonify({'error': 'Invalid path'}), 400
        if not safe_path.exists() or not safe_path.is_file():
            return jsonify({'error': 'File not found'}), 404
        # Determine mimetype based on extension
        ext = safe_path.suffix.lower()
        mimetypes = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.svg': 'image/svg+xml',
            '.gif': 'image/gif'
        }
        mimetype = mimetypes.get(ext, 'application/octet-stream')
        return send_file(str(safe_path), mimetype=mimetype)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


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


# Note: LAYOUT_TEMPLATES_DIR and BOXART_TEMPLATES_DIR are defined from Config above


@app.route('/get_badge/<name>')
def get_badge(name):
    """Return SVG content for a specific IntelliVoice badge template"""
    safe_name = Path(name).name
    if not safe_name.endswith('.svg'):
        safe_name += '.svg'

    badge_dir = SHAPES_DIR / 'intellivoice-badge'
    badge_path = (badge_dir / safe_name).resolve()

    try:
        if not str(badge_path).startswith(str(badge_dir.resolve())):
            return jsonify({'error': 'Invalid badge path'}), 400
        if not badge_path.exists() or not badge_path.is_file():
            return jsonify({'error': 'Badge not found'}), 404

        with open(badge_path, 'r') as f:
            return jsonify({'svg': f.read(), 'name': Path(safe_name).stem})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


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


@app.route('/get_boxart_examples')
def get_boxart_examples():
    """Return list of available example box art projects"""
    examples = []
    if BOXART_TEMPLATES_DIR.exists():
        for p in sorted(BOXART_TEMPLATES_DIR.iterdir()):
            if p.suffix.lower() == '.zip' and p.is_file():
                # Use filename without extension as the example name
                # Convert underscores to spaces and title case for display
                display_name = p.stem.replace('_', ' ').replace('boxart project', '').replace('box art project', '').strip().title()
                examples.append({
                    'name': p.stem,
                    'file': p.name,
                    'displayName': display_name
                })
    return jsonify({'examples': examples}), 200


@app.route('/get_boxart_example/<name>')
def get_boxart_example(name):
    """Return the zip file for a specific example box art project"""
    # Sanitize name to prevent path traversal
    safe_name = Path(name).name
    if not safe_name.endswith('.zip'):
        safe_name += '.zip'

    example_path = (BOXART_TEMPLATES_DIR / safe_name).resolve()

    # Security check: ensure path is within BOXART_TEMPLATES_DIR
    try:
        if not str(example_path).startswith(str(BOXART_TEMPLATES_DIR.resolve())):
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

# Note: FONT_DIR is defined from Config above

def _parse_font_info(filename: str) -> dict:
    """Parse font filename to extract family name and weight/style info.

    Examples:
        LiberationSans-Bold.ttf -> family='Liberation Sans', weight='Bold'
        SF Intellivised Bold.ttf -> family='SF Intellivised', weight='Bold'
        Roboto_Condensed-Medium.ttf -> family='Roboto Condensed', weight='Medium'
    """
    import re

    stem = Path(filename).stem

    # Weight/style suffixes (order matters - check longer ones first)
    weight_styles = [
        'Extra Bold Italic', 'Semi Bold Italic', 'Bold Italic', 'Light Italic',
        'Medium Italic', 'Thin Italic', 'Extra Light Italic', 'Black Italic',
        'Outline Italic', 'Extended Italic',
        'ExtraBoldItalic', 'SemiBoldItalic', 'BoldItalic', 'LightItalic',
        'MediumItalic', 'ThinItalic', 'ExtraLightItalic', 'BlackItalic',
        'Extra Bold', 'Semi Bold', 'Extra Light',
        'ExtraBold', 'SemiBold', 'ExtraLight',
        'Bold', 'Medium', 'Regular', 'Light', 'Thin', 'Black',
        'Outline', 'Extended', 'Italic',
        'VariableFont_wdth,wght'
    ]

    # Special cases - fonts where the full name is the family
    special_families = ['Eurostile Bold Extended']
    for sf in special_families:
        if stem == sf or stem.startswith(sf + ' '):
            return {'family': sf, 'weight': 'Regular', 'style': ''}

    # Check if filename has spaces (e.g., "SF Intellivised Bold.ttf")
    if ' ' in stem:
        # For space-separated names, check for weight suffix at end
        family = stem
        weight = 'Regular'
        style = ''
        for ws in weight_styles:
            if stem.endswith(' ' + ws):
                family = stem[:-len(ws)-1].strip()
                if 'Italic' in ws:
                    style = 'Italic'
                    weight = ws.replace(' Italic', '').replace('Italic', '') or 'Regular'
                else:
                    weight = ws.replace(' ', '')
                break
        return {'family': family, 'weight': weight, 'style': style}

    # Handle hyphen-separated weight (e.g., LiberationSans-Bold)
    parts = stem.split('-')
    if len(parts) >= 2:
        base_name = parts[0]
        weight_part = '-'.join(parts[1:])
    else:
        base_name = stem
        weight_part = 'Regular'

    # Convert underscores to spaces and expand CamelCase
    family = base_name.replace('_', ' ')

    # Add spaces before capital letters (CamelCase), but not between consecutive capitals
    def expand_camelcase(word):
        return re.sub(r'(?<=[a-z])(?=[A-Z])', ' ', word)

    if ' ' not in family:
        family = expand_camelcase(family)
    else:
        words = family.split(' ')
        family = ' '.join(expand_camelcase(w) for w in words)

    family = re.sub(r'\s+', ' ', family).strip()

    # Determine weight from hyphen-separated part
    weight = 'Regular'
    style = ''
    for ws in weight_styles:
        if weight_part.endswith(ws) or weight_part == ws:
            if 'Italic' in ws:
                style = 'Italic'
                weight = ws.replace('Italic', '').replace(' ', '') or 'Regular'
            else:
                weight = ws.replace(' ', '')
            break

    return {'family': family, 'weight': weight, 'style': style}


def _scan_fonts() -> list:
    """Scan font directory and return list of font metadata.

    This is the internal implementation that does the actual disk scan.
    """
    fonts = []

    if FONT_DIR.exists():
        for p in sorted(FONT_DIR.iterdir()):
            if p.suffix.lower() in ['.ttf', '.otf'] and p.is_file():
                info = _parse_font_info(p.name)
                family = info['family']
                weight = info['weight']

                # Build display name: Family + Weight + Style
                if weight == 'Regular' and not info['style']:
                    display_name = family
                elif weight == 'Regular' and info['style']:
                    display_name = f"{family} {info['style']}"
                elif info['style']:
                    display_name = f"{family} {weight} {info['style']}"
                else:
                    display_name = f"{family} {weight}"

                fonts.append({
                    'file': p.name,
                    'family': family,
                    'weight': weight,
                    'style': info['style'],
                    'type': 'custom',
                    'displayName': display_name
                })

    # Sort by family name, then by weight order
    weight_order = {'Thin': 0, 'ExtraLight': 1, 'Light': 2, 'Regular': 3,
                    'Medium': 4, 'SemiBold': 5, 'Bold': 6, 'ExtraBold': 7, 'Black': 8}
    fonts.sort(key=lambda f: (f['family'], weight_order.get(f['weight'], 3), f.get('style', '')))

    return fonts


def _get_fonts_cached() -> list:
    """Get font list with caching support.

    When FONT_CACHE_ENABLED is True, scans fonts once and caches the result.
    Cache is invalidated if the font directory modification time changes.
    """
    global _font_cache, _font_cache_mtime

    if not Config.FONT_CACHE_ENABLED:
        return _scan_fonts()

    # Check if cache needs refresh
    try:
        current_mtime = FONT_DIR.stat().st_mtime if FONT_DIR.exists() else None
    except OSError:
        current_mtime = None

    if _font_cache is None or _font_cache_mtime != current_mtime:
        logger.info(f"Scanning fonts from {FONT_DIR}")
        _font_cache = _scan_fonts()
        _font_cache_mtime = current_mtime
        logger.info(f"Font cache populated with {len(_font_cache)} fonts")

    return _font_cache


@app.route('/fonts/list')
def fonts_list():
    """Return list of available bundled fonts.

    All fonts are served from the sf_intellivised folder. No system fonts are
    exposed to ensure consistent rendering across all platforms (Windows, macOS,
    iOS, Linux, Docker).

    Results are cached for performance (see Config.FONT_CACHE_ENABLED).
    """
    fonts = _get_fonts_cached()
    return jsonify({'fonts': fonts}), 200


@app.route('/fonts/refresh', methods=['POST'])
def fonts_refresh():
    """Force refresh of the font cache.

    Call this endpoint after adding new fonts to the font directory.
    """
    global _font_cache, _font_cache_mtime
    _font_cache = None
    _font_cache_mtime = None
    fonts = _get_fonts_cached()
    return jsonify({'status': 'ok', 'count': len(fonts)}), 200


@app.route('/fonts/<path:font_name>')
def serve_font(font_name):
    """Serve a TTF or OTF font file from the sf_intellivised folder.

    Includes cache headers for browser caching (fonts rarely change).
    """
    safe_path = (FONT_DIR / font_name).resolve()
    try:
        if not str(safe_path).startswith(str(FONT_DIR.resolve())):
            return jsonify({'error': 'invalid font path'}), 400
        if not safe_path.exists() or not safe_path.is_file():
            return jsonify({'error': 'font not found'}), 404
        # Determine mimetype based on extension
        mimetype = 'font/otf' if safe_path.suffix.lower() == '.otf' else 'font/ttf'
        response = send_file(str(safe_path), mimetype=mimetype)
        # Cache fonts for 1 year (they don't change often)
        response.headers['Cache-Control'] = 'public, max-age=31536000, immutable'
        return response
    except Exception as e:
        logger.error(f"Error serving font {font_name}: {e}")
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


@app.route('/export_ovl', methods=['POST'])
def export_ovl():
    """
    Export a Nintendo DS .OVL overlay file for the NINTV-DS emulator.

    Accepts JSON: { hotspots: [[x1,x2,y1,y2], ...36], name: str, image: dataURL|null }
    Returns a plain-text .ovl file download.

    If `image` is provided (base64 PNG data URL), the PNG is converted to NDS
    8bpp tile/map/palette format and appended to the file.
    """
    data = request.get_json(force=True)
    hotspots = data.get('hotspots', [])
    name     = data.get('name', 'overlay').strip() or 'overlay'
    image_data = data.get('image')  # base64 data URL or None

    BUTTON_KEYS = [
        'KEY_1',        'KEY_2',        'KEY_3',        'KEY_4',
        'KEY_5',        'KEY_6',        'KEY_7',        'KEY_8',
        'KEY_9',        'KEY_CLEAR',    'KEY_0',        'KEY_ENTER',
        'BTN_FIRE',     'BTN_L_ACT',    'BTN_R_ACT',
        'META_RESET',   'META_LOAD',    'META_CONFIG',  'META_SCORES',
        'META_QUIT',    'META_STATE',   'META_MENU',    'META_SWITCH',
        'META_MANUAL',  'META_DISC',    'META_KEYBOARD','META_SWAPOVL',
        'META_DISC_UP', 'META_DISC_DN', 'META_SPEEDUP', 'META_FASTLOAD',
        'META_STRETCH', 'META_GCONFIG', 'META_CHEATS',  'META_EMUINFO',
        'META_PICKOVL',
    ]

    lines = [
        '    // -----------------------------------------------------------------',
        f'    // {name} - Nintellivision Overlay',
        '    // Generated by Intellivision Overlay Editor',
        '    // https://github.com/mholzinger/intellivision-overlay-editor',
        '    // -----------------------------------------------------------------',
    ]

    for i, hs in enumerate(hotspots[:36]):
        key = BUTTON_KEYS[i] if i < len(BUTTON_KEYS) else f'BTN_{i}'
        x1, x2, y1, y2 = (int(v) for v in hs)
        lines.append(f'    .ovl {x1:>4}, {x2:>4}, {y1:>4}, {y2:>4},    // {key}')

    # Optional: convert image to NDS tile/map/pal
    if image_data:
        try:
            header, encoded = image_data.split(',', 1)
            img_bytes = base64.b64decode(encoded)
            tile_lines, map_lines, pal_lines = _png_to_nds_ovl(img_bytes)
            lines.append('')
            lines.extend(tile_lines)
            lines.append('')
            lines.extend(map_lines)
            lines.append('')
            lines.extend(pal_lines)
        except Exception as exc:
            logger.error(f'DS OVL image conversion failed: {exc}')
            # Continue without image data rather than failing the whole request

    content = '\n'.join(lines) + '\n'
    safe_name = name.lower().replace(' ', '_')
    # Strip characters that are unsafe in filenames
    safe_name = ''.join(c for c in safe_name if c.isalnum() or c in '_-') or 'overlay'

    return send_file(
        BytesIO(content.encode('utf-8')),
        mimetype='text/plain',
        as_attachment=True,
        download_name=f'{safe_name}.ovl',
    )


def _png_to_nds_ovl(img_bytes):
    """
    Convert a PNG image to NDS 8bpp tile/map/palette data.

    Returns (tile_lines, map_lines, pal_lines) as lists of strings
    suitable for appending to a .ovl file.

    NDS 8bpp text-BG format:
      - Tiles:   8×8 pixels, 1 byte per pixel → 64 bytes = 16 uint32 per tile
                 Each .tile line holds 8 uint32 values (= 32 bytes = half a tile)
      - Tilemap: 32×32 = 1024 uint16 entries; each .map line holds 8 uint16 values
      - Palette: 256 RGB555 uint16 entries;  each .pal line holds 8 uint16 values
    """
    from io import BytesIO as _BytesIO

    img = Image.open(_BytesIO(img_bytes)).convert('RGBA')
    img = img.resize((256, 256), Image.LANCZOS)

    # Quantise to max 256 colours (8bpp indexed)
    img = img.convert('P', palette=Image.ADAPTIVE, colors=256)

    pixels    = list(img.getdata())          # 65 536 index values
    raw_pal   = img.getpalette()             # 768 bytes: R,G,B × 256

    # Build RGB555 palette
    pal_rgb555 = []
    for i in range(256):
        r = (raw_pal[i * 3]     >> 3) & 0x1F
        g = (raw_pal[i * 3 + 1] >> 3) & 0x1F
        b = (raw_pal[i * 3 + 2] >> 3) & 0x1F
        pal_rgb555.append(r | (g << 5) | (b << 10))

    # Extract 8×8 tiles with deduplication
    unique_tiles = []
    tile_cache   = {}
    tilemap      = []  # 1024 entries for 32×32 tile grid

    for ty in range(32):
        for tx in range(32):
            tile = tuple(pixels[(ty * 8 + row) * 256 + tx * 8 + col]
                         for row in range(8) for col in range(8))
            if tile not in tile_cache:
                tile_cache[tile] = len(unique_tiles)
                unique_tiles.append(tile)
            tilemap.append(tile_cache[tile])

    # Format .tile lines (8bpp: 64 bytes/tile → 16 uint32/tile → 2 lines of 8 uint32)
    tile_lines = []
    for tile in unique_tiles:
        uint32s = []
        for i in range(0, 64, 4):
            val = (tile[i]
                   | (tile[i + 1] << 8)
                   | (tile[i + 2] << 16)
                   | (tile[i + 3] << 24))
            uint32s.append(val)
        # Two .tile lines per tile (8 uint32 each)
        for start in range(0, 16, 8):
            chunk = uint32s[start:start + 8]
            tile_lines.append('\t.tile ' + ','.join(f'0x{v:08X}' for v in chunk))

    # Format .map lines (1024 entries → 128 lines of 8 uint16)
    map_lines = []
    for i in range(0, len(tilemap), 8):
        chunk = tilemap[i:i + 8]
        map_lines.append('\t.map ' + ','.join(f'0x{v:04X}' for v in chunk))

    # Format .pal lines (256 entries → 32 lines of 8 uint16)
    pal_lines = []
    for i in range(0, 256, 8):
        chunk = pal_rgb555[i:i + 8]
        pal_lines.append('\t.pal ' + ','.join(f'0x{v:04X}' for v in chunk))

    return tile_lines, map_lines, pal_lines


@app.route('/health')
def health():
    """Health check endpoint for load balancers and monitoring."""
    return jsonify({'status': 'ok'}), 200


@app.route('/config')
def get_config():
    """Return non-sensitive configuration for debugging (development only)."""
    if not Config.DEBUG:
        return jsonify({'error': 'not available in production'}), 403
    return jsonify(Config.to_dict()), 200


# ── IntelliVoice: CMU Pronouncing Dictionary word lookup ─────────────────────
# Uses the `pronouncing` package (wraps CMU dict, ~134k words) to convert any
# English word to SP0256-AL2 allophone codes for IntyBASIC VOICE statements.

try:
    import cmudict as _cmudict
    _CMU_DICT = _cmudict.dict()   # { 'hello': [['HH','AH0','L','OW1'], ...], ... }
    _CMU_AVAILABLE = True
    logger.info('CMU Pronouncing Dictionary loaded (%d entries)', len(_CMU_DICT))
except Exception as _e:
    _CMU_DICT = {}
    _CMU_AVAILABLE = False
    logger.warning('cmudict package not available — /voice/lookup will be disabled: %s', _e)

# ARPAbet phoneme → SP0256-AL2 allophone code.
# Notes:
#   - No SH in SP0256-AL2; use ZH (palatal fricative) as closest substitute
#   - Stress digits (0/1/2) on ARPAbet vowels are stripped before lookup
#   - ER (any stress) → ER1 (lighter) for unstressed (0), ER2 for stressed (1/2)
_ARPABET_TO_SP0256 = {
    'AA': 'AA',  'AE': 'AE',  'AH': 'AX',  'AO': 'AO',
    'AW': 'AW',  'AY': 'AY',  'B':  'BB1', 'CH': 'CH',
    'D':  'DD1', 'DH': 'DH2', 'EH': 'EH',  'ER': 'ER2',
    'EY': 'EY',  'F':  'FF',  'G':  'GG1', 'HH': 'HH1',
    'IH': 'IH',  'IY': 'IY',  'JH': 'JH',  'K':  'KK3',
    'L':  'LL',  'M':  'MM',  'N':  'NN1', 'NG': 'NG',
    'OW': 'OW',  'OY': 'OY',  'P':  'PP',  'R':  'RR1',
    'S':  'SS',  'SH': 'ZH',  'T':  'TT2', 'TH': 'TH',
    'UH': 'UH',  'UW': 'UW2', 'V':  'VV',  'W':  'WW',
    'Y':  'YY2', 'Z':  'ZZ',  'ZH': 'ZH',
}

# IntyBASIC uses different names for three allophones.
_IB_NAMES = {'AE': 'AE1', 'NG': 'NG1', 'OR': 'OR2'}

def _arpabet_to_sp0256(phones_str):
    """Convert a CMU phones string ('HH AH0 L OW1') to SP0256-AL2 code list."""
    result = []
    for token in phones_str.split():
        # Strip stress digit if present (ARPAbet vowels end in 0/1/2)
        stress = token[-1] if token[-1].isdigit() else None
        base   = token.rstrip('012')
        # ER: unstressed (0) → ER1, stressed (1/2) → ER2
        if base == 'ER':
            sp = 'ER1' if stress == '0' else 'ER2'
        else:
            sp = _ARPABET_TO_SP0256.get(base)
        if sp:
            result.append(_IB_NAMES.get(sp, sp))
    return result


@app.route('/voice/lookup')
def voice_lookup():
    """
    Look up one or more words in the CMU Pronouncing Dictionary (~134k entries)
    and return the corresponding SP0256-AL2 allophone sequences.

    Query params:
      word   — a single word  (e.g. ?word=hello)
      phrase — space-separated words  (e.g. ?phrase=break+a+leg)

    Returns JSON:
      { "results": [ { "word": "hello", "allophones": ["HH1","AX","LL","OW"] }, ... ],
        "unknown": ["foo"] }
    """
    if not _CMU_AVAILABLE:
        return jsonify({'error': 'cmudict not available on this server'}), 503

    raw = request.args.get('phrase') or request.args.get('word') or ''
    words = raw.strip().lower().split()
    if not words:
        return jsonify({'error': 'provide ?word= or ?phrase='}), 400

    results = []
    unknown = []
    for word in words:
        phones_list = _CMU_DICT.get(word)
        if phones_list:
            # Use the first (most common) pronunciation.
            allophones = _arpabet_to_sp0256(' '.join(phones_list[0]))
            results.append({'word': word, 'allophones': allophones})
        else:
            unknown.append(word)

    return jsonify({'results': results, 'unknown': unknown})


# ── SPA tab routing ──────────────────────────────────────────────────────────
# Serves the same page for direct tab URLs: /overlay /boxart /sprite /ds /voice
# ── Emulator (jzIntv WASM) ────────────────────────────────────────────────
WASM_DIR = Path(__file__).parent / 'static' / 'wasm'

@app.route('/emulator')
def emulator():
    """Serve the main editor with the emulator tab active (supports SPA tab routing)."""
    return render_template('overlay_editor.html')

@app.route('/emulator/shell')
def emulator_shell_redirect():
    """Redirect to /emulator/shell/ so relative WASM URLs resolve correctly."""
    return redirect('/emulator/shell/')

@app.route('/emulator/shell/')
def emulator_shell():
    """Serve the jzIntv WASM shell page (loaded inside the iframe)."""
    return send_from_directory(WASM_DIR, 'jzintv.html')

@app.route('/emulator/bios/status')
def emulator_bios_status():
    """Return which BIOS files are available server-side (configured via OVL_BIOS_*_PATH)."""
    exec_path = Config.get_bios_exec_path()
    grom_path = Config.get_bios_grom_path()
    ecs_path  = Config.get_bios_ecs_path()
    return jsonify({
        'exec': bool(exec_path and exec_path.is_file()),
        'grom': bool(grom_path and grom_path.is_file()),
        'ecs':  bool(ecs_path  and ecs_path.is_file()),
    })

@app.route('/emulator/bios/<filename>')
def emulator_bios_file(filename):
    """Serve a server-configured BIOS file (exec.bin, grom.bin, or ecs.bin)."""
    if filename == 'exec.bin':
        path = Config.get_bios_exec_path()
    elif filename == 'grom.bin':
        path = Config.get_bios_grom_path()
    elif filename == 'ecs.bin':
        path = Config.get_bios_ecs_path()
    else:
        return jsonify({'error': 'Unknown BIOS file'}), 404
    if not path or not path.is_file():
        return jsonify({'error': 'BIOS file not configured on server'}), 404
    return send_from_directory(path.parent, path.name,
                               mimetype='application/octet-stream')

@app.route('/emulator/bios/fetch/available')
def emulator_bios_fetch_available():
    """Return whether IA credentials are configured (so UI can show/hide the Fetch button)."""
    has_creds = bool(os.environ.get('OVL_IA_ACCESS_KEY') and os.environ.get('OVL_IA_SECRET_KEY'))
    return jsonify({'available': has_creds})


@app.route('/emulator/bios/fetch')
def emulator_bios_fetch():
    """
    Proxy-fetch the OpenEmu BIOS Pack ZIP from Archive.org using the server's
    IA credentials and stream it back to the browser same-origin.
    Requires OVL_IA_ACCESS_KEY and OVL_IA_SECRET_KEY environment variables.
    """
    access_key = os.environ.get('OVL_IA_ACCESS_KEY')
    secret_key = os.environ.get('OVL_IA_SECRET_KEY')
    logged_in_user = os.environ.get('OVL_IA_LOGGED_IN_USER', '')
    logged_in_sig = os.environ.get('OVL_IA_LOGGED_IN_SIG', '')
    if not access_key or not secret_key:
        return jsonify({'error': 'IA credentials not configured on server'}), 503

    try:
        import internetarchive as ia

        # Strip Set-Cookie metadata (expires, path, domain) — keep value only
        def _cv(s):
            return s.split(';')[0].strip() if s else ''

        config = {
            's3': {'access': access_key, 'secret': secret_key},
            'cookies': {'logged-in-user': _cv(logged_in_user), 'logged-in-sig': _cv(logged_in_sig)},
        }
        session = ia.get_session(config)
        item = session.get_item('OpenEmuBIOSPack')
        zip_file = next(
            (f for f in item.get_files() if f.name.lower().endswith('.zip')),
            None
        )
        if not zip_file:
            return jsonify({'error': 'ZIP not found in Archive.org item'}), 404

        from urllib.parse import quote
        url = f'https://archive.org/download/OpenEmuBIOSPack/{quote(zip_file.name)}'
        resp = session.get(url, stream=True)
        if resp.status_code != 200:
            return jsonify({'error': f'Archive.org returned {resp.status_code}'}), 502

        def generate():
            for chunk in resp.iter_content(chunk_size=65536):
                if chunk:
                    yield chunk

        return app.response_class(
            generate(),
            status=200,
            mimetype='application/zip',
            headers={'Content-Disposition': 'attachment; filename="OpenEmu BIOS Pack.zip"'}
        )
    except Exception as e:
        print(f'[bios/fetch] error: {e}', file=sys.stderr)
        return jsonify({'error': str(e)}), 502


@app.route('/emulator/game/latest')
def emulator_game_latest():
    """
    Fetch the latest game ZIP from itch.io and proxy it to the browser.
    Requires ITCH_API_KEY and ITCH_GAME_ID environment variables.
    """
    import urllib.request, json as _json

    api_key = Config.ITCH_API_KEY
    game_id = Config.ITCH_GAME_ID
    if not api_key or not game_id:
        return jsonify({'error': 'ITCH_API_KEY or ITCH_GAME_ID not configured'}), 503

    try:
        # Get upload list for the game
        with urllib.request.urlopen(
            f'https://itch.io/api/1/{api_key}/game/{game_id}/uploads', timeout=10
        ) as r:
            uploads = _json.loads(r.read()).get('uploads', [])

        # Pick the first ZIP upload
        zip_upload = next(
            (u for u in uploads if u.get('filename', '').lower().endswith('.zip')),
            None
        )
        if not zip_upload:
            return jsonify({'error': 'No ZIP upload found on itch.io'}), 404

        # Get signed download URL
        with urllib.request.urlopen(
            f'https://itch.io/api/1/{api_key}/upload/{zip_upload["id"]}/download', timeout=10
        ) as r2:
            url = _json.loads(r2.read()).get('url')
        if not url:
            return jsonify({'error': 'itch.io returned no download URL'}), 502

        # Download full ZIP into memory and return it
        with urllib.request.urlopen(url, timeout=60) as r3:
            data = r3.read()

        filename = zip_upload['filename']
        return app.response_class(
            data,
            status=200,
            mimetype='application/zip',
            headers={
                'Content-Disposition': f'attachment; filename="{filename}"',
                'Content-Length': str(len(data)),
            }
        )
    except Exception as e:
        print(f'[game/latest] error: {e}', file=sys.stderr)
        return jsonify({'error': str(e)}), 502


# ── Temporary ROM token store ─────────────────────────────────────────────
# In-memory only; cleared on server restart. Tokens expire after 30 minutes.
import uuid, time as _time
_rom_tokens: dict = {}  # token → {data, filename, stored_at}
_ROM_TOKEN_TTL = 1800   # seconds

def _evict_expired_tokens():
    cutoff = _time.time() - _ROM_TOKEN_TTL
    expired = [k for k, v in _rom_tokens.items() if v['stored_at'] < cutoff]
    for k in expired:
        del _rom_tokens[k]


@app.route('/emulator/game/upload', methods=['POST'])
def emulator_game_upload():
    """
    Accept a ROM or ZIP via multipart file upload or raw request body.
    Returns a token and a ready-to-use play URL valid for 30 minutes.

    Multipart:  POST with field name 'file'
    Raw body:   POST with Content-Disposition: attachment; filename="game.rom"
    """
    _evict_expired_tokens()

    filename = 'game.rom'
    if 'file' in request.files:
        f = request.files['file']
        data = f.read()
        filename = f.filename or filename
    else:
        data = request.get_data()
        cd = request.headers.get('Content-Disposition', '')
        for part in cd.split(';'):
            part = part.strip()
            if part.startswith('filename='):
                filename = part[9:].strip('"\'') or filename

    if not data:
        return jsonify({'error': 'No file data received'}), 400

    MAX_ROM_SIZE = 5 * 1024 * 1024  # 5 MB
    if len(data) > MAX_ROM_SIZE:
        return jsonify({'error': f'File too large ({len(data) // 1024} KB). Maximum is 5 MB.'}), 413

    token = str(uuid.uuid4())
    _rom_tokens[token] = {'data': data, 'filename': filename, 'stored_at': _time.time()}

    play_url = f'/emulator?rom_token={token}'
    return jsonify({'token': token, 'play_url': play_url, 'filename': filename,
                    'expires_in': _ROM_TOKEN_TTL})


# ── Music Studio: compile MUSIC source to ROM for bit-perfect WASM playback ──

# Minimal IntyBASIC wrapper that boots straight into the song. The user's
# serialized MUSIC source (including its own label and DATA / MUSIC lines) is
# inlined after the wrapper. PLAY SIMPLE works for both base PSG and ECS
# variants — the 8-arg MUSIC lines toggle ECS automatically at compile time.
_MUSIC_PLAYER_WRAPPER = """\
\tREM Music Studio playback wrapper — boots into the song and idles forever.
\tREM Generated by /music/compile_rom from the editor's serialized output.
main:
\tPLAY SIMPLE
\tPLAY {song_label}
wait_loop:
\tWAIT
\tGOTO wait_loop

"""


def _compile_music_rom(music_source: str, song_label: str) -> bytes:
    """Compile an IntyBASIC MUSIC source snippet into a playable ROM.

    Returns the raw ROM bytes. Raises RuntimeError with a useful message on
    any pipeline failure (missing binaries, BASIC syntax error, assembler
    error). Uses a temp directory that's auto-cleaned.
    """
    intybasic = Config.get_intybasic_path()
    as1600    = Config.get_as1600_path()
    if not intybasic:
        raise RuntimeError(
            'intybasic compiler not found on this server. Set OVL_INTYBASIC_PATH '
            'or install it on PATH. See docs/wasm-playback.md.'
        )
    if not as1600:
        raise RuntimeError(
            'as1600 assembler not found on this server. Set OVL_AS1600_PATH or '
            'install it on PATH (ships with jzIntv). See docs/wasm-playback.md.'
        )
    library_path = Config.get_intybasic_library_path()
    if not library_path:
        raise RuntimeError(
            'intybasic library path (containing intybasic_prologue.asm) not found. '
            'Set OVL_INTYBASIC_LIBRARY_PATH or place it next to the intybasic binary.'
        )

    import tempfile, shutil
    wrapped = _MUSIC_PLAYER_WRAPPER.format(song_label=song_label) + music_source

    with tempfile.TemporaryDirectory(prefix='music_rom_') as tmpdir:
        tmp = Path(tmpdir)
        bas_path = tmp / 'song.bas'
        asm_path = tmp / 'song.asm'
        rom_path = tmp / 'song.rom'
        bas_path.write_text(wrapped, encoding='utf-8')

        # Step 1: intybasic .bas → .asm
        try:
            r = subprocess.run(
                [str(intybasic), str(bas_path), str(asm_path), str(library_path)],
                cwd=tmp, capture_output=True, text=True, timeout=20
            )
        except subprocess.TimeoutExpired:
            raise RuntimeError('intybasic timed out (>20s). Source may be too large or invalid.')
        if r.returncode != 0 or not asm_path.is_file():
            # IntyBASIC writes errors to stdout, not stderr
            err = (r.stdout + r.stderr).strip()[-1200:]
            raise RuntimeError(f'intybasic failed:\n{err}')

        # Step 2: as1600 .asm → .rom
        try:
            r = subprocess.run(
                [str(as1600), '-o', str(rom_path), str(asm_path)],
                cwd=tmp, capture_output=True, text=True, timeout=20
            )
        except subprocess.TimeoutExpired:
            raise RuntimeError('as1600 timed out (>20s).')
        if r.returncode != 0 or not rom_path.is_file():
            err = (r.stdout + r.stderr).strip()[-1200:]
            raise RuntimeError(f'as1600 failed:\n{err}')

        return rom_path.read_bytes()


@app.route('/music/compile_rom', methods=['POST'])
def music_compile_rom():
    """Compile IntyBASIC MUSIC source into a ROM playable by the WASM emulator.

    Body JSON:
        {
            "source":     "<serialized MUSIC source from the editor>",
            "song_label": "<label name to PLAY (defaults to first label in source)>",
            "title":      "<optional display title>"
        }

    On success returns {"token": "...", "play_url": "...", "filename": "...",
    "rom_bytes": <int>, "expires_in": <int>} (same shape as
    /emulator/game/upload). The ROM is stored in the existing in-memory token
    table so the existing /emulator?rom_token=... shell loads it.
    """
    _evict_expired_tokens()

    payload = request.get_json(silent=True) or {}
    source = payload.get('source') or ''
    song_label = (payload.get('song_label') or '').strip()
    title = (payload.get('title') or 'music_playback').strip()
    if not source.strip():
        return jsonify({'error': 'Missing "source" in request body.'}), 400

    # Best-effort label sniff if the caller didn't specify one
    if not song_label:
        import re
        m = re.search(r'^([A-Za-z_][A-Za-z0-9_]*)\s*:', source, re.MULTILINE)
        if not m:
            return jsonify({'error': 'Could not detect a song label in source; pass "song_label" explicitly.'}), 400
        song_label = m.group(1)

    try:
        rom_bytes = _compile_music_rom(source, song_label)
    except RuntimeError as exc:
        return jsonify({'error': str(exc)}), 500

    # Sanitize for filename
    import re
    safe_title = re.sub(r'[^A-Za-z0-9_.-]+', '_', title)[:48] or 'music'
    filename = f'{safe_title}.rom'
    token = str(uuid.uuid4())
    _rom_tokens[token] = {'data': rom_bytes, 'filename': filename, 'stored_at': _time.time()}

    return jsonify({
        'token': token,
        'play_url': f'/emulator?rom_token={token}',
        'filename': filename,
        'rom_bytes': len(rom_bytes),
        'expires_in': _ROM_TOKEN_TTL,
    })


@app.route('/music/compile_rom/status')
def music_compile_rom_status():
    """Tells the frontend whether /music/compile_rom is functional on this
    server. Frontend uses this to hide the '▶ Play in jzIntv' button on
    deployments where the compiler isn't installed."""
    intybasic = Config.get_intybasic_path()
    as1600    = Config.get_as1600_path()
    library   = Config.get_intybasic_library_path()
    return jsonify({
        'available': bool(intybasic and as1600 and library),
        'intybasic': bool(intybasic),
        'as1600':    bool(as1600),
        'library':   bool(library),
    })


@app.route('/emulator/game/token/<token>')
def emulator_game_token(token):
    """Retrieve a previously uploaded ROM by token."""
    _evict_expired_tokens()
    entry = _rom_tokens.get(token)
    if not entry:
        return jsonify({'error': 'Token not found or expired'}), 404
    filename = entry['filename']
    is_zip = filename.lower().endswith('.zip')
    mimetype = 'application/zip' if is_zip else 'application/octet-stream'
    return app.response_class(
        entry['data'], status=200, mimetype=mimetype,
        headers={'Content-Disposition': f'attachment; filename="{filename}"'}
    )


@app.route('/emulator/game/fetch')
def emulator_game_fetch():
    """
    Proxy-fetch a ROM or ZIP from an arbitrary URL and stream it to the browser.
    Accepts a ?url= query parameter. Only http/https URLs are allowed.
    """
    url = request.args.get('url', '').strip()
    if not url:
        return jsonify({'error': 'No URL provided'}), 400
    if not url.startswith(('http://', 'https://')):
        return jsonify({'error': 'Only http/https URLs are supported'}), 400

    try:
        import requests as http
        fetch_headers = {
            'User-Agent': 'Mozilla/5.0 (compatible; IntellvisionOverlayEditor/1.0)',
            'Accept': '*/*',
        }
        r = http.get(url, stream=True, timeout=30, allow_redirects=True, headers=fetch_headers)
        r.raise_for_status()

        filename = url.split('?')[0].rstrip('/').split('/')[-1] or 'game'
        is_zip = filename.lower().endswith('.zip')
        mimetype = 'application/zip' if is_zip else 'application/octet-stream'

        def generate():
            for chunk in r.iter_content(chunk_size=65536):
                if chunk:
                    yield chunk

        headers = {'Content-Disposition': f'attachment; filename="{filename}"'}
        if 'Content-Length' in r.headers:
            headers['Content-Length'] = r.headers['Content-Length']

        return app.response_class(generate(), status=200, mimetype=mimetype, headers=headers)
    except Exception as e:
        app.logger.error(f'[game/fetch] error fetching {url!r}: {e}')
        return jsonify({'error': str(e)}), 502


@app.route('/emulator/game/available')
def emulator_game_available():
    """Return whether itch.io credentials are configured (so UI can show fetch status)."""
    available = bool(Config.ITCH_API_KEY and Config.ITCH_GAME_ID)
    return jsonify({'available': available})


@app.route('/emulator/shell/<path:filename>')
def emulator_shell_static(filename):
    """Serve jzintv.js / jzintv.wasm / jzintv.data referenced by relative URL from shell."""
    return send_from_directory(WASM_DIR, filename)


# ── Music Studio: bundled demo songs ─────────────────────────────────────────
MUSIC_DEMOS_DIR = Path(__file__).parent / 'static' / 'music-demos'


@app.route('/music/demos/manifest')
def music_demos_manifest():
    """Return the list of bundled demo songs and their metadata."""
    manifest_file = MUSIC_DEMOS_DIR / 'manifest.json'
    if not manifest_file.exists():
        return jsonify({'demos': []})
    return send_from_directory(MUSIC_DEMOS_DIR, 'manifest.json',
                               mimetype='application/json')


@app.route('/music/demos/<path:filename>')
def music_demos_serve(filename):
    """Serve an individual demo .bas file."""
    # Only allow .bas / .json files to be served from this directory
    if not (filename.endswith('.bas') or filename.endswith('.json')):
        return jsonify({'error': 'not found'}), 404
    if '..' in filename or filename.startswith('/'):
        return jsonify({'error': 'invalid path'}), 400
    return send_from_directory(MUSIC_DEMOS_DIR, filename, mimetype='text/plain')


# Must come after all real API routes so it doesn't shadow them.
_TAB_SLUGS = {'overlay', 'boxart', 'sprite', 'ds', 'voice', 'emulator', 'music', 'sfx'}

@app.route('/<tab>')
def tab_route(tab):
    if tab in _TAB_SLUGS:
        return render_template('overlay_editor.html')
    return jsonify({'error': 'not found'}), 404


if __name__ == '__main__':
    # Create templates directory if it doesn't exist
    templates_dir = Path(__file__).parent / 'templates'
    templates_dir.mkdir(exist_ok=True)

    # Validate configuration
    warnings = Config.validate()
    for warning in warnings:
        logger.warning(f"Config warning: {warning}")

    print("=" * 70)
    print("Intellivision Overlay Editor - Flask Application")
    print("=" * 70)
    print(f"\nTemplate: {TEMPLATE_PATH}")
    print(f"Fonts: {FONT_DIR} ({len(_get_fonts_cached())} fonts loaded)")

    # Use configuration for host/port
    host = Config.HOST
    port = Config.PORT

    print(f"\nStarting server at http://{host}:{port}")
    if Config.CORS_ENABLED:
        print(f"CORS enabled for: {Config.CORS_ORIGINS}")
    if Config.RATE_LIMIT_ENABLED:
        print(f"Rate limiting: {Config.RATE_LIMIT_DEFAULT}")
    print("Press CTRL+C to quit\n")

    if Config.DEBUG:
        # Disable Werkzeug's debug PIN requirement when intentionally running in debug mode locally
        os.environ['WERKZEUG_DEBUG_PIN'] = 'off'

    app.run(debug=Config.DEBUG, host=host, port=port)
