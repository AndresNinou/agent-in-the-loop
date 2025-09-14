"""Utility functions for the FastAPI backend application.

Provides helper functions for common operations like UUID generation,
timestamp creation, and request information extraction.
"""

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, TypeVar

from fastapi import Request

from app.core.config import settings
from app.core.log_config import logger

# Logger is now configured via app.core.log_config

# Type variables for generic functions
T = TypeVar("T")


class LogLevel(str, Enum):
    """Log levels for structured logging."""

    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


def log_event(
    event_type: str,
    level: LogLevel = LogLevel.INFO,
    details: dict[str, Any] | None = None,
    **kwargs: Any,
) -> None:
    """Log a structured event in JSON format.

    Args:
        event_type: The type of event (e.g., "item_created", "request_received")
        level: Log level from LogLevel enum
        details: Optional dictionary with additional event details
        **kwargs: Additional key-value pairs to include in the log
    """
    log_data: dict[str, Any] = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "event_type": event_type,
        **kwargs,
    }

    if details:
        log_data["details"] = details

    # Use Loguru's bind() for proper structured logging that preserves context
    # This ensures all fields appear in JSON output and in Sentry breadcrumbs
    message = f"Event: {event_type}"
    bound_logger = logger.bind(**log_data)
    
    if level == LogLevel.DEBUG:
        bound_logger.debug(message)
    elif level == LogLevel.INFO:
        bound_logger.info(message)
    elif level == LogLevel.WARNING:
        bound_logger.warning(message)
    elif level == LogLevel.ERROR:
        bound_logger.error(message)
    elif level == LogLevel.CRITICAL:
        bound_logger.critical(message)


def generate_uuid() -> uuid.UUID:
    """Generate a random UUID.

    Returns:
        A new random UUID
    """
    return uuid.uuid4()


def request_info(request: Request) -> dict[str, Any]:
    """Extract useful information from a FastAPI request.

    Args:
        request: The FastAPI request object

    Returns:
        Dictionary with request information
    """
    return {
        "method": request.method,
        "url": str(request.url),
        "client_host": request.client.host if request.client else "unknown",
        "headers": {k: v for k, v in request.headers.items() if k.lower() not in ["authorization"]},
    }


def paginate_response(items: list[T], count: int, skip: int, limit: int) -> dict[str, Any]:
    """Create a paginated response.

    Args:
        items: List of items for the current page
        count: Total count of items
        skip: Number of items skipped
        limit: Maximum number of items per page

    Returns:
        Dictionary with pagination information
    """
    return {
        "data": items,
        "pagination": {
            "total": count,
            "page": skip // limit + 1 if limit > 0 else 1,
            "pages": (count + limit - 1) // limit if limit > 0 else 1,
            "has_more": (skip + limit) < count,
        },
    }
