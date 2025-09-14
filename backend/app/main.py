"""Main FastAPI application entry point.

Configures and initializes the FastAPI application with routes, middleware,
and error handling. Responsible for setting up the application context,
including logging, Sentry integration, and database sessions.

Initializes and configures the FastAPI application with middleware, error handlers,
and routers. Entry point for the backend service.

Uses SQLModel metadata to create tables directly instead of Alembic migrations.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.routing import APIRoute
from starlette.middleware.cors import CORSMiddleware

from app.api.main import api_router
from app.core.config import settings
from app.core.log_config import logger


def custom_generate_unique_id(route: APIRoute) -> str:
    """Generate a unique operation ID for OpenAPI documentation.

    Creates a consistent, readable ID based on the route's tag and name.
    Used for better OpenAPI documentation and client generation.

    Args:
        route: FastAPI route object

    Returns:
        Unique operation ID string combining tag and route name
    """
    return f"{route.tags[0]}-{route.name}"


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Application lifespan context.
    
    This context manager runs tasks before the application starts,
    and after it shuts down.
    """
    # Pre-startup initialization task
    try:
        logger.info("FastAPI application starting up")
        # Skip database connection for Cline automation API
        # Database not needed for VS Code automation control
        
        yield
    finally:
        # Shutdown tasks
        logger.info("FastAPI application shutting down")
    # Cleanup on shutdown is handled in the finally block above


def get_application() -> FastAPI:
    """Create and configure the FastAPI application.

    Sets up the FastAPI instance with title, version, CORS middleware,
    and API routers. This factory pattern allows for easier testing
    and application configuration.

    Returns:
        Configured FastAPI application instance
    """
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description=settings.DESCRIPTION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url="/docs",
        generate_unique_id_function=custom_generate_unique_id,
        lifespan=lifespan,
    )

    # Set all CORS enabled origins
    if settings.all_cors_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.all_cors_origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    app.include_router(api_router, prefix=settings.API_V1_STR)

    return app


# Sentry integration is now handled in app.core._logging module
# This ensures Sentry is initialized before any log messages are sent
logger.info(f"Application initialized in {settings.ENVIRONMENT} environment")

app = get_application()
