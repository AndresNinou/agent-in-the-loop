"""Integration tests for private API diagnostic endpoints.

Tests server information and database statistics endpoints.
Verifies that diagnostic data is correctly returned and properly formatted.
"""

import pytest
from httpx import AsyncClient
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.tests.utils.page import create_random_page


@pytest.mark.asyncio
async def test_get_server_info(client: AsyncClient) -> None:
    """Test the server diagnostics endpoint."""
    response = await client.get(f"{settings.API_V1_STR}/private/diagnostics/server")

    # Verify response structure
    assert response.status_code == 200
    data = response.json()

    # Check required fields exist
    assert "python_version" in data
    assert "hostname" in data
    assert "platform_info" in data
    assert "server_time" in data
    assert "environment" in data
    assert "pid" in data

    # Validate data types
    assert isinstance(data["python_version"], str)
    assert isinstance(data["environment"], str)
    assert isinstance(data["pid"], int)


@pytest.mark.asyncio
async def test_get_database_stats(client: AsyncClient, db: AsyncSession) -> None:
    """Test the database diagnostics endpoint."""
    # Create some test pages to verify count
    for _ in range(3):
        await create_random_page(db)

    # Test the endpoint
    response = await client.get(f"{settings.API_V1_STR}/private/diagnostics/database")

    # Verify response structure
    assert response.status_code == 200
    data = response.json()

    # Check required fields
    assert "page_count" in data
    assert "database_name" in data
    assert "tables" in data

    # Verify page count is at least what we created
    assert data["page_count"] >= 3

    # Verify tables list contains at least the page table
    assert "Page" in data["tables"]
    # Note: Using SQLModel.metadata.create_all() for table creation instead of migrations
    # where we're using SQLModel.metadata.create_all() instead of migrations
