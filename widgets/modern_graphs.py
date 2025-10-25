"""
Modern graphs widget for displaying weather data graphs.
"""

from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from kivy.uix.button import Button
from kivy.uix.scrollview import ScrollView
from kivy.metrics import dp
from kivy.graphics import Color, RoundedRectangle
from datetime import datetime
from typing import Dict, List

from constants import UIConstants, WeatherConstants

try:
    from kivy_garden.graph import Graph, LinePlot
    GRAPH_AVAILABLE = True
except ImportError:
    GRAPH_AVAILABLE = False


class ModernGraphsWidget(BoxLayout):
    """Widget for displaying weather graphs with tab system."""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.orientation = 'vertical'
        self.padding = UIConstants.PADDING['medium']
        self.spacing = UIConstants.SPACING['medium']

        # Current data
        self.daily_summary = {}
        self.hourly_data = []
        self.current_tab = 'temperature'

        # Graph widgets
        self.temp_graph = None
        self.wind_graph = None
        self.rain_graph = None

        self._setup_ui()
        self._setup_graphics()

    def _setup_ui(self):
        """Setup the UI components."""
        # Title
        self.title_label = Label(
            text='Weather Graphs',
            font_size=UIConstants.FONT_SIZES['medium'],
            bold=True,
            color=(1, 1, 1, 1),
            size_hint_y=None,
            height=UIConstants.ICON_SIZES['small']
        )
        self.add_widget(self.title_label)

        if not GRAPH_AVAILABLE:
            self._setup_fallback()
            return

        # Tab buttons
        self._setup_tabs()

        # Graph container with scrolling
        self.graph_scroll = ScrollView(
            do_scroll_x=True,
            do_scroll_y=False,
            scroll_distance=100,
            scroll_timeout=250
        )
        self.add_widget(self.graph_scroll)

        # Graph container
        self.graph_container = BoxLayout(
            orientation='vertical',
            size_hint_x=None,
            width=WeatherConstants.GRAPH_WIDTH,  # Use constant for width
            spacing=UIConstants.SPACING['medium']
        )
        self.graph_scroll.add_widget(self.graph_container)

        # Initialize graphs
        self._setup_graphs()

    def _setup_fallback(self):
        """Setup fallback UI when graphs are not available."""
        self.content_label = Label(
            text='Graphs require kivy-garden.graph\nInstall with: pip install kivy-garden.graph',
            font_size=UIConstants.FONT_SIZES['small'],
            color=(0.8, 0.8, 0.8, 1),
            halign='center',
            valign='middle'
        )
        self.add_widget(self.content_label)

    def _setup_tabs(self):
        """Setup tab buttons for different graph types."""
        self.tab_container = BoxLayout(
            orientation='horizontal',
            size_hint_y=None,
            height=UIConstants.NAV_HEIGHT,
            spacing=UIConstants.SPACING['small']
        )

        # Temperature tab
        self.temp_tab = Button(
            text='Temperature',
            font_size=UIConstants.FONT_SIZES['small'],
            size_hint=(1, 1),
            background_color=(0.2, 0.6, 1, 0.8)
        )
        self.temp_tab.bind(on_press=lambda x: self._switch_tab('temperature'))
        self.tab_container.add_widget(self.temp_tab)

        # Wind tab
        self.wind_tab = Button(
            text='Wind',
            font_size=UIConstants.FONT_SIZES['small'],
            size_hint=(1, 1),
            background_color=(0.3, 0.3, 0.3, 0.8)
        )
        self.wind_tab.bind(on_press=lambda x: self._switch_tab('wind'))
        self.tab_container.add_widget(self.wind_tab)

        # Rain tab
        self.rain_tab = Button(
            text='Rain',
            font_size=UIConstants.FONT_SIZES['small'],
            size_hint=(1, 1),
            background_color=(0.3, 0.3, 0.3, 0.8)
        )
        self.rain_tab.bind(on_press=lambda x: self._switch_tab('rain'))
        self.tab_container.add_widget(self.rain_tab)

        self.add_widget(self.tab_container)

    def _setup_graphs(self):
        """Setup the actual graph widgets."""
        if not GRAPH_AVAILABLE:
            return

        # Temperature graph
        self.temp_graph = Graph(
            xlabel='Hour',
            ylabel=f'Temperature ({WeatherConstants.TEMP_UNIT})',
            x_ticks_major=2,
            y_ticks_major=5,
            x_grid=True,
            y_grid=True,
            x_grid_label=True,
            y_grid_label=True,
            x_ticks_angle=WeatherConstants.X_TICKS_ANGLE,  # Use constant for angle
            size_hint_x=None,
            width=WeatherConstants.GRAPH_WIDTH,
            height=WeatherConstants.GRAPH_HEIGHT
        )
        self.temp_plot = LinePlot(color=[1, 0.5, 0, 1], line_width=2)
        self.temp_graph.add_plot(self.temp_plot)

        # Wind graph
        self.wind_graph = Graph(
            xlabel='Hour',
            ylabel=f'Wind Speed ({WeatherConstants.WIND_UNIT})',
            x_ticks_major=2,
            y_ticks_major=5,
            x_grid=True,
            y_grid=True,
            x_grid_label=True,
            y_grid_label=True,
            x_ticks_angle=WeatherConstants.X_TICKS_ANGLE,  # Use constant for angle
            size_hint_x=None,
            width=WeatherConstants.GRAPH_WIDTH,
            height=WeatherConstants.GRAPH_HEIGHT
        )
        self.wind_plot = LinePlot(color=[0, 1, 0, 1], line_width=2)
        self.wind_graph.add_plot(self.wind_plot)

        # Rain graph
        self.rain_graph = Graph(
            xlabel='Hour',
            ylabel=f'Precipitation ({WeatherConstants.RAIN_UNIT})',
            x_ticks_major=2,
            y_ticks_major=1,
            x_grid=True,
            y_grid=True,
            x_grid_label=True,
            y_grid_label=True,
            x_ticks_angle=WeatherConstants.X_TICKS_ANGLE,  # Use constant for angle
            size_hint_x=None,
            width=WeatherConstants.GRAPH_WIDTH,
            height=WeatherConstants.GRAPH_HEIGHT
        )
        self.rain_plot = LinePlot(color=[0, 0.5, 1, 1], line_width=2)
        self.rain_graph.add_plot(self.rain_plot)

        # Add only temperature graph initially (others will be shown/hidden)
        self.graph_container.add_widget(self.temp_graph)
        self.graph_container.add_widget(self.wind_graph)
        self.graph_container.add_widget(self.rain_graph)

        # Show temperature graph by default
        self._show_graph('temperature')

    def _switch_tab(self, tab_name):
        """Switch between different graph tabs."""
        self.current_tab = tab_name

        # Update button colors
        self.temp_tab.background_color = (0.2, 0.6, 1, 0.8) if tab_name == 'temperature' else (0.3, 0.3, 0.3, 0.8)
        self.wind_tab.background_color = (0.2, 0.6, 1, 0.8) if tab_name == 'wind' else (0.3, 0.3, 0.3, 0.8)
        self.rain_tab.background_color = (0.2, 0.6, 1, 0.8) if tab_name == 'rain' else (0.3, 0.3, 0.3, 0.8)

        # Show selected graph
        self._show_graph(tab_name)

    def _show_graph(self, graph_type):
        """Show the selected graph and hide others."""
        if not GRAPH_AVAILABLE:
            return

        # Remove all graphs from container
        self.graph_container.clear_widgets()

        # Add only the selected graph
        if graph_type == 'temperature':
            self.graph_container.add_widget(self.temp_graph)
        elif graph_type == 'wind':
            self.graph_container.add_widget(self.wind_graph)
        elif graph_type == 'rain':
            self.graph_container.add_widget(self.rain_graph)

    def _setup_graphics(self):
        """Setup background graphics."""
        with self.canvas.before:
            Color(1, 1, 1, 0.1)
            self.bg_rect = RoundedRectangle(
                pos=self.pos,
                size=self.size,
                radius=[dp(15)]
            )
            self.bind(pos=self._update_bg, size=self._update_bg)

    def _update_bg(self, *args):
        """Update background graphics."""
        self.bg_rect.pos = self.pos
        self.bg_rect.size = self.size

    def update_graphs(self, daily_summary: Dict, hourly_data: List[Dict], is_today: bool = True):
        """Update graphs with weather data."""
        self.daily_summary = daily_summary
        self.hourly_data = hourly_data
        self.is_today = is_today

        if not GRAPH_AVAILABLE or not hourly_data:
            return

        # Update all graphs
        self._update_temperature_graph()
        self._update_wind_graph()
        self._update_rain_graph()

    def _update_temperature_graph(self):
        """Update temperature graph with hourly data."""
        if not self.temp_graph or not self.hourly_data:
            return

        # Prepare data points
        points = []
        if self.is_today:
            # For today: start from current hour
            current_hour = datetime.now().hour
            for i, hour_data in enumerate(self.hourly_data):
                temp = hour_data.get('temperature', 0)
                # Map to 24-hour scale starting from current hour
                hour_index = (current_hour + i) % 24
                points.append((hour_index, temp))
        else:
            # For other days: start from hour 0 (midnight)
            for i, hour_data in enumerate(self.hourly_data):
                temp = hour_data.get('temperature', 0)
                points.append((i, temp))  # Direct mapping 0-23

        # Update plot
        self.temp_plot.points = points

        # Set graph bounds and X-axis labels
        if points:
            temps = [p[1] for p in points]
            min_temp = min(temps) - 2
            max_temp = max(temps) + 2
            self.temp_graph.xmin = 0
            self.temp_graph.xmax = 23  # Always show 0-23 hours
            self.temp_graph.ymin = min_temp
            self.temp_graph.ymax = max_temp

            # Set X-axis labels in "13h" format for all 24 hours
            x_labels = [f"{i}h" for i in range(24)]
            self.temp_graph.x_ticks = list(range(24))
            self.temp_graph.x_ticks_text = x_labels

    def _update_wind_graph(self):
        """Update wind graph with hourly data."""
        if not self.wind_graph or not self.hourly_data:
            return

        # Prepare data points
        points = []
        if self.is_today:
            # For today: start from current hour
            current_hour = datetime.now().hour
            for i, hour_data in enumerate(self.hourly_data):
                wind = hour_data.get('wind_speed', 0)
                # Map to 24-hour scale starting from current hour
                hour_index = (current_hour + i) % 24
                points.append((hour_index, wind))
        else:
            # For other days: start from hour 0 (midnight)
            for i, hour_data in enumerate(self.hourly_data):
                wind = hour_data.get('wind_speed', 0)
                points.append((i, wind))  # Direct mapping 0-23

        # Update plot
        self.wind_plot.points = points

        # Set graph bounds and X-axis labels
        if points:
            winds = [p[1] for p in points]
            min_wind = 0
            max_wind = max(winds) + 5
            self.wind_graph.xmin = 0
            self.wind_graph.xmax = 23  # Always show 0-23 hours
            self.wind_graph.ymin = min_wind
            self.wind_graph.ymax = max_wind

            # Set X-axis labels in "13h" format for all 24 hours
            x_labels = [f"{i}h" for i in range(24)]
            self.wind_graph.x_ticks = list(range(24))
            self.wind_graph.x_ticks_text = x_labels

    def _update_rain_graph(self):
        """Update rain graph with hourly data."""
        if not self.rain_graph or not self.hourly_data:
            return

        # Prepare data points
        points = []
        if self.is_today:
            # For today: start from current hour
            current_hour = datetime.now().hour
            for i, hour_data in enumerate(self.hourly_data):
                rain = hour_data.get('precipitation', 0)
                # Map to 24-hour scale starting from current hour
                hour_index = (current_hour + i) % 24
                points.append((hour_index, rain))
        else:
            # For other days: start from hour 0 (midnight)
            for i, hour_data in enumerate(self.hourly_data):
                rain = hour_data.get('precipitation', 0)
                points.append((i, rain))  # Direct mapping 0-23

        # Update plot
        self.rain_plot.points = points

        # Set graph bounds and X-axis labels
        if points:
            rains = [p[1] for p in points]
            min_rain = 0
            max_rain = max(rains) + 1 if max(rains) > 0 else 5
            self.rain_graph.xmin = 0
            self.rain_graph.xmax = 23  # Always show 0-23 hours
            self.rain_graph.ymin = min_rain
            self.rain_graph.ymax = max_rain

            # Set X-axis labels in "13h" format for all 24 hours
            x_labels = [f"{i}h" for i in range(24)]
            self.rain_graph.x_ticks = list(range(24))
            self.rain_graph.x_ticks_text = x_labels