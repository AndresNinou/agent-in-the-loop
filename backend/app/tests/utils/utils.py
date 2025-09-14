"""Test utility functions for the FastAPI backend.

Provides helper functions for generating test data such as random strings,
UUIDs, and timestamps for use in test cases.
"""

import random
import string
import uuid
from datetime import datetime


def random_lower_string(length: int = 32) -> str:
    """Generate a random lowercase string.

    Args:
        length: Length of the string to generate (default: 32)

    Returns:
        A random lowercase string of the specified length
    """
    # For test data, standard random is sufficient - not used for security purposes
    # S311 is suppressed in pyproject.toml for test files
    return "".join(random.choices(string.ascii_lowercase, k=length))


def random_uuid() -> uuid.UUID:
    """Generate a random UUID.

    Returns:
        A random UUID object
    """
    return uuid.uuid4()


def get_current_timestamp() -> str:
    """Get the current timestamp in ISO format.

    Returns:
        Current timestamp as an ISO-formatted string
    """
    return datetime.now().isoformat()
