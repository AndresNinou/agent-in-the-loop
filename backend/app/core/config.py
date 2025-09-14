"""Application configuration settings module.

Provides settings management for the FastAPI backend application using Pydantic.
Manages environment variables, database connections, and other configuration settings.
"""

import secrets
import sys
import warnings
from typing import Annotated, Any, Literal, TypeVar

from pydantic import (
    AnyUrl,
    BeforeValidator,
    HttpUrl,
    computed_field,
    model_validator,
)
from pydantic_settings import BaseSettings, SettingsConfigDict

# Python 3.10 compatibility - Self was introduced in Python 3.11
# Placed after imports to avoid circular import issues
SettingsType = TypeVar("SettingsType", bound="Settings")


# pyright: reportUnknownVariableType=false, reportUnknownArgumentType=false
def parse_cors(v: Any) -> list[str]:
    """Parse CORS origins from string or list format.

    Args:
        v: Input value which could be a string or list

    Returns:
        List of strings representing CORS origins

    Raises:
        ValueError: If the input cannot be parsed as CORS origins
    """
    if isinstance(v, str):
        if not v.startswith("["):
            # Handle comma-separated string format
            return [i.strip() for i in v.split(",")]
        # Handle single string
        return [v]
    elif isinstance(v, list):
        # Convert all list items to strings
        return [str(x) for x in v]

    # If we get here, the input is neither a string nor a list
    raise ValueError(f"Cannot parse CORS origins from {type(v)}: {v}")


class Settings(BaseSettings):
    """Application settings.

    Configuration for the FastAPI backend microservice.
    Authentication and user management are handled by external services.
    """

    model_config = SettingsConfigDict(
        # Container runs in /app, so .env is in the current directory
        # Docker's env_file directive handles injection, this is for local dev
        env_file=[".env"],
        env_ignore_empty=True,
        extra="ignore",
    )
    # API settings
    API_V1_STR: str = "/api/v1"
    API_HOST: str = "http://localhost:8000"  # API host for external references
    ENVIRONMENT: Literal["local", "staging", "production"] = "local"
    PROJECT_NAME: str
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "FastAPI Backend Microservice API"

    # Security settings - default uses a random token that will change on restart
    # In production, always set SECRET_KEY in .env file
    SECRET_KEY: str = secrets.token_urlsafe(32)

    # CORS settings
    BACKEND_CORS_ORIGINS: Annotated[list[AnyUrl] | str, BeforeValidator(parse_cors)] = []

    @computed_field  # type: ignore[prop-decorator]
    @property
    def all_cors_origins(self) -> list[str]:
        """Return all CORS origins as strings."""
        return [str(origin).rstrip("/") for origin in self.BACKEND_CORS_ORIGINS]

    # Monitoring
    SENTRY_DSN: HttpUrl | None = None

    # Database settings - use DATABASE_URL for external database connection managed by Next.js/Prisma
    # Required in production, but has a placeholder for tests
    DATABASE_URL: str | None = None

    @computed_field  # type: ignore[prop-decorator]
    @property
    def sqlalchemy_database_uri(self) -> str:
        """Return the database URI for SQLAlchemy connection.

        In production the database must be PostgreSQL. In test environments we
        allow an in-memory SQLite database to enable isolated testing without a
        running PostgreSQL instance.
        """
        if not self.DATABASE_URL:
            raise ValueError("DATABASE_URL must be set in all environments")

        db_url = str(self.DATABASE_URL)
        is_test = "pytest" in sys.modules or "test" in sys.argv[0].lower()

        if db_url.startswith("sqlite"):
            if not is_test:
                raise ValueError("SQLite database URLs are only permitted for testing")
            return db_url

        if not db_url.startswith("postgresql"):
            raise ValueError(
                "DATABASE_URL must be a PostgreSQL connection string. "
                "Schema management is owned by Prisma and requires PostgreSQL."
            )

        return db_url

    def _check_default_secret(self, var_name: str, value: str | None) -> None:
        """Check if a secret is using the default value."""
        # Skip validation in test environments
        import sys

        is_test_environment = "pytest" in sys.modules or "test" in sys.argv[0].lower()

        if value == "changethis":
            message = (
                f'The value of {var_name} is "changethis", '
                "for security, please change it in the .env file."
            )

            # Don't warn during tests, only for actual use
            if self.ENVIRONMENT == "local" and not is_test_environment:
                warnings.warn(message, stacklevel=1)
            # Always raise for non-local environments
            elif self.ENVIRONMENT != "local":
                raise ValueError(message)

    @model_validator(mode="after")
    def _enforce_non_default_secrets(self) -> "Settings":
        """Ensure secrets are not using default values."""
        self._check_default_secret("SECRET_KEY", self.SECRET_KEY)
        return self


settings = Settings()  # type: ignore
