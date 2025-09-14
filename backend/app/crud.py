"""CRUD operations module for database entities.

Provides Create, Read, Update, Delete functionality for database models.
Follows a functional-first approach with pure functions as specified in the architecture guidelines.
"""

from pydantic import BaseModel
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import Page


# Pydantic models for Page operations
class PageCreate(BaseModel):
    """Schema for creating a new page."""

    name: str


class PageUpdate(BaseModel):
    """Schema for updating an existing page."""

    name: str | None = None


async def create_page(*, session: AsyncSession, page_in: PageCreate) -> Page:
    """Create a new page in the database.

    Args:
        session: Database session
        page_in: Page creation data

    Returns:
        The created page
    """
    db_page = Page(name=page_in.name)
    session.add(db_page)
    await session.commit()
    await session.refresh(db_page)
    return db_page


async def get_page(*, session: AsyncSession, page_id: int) -> Page | None:
    """Get a page by ID.

    Args:
        session: Database session
        page_id: ID of the page

    Returns:
        The page if found, None otherwise
    """
    return await session.get(Page, page_id)


async def get_pages(*, session: AsyncSession, skip: int = 0, limit: int = 100) -> list[Page]:
    """Get a list of pages with pagination.

    Args:
        session: Database session
        skip: Number of pages to skip
        limit: Maximum number of pages to return

    Returns:
        List of pages
    """
    query = select(Page)
    # Convert Sequence[Page] to list[Page] explicitly for type safety
    result = await session.exec(query.offset(skip).limit(limit))
    pages = result.all()
    return list(pages)


async def update_page(*, session: AsyncSession, db_page: Page, page_in: PageUpdate) -> Page:
    """Update a page.

    Args:
        session: Database session
        db_page: Existing page from the database
        page_in: Update data

    Returns:
        The updated page
    """
    update_data = page_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_page, key, value)
    session.add(db_page)
    await session.commit()
    await session.refresh(db_page)
    return db_page


async def delete_page(*, session: AsyncSession, page_id: int) -> None:
    """Delete a page.

    Args:
        session: Database session
        page_id: ID of the page to delete
    """
    page = await session.get(Page, page_id)
    if page:
        await session.delete(page)
        await session.commit()
