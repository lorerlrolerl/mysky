"""
Weather summary widget for displaying daily weather summary.
"""

from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from kivy.uix.gridlayout import GridLayout
from kivy.graphics import Color, RoundedRectangle
from kivy.metrics import dp
from typing import Dict, List

from widgets.weather_image_icon import WeatherImageIcon
from widgets.ui_icon import UIIcon


class WeatherSummary(BoxLayout):
    """Widget for displaying weather summary for any selected day."""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.orientation = 'vertical'
        self.size_hint_y = None
        self.height = dp(180)
        self.padding = dp(20)
        self.spacing = dp(15)

        self._setup_ui()
        self._setup_graphics()

    def _setup_ui(self):
        """Setup the UI components."""
        # Main weather info container
        self.weather_info_container = BoxLayout(
            orientation='horizontal',
            size_hint_y=0.6,
            spacing=dp(20)
        )

        # Weather icon (left side)
        self.weather_icon = WeatherImageIcon(
            icon_size=48,
            show_text=False,
            size_hint_x=0.2
        )
        self.weather_info_container.add_widget(self.weather_icon)

        # Weather description (next to icon)
        self.weather_desc = Label(
            text='Clear',
            font_size=dp(16),
            color=(1, 1, 1, 1),
            size_hint_x=0.3,
            halign='left'
        )
        self.weather_info_container.add_widget(self.weather_desc)

        # Temperature range (right side)
        self.temp_range = Label(
            text='22°C / 18°C',
            font_size=dp(20),
            bold=True,
            color=(1, 1, 1, 1),
            size_hint_x=0.5,
            halign='right'
        )
        self.weather_info_container.add_widget(self.temp_range)

        self.add_widget(self.weather_info_container)

        # Details container with rotated table format
        self.details_container = GridLayout(
            cols=5,  # 5 columns for the 5 weather metrics
            size_hint_y=0.4,
            spacing=dp(5),
            padding=[dp(10), dp(5), dp(10), dp(5)]
        )

        # Create table headers for weather metrics
        self._create_metric_header('Temperature')
        self._create_metric_header('Feels Like')
        self._create_metric_header('Wind Speed')
        self._create_metric_header('Total Rain')
        self._create_metric_header('Rain Chance')
        
        # Create value rows for all weather data
        self.temp_value = self._create_value_cell('--°C')
        self.feels_like_value = self._create_value_cell('--°C')
        self.wind_value = self._create_value_cell('-- km/h')
        self.rain_value = self._create_value_cell('-- mm')
        self.rain_chance_value = self._create_value_cell('--%')

        self.add_widget(self.details_container)

    def _get_weather_description(self, weather_code):
        """Get weather description from weather code."""
        descriptions = {
            0: "Clear sky",
            1: "Mainly clear", 
            2: "Partly cloudy",
            3: "Overcast",
            45: "Fog",
            48: "Depositing rime fog",
            51: "Light drizzle",
            53: "Moderate drizzle", 
            55: "Dense drizzle",
            56: "Light freezing drizzle",
            57: "Dense freezing drizzle",
            61: "Slight rain",
            63: "Moderate rain",
            65: "Heavy rain",
            66: "Light freezing rain",
            67: "Heavy freezing rain",
            71: "Slight snow",
            73: "Moderate snow",
            75: "Heavy snow",
            77: "Snow grains",
            80: "Slight rain showers",
            81: "Moderate rain showers",
            82: "Violent rain showers",
            85: "Slight snow showers",
            86: "Heavy snow showers",
            95: "Thunderstorm",
            96: "Thunderstorm with slight hail",
            99: "Thunderstorm with heavy hail"
        }
        return descriptions.get(weather_code, "Unknown")

    def _create_metric_header(self, metric):
        """Create a metric header cell."""
        header = Label(
            text=metric,
            font_size=dp(10),
            bold=True,
            color=(1, 1, 1, 0.9),
            size_hint_x=1,
            halign='center'
        )
        self.details_container.add_widget(header)

    def _create_value_cell(self, value):
        """Create a value cell for weather data."""
        value_label = Label(
            text=value,
            font_size=dp(11),
            bold=True,
            color=(1, 1, 1, 1),
            size_hint_x=1,
            halign='center'
        )
        self.details_container.add_widget(value_label)
        
        return value_label  # Return the value label for updating

    def _setup_graphics(self):
        """Setup glass effect background."""
        with self.canvas.before:
            Color(1, 1, 1, 0.1)
            self.bg = RoundedRectangle(
                pos=self.pos,
                size=self.size,
                radius=[dp(20)]
            )
            self.bind(pos=self._update_bg, size=self._update_bg)

    def _update_bg(self, *args):
        """Update background position and size."""
        self.bg.pos = self.pos
        self.bg.size = self.size


    def update_weather_summary(self, daily_summary: Dict, hourly_data: List[Dict]):
        """Update the weather summary with daily data."""
        if not daily_summary:
            self.clear_data()
            return

        # Get weather description from weather code
        weather_code = daily_summary.get('weather_code', 0)
        weather_desc = self._get_weather_description(weather_code)

        # Update weather icon
        self.weather_icon.update_for_daily_summary(daily_summary, hourly_data, animate=True)

        # Update description
        self.weather_desc.text = weather_desc

        # Update temperature range
        temp_max = daily_summary.get('temp_max', 0)
        temp_min = daily_summary.get('temp_min', 0)
        self.temp_range.text = f'{temp_max:.1f}°C / {temp_min:.1f}°C'

        # Check if this is today
        from datetime import datetime
        today = datetime.now().date()
        try:
            date_obj = datetime.fromisoformat(daily_summary.get('date', ''))
            is_today = date_obj.date() == today
        except Exception:
            is_today = False

        if is_today:
            # For today: show current conditions
            self._update_today_summary(daily_summary, hourly_data)
        else:
            # For other days: show total rain and rain chance
            self._update_other_days_summary(daily_summary, hourly_data)

    def _update_today_summary(self, daily_summary: Dict, hourly_data: List[Dict]):
        """Update summary for today with current conditions."""
        from datetime import datetime
        
        # Get current hour
        current_hour = datetime.now().hour
        
        # Find current hour data
        current_temp = 0
        current_feels_like = 0
        current_wind = 0
        
        if hourly_data:
            for hour_data in hourly_data:
                hour_time = datetime.fromisoformat(hour_data['time'].replace('Z', '+00:00'))
                if hour_time.hour == current_hour:
                    current_temp = hour_data.get('temperature', 0)
                    current_feels_like = hour_data.get('feels_like', 0)
                    current_wind = hour_data.get('wind_speed', 0)
                    break
        
        # Fallback to daily averages if no current hour data
        if current_temp == 0:
            current_temp = (daily_summary.get('temp_max', 0) + daily_summary.get('temp_min', 0)) / 2
        if current_feels_like == 0:
            current_feels_like = (daily_summary.get('feels_like_max', 0) + daily_summary.get('feels_like_min', 0)) / 2
        if current_wind == 0:
            current_wind = daily_summary.get('wind_speed_max', 0)

        # Calculate rain chance from hourly data
        rain_chance = 0
        if hourly_data:
            rainy_hours = sum(1 for h in hourly_data if h.get('precipitation', 0) > 0.5)
            rain_chance = (rainy_hours / len(hourly_data)) * 100

        # Get total rain for the day
        total_rain = daily_summary.get('precipitation_sum', 0)

        # Update rotated table with current conditions for today
        self.temp_value.text = f'{current_temp:.1f}°C'
        self.feels_like_value.text = f'{current_feels_like:.1f}°C'
        self.wind_value.text = f'{current_wind:.1f} km/h'
        self.rain_value.text = f'{total_rain:.1f} mm'
        self.rain_chance_value.text = f'{rain_chance:.0f}%'
        
        print(f"DEBUG: TODAY TABLE - Temp: {current_temp:.1f}°C, Feels Like: {current_feels_like:.1f}°C, Wind: {current_wind:.1f} km/h")
        print(f"DEBUG: TODAY TABLE - Total Rain: {total_rain:.1f} mm, Rain Chance: {rain_chance:.0f}%")

    def _update_other_days_summary(self, daily_summary: Dict, hourly_data: List[Dict]):
        """Update summary for other days with averages and totals."""
        # Calculate averages from hourly data
        avg_temp = 0
        avg_feels_like = 0
        max_wind = 0
        
        if hourly_data:
            temps = [h.get('temperature', 0) for h in hourly_data]
            feels_likes = [h.get('feels_like', 0) for h in hourly_data]
            winds = [h.get('wind_speed', 0) for h in hourly_data]
            
            avg_temp = sum(temps) / len(temps) if temps else 0
            avg_feels_like = sum(feels_likes) / len(feels_likes) if feels_likes else 0
            max_wind = max(winds) if winds else 0
        else:
            # Fallback to daily averages
            avg_temp = (daily_summary.get('temp_max', 0) + daily_summary.get('temp_min', 0)) / 2
            avg_feels_like = (daily_summary.get('feels_like_max', 0) + daily_summary.get('feels_like_min', 0)) / 2
            max_wind = daily_summary.get('wind_speed_max', 0)

        # Calculate rain chance from hourly data
        rain_chance = 0
        if hourly_data:
            rainy_hours = sum(1 for h in hourly_data if h.get('precipitation', 0) > 0.5)
            rain_chance = (rainy_hours / len(hourly_data)) * 100

        # Get total rain
        total_rain = daily_summary.get('precipitation_sum', 0)

        # Update rotated table with average data for other days
        self.temp_value.text = f'{avg_temp:.1f}°C'
        self.feels_like_value.text = f'{avg_feels_like:.1f}°C'
        self.wind_value.text = f'{max_wind:.1f} km/h'
        self.rain_value.text = f'{total_rain:.1f} mm'
        self.rain_chance_value.text = f'{rain_chance:.0f}%'
        
        print(f"DEBUG: OTHER DAYS TABLE - Avg Temp: {avg_temp:.1f}°C, Avg Feels Like: {avg_feels_like:.1f}°C, Max Wind: {max_wind:.1f} km/h")
        print(f"DEBUG: OTHER DAYS TABLE - Total Rain: {total_rain:.1f} mm, Rain Chance: {rain_chance:.0f}%")

    def clear_data(self):
        """Clear all weather data."""
        self.weather_icon.set_weather_icon('unknown', animate=False)
        self.weather_desc.text = 'Unknown'
        self.temp_range.text = '--°C / --°C'
        self.temp_card.children[0].text = '--°C'
        self.wind_card.children[0].text = '-- km/h'
        self.rain_card.children[0].text = '-- mm'
