"""
Modern weather screen with beautiful UI and better navigation.
"""

from kivy.uix.screenmanager import Screen
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from kivy.uix.button import Button
from kivy.uix.popup import Popup
from kivy.clock import Clock
from kivy.metrics import dp
from kivy.graphics import Color, RoundedRectangle, Rectangle
from kivy.animation import Animation
from typing import Dict, Optional
import threading

# ModernCurrentWeatherCard and ModernDayForecastCard imports removed
from widgets.ui_icon import UIIcon


class ModernWeatherScreen(Screen):
    """Modern weather screen with beautiful UI and smooth navigation."""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.name = 'weather'

        self.current_city = None
        self.weather_data = None
        self.air_quality_data = None
        self.daily_forecasts = {}
        self.daily_summaries = {}
        self.current_day_index = 0
        self.total_days = 0
        self.day_forecast_card = None

        self._setup_ui()

    def _setup_ui(self):
        """Setup the modern UI with beautiful design."""
        # Main container with gradient background
        self.main_container = BoxLayout(
            orientation='vertical',
            padding=0,
            spacing=0
        )
        self._setup_background()

        # Header section
        self._setup_header()

        # Content section
        self._setup_content()

        self.add_widget(self.main_container)

    def _setup_background(self):
        """Setup beautiful gradient background."""
        with self.main_container.canvas.before:
            # Gradient background
            Color(0.1, 0.2, 0.4, 1)  # Dark blue
            self.bg_rect = Rectangle(pos=self.main_container.pos, size=self.main_container.size)
            self.main_container.bind(pos=self._update_bg, size=self._update_bg)

    def _update_bg(self, *args):
        """Update background rectangle."""
        self.bg_rect.pos = self.main_container.pos
        self.bg_rect.size = self.main_container.size

    def _setup_header(self):
        """Setup modern header with navigation."""
        # Header container with fixed height to prevent overlap
        self.header_container = BoxLayout(
            orientation='horizontal',
            size_hint_y=None,  # Use fixed height instead of percentage
            height=dp(60),  # Fixed height in density-independent pixels
            padding=[dp(20), dp(8), dp(20), dp(8)],
            spacing=dp(15)
        )

        # Add glass effect to header
        with self.header_container.canvas.before:
            Color(1, 1, 1, 0.1)  # Semi-transparent white
            self.header_bg = RoundedRectangle(
                pos=self.header_container.pos,
                size=self.header_container.size,
                radius=[dp(20)]
            )
            self.header_container.bind(pos=self._update_header_bg, size=self._update_header_bg)

        # Back button using UIIcon directly (no separate Button)
        self.back_button = UIIcon(
            icon_name='back',
            size=dp(32),
            size_hint=(0.15, 0.8)  # 15% width, 80% height of container
        )
        self.back_button.bind(on_press=self._on_back_pressed)
        self.header_container.add_widget(self.back_button)

        # City name with beautiful typography - use remaining space with text scaling
        self.city_label = Label(
            text='Loading...',
            font_size=dp(20),
            bold=True,
            color=(1, 1, 1, 1),
            size_hint=(0.7, 1),  # 70% width, full height
            text_size=(None, None),
            halign='center',
            valign='middle'
        )
        self.header_container.add_widget(self.city_label)

        # Refresh button using UIIcon directly (no separate Button)
        self.refresh_button = UIIcon(
            icon_name='refresh',
            size=dp(32),
            size_hint=(0.15, 0.8)  # 15% width, 80% height of container
        )
        self.refresh_button.bind(on_press=self._on_refresh_pressed)
        self.header_container.add_widget(self.refresh_button)

        self.main_container.add_widget(self.header_container)

        # Bind to window size changes for text scaling
        from kivy.core.window import Window
        Window.bind(size=self._on_window_resize)

    def _on_window_resize(self, instance, size):
        """Handle window resize to scale text appropriately."""
        width, height = size

        # Calculate appropriate font size based on available width
        # Available width for city name is approximately 70% of window width
        available_width = width * 0.7

        # Scale font size based on available width
        if available_width < 200:
            font_size = dp(14)  # Very small
        elif available_width < 300:
            font_size = dp(16)  # Small
        elif available_width < 400:
            font_size = dp(18)  # Medium
        else:
            font_size = dp(20)  # Normal

        # Update city label font size
        if hasattr(self, 'city_label'):
            self.city_label.font_size = font_size

    def _update_header_bg(self, *args):
        """Update header background."""
        self.header_bg.pos = self.header_container.pos
        self.header_bg.size = self.header_container.size

    def _setup_content(self):
        """Setup content sections positioned right below header and navigation."""
        # Day navigation with modern design (positioned after header)
        self._setup_day_navigation()

        # Current weather section removed entirely

        # Weather summary container with fixed height to prevent overlap
        self.weather_summary_container = BoxLayout(
            orientation='vertical',
            size_hint_y=None,  # Use fixed height instead of percentage
            height=dp(200),  # Fixed height in density-independent pixels
            spacing=dp(8),
            padding=[dp(15), dp(8), dp(15), dp(8)]
        )

        # Weather summary widget
        from widgets.weather_summary import WeatherSummary
        self.weather_summary = WeatherSummary()
        self.weather_summary_container.add_widget(self.weather_summary)
        self.main_container.add_widget(self.weather_summary_container)

        # Graphs section - takes remaining space with flexible height
        self.graphs_container = BoxLayout(
            orientation='vertical',
            size_hint_y=1.0,  # Take all remaining space
            spacing=dp(10),
            padding=[dp(15), dp(8), dp(15), dp(8)]
        )

        # Add graphs widget here (placeholder for now)
        from widgets.modern_graphs import ModernGraphsWidget
        self.graphs_widget = ModernGraphsWidget()
        self.graphs_container.add_widget(self.graphs_widget)
        self.main_container.add_widget(self.graphs_container)

    def _setup_day_navigation(self):
        """Setup modern day navigation."""
        # Navigation container with fixed height to prevent overlap
        self.nav_container = BoxLayout(
            orientation='horizontal',
            size_hint_y=None,  # Use fixed height instead of percentage
            height=dp(50),  # Fixed height in density-independent pixels
            padding=[dp(15), dp(8), dp(15), dp(8)],
            spacing=dp(15)
        )

        # Add glass effect
        with self.nav_container.canvas.before:
            Color(1, 1, 1, 0.1)
            self.nav_bg = RoundedRectangle(
                pos=self.nav_container.pos,
                size=self.nav_container.size,
                radius=[dp(15)]
            )
            self.nav_container.bind(pos=self._update_nav_bg, size=self._update_nav_bg)

        # Previous button using UIIcon directly
        self.prev_button = UIIcon(
            icon_name='prev_day',
            size=dp(28),
            size_hint=(0.25, 0.8)  # 25% width, 80% height of container
        )
        self.prev_button.bind(on_press=self._prev_day)
        self.nav_container.add_widget(self.prev_button)

        # Day info with beautiful design - use relative sizing
        self.day_info_container = BoxLayout(
            orientation='vertical',
            size_hint=(0.5, 1),  # 50% width, full height
            spacing=dp(5)
        )

        self.day_label = Label(
            text='Today',
            font_size=dp(18),
            bold=True,
            color=(1, 1, 1, 1),
            size_hint=(1, 0.6)  # Full width, 60% height
        )
        self.day_info_container.add_widget(self.day_label)

        self.date_label = Label(
            text='Jan 15, 2024',
            font_size=dp(14),
            color=(0.8, 0.8, 0.8, 1),
            size_hint=(1, 0.4)  # Full width, 40% height
        )
        self.day_info_container.add_widget(self.date_label)

        self.nav_container.add_widget(self.day_info_container)

        # Next button using UIIcon directly
        self.next_button = UIIcon(
            icon_name='next_day',
            size=dp(28),
            size_hint=(0.25, 0.8)  # 25% width, 80% height of container
        )
        self.next_button.bind(on_press=self._next_day)
        self.nav_container.add_widget(self.next_button)

        self.main_container.add_widget(self.nav_container)

    def _update_nav_bg(self, *args):
        """Update navigation background."""
        self.nav_bg.pos = self.nav_container.pos
        self.nav_bg.size = self.nav_container.size

    def update_city(self, city: Dict):
        """Update the city and load weather data."""
        self.current_city = city
        self.city_label.text = city.get('display_name', 'Unknown City')

        # Animate city name change
        anim = Animation(opacity=0, duration=0.2) + Animation(opacity=1, duration=0.3)
        anim.start(self.city_label)

        # Load weather data
        self._load_weather_data()

    def _load_weather_data(self):
        """Load weather data with loading animation."""
        self._show_loading_popup()

        # Start background thread
        thread = threading.Thread(target=self._fetch_weather_data)
        thread.daemon = True
        thread.start()

    def _fetch_weather_data(self):
        """Fetch weather data from API."""
        try:
            from api.weather_api import WeatherAPI

            api = WeatherAPI()
            latitude = self.current_city['latitude']
            longitude = self.current_city['longitude']

            # Fetch data
            weather_data = api.get_weather_forecast(latitude, longitude)
            air_quality = api.get_air_quality(latitude, longitude)

            # Update UI on main thread
            Clock.schedule_once(
                lambda dt: self._update_weather_display(weather_data, air_quality), 0
            )

        except Exception as error:
            Clock.schedule_once(
                lambda dt: self._show_error_popup(str(error)), 0
            )

    def _update_weather_display(self, weather_data: Dict, air_quality: Optional[Dict]):
        """Update the weather display with animations."""
        if not weather_data:
            self._show_error_popup("Failed to load weather data")
            return

        self.weather_data = weather_data
        self.air_quality_data = air_quality

        # Update daily data
        self.daily_forecasts = weather_data.get('daily_forecasts', {})
        self.daily_summaries = weather_data.get('daily_summaries', {})

        # Initialize day navigation
        self.total_days = len(self.daily_summaries)
        self.current_day_index = 0
        self._update_day_navigation()
        self._show_current_day()

        # Hide loading popup
        self._hide_loading_popup()

    def _show_current_day(self):
        """Show current day with smooth animation."""
        if not self.daily_summaries or not self.daily_forecasts:
            return

        # Get current day data
        sorted_days = sorted(self.daily_summaries.items())
        if self.current_day_index >= len(sorted_days):
            return

        date_str, daily_summary = sorted_days[self.current_day_index]
        hourly_data = self.daily_forecasts.get(date_str, [])

        # Update weather summary for the selected day
        self.weather_summary.update_weather_summary(daily_summary, hourly_data)

        # Update graphs with the same data
        if hasattr(self, 'graphs_widget'):
            # Determine if this is today (index 0) or other days
            is_today = (self.current_day_index == 0)
            self.graphs_widget.update_graphs(daily_summary, hourly_data, is_today)

    def _update_day_navigation(self):
        """Update day navigation with current info."""
        if not self.daily_summaries:
            return

        # Update day and date labels
        sorted_days = sorted(self.daily_summaries.items())
        if self.current_day_index < len(sorted_days):
            date_str = sorted_days[self.current_day_index][0]
            try:
                from datetime import datetime, timedelta
                date_obj = datetime.fromisoformat(date_str)
                today = datetime.now().date()

                # Determine day name
                if date_obj.date() == today:
                    day_name = 'Today'
                elif date_obj.date() == today + timedelta(days=1):
                    day_name = 'Tomorrow'
                else:
                    day_name = date_obj.strftime('%A')

                # Update labels
                self.day_label.text = day_name
                self.date_label.text = date_obj.strftime('%b %d, %Y')
            except Exception:
                self.day_label.text = 'Today'
                self.date_label.text = 'Unknown'

        # Update button states
        self.prev_button.disabled = self.current_day_index == 0
        self.next_button.disabled = self.current_day_index >= self.total_days - 1

    def _prev_day(self, instance):
        """Navigate to previous day with animation."""
        if self.current_day_index > 0:
            self.current_day_index -= 1
            self._update_day_navigation()
            self._show_current_day()

    def _next_day(self, instance):
        """Navigate to next day with animation."""
        if self.current_day_index < self.total_days - 1:
            self.current_day_index += 1
            self._update_day_navigation()
            self._show_current_day()

    def _show_loading_popup(self):
        """Show modern loading popup."""
        content = BoxLayout(orientation='vertical', padding=dp(20))

        # Loading animation
        loading_label = Label(
            text='Loading weather data...',
            font_size=dp(18),
            color=(1, 1, 1, 1)
        )
        content.add_widget(loading_label)

        self.loading_popup = Popup(
            title='',
            content=content,
            size_hint=(0.6, 0.3),
            auto_dismiss=False,
            background='',
            separator_height=0
        )

        # Add glass effect to popup
        with self.loading_popup.canvas.before:
            Color(0.1, 0.2, 0.4, 0.9)
            self.popup_bg = RoundedRectangle(
                pos=self.loading_popup.pos,
                size=self.loading_popup.size,
                radius=[dp(15)]
            )

        self.loading_popup.open()

    def _hide_loading_popup(self):
        """Hide loading popup."""
        if hasattr(self, 'loading_popup'):
            self.loading_popup.dismiss()

    def _show_error_popup(self, message: str):
        """Show modern error popup."""
        content = BoxLayout(orientation='vertical', padding=dp(20), spacing=dp(15))

        error_label = Label(
            text=message,
            font_size=dp(16),
            color=(1, 1, 1, 1),
            text_size=(dp(300), None),
            halign='center'
        )
        content.add_widget(error_label)

        close_button = Button(
            text='Close',
            size_hint_y=None,
            height=dp(40),
            background_normal='',
            background_color=(0.8, 0.2, 0.2, 0.8),
            color=(1, 1, 1, 1)
        )
        close_button.bind(on_press=lambda x: error_popup.dismiss())
        content.add_widget(close_button)

        error_popup = Popup(
            title='',
            content=content,
            size_hint=(0.8, 0.4),
            auto_dismiss=True,
            background='',
            separator_height=0
        )

        # Add glass effect
        with error_popup.canvas.before:
            Color(0.2, 0.1, 0.1, 0.9)
            self.error_bg = RoundedRectangle(
                pos=error_popup.pos,
                size=error_popup.size,
                radius=[dp(15)]
            )

        error_popup.open()
        self._hide_loading_popup()

    def _on_back_pressed(self, instance):
        """Handle back button with animation."""
        if hasattr(self.parent, 'current'):
            self.parent.current = 'search'

    def _on_refresh_pressed(self, instance):
        """Handle refresh with animation."""
        if self.current_city:
            # Animate refresh button with opacity
            anim = Animation(opacity=0.5, duration=0.2) + Animation(opacity=1, duration=0.3)
            anim.start(self.refresh_button)
            self._load_weather_data()
