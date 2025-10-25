"""
MySky Weather App - Privacy-focused weather app for Android.
"""

import sys
import logging
from typing import Optional

from kivy.app import App
from kivy.uix.screenmanager import ScreenManager
from kivy.core.window import Window
from kivy.utils import platform as kivy_platform

from screens.modern_search_screen import ModernSearchScreen
from screens.modern_weather_screen import ModernWeatherScreen
from utils.cache import ensure_cache_directory
from utils.debug import enable_debug, debug


LOGGER = logging.getLogger("mysky")


class MySkyApp(App):
    """Main application class."""

    def build(self):
        """Build and return the root widget (ScreenManager)."""
        # Ensure cache directory exists (fail gracefully if it does not)
        try:
            ensure_cache_directory()
        except Exception as exc:  # noqa: BLE001 - we want to log any problem here
            LOGGER.exception("Failed to ensure cache directory: %s", exc)

        # Only set a fixed Window size when not on mobile platforms
        if kivy_platform not in ("android", "ios"):
            Window.size = (400, 700)
            LOGGER.debug("Window size set to %s", Window.size)
        else:
            LOGGER.debug("Running on mobile platform (%s) — not forcing Window.size", kivy_platform)

        # Create screen manager and screens with explicit names
        sm = ScreenManager()
        # Pass the callback and set explicit names to avoid reliance on internal defaults
        search_screen = ModernSearchScreen(name="search", on_city_selected=self._on_city_selected)
        weather_screen = ModernWeatherScreen(name="weather")

        sm.add_widget(search_screen)
        sm.add_widget(weather_screen)

        # Start with search screen
        sm.current = "search"

        return sm

    def _on_city_selected(self, city: str) -> None:
        """Handle city selection from search screen.

        Safely switch to the weather screen and update the selected city. If the
        weather screen is not available or does not have the expected API,
        log an error.
        """
        if not self.root:
            LOGGER.error("Root ScreenManager is not initialized — cannot switch screens")
            return

        try:
            weather_screen = self.root.get_screen("weather")
        except Exception:
            LOGGER.exception("Weather screen not found in ScreenManager")
            return

        # Update the weather screen if it provides update_city
        if hasattr(weather_screen, "update_city"):
            try:
                weather_screen.update_city(city)
                self.root.current = "weather"
                LOGGER.debug("Switched to weather screen for city: %s", city)
            except Exception:
                LOGGER.exception("Failed to update weather screen with city '%s'", city)
        else:
            LOGGER.error("Weather screen does not implement update_city; city: %s", city)


def main(argv: Optional[list] = None):
    """Main entry point.

    argv is optional and provided for easier testing. If None, sys.argv is used.
    """
    args = argv if argv is not None else sys.argv

    # Check for debug flag (kept simple to avoid interfering with Kivy argument handling)
    if "--debug" in args:
        enable_debug()
        # configure Python logging to respect debug mode
        logging.basicConfig(level=logging.DEBUG, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
        LOGGER.debug("MySky Weather App - Debug Mode")
        debug.print_header("MySky Weather App - Debug Mode")
        LOGGER.debug("🔍 Debug mode enabled - showing detailed API responses")
        LOGGER.debug("📱 GUI will still be displayed alongside debug output")
        LOGGER.debug("DEBUG: Debug system initialized successfully")
    else:
        # default logging configuration for normal runs
        logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

    MySkyApp().run()


if __name__ == "__main__":
    main()