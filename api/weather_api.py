"""
Weather API module using Open-Meteo APIs with caching.
No authentication required - completely privacy-focused.
"""

import openmeteo_requests
import requests_cache
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import time

from utils.debug import debug
from constants import APIConstants, CacheConstants
from exceptions import NetworkError, APIResponseError, DataProcessingError


class WeatherAPI:
    """Open-Meteo API client with built-in caching and retry logic."""

    def __init__(self):
        # Configure cache with SQLite backend using constants
        self.cache_session = requests_cache.SQLiteCache(
            CacheConstants.CACHE_NAME,
            expire_after=CacheConstants.EXPIRY_TIMES
        )

        # Create session with retry logic
        self.session = openmeteo_requests.Client()

        # API endpoints using constants
        self.geocoding_url = APIConstants.ENDPOINTS['geocoding']
        self.forecast_url = APIConstants.ENDPOINTS['forecast']
        self.air_quality_url = APIConstants.ENDPOINTS['air_quality']

    def search_cities(self, query: str, count: int = APIConstants.DEFAULT_CITY_COUNT) -> List[Dict]:
        """
        Search for cities using geocoding API.

        Args:
            query: City name to search for
            count: Maximum number of results (default: 5)

        Returns:
            List of city dictionaries with name, country, latitude, longitude
        """
        if not query.strip():
            return []

        params = {
            "name": query,
            "count": count,
            "language": "en",
            "format": "json"
        }

        try:
            start_time = time.time()
            # Use requests directly for geocoding since it's not part of openmeteo-requests
            import requests
            response = requests.get(self.geocoding_url, params=params, timeout=APIConstants.TIMEOUT_SECONDS)
            response.raise_for_status()
            data = response.json()
            response_time = time.time() - start_time

            cities = []
            for result in data.get('results', []):
                cities.append({
                    'name': result.get('name', ''),
                    'country': result.get('country', ''),
                    'admin1': result.get('admin1', ''),  # State/region
                    'latitude': result.get('latitude', 0),
                    'longitude': result.get('longitude', 0),
                    'display_name': f"{result.get('name', '')}, {result.get('admin1', '')}, {result.get('country', '')}"
                })

            debug.print_api_call("City Search", "success", response_time)
            debug.print_city_search(query, cities)
            return cities

        except requests.exceptions.RequestException as e:
            debug.print_api_call("City Search", "error")
            debug.print_error(f"Network error searching cities: {e}")
            raise NetworkError(f"Failed to search cities: {e}", getattr(e.response, 'status_code', None))
        except Exception as e:
            debug.print_api_call("City Search", "error")
            debug.print_error(f"Error searching cities: {e}")
            raise APIResponseError(f"Error processing city search response: {e}")

    def get_weather_forecast(self, latitude: float, longitude: float) -> Optional[Dict]:
        """
        Get 16-day weather forecast with hourly data.

        Args:
            latitude: City latitude
            longitude: City longitude

        Returns:
            Dictionary with current weather and 16-day forecast
        """
        try:
            # Use requests directly for weather forecast (simpler approach)
            import requests
            params = {
                "latitude": latitude,
                "longitude": longitude,
                "hourly": [
                    "temperature_2m",
                    "apparent_temperature",
                    "precipitation",
                    "wind_speed_10m",
                    "wind_direction_10m"
                ],
                "daily": [
                    "temperature_2m_max",
                    "temperature_2m_min",
                    "apparent_temperature_max",
                    "apparent_temperature_min",
                    "precipitation_sum",
                    "wind_speed_10m_max",
                    "wind_direction_10m_dominant"
                ],
                "timezone": "auto",
                "forecast_days": APIConstants.FORECAST_DAYS
            }

            start_time = time.time()
            response = requests.get(self.forecast_url, params=params, timeout=APIConstants.TIMEOUT_SECONDS)
            response.raise_for_status()
            data = response.json()
            response_time = time.time() - start_time

            debug.print_api_call("Weather Forecast", "success", response_time)

            # Process hourly data
            hourly_data = data.get('hourly', {})
            times = hourly_data.get('time', [])

            # Group hourly data by day
            daily_forecasts = {}
            current_time = datetime.now()

            for i, time_str in enumerate(times):
                time_obj = datetime.fromisoformat(time_str.replace('Z', '+00:00'))

                # Skip past hours
                if time_obj < current_time - timedelta(hours=1):
                    continue

                day_key = time_obj.strftime('%Y-%m-%d')
                if day_key not in daily_forecasts:
                    daily_forecasts[day_key] = []

                hourly_entry = {
                    'time': time_str,
                    'hour': time_obj.hour,
                    'temperature': hourly_data.get('temperature_2m', [])[i],
                    'feels_like': hourly_data.get('apparent_temperature', [])[i],
                    'precipitation': hourly_data.get('precipitation', [])[i],
                    'wind_speed': hourly_data.get('wind_speed_10m', [])[i],
                    'wind_direction': hourly_data.get('wind_direction_10m', [])[i]
                }
                daily_forecasts[day_key].append(hourly_entry)

            # Process daily summaries
            daily_data = data.get('daily', {})
            daily_times = daily_data.get('time', [])
            daily_summaries = {}

            for i, day_time in enumerate(daily_times):
                day_key = day_time
                daily_summaries[day_key] = {
                    'date': day_time,
                    'temp_max': daily_data.get('temperature_2m_max', [])[i],
                    'temp_min': daily_data.get('temperature_2m_min', [])[i],
                    'feels_like_max': daily_data.get('apparent_temperature_max', [])[i],
                    'feels_like_min': daily_data.get('apparent_temperature_min', [])[i],
                    'precipitation_sum': daily_data.get('precipitation_sum', [])[i],
                    'wind_speed_max': daily_data.get('wind_speed_10m_max', [])[i],
                    'wind_direction': daily_data.get('wind_direction_10m_dominant', [])[i]
                }

            result = {
                'current': self._get_current_weather(daily_forecasts, daily_summaries),
                'daily_forecasts': daily_forecasts,
                'daily_summaries': daily_summaries,
                'timezone': data.get('timezone', 'UTC')
            }

            # Debug output for weather data
            debug.print_daily_forecast(daily_summaries)
            debug.print_hourly_forecast(daily_forecasts)

            return result

        except requests.exceptions.RequestException as e:
            debug.print_api_call("Weather Forecast", "error")
            debug.print_error(f"Network error fetching weather forecast: {e}")
            raise NetworkError(f"Failed to fetch weather forecast: {e}", getattr(e.response, 'status_code', None))
        except Exception as e:
            debug.print_api_call("Weather Forecast", "error")
            debug.print_error(f"Error fetching weather forecast: {e}")
            raise DataProcessingError(f"Error processing weather forecast data: {e}")

    def get_air_quality(self, latitude: float, longitude: float) -> Optional[Dict]:
        """
        Get air quality data.

        Args:
            latitude: City latitude
            longitude: City longitude

        Returns:
            Dictionary with air quality data
        """
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "hourly": [
                "european_aqi",
                "us_aqi",
                "pm2_5",
                "pm10"
            ],
            "timezone": "auto"
        }

        try:
            start_time = time.time()
            # Use requests directly for air quality
            import requests
            response = requests.get(self.air_quality_url, params=params, timeout=APIConstants.TIMEOUT_SECONDS)
            response.raise_for_status()
            data = response.json()
            response_time = time.time() - start_time

            debug.print_api_call("Air Quality", "success", response_time)

            hourly_data = data.get('hourly', {})
            times = hourly_data.get('time', [])

            if not times:
                return None

            # Get current air quality (most recent)
            current_aq = {
                'time': times[0],
                'european_aqi': hourly_data.get('european_aqi', [0])[0],
                'us_aqi': hourly_data.get('us_aqi', [0])[0],
                'pm2_5': hourly_data.get('pm2_5', [0])[0],
                'pm10': hourly_data.get('pm10', [0])[0]
            }

            return current_aq

        except requests.exceptions.RequestException as e:
            debug.print_api_call("Air Quality", "error")
            debug.print_error(f"Network error fetching air quality: {e}")
            raise NetworkError(f"Failed to fetch air quality: {e}", getattr(e.response, 'status_code', None))
        except Exception as e:
            debug.print_api_call("Air Quality", "error")
            debug.print_error(f"Error fetching air quality: {e}")
            raise DataProcessingError(f"Error processing air quality data: {e}")

    def _get_current_weather(self, daily_forecasts: Dict, daily_summaries: Dict) -> Dict:
        """Extract current weather from hourly data."""
        today = datetime.now().strftime('%Y-%m-%d')

        if today in daily_forecasts and daily_forecasts[today]:
            # Get the most recent hourly data for today
            current_hourly = daily_forecasts[today][0]
            return {
                'temperature': current_hourly['temperature'],
                'feels_like': current_hourly['feels_like'],
                'precipitation': current_hourly['precipitation'],
                'wind_speed': current_hourly['wind_speed'],
                'wind_direction': current_hourly['wind_direction']
            }

        # Fallback to daily summary
        if today in daily_summaries:
            daily = daily_summaries[today]
            return {
                'temperature': daily.get('temp_max', 0),
                'feels_like': daily.get('feels_like_max', 0),
                'precipitation': daily.get('precipitation_sum', 0),
                'wind_speed': daily.get('wind_speed_max', 0),
                'wind_direction': daily.get('wind_direction', 0)
            }

        return {
            'temperature': 0,
            'feels_like': 0,
            'precipitation': 0,
            'wind_speed': 0,
            'wind_direction': 0
        }
