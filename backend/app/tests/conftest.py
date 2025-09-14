"""Test configuration and fixtures module.

Provides pytest fixtures for database sessions, test clients,
and other shared resources for testing.
"""

# =========================================================
# IMPORTANT: Set environment variables BEFORE any imports!
# =========================================================
import asyncio
import os
import warnings
from collections.abc import AsyncGenerator
from pathlib import Path

from dotenv import load_dotenv
from httpx import AsyncClient
from pytest_asyncio import fixture  # pyright: ignore[reportUnknownVariableType]
from sqlalchemy import exc as sa_exc
from sqlalchemy.orm import Session, SessionTransaction
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

# This import is required to ensure all models are registered with SQLModel metadata
# before creating tables. Do not remove even if it appears unused.
# pyright: reportUnusedImport=false
import app.models as _models  # noqa: F401

# --- Environment Setup ---
# Load .env file if it exists
# Assuming conftest.py is in app/tests/, so root_dir is backend/
root_dir = Path(__file__).resolve().parent.parent.parent
env_path = root_dir / ".env"

# Import the structured logger - do this after setting paths but before loading env
# so we can log the environment loading process
from app.core.log_config import logger  # noqa: E402

logger.info(f"Attempting to load base environment from: {env_path}")
if env_path.exists():
    logger.info(f"Loading base environment from {env_path}")
    # Load .env. override=True means .env values will override current os.environ.
    # We then programmatically override these with test-specific values.
    load_dotenv(dotenv_path=str(env_path), override=True)
else:
    logger.warning(
        f"No .env file found at {env_path}. Proceeding with defaults and test-specific overrides."
    )

# Keep environment settings for testing but don't override database
logger.info("Setting test environment values...")
# Keep environment as local for tests
os.environ["ENVIRONMENT"] = "local"
# Provide fallbacks for other required settings only if not set in .env
os.environ["PROJECT_NAME"] = os.environ.get("PROJECT_NAME", "FastAPI Backend Test")
os.environ["SECRET_KEY"] = os.environ.get("SECRET_KEY", "testsecretkey")
os.environ["BACKEND_CORS_ORIGINS"] = os.environ.get("BACKEND_CORS_ORIGINS", '["http://localhost"]')
os.environ["SENTRY_DSN"] = os.environ.get("SENTRY_DSN", "")
# Use local SQLite database if DATABASE_URL is not provided
# Force tests to use a local SQLite database to avoid external dependencies
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test.db"

# Environment variables are set but not printed to logs for security reasons
logger.info("Environment configured for testing")
# Do NOT log actual values of environment variables to prevent secrets exposure

# Filter out specific SQLAlchemy warnings that occur during test teardown
warnings.filterwarnings(
    "ignore",
    category=sa_exc.SAWarning,
    message=".*transaction already deassociated from connection.*",
)

# Now we can safely import app-specific modules
from app.core.db import engine  # noqa: E402 - Must be imported after env setup
from app.main import get_application  # noqa: E402 - Must be imported after env setup

# Create a fresh instance of the app for testing
app = get_application()


# We'll override the get_db dependency in our tests to use our test session
# This ensures proper transaction isolation


async def create_test_tables() -> None:
    """Create tables in test database ONLY for test purposes.

    IMPORTANT: This is only used for testing and maintains our architecture where
    Prisma is the sole schema owner in production. We create tables directly
    here only to support tests without requiring Prisma in the test environment.

    This approach keeps tests isolated and functional while preserving our
    production architecture principle.
    """
    # Create all tables defined in SQLModel metadata
    # This happens ONLY in the test environment
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


# Module-level setup: Create test tables once per test session
# This is more efficient than creating tables for every test
# We're still maintaining our architecture where Prisma owns the schema in production

# Use asyncio.run() instead of get_event_loop().run_until_complete()
# This avoids the "There is no current event loop" deprecation warning in Python 3.12
try:
    asyncio.run(create_test_tables())
except RuntimeError as e:
    # Handle case where there might already be a running event loop
    if "already running" in str(e):
        loop = asyncio.get_running_loop()
        loop.run_until_complete(create_test_tables())
    else:
        raise


@fixture(scope="function")  # pyright: ignore[reportUntypedFunctionDecorator]
async def db() -> AsyncGenerator[AsyncSession, None]:
    """Initialize test database with savepoint-based isolation.

    This fixture provides an isolated database session for tests that
    automatically rolls back all changes after each test, ensuring
    tests don't affect one another or the real database.

    Uses proper savepoint management to handle session.commit() calls within tests.

    Tables are created once at module level for performance, but this fixture
    provides transaction isolation for each test.

    IMPORTANT: This fixture also OVERRIDES the standard get_db dependency in FastAPI
    to ensure that API routes use the same transactional session as the tests.
    """
    # Import SQLAlchemy event system to manage savepoints
    from sqlalchemy import event

    # Import the get_db dependency we need to override
    from app.api.deps import get_db

    # Connect to the database
    connection = await engine.connect()
    # Begin an outer transaction
    transaction = await connection.begin()
    # Create a session bound to this connection
    session = AsyncSession(bind=connection, expire_on_commit=False)

    # Set up savepoint management to handle session.commit() calls within tests
    # This function is not directly called but invoked by SQLAlchemy event system
    @event.listens_for(session.sync_session, "after_transaction_end")
    def restart_savepoint(sess: Session, trans: SessionTransaction) -> None:  # type: ignore[reportUnusedFunction]
        # If the innermost transaction (savepoint) is committed or rolled back,
        # start a new savepoint - but only if the parent transaction is not closed
        if getattr(trans, "nested", False) and not getattr(
            getattr(trans, "_parent", None), "nested", False
        ):
            # Create a new savepoint
            sess.begin_nested()

    # Create the first savepoint
    session.sync_session.begin_nested()

    # CRITICAL: Override the get_db dependency in FastAPI to use our test session
    # This ensures that API routes use the SAME database session as our tests,
    # maintaining proper transaction isolation and seeing the same data
    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield session

    # Apply the override to the FastAPI app
    app.dependency_overrides[get_db] = override_get_db

    try:
        # Provide the session to the test
        yield session
    finally:
        # Remove the dependency override
        app.dependency_overrides.pop(get_db, None)

        # Cleanup: rollback to the beginning of the transaction
        await session.close()
        # Rollback the outer transaction, discarding all changes
        await transaction.rollback()
        await connection.close()

    logger.debug("Test transaction rolled back successfully")


@fixture(scope="function")  # pyright: ignore[reportUntypedFunctionDecorator]
async def client(db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:  # noqa: ARG001
    """Provide a test client for the FastAPI application.
    
    Depends on the db fixture to ensure proper database overrides are in place
    before any requests are made, preventing test pollution.
    """
    # Import ASGITransport for the updated httpx client API
    from httpx import ASGITransport
    
    # db parameter ensures database overrides are applied before client is created
    # Using explicit ASGITransport instead of deprecated app shortcut
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver"
    ) as c:
        yield c
