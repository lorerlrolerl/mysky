# MySky Weather App

A privacy-focused weather app for Android built with Python and Kivy. No GPS, no tracking, no accounts required - just search for your city and get detailed weather forecasts.

## Features

- **Privacy-First**: No GPS, no location tracking, no user accounts
- **Open Source APIs**: Uses Open-Meteo APIs (no authentication required)
- **Comprehensive Weather**: Current conditions, 15-day forecast, hourly data
- **Interactive Graphs**: Wind speed and precipitation charts for each day
- **Offline Caching**: Smart caching with SQLite backend
- **Android Ready**: Optimized for mobile with touch-friendly interface

## Weather Data

- **Current Weather**: Temperature, feels-like, precipitation, wind speed/direction
- **Air Quality**: EU/US AQI, PM2.5, PM10 levels
- **15-Day Forecast**: Daily summaries with hourly breakdowns
- **Interactive Graphs**: 24-hour wind and rain visualizations
- **City Search**: Autocomplete suggestions with country/region info

## Privacy & Security

- ✅ No GPS or location permissions
- ✅ No API keys or authentication
- ✅ No analytics or tracking
- ✅ Only city name sent to geocoding API
- ✅ All data cached locally
- ✅ Open-source stack

## Installation & Setup

### Prerequisites

- Python 3.12+
- Ubuntu 24.04 (for Android builds)
- UV package manager

### Development Setup

1. **Clone and setup**:
   ```bash
   cd ~/Workspace/mysky
   uv sync
   ```

2. **Install garden graph**:
   ```bash
   uv run python -m pip install kivy_garden.graph
   ```

3. **Run the app**:
   ```bash
   uv run python main.py
   ```

### Android Build

1. **Install buildozer**:
   ```bash
   uv add --dev buildozer cython
   ```

2. **Initialize buildozer** (if needed):
   ```bash
   buildozer init
   ```

3. **Build APK**:
   ```bash
   buildozer -v android debug
   ```

4. **Deploy to device**:
   ```bash
   buildozer android deploy run
   ```

## Project Structure

```
mysky/
├── main.py                 # App entry point
├── api/
│   └── weather_api.py      # Open-Meteo API client
├── screens/
│   ├── search_screen.py    # City search UI
│   └── weather_screen.py   # Main weather display
├── widgets/
│   ├── city_search.py      # Autocomplete search
│   ├── current_weather.py  # Current conditions
│   ├── day_forecast.py     # Daily forecast cards
│   └── weather_graph.py    # Wind/rain graphs
├── utils/
│   └── cache.py            # Cache utilities
├── pyproject.toml          # UV dependencies
├── buildozer.spec          # Android build config
└── README.md
```

## API Usage

The app uses three Open-Meteo APIs:

1. **Geocoding API**: City search with suggestions
2. **Forecast API**: 16-day hourly weather data
3. **Air Quality API**: EU/US AQI and PM levels

All APIs are free, require no authentication, and have built-in caching via `openmeteo-requests`.

## Caching Strategy

- **SQLite Backend**: Local cache in `.cache/openmeteo_cache.sqlite`
- **Smart Expiration**: 1 hour for forecasts, 24 hours for geocoding
- **Offline Support**: Works with stale data when offline
- **Performance**: Prevents API overload and reduces data usage

## Development

### Running Tests

```bash
uv run python -m pytest
```

### Cache Management

```python
from utils.cache import get_cache_info, clear_cache

# Check cache size
info = get_cache_info()
print(f"Cache size: {info['size_mb']} MB")

# Clear cache
clear_cache()
```

## Build Configuration

The `buildozer.spec` is optimized for:
- **Target**: Android API 31, ARM64
- **Permissions**: INTERNET only (no GPS)
- **Dependencies**: All required packages included
- **Size**: Optimized APK with minimal overhead

## License

This project is open source. See the source code for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on both desktop and Android
5. Submit a pull request

## Support

For issues and questions:
- Check the GitHub issues
- Review the Open-Meteo API documentation
- Test with different cities and network conditions
