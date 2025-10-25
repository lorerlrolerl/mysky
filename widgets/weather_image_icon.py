"""
Weather icon widget using actual image files instead of emoji text.
"""

from kivy.uix.image import Image
from kivy.uix.label import Label
from kivy.uix.boxlayout import BoxLayout
from kivy.metrics import dp
from kivy.animation import Animation
from typing import Dict, Optional
import os

from utils.weather_condition_detector import WeatherConditionDetector


class WeatherImageIcon(BoxLayout):
    """Widget for displaying weather icons using actual image files."""

    # Weather icon file mappings based on WMO Weather interpretation codes
    WEATHER_ICONS = {
        # Clear conditions
        'clear': 'clear.png',
        'clear_night': 'clear_night.png',
        'mainly_clear': 'mainly_clear.png',
        'partly_cloudy': 'partly_cloudy.png',
        'overcast': 'overcast.png',

        # Fog conditions
        'fog': 'fog.png',

        # Drizzle conditions
        'light_drizzle': 'light_drizzle.png',
        'moderate_drizzle': 'moderate_drizzle.png',
        'dense_drizzle': 'dense_drizzle.png',
        'light_freezing_drizzle': 'light_freezing_drizzle.png',
        'dense_freezing_drizzle': 'dense_freezing_drizzle.png',

        # Rain conditions
        'light_rain': 'light_rain.png',
        'moderate_rain': 'moderate_rain.png',
        'heavy_rain': 'heavy_rain.png',
        'light_freezing_rain': 'light_freezing_rain.png',
        'heavy_freezing_rain': 'heavy_freezing_rain.png',

        # Snow conditions
        'light_snow': 'light_snow.png',
        'moderate_snow': 'moderate_snow.png',
        'heavy_snow': 'heavy_snow.png',
        'snow_grains': 'snow_grains.png',

        # Showers
        'light_rain_shower': 'light_rain_shower.png',
        'moderate_rain_shower': 'moderate_rain_shower.png',
        'heavy_rain_shower': 'heavy_rain_shower.png',
        'light_snow_shower': 'light_snow_shower.png',
        'heavy_snow_shower': 'heavy_snow_shower.png',

        # Thunderstorms
        'thunderstorm': 'thunderstorm.png',
        'thunderstorm_hail': 'thunderstorm_hail.png',
        'thunderstorm_heavy_hail': 'thunderstorm_heavy_hail.png',

        # Other conditions
        'windy': 'windy.png',
        'hot': 'hot.png',
        'cold': 'cold.png',
        'freezing': 'freezing.png',
        'unknown': 'unknown.png'
    }

    def __init__(self, icon_size: int = 64, show_text: bool = True, **kwargs):
        super().__init__(**kwargs)
        self.orientation = 'vertical'
        self.spacing = dp(5)
        self.icon_size = icon_size
        self.show_text = show_text
        self.current_icon = 'unknown'

        # Get the directory where this file is located
        self.assets_dir = os.path.join(os.path.dirname(__file__), '..', 'assets', 'weather_icons')

        self._setup_ui()

    def _setup_ui(self):
        """Setup the UI components."""
        # Weather icon image
        self.icon_image = Image(
            size_hint_y=None,
            height=dp(self.icon_size),
            mipmap=True
        )
        self.add_widget(self.icon_image)

        # Weather description text (optional)
        if self.show_text:
            self.desc_label = Label(
                text='Unknown',
                font_size=dp(12),
                color=(0.8, 0.8, 0.8, 1),
                size_hint_y=None,
                height=dp(20),
                text_size=(None, None),
                halign='center'
            )
            self.add_widget(self.desc_label)

        # Set initial icon
        self._set_icon('unknown')

    def _get_icon_path(self, condition: str) -> str:
        """Get the full path to the icon file."""
        icon_file = self.WEATHER_ICONS.get(condition, self.WEATHER_ICONS['unknown'])
        return os.path.join(self.assets_dir, icon_file)

    def _set_icon(self, condition: str):
        """Set the icon image."""
        icon_path = self._get_icon_path(condition)

        # Check if file exists, otherwise use fallback
        if not os.path.exists(icon_path):
            print(f"Weather icon file not found: {icon_path}")
            # Create a fallback colored rectangle
            self._create_fallback_icon(condition)
            return

        print(f"Loading weather icon: {icon_path}")
        self.icon_image.source = icon_path
        self.current_icon = condition

    def _create_fallback_icon(self, condition: str):
        """Create a fallback icon if image file doesn't exist."""
        from kivy.graphics import Color, Rectangle, Ellipse

        # Clear previous canvas instructions
        self.icon_image.canvas.before.clear()

        # Create a simple colored circle as fallback with better visibility
        with self.icon_image.canvas.before:
            # Background circle
            Color(0.2, 0.4, 0.6, 1)  # Blue background
            Ellipse(pos=self.icon_image.pos, size=self.icon_image.size)

            # Inner circle for contrast
            Color(0.8, 0.8, 0.8, 1)  # Light gray inner
            margin = dp(4)
            Ellipse(
                pos=(self.icon_image.pos[0] + margin, self.icon_image.pos[1] + margin),
                size=(self.icon_image.size[0] - margin*2, self.icon_image.size[1] - margin*2)
            )

        self.icon_image.source = '' # Clear source to prevent loading issues
        self.current_icon = condition

    def set_weather_icon(self, condition: str, animate: bool = True):
        """
        Set weather icon based on condition.

        Args:
            condition: Weather condition string
            animate: Whether to animate the change
        """
        if animate and self.current_icon != condition:
            # Animate icon change
            anim = Animation(opacity=0, duration=0.2)
            anim.bind(on_complete=lambda *args: self._update_icon(condition))
            anim.start(self)
        else:
            self._update_icon(condition)

    def _update_icon(self, condition: str):
        """Update the icon and animate back in."""
        self._set_icon(condition)

        # Update description text if enabled
        if self.show_text and hasattr(self, 'desc_label'):
            self.desc_label.text = self._get_condition_description(condition)

        # Animate back in
        anim = Animation(opacity=1, duration=0.3)
        anim.start(self)

    def _get_condition_description(self, condition: str) -> str:
        """Get human-readable description for condition."""
        descriptions = {
            'clear': 'Clear',
            'sunny': 'Sunny',
            'clear_night': 'Clear Night',
            'partly_cloudy': 'Partly Cloudy',
            'cloudy': 'Cloudy',
            'overcast': 'Overcast',
            'light_rain': 'Light Rain',
            'rain': 'Rain',
            'heavy_rain': 'Heavy Rain',
            'thunderstorm': 'Thunderstorm',
            'light_snow': 'Light Snow',
            'snow': 'Snow',
            'heavy_snow': 'Heavy Snow',
            'fog': 'Fog',
            'windy': 'Windy',
            'hot': 'Hot',
            'cold': 'Cold',
            'freezing': 'Freezing',
            'unknown': 'Unknown'
        }
        return descriptions.get(condition, 'Unknown')

    def set_size(self, size: int):
        """Set icon size."""
        self.icon_size = size
        self.icon_image.height = dp(size)

    def get_weather_icon_for_conditions(self, temperature: float, precipitation: float,
                                     wind_speed: float, hour: int = 12) -> str:
        """
        Get appropriate weather icon based on conditions.

        Args:
            temperature: Temperature in Celsius
            precipitation: Precipitation in mm
            wind_speed: Wind speed in km/h
            hour: Hour of day (0-23)

        Returns:
            Weather condition string
        """
        condition_code, description = WeatherConditionDetector.detect_condition(
            temperature, precipitation, wind_speed, hour
        )
        return condition_code

    def update_for_weather_data(self, weather_data: Dict, animate: bool = True):
        """
        Update icon based on weather data.

        Args:
            weather_data: Dictionary with weather information
            animate: Whether to animate the change
        """
        if not weather_data:
            self.set_weather_icon('unknown', animate)
            return

        temp = weather_data.get('temperature', 0)
        precip = weather_data.get('precipitation', 0)
        wind = weather_data.get('wind_speed', 0)
        hour = weather_data.get('hour', 12)

        condition = self.get_weather_icon_for_conditions(temp, precip, wind, hour)
        self.set_weather_icon(condition, animate)

    def update_for_daily_summary(self, daily_summary: Dict, hourly_data: list, animate: bool = True):
        """
        Update icon based on daily summary.

        Args:
            daily_summary: Daily weather summary
            hourly_data: List of hourly data
            animate: Whether to animate the change
        """
        if not daily_summary or not hourly_data:
            self.set_weather_icon('unknown', animate)
            return

        # Use the proper condition detector
        condition_code, description = WeatherConditionDetector.detect_daily_condition(hourly_data)
        self.set_weather_icon(condition_code, animate)
