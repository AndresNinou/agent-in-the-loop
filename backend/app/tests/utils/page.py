"""Page test utilities module.

Provides helper functions for creating and manipulating test pages.
Used in integration and unit tests across the application.
"""

from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import Page
from app.tests.utils.utils import random_lower_string


async def create_random_page(db: AsyncSession) -> Page:
    """Create a random page for testing purposes.

    Args:
        db: Database session

    Returns:
        Page: Created test page
    """
    name = f"Test Page {random_lower_string(5)}"

    # Create page data
    page = Page(name=name)

    # Save to database
    db.add(page)
    await db.commit()
    await db.refresh(page)

    return page
