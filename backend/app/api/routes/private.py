"""Private utility endpoints for backend diagnostics.

Provides server and database diagnostic information for monitoring and debugging.
These endpoints are intended for internal use only and don't require authentication.
"""

import os
import platform
from datetime import datetime
from typing import cast

from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import func, text
from sqlmodel import select

from app.api.deps import SessionDep
from app.models import Page

router = APIRouter(tags=["private"], prefix="/private")


class ServerInfo(BaseModel):
    """Basic server information using only standard library."""

    python_version: str
    hostname: str
    platform_info: str
    server_time: str
    environment: str
    pid: int


class DatabaseStats(BaseModel):
    """Database statistics."""

    page_count: int
    database_name: str
    tables: list[str] = []


@router.get("/diagnostics/server", response_model=ServerInfo)
async def get_server_info() -> ServerInfo:
    """Get basic server information.

    Only available in local development environment.
    Uses only standard library to avoid extra dependencies.
    """
    return ServerInfo(
        python_version=platform.python_version(),
        hostname=platform.node(),
        platform_info=platform.platform(),
        server_time=datetime.now().isoformat(),
        environment=os.environ.get("ENVIRONMENT", "development"),
        pid=os.getpid(),
    )


@router.get("/diagnostics/database", response_model=DatabaseStats)
async def get_database_stats(session: SessionDep) -> DatabaseStats:
    """Get database statistics.

    Only available in local development environment.
    Provides information about the database and its tables.
    """
    # Get page count using SQLModel's recommended approach
    # First get the count of all pages
    count_result = (await session.exec(select(func.count()).select_from(Page))).one()
    # Extract the integer from the returned result and ensure it's an int
    # Use type casting to help type checker understand the value is convertible to int
    raw_count = cast(int, count_result[0] if isinstance(count_result, tuple) else count_result)
    page_count = int(raw_count)  # Explicitly cast to int to satisfy type checker

    # For raw SQL queries we use the underlying SQLAlchemy connection
    conn = await session.connection()
    # Don't close the connection - in testing, session manages the lifecycle
    # and calling close() on connection interferes with transaction management
    
    if conn.engine.dialect.name == "sqlite":
        database_info = "sqlite"
        result = await conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
        tables = [row[0] for row in result.fetchall()]
    else:
        # PostgreSQL specific queries
        database_info = (await conn.execute(text("SELECT current_database()"))).scalar()
        tables_query = text(
            """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
            """
        )
        try:
            result = await conn.execute(tables_query)
            tables = [row[0] for row in result.fetchall()]
        except Exception:
            tables = []

    # Ensure database_name is a string to satisfy type checking
    db_name = str(database_info) if database_info is not None else "unknown"

    return DatabaseStats(page_count=page_count, database_name=db_name, tables=tables)
