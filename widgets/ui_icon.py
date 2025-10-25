"""
UI icon widget for displaying UI icons as images.
Based on best practices from IconButton pattern.
"""

from kivy.uix.image import Image
from kivy.uix.behaviors import ButtonBehavior
from kivy.metrics import dp
from typing import Optional
from pathlib import Path
import os


class UIIcon(ButtonBehavior, Image):
    """Widget for displaying UI icons as images with button behavior."""

    def __init__(self, icon_name: str, size: int = 32, **kwargs):
        super().__init__(**kwargs)
        self.icon_name = icon_name
        self.size_hint = (None, None)
        self.size = (dp(size), dp(size))
        self.allow_stretch = True
        self.keep_ratio = True
        self.mipmap = True

        # Get the directory where this file is located using Path for robustness
        base = Path(__file__).resolve().parent
        self.assets_dir = base / '..' / 'assets' / 'ui_icons'

        # Set the icon
        self.set_icon(icon_name)

    def set_icon(self, icon_name: str):
        """Set the icon image using robust path resolution."""
        icon_path = self.assets_dir / f"{icon_name}.png"

        if icon_path.exists():
            self.source = str(icon_path)
            print(f"UI icon loaded: {icon_path}")
        else:
            print(f"UI icon file not found: {icon_path}")
            # Create a fallback with better visibility
            self._create_fallback_icon()

    def _create_fallback_icon(self):
        """Create a fallback icon with better visibility."""
        from kivy.graphics import Color, Ellipse, Line

        # Clear previous canvas instructions
        self.canvas.before.clear()

        # Create a simple colored circle as fallback
        with self.canvas.before:
            # Background circle
            Color(0.2, 0.4, 0.6, 1)  # Blue background
            Ellipse(pos=self.pos, size=self.size)

            # Inner circle for contrast
            Color(1, 1, 1, 1)  # White inner
            margin = dp(3)
            Ellipse(
                pos=(self.pos[0] + margin, self.pos[1] + margin),
                size=(self.size[0] - margin*2, self.size[1] - margin*2)
            )

            # Add a simple symbol based on icon name
            if 'back' in self.icon_name:
                # Draw a left arrow
                Color(0.2, 0.4, 0.6, 1)
                Line(points=[
                    self.pos[0] + self.size[0]*0.7, self.pos[1] + self.size[1]*0.3,
                    self.pos[0] + self.size[0]*0.3, self.pos[1] + self.size[1]*0.5,
                    self.pos[0] + self.size[0]*0.7, self.pos[1] + self.size[1]*0.7
                ], width=2)
            elif 'refresh' in self.icon_name:
                # Draw a circular arrow
                Color(0.2, 0.4, 0.6, 1)
                Line(circle=(
                    self.pos[0] + self.size[0]*0.5,
                    self.pos[1] + self.size[1]*0.5,
                    self.size[0]*0.3
                ), width=2)

        self.source = '' # Clear source to prevent loading issues

    def set_size(self, size: int):
        """Set icon size."""
        self.size = (dp(size), dp(size))
