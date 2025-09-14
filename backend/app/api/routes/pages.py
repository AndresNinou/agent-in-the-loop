"""Page API routes module.

Provides endpoints for CRUD operations on pages in the FastAPI backend.
Routes in this module handle page creation, retrieval, updating, and deletion.
"""

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlmodel import func, select

from app.api.deps import SessionDep
from app.crud import (
    PageCreate,
    PageUpdate,
    create_page,
    delete_page,
    get_page,
    get_pages,
    update_page,
)
from app.models import Page

router = APIRouter(prefix="/pages", tags=["pages"])


# Pydantic models for API responses
class PagePublic(BaseModel):
    """Schema for returning page information."""

    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class PagesPublic(BaseModel):
    """Schema for returning multiple pages with count."""

    data: list[PagePublic]
    count: int


class DeleteResponse(BaseModel):
    """Standard response for successful deletion operations."""

    message: str


@router.get("/", response_model=PagesPublic)
async def read_pages(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """Retrieve pages.

    Returns a paginated list of pages.
    Authentication is handled by the API gateway or external service.
    """
    # For count queries, use this pattern to guarantee correct typing
    # Use select_from to ensure proper typing with SQLAlchemy 2.0
    count_statement = select(func.count()).select_from(Page)
    
    # Execute and get a single value with proper type handling
    result = await session.exec(count_statement)
    
    # Explicitly handle the result as int with proper fallback
    # This satisfies the type checker that count will always be an int
    try:
        count = result.one() or 0  # Guaranteed to be int
    except Exception:
        # If any exception occurs (no rows, etc.), fallback to 0
        count = 0

    # Get paginated results
    pages = await get_pages(session=session, skip=skip, limit=limit)

    # Convert to PagePublic objects for type safety
    page_list: list[PagePublic] = [PagePublic.model_validate(page) for page in pages]

    # Return with explicit typing to ensure Pydantic validation works correctly
    return PagesPublic(data=page_list, count=count)


@router.get("/{page_id}", response_model=PagePublic)
async def read_page(session: SessionDep, page_id: int) -> Any:
    """Get page by ID.

    Retrieves a specific page by its ID.
    Authentication and authorization are handled by the API gateway.
    """
    page = await get_page(session=session, page_id=page_id)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return PagePublic.model_validate(page)


@router.post("/", response_model=PagePublic, status_code=201)
async def create_page_endpoint(*, session: SessionDep, page_in: PageCreate) -> Any:
    """Create new page.

    Creates a new page in the database.
    Authentication and authorization are handled by the API gateway.
    Returns 201 Created status code on success.
    """
    page = await create_page(session=session, page_in=page_in)
    return PagePublic.model_validate(page)


@router.put("/{page_id}", response_model=PagePublic)
async def update_page_endpoint(
    *,
    session: SessionDep,
    page_id: int,
    page_in: PageUpdate,
) -> Any:
    """Update a page.

    Updates an existing page by its ID.
    Authentication and authorization are handled by the API gateway.
    """
    page = await get_page(session=session, page_id=page_id)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")

    updated_page = await update_page(session=session, db_page=page, page_in=page_in)
    return PagePublic.model_validate(updated_page)


@router.delete("/{page_id}", response_model=DeleteResponse)
async def delete_page_endpoint(session: SessionDep, page_id: int) -> DeleteResponse:
    """Delete a page.

    Removes a page from the database by its ID.
    Authentication and authorization are handled by the API gateway.
    """
    page = await get_page(session=session, page_id=page_id)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")

    await delete_page(session=session, page_id=page_id)
    return DeleteResponse(message="Page deleted successfully")
