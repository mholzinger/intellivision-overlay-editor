"""
Application Configuration

Centralizes all configurable settings with environment variable support.
For enterprise deployments, set these via environment variables or a .env file.
"""

import os
from pathlib import Path


def _get_bool(key: str, default: bool = False) -> bool:
    """Parse boolean from environment variable."""
    val = os.environ.get(key, str(default)).lower()
    return val in ('1', 'true', 'yes', 'on')


def _get_int(key: str, default: int) -> int:
    """Parse integer from environment variable."""
    try:
        return int(os.environ.get(key, default))
    except (ValueError, TypeError):
        return default


def _get_list(key: str, default: str = '') -> list:
    """Parse comma-separated list from environment variable."""
    val = os.environ.get(key, default)
    return [x.strip() for x in val.split(',') if x.strip()]


class Config:
    """Application configuration with environment variable overrides."""

    # Base directory (where overlay_editor_app.py lives)
    BASE_DIR = Path(__file__).parent

    # Server settings
    HOST = os.environ.get('OVL_HOST', '0.0.0.0')
    PORT = _get_int('OVL_PORT', 5001)
    DEBUG = _get_bool('OVL_DEBUG', False)

    # Upload limits
    MAX_CONTENT_LENGTH_MB = _get_int('OVL_MAX_UPLOAD_MB', 16)
    MAX_CONTENT_LENGTH = MAX_CONTENT_LENGTH_MB * 1024 * 1024

    # Allowed file extensions for uploads
    ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'}
    ALLOWED_FONT_EXTENSIONS = {'ttf', 'otf'}

    # Directory paths (all relative to BASE_DIR, can be overridden)
    @classmethod
    def _resolve_path(cls, env_key: str, default_relative: str) -> Path:
        """Resolve a path from env var or default relative to BASE_DIR."""
        env_val = os.environ.get(env_key)
        if env_val:
            return Path(env_val)
        return cls.BASE_DIR / default_relative

    @classmethod
    def get_template_path(cls) -> Path:
        return cls._resolve_path('OVL_TEMPLATE_PATH', 'intellivision_overlay_RECTANGULAR.svg')

    @classmethod
    def get_boxart_template_path(cls) -> Path:
        return cls._resolve_path('OVL_BOXART_TEMPLATE_PATH', 'templates/box_art_template.svg')

    @classmethod
    def get_shapes_dir(cls) -> Path:
        return cls._resolve_path('OVL_SHAPES_DIR', 'svg-templates')

    @classmethod
    def get_layout_templates_dir(cls) -> Path:
        return cls._resolve_path('OVL_LAYOUT_TEMPLATES_DIR', 'layout-templates')

    @classmethod
    def get_boxart_templates_dir(cls) -> Path:
        return cls._resolve_path('OVL_BOXART_TEMPLATES_DIR', 'boxart-templates')

    @classmethod
    def get_font_dir(cls) -> Path:
        return cls._resolve_path('OVL_FONT_DIR', 'sf_intellivised')

    # itch.io game distribution (optional — fetches latest ZIP from itch.io API)
    # Set ITCH_API_KEY to your itch.io API key (from itch.io account settings).
    # Set ITCH_GAME_ID to the numeric game ID (visible in itch.io dashboard URLs).
    ITCH_API_KEY = os.environ.get('ITCH_API_KEY', '')
    ITCH_GAME_ID = os.environ.get('ITCH_GAME_ID', '')

    # BIOS file paths (optional — for Docker deployments with pre-provisioned BIOS)
    # Set OVL_BIOS_EXEC_PATH, OVL_BIOS_GROM_PATH, and OVL_BIOS_ECS_PATH to absolute paths.
    # When set, the emulator page serves them automatically so users don't need to drop files.
    @classmethod
    def get_bios_exec_path(cls) -> Path | None:
        val = os.environ.get('OVL_BIOS_EXEC_PATH')
        return Path(val) if val else None

    @classmethod
    def get_bios_grom_path(cls) -> Path | None:
        val = os.environ.get('OVL_BIOS_GROM_PATH')
        return Path(val) if val else None

    @classmethod
    def get_bios_ecs_path(cls) -> Path | None:
        val = os.environ.get('OVL_BIOS_ECS_PATH')
        return Path(val) if val else None

    # IntyBASIC + as1600 compiler paths (optional — enables Music Studio's
    # "▶ Play in jzIntv" button which compiles MUSIC source to a real ROM
    # the WASM emulator can play bit-perfectly).
    #
    # Defaults look in PATH, then a few known install dirs. Set explicitly
    # via OVL_INTYBASIC_PATH / OVL_AS1600_PATH for non-standard locations.
    @classmethod
    def get_intybasic_path(cls) -> Path | None:
        return cls._find_binary('OVL_INTYBASIC_PATH', 'intybasic', [
            '/usr/local/bin/intybasic',
            '/Users/mikeholzinger/intybasic/intybasic',
        ])

    @classmethod
    def get_as1600_path(cls) -> Path | None:
        return cls._find_binary('OVL_AS1600_PATH', 'as1600', [
            '/usr/local/bin/as1600',
            '/Users/mikeholzinger/jzintv/bin/as1600',
            '/Users/mikeholzinger/jzintv-20200712-osx-sdl2/bin/as1600',
        ])

    # inty-midi (MIDI → IntyBASIC MUSIC converter, Oscar Toledo).
    # Optional — enables Music Studio's "📥 MIDI" import button.
    @classmethod
    def get_inty_midi_path(cls) -> Path | None:
        return cls._find_binary('OVL_INTY_MIDI_PATH', 'inty-midi', [
            '/usr/local/bin/inty-midi',
            '/Users/mikeholzinger/src/intv-game-builder/inty-midi-0.1.0.0-bin/mac/inty-midi',
            '/Users/mikeholzinger/src/intv-game-builder/inty-midi-0.1.0.0-bin/linux/inty-midi',
        ])

    @classmethod
    def get_intybasic_library_path(cls) -> Path | None:
        """Directory containing intybasic_prologue.asm / epilogue (the as1600
        include path passed as the optional 3rd intybasic argument)."""
        val = os.environ.get('OVL_INTYBASIC_LIBRARY_PATH')
        if val:
            return Path(val)
        # Try sibling of the binary
        bin_path = cls.get_intybasic_path()
        if bin_path and bin_path.parent.is_dir():
            return bin_path.parent
        return None

    @staticmethod
    def _find_binary(env_var: str, binary_name: str, defaults: list[str]) -> Path | None:
        import shutil
        explicit = os.environ.get(env_var)
        if explicit:
            p = Path(explicit)
            return p if p.is_file() else None
        on_path = shutil.which(binary_name)
        if on_path:
            return Path(on_path)
        for d in defaults:
            p = Path(d)
            if p.is_file():
                return p
        return None

    # CORS settings
    CORS_ENABLED = _get_bool('OVL_CORS_ENABLED', True)
    CORS_ORIGINS = _get_list('OVL_CORS_ORIGINS', '*')

    # Rate limiting (requests per minute)
    RATE_LIMIT_ENABLED = _get_bool('OVL_RATE_LIMIT_ENABLED', False)
    RATE_LIMIT_DEFAULT = os.environ.get('OVL_RATE_LIMIT_DEFAULT', '60 per minute')
    RATE_LIMIT_EXPORT = os.environ.get('OVL_RATE_LIMIT_EXPORT', '10 per minute')

    # Font caching
    FONT_CACHE_ENABLED = _get_bool('OVL_FONT_CACHE_ENABLED', True)

    # Logging
    LOG_LEVEL = os.environ.get('OVL_LOG_LEVEL', 'INFO')
    LOG_FORMAT = os.environ.get(
        'OVL_LOG_FORMAT',
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    @classmethod
    def validate(cls) -> list:
        """Validate configuration and return list of warnings."""
        warnings = []

        # Check required directories exist
        dirs_to_check = [
            ('Font directory', cls.get_font_dir()),
            ('Shapes directory', cls.get_shapes_dir()),
            ('Layout templates', cls.get_layout_templates_dir()),
        ]

        for name, path in dirs_to_check:
            if not path.exists():
                warnings.append(f"{name} not found: {path}")

        # Check template files exist
        if not cls.get_template_path().exists():
            warnings.append(f"Overlay template not found: {cls.get_template_path()}")

        return warnings

    @classmethod
    def to_dict(cls) -> dict:
        """Export configuration as dictionary (for debugging/logging)."""
        return {
            'HOST': cls.HOST,
            'PORT': cls.PORT,
            'DEBUG': cls.DEBUG,
            'MAX_CONTENT_LENGTH_MB': cls.MAX_CONTENT_LENGTH_MB,
            'TEMPLATE_PATH': str(cls.get_template_path()),
            'FONT_DIR': str(cls.get_font_dir()),
            'SHAPES_DIR': str(cls.get_shapes_dir()),
            'CORS_ENABLED': cls.CORS_ENABLED,
            'CORS_ORIGINS': cls.CORS_ORIGINS,
            'RATE_LIMIT_ENABLED': cls.RATE_LIMIT_ENABLED,
            'FONT_CACHE_ENABLED': cls.FONT_CACHE_ENABLED,
            'LOG_LEVEL': cls.LOG_LEVEL,
        }
