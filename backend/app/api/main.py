"""
API router configuration and setup.

Configures the main API router with all route modules and middleware.
Provides customization for FastAPI route generation and documentation.
"""

from fastapi import APIRouter

# APIRoute is not used in this module
# Removed login, users routes as per microservice architecture
from app.api.routes import pages, private, utils
from app.core.config import settings

# No prefix here since main.py already adds the /api/v1 prefix
api_router = APIRouter()


# Authentication handled by external system
api_router.include_router(utils.router)
# Pages router already has its own prefix and tags, so we don't add them again
api_router.include_router(pages.router)

# Cline agent automation routes
from app.api.routes import cline
api_router.include_router(cline.router)

# CodeRabbit automation routes
from app.api.routes import coderabbit
api_router.include_router(coderabbit.router)

# Register private router only in local environment
if settings.ENVIRONMENT == "local":
    # Private router already has its own prefix and tags, so we don't add them again
    api_router.include_router(private.router)
