"""
Constants for MySky Weather App.
Centralized configuration for UI dimensions, font sizes, and other constants.
"""

from kivy.metrics import dp
from datetime import timedelta


class UIConstants:
    """UI-related constants for consistent sizing and spacing."""

    # Layout Heights
    HEADER_HEIGHT = dp(60)
    NAV_HEIGHT = dp(50)
    SUMMARY_HEIGHT = dp(200)

    # Font Sizes
    FONT_SIZES = {
        'very_small': dp(14),
        'small': dp(16),
        'medium': dp(18),
        'normal': dp(20),
        'large': dp(22),
        'xlarge': dp(24)
    }

    # Window Size Thresholds
    WINDOW_THRESHOLDS = {
        'very_small': 200,
        'small': 300,
        'medium': 400
    }

    # Spacing and Padding
    PADDING = {
        'small': dp(8),
        'medium': dp(15),
        'large': dp(20)
    }

    SPACING = {
        'small': dp(5),
        'medium': dp(10),
        'large': dp(15)
    }

    # Icon Sizes
    ICON_SIZES = {
        'small': dp(24),
        'medium': dp(32),
        'large': dp(48),
        'xlarge': dp(64)
    }


class CacheConstants:
    """Cache-related constants for data expiration."""

    EXPIRY_TIMES = {
        'forecast': timedelta(hours=1),
        'geocoding': timedelta(hours=24),
        'air_quality': timedelta(hours=1)
    }

    CACHE_BACKEND = 'sqlite'
    CACHE_NAME = '.cache/openmeteo_cache'


class APIConstants:
    """API-related constants for endpoints and parameters."""

    ENDPOINTS = {
        'geocoding': "https://geocoding-api.open-meteo.com/v1/search",
        'forecast': "https://api.open-meteo.com/v1/forecast",
        'air_quality': "https://air-quality-api.open-meteo.com/v1/air-quality"
    }

    # API Parameters
    DEFAULT_CITY_COUNT = 5
    FORECAST_DAYS = 16

    # Request timeouts
    TIMEOUT_SECONDS = 30


class WeatherConstants:
    """Weather-related constants for data processing."""

    # Rain threshold for "rainy" classification
    RAIN_THRESHOLD = 0.5

    # Temperature units
    TEMP_UNIT = '°C'
    WIND_UNIT = 'km/h'
    RAIN_UNIT = 'mm'

    # Graph settings
    GRAPH_WIDTH = 1200
    GRAPH_HEIGHT = 300
    X_TICKS_ANGLE = 45


class DebugConstants:
    """Debug-related constants."""

    DEBUG_PREFIX = "DEBUG:"
    API_CALL_PREFIX = "API Call:"
    ERROR_PREFIX = "Error:"
