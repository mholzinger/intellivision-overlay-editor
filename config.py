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
