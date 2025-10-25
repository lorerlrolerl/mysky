"""
Cache configuration utilities for the weather app.
"""

from pathlib import Path


def ensure_cache_directory():
    """Ensure the cache directory exists."""
    cache_dir = Path('.cache')
    cache_dir.mkdir(exist_ok=True)
    return cache_dir


def get_cache_size() -> int:
    """Get the size of the cache directory in bytes."""
    cache_dir = ensure_cache_directory()
    total_size = 0

    for file_path in cache_dir.rglob('*'):
        if file_path.is_file():
            total_size += file_path.stat().st_size

    return total_size


def clear_cache():
    """Clear all cached data."""
    cache_dir = ensure_cache_directory()

    for file_path in cache_dir.rglob('*'):
        if file_path.is_file():
            file_path.unlink()

    print("Cache cleared successfully")


def get_cache_info() -> dict:
    """Get information about the cache."""
    cache_dir = ensure_cache_directory()
    size_bytes = get_cache_size()

    return {
        'cache_directory': str(cache_dir.absolute()),
        'size_bytes': size_bytes,
        'size_mb': round(size_bytes / (1024 * 1024), 2),
        'files': len(list(cache_dir.rglob('*')))
    }
