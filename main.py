"""
MySky Weather App - Privacy-focused weather app for Android.
"""

import sys
from kivy.app import App
from kivy.uix.screenmanager import ScreenManager
from kivy.core.window import Window

from screens.modern_search_screen import ModernSearchScreen
from screens.modern_weather_screen import ModernWeatherScreen
from utils.cache import ensure_cache_directory
from utils.debug import enable_debug, debug


class MySkyApp(App):
    """Main application class."""

    def build(self):
        """Build the application."""
        # Ensure cache directory exists
        ensure_cache_directory()

        # Set window size for development (will be overridden on Android)
        Window.size = (400, 700)

        # Create screen manager
        sm = ScreenManager()

        # Create screens
        search_screen = ModernSearchScreen(on_city_selected=self._on_city_selected)
        weather_screen = ModernWeatherScreen()

        # Add screens to manager
        sm.add_widget(search_screen)
        sm.add_widget(weather_screen)

        # Start with search screen
        sm.current = 'search'

        return sm

    def _on_city_selected(self, city):
        """Handle city selection from search screen."""
        # Switch to weather screen and update with selected city
        weather_screen = self.root.get_screen('weather')
        weather_screen.update_city(city)
        self.root.current = 'weather'


def main():
    """Main entry point."""
    # Check for debug flag
    if '--debug' in sys.argv:
        enable_debug()
        debug.print_header("MySky Weather App - Debug Mode")
        print("🔍 Debug mode enabled - showing detailed API responses")
        print("📱 GUI will still be displayed alongside debug output\n")
        print("DEBUG: Debug system initialized successfully")

    MySkyApp().run()


if __name__ == "__main__":
    main()
