"""Database configuration and initialization module.

Provides database engine setup, session management, and initialization utilities.
"""

from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import AsyncEngine, async_sessionmaker, create_async_engine
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings

# Get database URI from settings
db_uri = settings.sqlalchemy_database_uri

# Parse the URL properly with SQLAlchemy
url = make_url(db_uri)

# Update driver to use psycopg async
if url.drivername == "postgresql":
    url = url.set(drivername="postgresql+psycopg")

engine: AsyncEngine = create_async_engine(
    url,  # Use the SQLAlchemy URL object directly
    future=True,
)

async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
