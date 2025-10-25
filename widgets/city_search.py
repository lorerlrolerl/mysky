"""
City search widget with autocomplete functionality.
"""

from kivy.uix.boxlayout import BoxLayout
from kivy.uix.textinput import TextInput
from kivy.uix.button import Button
from kivy.clock import Clock
from typing import List, Dict, Callable
import threading


class CitySearchWidget(BoxLayout):
    """Widget for city search with autocomplete dropdown."""

    def __init__(self, on_city_selected: Callable = None, **kwargs):
        super().__init__(**kwargs)
        self.orientation = 'vertical'
        self.size_hint_y = None
        self.height = 200

        self.on_city_selected = on_city_selected
        self.search_results = []
        self.search_thread = None
        self.search_debounce = None

        self._setup_ui()

    def _setup_ui(self):
        """Setup the UI components."""
        # Search input
        self.search_input = TextInput(
            hint_text='Enter city name...',
            multiline=False,
            size_hint_y=None,
            height=40
        )
        self.search_input.bind(text=self._on_text_change)
        self.add_widget(self.search_input)

        # Search button
        self.search_button = Button(
            text='Search',
            size_hint_y=None,
            height=40
        )
        self.search_button.bind(on_press=self._on_search_pressed)
        self.add_widget(self.search_button)

        # Results container
        self.results_container = BoxLayout(
            orientation='vertical',
            size_hint_y=None,
            height=0
        )
        self.add_widget(self.results_container)

    def _on_text_change(self, instance, text):
        """Handle text input changes with debouncing."""
        if self.search_debounce:
            Clock.unschedule(self.search_debounce)

        if len(text.strip()) >= 2:  # Minimum 2 characters
            self.search_debounce = Clock.schedule_once(
                lambda dt: self._search_cities(text), 0.5
            )
        else:
            self._clear_results()

    def _on_search_pressed(self, instance):
        """Handle search button press."""
        text = self.search_input.text.strip()
        if text:
            self._search_cities(text)

    def _search_cities(self, query: str):
        """Search for cities in a separate thread."""
        if self.search_thread and self.search_thread.is_alive():
            return

        self.search_thread = threading.Thread(
            target=self._perform_search,
            args=(query,)
        )
        self.search_thread.daemon = True
        self.search_thread.start()

    def _perform_search(self, query: str):
        """Perform the actual search (runs in thread)."""
        try:
            # Import here to avoid circular imports
            from api.weather_api import WeatherAPI

            api = WeatherAPI()
            results = api.search_cities(query, count=5)

            # Schedule UI update on main thread
            Clock.schedule_once(
                lambda dt: self._update_results(results), 0
            )
        except Exception as e:
            print(f"Error searching cities: {e}")
            Clock.schedule_once(
                lambda dt: self._update_results([]), 0
            )

    def _update_results(self, results: List[Dict]):
        """Update the results display."""
        self.search_results = results
        self._clear_results()

        if not results:
            return

        # Show results
        self.results_container.height = min(len(results) * 50, 200)

        for i, city in enumerate(results):
            city_button = Button(
                text=city['display_name'],
                size_hint_y=None,
                height=50
            )
            city_button.bind(
                on_press=lambda btn, c=city: self._select_city(c)
            )
            self.results_container.add_widget(city_button)

    def _clear_results(self):
        """Clear the results display."""
        self.results_container.clear_widgets()
        self.results_container.height = 0

    def _select_city(self, city: Dict):
        """Handle city selection."""
        self.search_input.text = city['display_name']
        self._clear_results()

        if self.on_city_selected:
            self.on_city_selected(city)

    def get_selected_city(self) -> Dict:
        """Get the currently selected city data."""
        if self.search_results:
            # Find matching city from results
            for city in self.search_results:
                if city['display_name'] == self.search_input.text:
                    return city
        return None
