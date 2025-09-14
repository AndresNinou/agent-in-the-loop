"""Logging configuration module for the FastAPI Backend application.

This module provides logging configuration and utilities, setting up
the application-wide logger for consistent log formatting and handling.
Loguru is used as the logging backend for improved formatting and ease of use.
"""
# Re-export logger from the underscore-prefixed module
from app.core._logging import logger

# Make the logger available for import from this module
__all__ = ["logger"]
