"""
Debug utilities for MySky Weather App.
Provides beautiful CLI output when running with --debug parameter.
"""

import sys
from datetime import datetime
from typing import Dict, List, Optional, Any
import json


class DebugOutput:
    """Beautiful CLI debug output for weather data."""

    def __init__(self, enabled: bool = False):
        self.enabled = enabled
        self.colors = {
            'header': '\033[95m',      # Magenta
            'success': '\033[92m',     # Green
            'warning': '\033[93m',     # Yellow
            'error': '\033[91m',       # Red
            'info': '\033[94m',        # Blue
            'bold': '\033[1m',         # Bold
            'underline': '\033[4m',    # Underline
            'end': '\033[0m'           # End color
        }

    def print_header(self, title: str):
        """Print a beautiful header."""
        if not self.enabled:
            return

        print(f"\n{self.colors['header']}{'='*60}{self.colors['end']}")
        print(f"{self.colors['header']}{self.colors['bold']}{title.center(60)}{self.colors['end']}")
        print(f"{self.colors['header']}{'='*60}{self.colors['end']}\n")

    def print_section(self, title: str):
        """Print a section header."""
        if not self.enabled:
            return

        print(f"\n{self.colors['info']}{self.colors['bold']}📊 {title}{self.colors['end']}")
        print(f"{self.colors['info']}{'─'*50}{self.colors['end']}")

    def print_api_call(self, api_name: str, status: str, response_time: float = None):
        """Print API call status."""
        if not self.enabled:
            return

        status_color = self.colors['success'] if status == 'success' else self.colors['error']
        time_str = f" ({response_time:.2f}s)" if response_time else ""

        print(f"{status_color}🌐 {api_name}: {status.upper()}{time_str}{self.colors['end']}")

    def print_city_search(self, query: str, results: List[Dict]):
        """Print city search results."""
        if not self.enabled:
            return

        self.print_section(f"City Search: '{query}'")
        if not results:
            print(f"{self.colors['warning']}⚠️  No cities found{self.colors['end']}")
            return

        for i, city in enumerate(results, 1):
            location = f"{city.get('name', 'Unknown')}"
            if city.get('admin1'):
                location += f", {city['admin1']}"
            if city.get('country'):
                location += f", {city['country']}"

            coords = f"({city.get('latitude', 0):.4f}, {city.get('longitude', 0):.4f})"
            print(f"  {i}. {self.colors['bold']}{location}{self.colors['end']} {coords}")

    def print_current_weather(self, city_name: str, weather: Dict, air_quality: Dict):
        """Print current weather information."""
        if not self.enabled:
            return

        self.print_section(f"Current Weather: {city_name}")

        if not weather:
            print(f"{self.colors['warning']}⚠️  No current weather data{self.colors['end']}")
            return

        # Temperature info
        temp = weather.get('temperature', '--')
        feels_like = weather.get('apparent_temperature', '--')
        print(f"🌡️  Temperature: {self.colors['bold']}{temp}°C{self.colors['end']} (feels like {feels_like}°C)")

        # Wind info
        wind_speed = weather.get('wind_speed_10m', '--')
        wind_dir = weather.get('wind_direction_10m', '--')
        print(f"💨 Wind: {wind_speed} km/h (direction: {wind_dir}°)")

        # Precipitation
        precip = weather.get('precipitation', '--')
        print(f"🌧️  Precipitation: {precip} mm")

        # Air quality
        if air_quality and air_quality.get('hourly_air_quality'):
            aqi_data = air_quality['hourly_air_quality'][0]
            eu_aqi = aqi_data.get('european_aqi', '--')
            us_aqi = aqi_data.get('us_aqi', '--')
            pm25 = aqi_data.get('pm2_5', '--')
            pm10 = aqi_data.get('pm10', '--')

            print(f"🌬️  Air Quality:")
            print(f"    EU AQI: {eu_aqi} | US AQI: {us_aqi}")
            print(f"    PM2.5: {pm25} μg/m³ | PM10: {pm10} μg/m³")

    def print_daily_forecast(self, daily_data: Dict):
        """Print daily forecast summary."""
        if not self.enabled:
            return

        self.print_section("16-Day Forecast Summary")

        if not daily_data:
            print(f"{self.colors['warning']}⚠️  No daily forecast data{self.colors['end']}")
            return

        for date, data in list(daily_data.items())[:5]:  # Show first 5 days
            date_obj = datetime.fromisoformat(date)
            day_name = date_obj.strftime('%A, %B %d')

            temp_max = data.get('temp_max', '--')
            temp_min = data.get('temp_min', '--')
            precip = data.get('precipitation_sum', '--')
            wind_max = data.get('wind_speed_max', '--')

            print(f"📅 {day_name}:")
            print(f"    🌡️  {temp_min}°C → {temp_max}°C")
            print(f"    🌧️  {precip} mm | 💨 {wind_max} km/h")

        if len(daily_data) > 5:
            print(f"    ... and {len(daily_data) - 5} more days")

    def print_hourly_forecast(self, hourly_data: Dict, day_limit: int = 2):
        """Print hourly forecast for first few days."""
        if not self.enabled:
            return

        self.print_section(f"Hourly Forecast (First {day_limit} Days)")

        if not hourly_data:
            print(f"{self.colors['warning']}⚠️  No hourly forecast data{self.colors['end']}")
            return

        day_count = 0
        for date, hours in hourly_data.items():
            if day_count >= day_limit:
                break

            date_obj = datetime.fromisoformat(date)
            day_name = date_obj.strftime('%A, %B %d')

            print(f"\n📅 {day_name}:")

            # Show every 3rd hour for readability
            for i, hour_data in enumerate(hours[::3]):
                time_str = hour_data['time'].split('T')[1][:5]  # HH:MM
                temp = hour_data.get('temperature', '--')
                feels_like = hour_data.get('apparent_temperature', '--')
                wind = hour_data.get('wind_speed', '--')
                precip = hour_data.get('precipitation', '--')

                print(f"    {time_str}: {temp}°C (feels {feels_like}°C) | 💨 {wind} km/h | 🌧️ {precip} mm")

            day_count += 1

    def print_data_summary(self, weather_data: Dict, air_quality_data: Dict):
        """Print a summary of all data received."""
        if not self.enabled:
            return

        self.print_section("Data Summary")

        # Weather data summary
        if weather_data:
            daily_count = len(weather_data.get('daily_summaries', {}))
            hourly_count = sum(len(hours) for hours in weather_data.get('daily_forecasts', {}).values())
            print(f"📊 Weather Data: {daily_count} days, {hourly_count} hourly entries")

        # Air quality summary
        if air_quality_data and air_quality_data.get('hourly_air_quality'):
            aqi_count = len(air_quality_data['hourly_air_quality'])
            print(f"🌬️  Air Quality: {aqi_count} hourly entries")

        # Cache info
        print(f"💾 Data cached for offline use")

    def print_error(self, error_msg: str):
        """Print error message."""
        if not self.enabled:
            return

        print(f"{self.colors['error']}❌ {error_msg}{self.colors['end']}")


# Global debug instance
debug = DebugOutput()


def enable_debug():
    """Enable debug output."""
    debug.enabled = True


def disable_debug():
    """Disable debug output."""
    debug.enabled = False


def is_debug_enabled() -> bool:
    """Check if debug is enabled."""
    return debug.enabled
