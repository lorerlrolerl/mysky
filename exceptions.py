"""
Custom exceptions for MySky Weather App.
Specific exception types for better error handling and debugging.
"""


class MySkyException(Exception):
    """Base exception for MySky Weather App."""
    pass


class WeatherAPIError(MySkyException):
    """Base exception for weather API related errors."""
    pass


class NetworkError(WeatherAPIError):
    """Exception for network-related errors."""

    def __init__(self, message: str, status_code: int = None):
        super().__init__(message)
        self.status_code = status_code


class APIResponseError(WeatherAPIError):
    """Exception for API response errors."""

    def __init__(self, message: str, response_data: dict = None):
        super().__init__(message)
        self.response_data = response_data


class DataProcessingError(MySkyException):
    """Exception for data processing errors."""
    pass


class CacheError(MySkyException):
    """Exception for cache-related errors."""
    pass


class UIError(MySkyException):
    """Exception for UI-related errors."""
    pass


class ConfigurationError(MySkyException):
    """Exception for configuration errors."""
    pass
