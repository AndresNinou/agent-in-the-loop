"""API dependency injection module.

Provides reusable dependencies for FastAPI route functions.
Implements the dependency injection pattern for database sessions
and other shared resources needed across multiple endpoints.
"""

from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.db import async_session_maker


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for database session.

    Returns a SQLModel Session that will be automatically closed when the request is complete.
    This is the only dependency we need as authentication is handled externally.
    """
    session = async_session_maker()
    try:
        yield session
    finally:
        await session.close()


# Type annotation for session dependency to use in route functions
SessionDep = Annotated[AsyncSession, Depends(get_db)]
