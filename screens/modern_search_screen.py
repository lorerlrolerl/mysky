"""
Modern search screen with beautiful UI and smooth animations.
"""

from kivy.uix.screenmanager import Screen
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from kivy.uix.button import Button
from kivy.graphics import Color, RoundedRectangle, Rectangle
from kivy.metrics import dp
from kivy.animation import Animation
from typing import Dict, Callable

from widgets.city_search import CitySearchWidget
from widgets.ui_icon import UIIcon


class ModernSearchScreen(Screen):
    """Modern search screen with beautiful design."""

    def __init__(self, on_city_selected: Callable[[Dict], None], **kwargs):
        super().__init__(**kwargs)
        self.name = 'search'
        self.on_city_selected = on_city_selected

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
        """Setup modern header."""
        # Header container with glass effect
        self.header_container = BoxLayout(
            orientation='vertical',
            size_hint_y=None,
            height=dp(200),
            padding=[dp(30), dp(20), dp(30), dp(20)],
            spacing=dp(20)
        )

        # Add glass effect to header
        with self.header_container.canvas.before:
            Color(1, 1, 1, 0.1)  # Semi-transparent white
            self.header_bg = RoundedRectangle(
                pos=self.header_container.pos,
                size=self.header_container.size,
                radius=[dp(30)]
            )
            self.header_container.bind(pos=self._update_header_bg, size=self._update_header_bg)

        # App title only (no icon)
        self.app_title = Label(
            text='MySky',
            font_size=dp(32),
            bold=True,
            color=(1, 1, 1, 1),
            size_hint_y=None,
            height=dp(60)
        )
        self.header_container.add_widget(self.app_title)


        self.main_container.add_widget(self.header_container)

    def _update_header_bg(self, *args):
        """Update header background."""
        self.header_bg.pos = self.header_container.pos
        self.header_bg.size = self.header_container.size

    def _setup_content(self):
        """Setup content area with search widget."""
        # Content container
        self.content_container = BoxLayout(
            orientation='vertical',
            size_hint_y=1,
            padding=[dp(30), dp(20), dp(30), dp(30)],
            spacing=dp(20)
        )

        # Search widget with modern styling
        self.city_search_widget = CitySearchWidget(
            on_city_selected=self.on_city_selected
        )
        self.content_container.add_widget(self.city_search_widget)

        # Add some spacing
        spacer = BoxLayout(size_hint_y=1)
        self.content_container.add_widget(spacer)

        # Footer with info

        self.main_container.add_widget(self.content_container)

