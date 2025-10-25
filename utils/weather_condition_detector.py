"""
Weather condition detector based on WMO Weather interpretation codes (WW).
Based on Open-Meteo ECMWF API documentation.
Maps WMO weather codes to proper weather conditions and icons.
"""

from typing import Dict, Tuple
from datetime import datetime


class WeatherConditionDetector:
    """Detects weather conditions using WMO Weather interpretation codes (WW)."""

    # WMO Weather interpretation codes (WW) mapping based on Open-Meteo documentation
    WMO_WEATHER_CODES = {
        # Clear conditions
        0: 'clear',              # Clear sky

        # Cloudy conditions
        1: 'mainly_clear',       # Mainly clear
        2: 'partly_cloudy',      # Partly cloudy
        3: 'overcast',           # Overcast

        # Fog conditions
        45: 'fog',               # Fog
        48: 'fog',              # Depositing rime fog

        # Drizzle conditions
        51: 'light_drizzle',     # Light drizzle
        53: 'moderate_drizzle',  # Moderate drizzle
        55: 'dense_drizzle',     # Dense drizzle
        56: 'light_freezing_drizzle',  # Light freezing drizzle
        57: 'dense_freezing_drizzle',  # Dense freezing drizzle

        # Rain conditions
        61: 'light_rain',        # Slight rain
        63: 'moderate_rain',     # Moderate rain
        65: 'heavy_rain',        # Heavy rain
        66: 'light_freezing_rain',  # Light freezing rain
        67: 'heavy_freezing_rain',  # Heavy freezing rain

        # Snow conditions
        71: 'light_snow',        # Slight snow fall
        73: 'moderate_snow',     # Moderate snow fall
        75: 'heavy_snow',        # Heavy snow fall
        77: 'snow_grains',       # Snow grains

        # Showers
        80: 'light_rain_shower', # Slight rain shower
        81: 'moderate_rain_shower',  # Moderate rain shower
        82: 'heavy_rain_shower', # Violent rain shower
        85: 'light_snow_shower', # Slight snow shower
        86: 'heavy_snow_shower', # Heavy snow shower

        # Thunderstorms
        95: 'thunderstorm',      # Thunderstorm: Slight or moderate
        96: 'thunderstorm_hail', # Thunderstorm with slight hail
        99: 'thunderstorm_heavy_hail',  # Thunderstorm with heavy hail
    }

    # Weather condition thresholds for fallback detection
    PRECIPITATION_THRESHOLDS = {
        'light': 0.1,      # 0.1mm - light drizzle
        'moderate': 2.5,   # 2.5mm - moderate rain
        'heavy': 7.5       # 7.5mm - heavy rain
    }

    WIND_THRESHOLDS = {
        'light': 5,        # 5 km/h - light breeze
        'moderate': 15,    # 15 km/h - moderate breeze
        'strong': 30,      # 30 km/h - strong wind
        'very_strong': 50  # 50 km/h - very strong wind
    }

    TEMPERATURE_THRESHOLDS = {
        'freezing': 0,     # Below 0°C
        'cold': 5,         # Below 5°C
        'cool': 15,        # Below 15°C
        'warm': 25,        # Below 25°C
        'hot': 30          # Above 30°C
    }

    @classmethod
    def detect_condition_from_wmo_code(cls, wmo_code: int) -> Tuple[str, str]:
        """
        Detect weather condition from WMO weather code.

        Args:
            wmo_code: WMO weather interpretation code (0-99)

        Returns:
            Tuple of (condition_code, description)
        """
        condition_code = cls.WMO_WEATHER_CODES.get(wmo_code, 'unknown')
        description = cls.get_description(condition_code)
        return (condition_code, description)

    @classmethod
    def detect_condition(cls, temperature: float, precipitation: float,
                        wind_speed: float, hour: int = 12) -> Tuple[str, str]:
        """
        Detect weather condition based on actual data (fallback method).

        Args:
            temperature: Temperature in Celsius
            precipitation: Precipitation in mm
            wind_speed: Wind speed in km/h
            hour: Hour of day (0-23)

        Returns:
            Tuple of (condition_code, description)
        """
        # Determine if it's day or night
        is_day = 6 <= hour <= 20

        # Check for precipitation first
        if precipitation > cls.PRECIPITATION_THRESHOLDS['heavy']:
            if wind_speed > cls.WIND_THRESHOLDS['strong']:
                return ('thunderstorm', 'Thunderstorm')
            else:
                return ('heavy_rain', 'Heavy Rain')
        elif precipitation > cls.PRECIPITATION_THRESHOLDS['moderate']:
            return ('moderate_rain', 'Moderate Rain')
        elif precipitation > cls.PRECIPITATION_THRESHOLDS['light']:
            return ('light_rain', 'Light Rain')

        # Check for strong winds
        if wind_speed > cls.WIND_THRESHOLDS['very_strong']:
            return ('windy', 'Very Windy')
        elif wind_speed > cls.WIND_THRESHOLDS['strong']:
            return ('windy', 'Windy')

        # Check temperature extremes
        if temperature > cls.TEMPERATURE_THRESHOLDS['hot']:
            return ('hot', 'Hot')
        elif temperature < cls.TEMPERATURE_THRESHOLDS['freezing']:
            return ('freezing', 'Freezing')
        elif temperature < cls.TEMPERATURE_THRESHOLDS['cold']:
            return ('cold', 'Cold')

        # Default to clear conditions based on time
        if is_day:
            return ('clear', 'Clear')
        else:
            return ('clear_night', 'Clear Night')

    @classmethod
    def detect_daily_condition(cls, hourly_data: list) -> Tuple[str, str]:
        """
        Detect dominant daily weather condition.

        Args:
            hourly_data: List of hourly weather data

        Returns:
            Tuple of (condition_code, description)
        """
        if not hourly_data:
            return ('unknown', 'Unknown')

        # Calculate averages and extremes
        temps = [h.get('temperature', 0) for h in hourly_data]
        precip = [h.get('precipitation', 0) for h in hourly_data]
        winds = [h.get('wind_speed', 0) for h in hourly_data]

        avg_temp = sum(temps) / len(temps) if temps else 0
        total_precip = sum(precip)
        max_wind = max(winds) if winds else 0

        # Count rainy hours
        rainy_hours = sum(1 for p in precip if p > 0)
        rain_percentage = (rainy_hours / len(hourly_data)) * 100

        # Determine dominant condition
        if rain_percentage > 60:  # More than 60% of hours have rain
            if total_precip > 10:
                return ('heavy_rain', 'Heavy Rain')
            elif total_precip > 5:
                return ('moderate_rain', 'Moderate Rain')
            else:
                return ('light_rain', 'Light Rain')
        elif max_wind > 40:
            return ('windy', 'Very Windy')
        elif max_wind > 25:
            return ('windy', 'Windy')
        elif avg_temp > 28:
            return ('hot', 'Hot')
        elif avg_temp < 2:
            return ('freezing', 'Freezing')
        elif avg_temp < 8:
            return ('cold', 'Cold')
        elif rain_percentage > 30:  # Some rain during the day
            return ('partly_cloudy', 'Partly Cloudy')
        else:
            return ('clear', 'Clear')

    @classmethod
    def get_icon_filename(cls, condition_code: str) -> str:
        """
        Get the correct icon filename for a condition.

        Args:
            condition_code: Weather condition code

        Returns:
            Icon filename
        """
        icon_mapping = {
            'clear': 'sunny.png',
            'clear_night': 'clear_night.png',
            'mainly_clear': 'partly_cloudy.png',
            'partly_cloudy': 'partly_cloudy.png',
            'overcast': 'overcast.png',
            'fog': 'fog.png',
            'light_drizzle': 'light_rain.png',
            'moderate_drizzle': 'light_rain.png',
            'dense_drizzle': 'light_rain.png',
            'light_freezing_drizzle': 'freezing_rain.png',
            'dense_freezing_drizzle': 'freezing_rain.png',
            'light_rain': 'light_rain.png',
            'moderate_rain': 'rain.png',
            'heavy_rain': 'heavy_rain.png',
            'light_freezing_rain': 'freezing_rain.png',
            'heavy_freezing_rain': 'freezing_rain.png',
            'light_snow': 'light_snow.png',
            'moderate_snow': 'snow.png',
            'heavy_snow': 'heavy_snow.png',
            'snow_grains': 'snow.png',
            'light_rain_shower': 'light_rain.png',
            'moderate_rain_shower': 'rain.png',
            'heavy_rain_shower': 'heavy_rain.png',
            'light_snow_shower': 'light_snow.png',
            'heavy_snow_shower': 'heavy_snow.png',
            'thunderstorm': 'thunderstorm.png',
            'thunderstorm_hail': 'thunderstorm.png',
            'thunderstorm_heavy_hail': 'thunderstorm.png',
            'windy': 'windy.png',
            'hot': 'hot.png',
            'cold': 'cold.png',
            'freezing': 'freezing.png',
            'unknown': 'unknown.png'
        }

        return icon_mapping.get(condition_code, 'unknown.png')

    @classmethod
    def get_description(cls, condition_code: str) -> str:
        """
        Get human-readable weather description.

        Args:
            condition_code: Weather condition code

        Returns:
            Weather description
        """
        descriptions = {
            'clear': 'Clear Sky',
            'clear_night': 'Clear Night',
            'mainly_clear': 'Mainly Clear',
            'partly_cloudy': 'Partly Cloudy',
            'overcast': 'Overcast',
            'fog': 'Fog',
            'light_drizzle': 'Light Drizzle',
            'moderate_drizzle': 'Moderate Drizzle',
            'dense_drizzle': 'Dense Drizzle',
            'light_freezing_drizzle': 'Light Freezing Drizzle',
            'dense_freezing_drizzle': 'Dense Freezing Drizzle',
            'light_rain': 'Light Rain',
            'moderate_rain': 'Moderate Rain',
            'heavy_rain': 'Heavy Rain',
            'light_freezing_rain': 'Light Freezing Rain',
            'heavy_freezing_rain': 'Heavy Freezing Rain',
            'light_snow': 'Light Snow',
            'moderate_snow': 'Moderate Snow',
            'heavy_snow': 'Heavy Snow',
            'snow_grains': 'Snow Grains',
            'light_rain_shower': 'Light Rain Shower',
            'moderate_rain_shower': 'Moderate Rain Shower',
            'heavy_rain_shower': 'Heavy Rain Shower',
            'light_snow_shower': 'Light Snow Shower',
            'heavy_snow_shower': 'Heavy Snow Shower',
            'thunderstorm': 'Thunderstorm',
            'thunderstorm_hail': 'Thunderstorm with Hail',
            'thunderstorm_heavy_hail': 'Thunderstorm with Heavy Hail',
            'windy': 'Windy',
            'hot': 'Hot',
            'cold': 'Cold',
            'freezing': 'Freezing',
            'unknown': 'Unknown'
        }

        return descriptions.get(condition_code, 'Unknown')