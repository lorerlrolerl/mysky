"""
Configuration management for MySky Weather App.
Centralized configuration for API endpoints, cache settings, and app behavior.
"""

from typing import Dict, Optional
from datetime import timedelta
from constants import APIConstants, CacheConstants, WeatherConstants


class AppConfig:
    """Main application configuration."""

    def __init__(self, custom_config: Optional[Dict] = None):
        """
        Initialize app configuration.

        Args:
            custom_config: Optional custom configuration to override defaults
        """
        self.api_endpoints = APIConstants.ENDPOINTS.copy()
        self.cache_settings = CacheConstants.EXPIRY_TIMES.copy()
        self.weather_settings = {
            'rain_threshold': WeatherConstants.RAIN_THRESHOLD,
            'temp_unit': WeatherConstants.TEMP_UNIT,
            'wind_unit': WeatherConstants.WIND_UNIT,
            'rain_unit': WeatherConstants.RAIN_UNIT
        }

        # Apply custom configuration if provided
        if custom_config:
            self._apply_custom_config(custom_config)

    def _apply_custom_config(self, custom_config: Dict):
        """Apply custom configuration overrides."""
        if 'api_endpoints' in custom_config:
            self.api_endpoints.update(custom_config['api_endpoints'])

        if 'cache_settings' in custom_config:
            self.cache_settings.update(custom_config['cache_settings'])

        if 'weather_settings' in custom_config:
            self.weather_settings.update(custom_config['weather_settings'])

    def get_api_endpoint(self, service: str) -> str:
        """Get API endpoint for a specific service."""
        return self.api_endpoints.get(service, "")

    def get_cache_expiry(self, data_type: str) -> timedelta:
        """Get cache expiry time for a specific data type."""
        return self.cache_settings.get(data_type, timedelta(hours=1))

    def get_weather_setting(self, setting: str):
        """Get weather-related setting."""
        return self.weather_settings.get(setting)


# Default configuration instance
default_config = AppConfig()


class DevelopmentConfig(AppConfig):
    """Development configuration with debug settings."""

    def __init__(self):
        super().__init__()
        # Shorter cache times for development
        self.cache_settings = {
            'forecast': timedelta(minutes=5),
            'geocoding': timedelta(hours=1),
            'air_quality': timedelta(minutes=5)
        }


class ProductionConfig(AppConfig):
    """Production configuration with optimized settings."""

    def __init__(self):
        super().__init__()
        # Longer cache times for production
        self.cache_settings = {
            'forecast': timedelta(hours=2),
            'geocoding': timedelta(days=1),
            'air_quality': timedelta(hours=2)
        }
