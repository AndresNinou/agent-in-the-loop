"""Integration tests for the pages API routes.

Tests CRUD operations on pages including creation, retrieval, update, and deletion.
Verifies API behavior with proper status codes and response formats.
"""

import pytest
from httpx import AsyncClient
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.models import Page
from app.tests.utils.page import create_random_page


@pytest.mark.asyncio
async def test_create_page(client: AsyncClient) -> None:
    """Test creating a new page through the API."""
    data = {"name": "Test Page"}
    response = await client.post(
        f"{settings.API_V1_STR}/pages/",
        json=data,
    )
    # REST convention: 201 for resource creation
    assert response.status_code == 201
    content = response.json()
    assert content["name"] == data["name"]
    assert "id" in content


@pytest.mark.asyncio
async def test_read_page(client: AsyncClient, db: AsyncSession) -> None:
    """Test retrieving a specific page by ID."""
    page = await create_random_page(db)
    response = await client.get(
        f"{settings.API_V1_STR}/pages/{page.id}",
    )
    assert response.status_code == 200
    content = response.json()
    assert content["name"] == page.name
    assert content["id"] == page.id


@pytest.mark.asyncio
async def test_read_page_not_found(client: AsyncClient) -> None:
    """Test retrieving a non-existent page returns 404."""
    response = await client.get(
        f"{settings.API_V1_STR}/pages/999999",
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Page not found"


@pytest.mark.asyncio
async def test_read_pages(client: AsyncClient, db: AsyncSession) -> None:
    """Test retrieving a list of pages with pagination."""
    # Create multiple test pages
    for i in range(3):
        page = Page(name=f"Test Page {i}")
        db.add(page)
    await db.commit()

    # Test regular list endpoint
    response = await client.get(f"{settings.API_V1_STR}/pages/")
    assert response.status_code == 200
    content = response.json()
    assert "data" in content
    assert "count" in content
    assert content["count"] >= 3
    assert len(content["data"]) > 0


@pytest.mark.asyncio
async def test_update_page(client: AsyncClient, db: AsyncSession) -> None:
    """Test updating an existing page."""
    page = await create_random_page(db)
    data = {"name": "Updated Page"}
    response = await client.put(
        f"{settings.API_V1_STR}/pages/{page.id}",
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["name"] == data["name"]
    assert content["id"] == page.id


@pytest.mark.asyncio
async def test_update_page_not_found(client: AsyncClient) -> None:
    """Test updating a non-existent page returns 404."""
    data = {"name": "Updated Page"}
    response = await client.put(
        f"{settings.API_V1_STR}/pages/999999",
        json=data,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Page not found"


@pytest.mark.asyncio
async def test_delete_page(client: AsyncClient, db: AsyncSession) -> None:
    """Test deleting a page."""
    page = await create_random_page(db)
    response = await client.delete(
        f"{settings.API_V1_STR}/pages/{page.id}",
    )
    assert response.status_code == 200
    content = response.json()
    assert content["message"] == "Page deleted successfully"

    # Verify the page is actually deleted
    response = await client.get(f"{settings.API_V1_STR}/pages/{page.id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_page_not_found(client: AsyncClient) -> None:
    """Test deleting a non-existent page returns 404."""
    response = await client.delete(
        f"{settings.API_V1_STR}/pages/999999",
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Page not found"
