"""Utility API routes module.

Provides utility endpoints for health checking and version information.
These endpoints are essential for monitoring and maintaining the service.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/utils", tags=["utils"])


@router.get("/health-check/")
async def health_check() -> dict[str, bool]:
    """Health check endpoint.

    Returns a simple health status indicating the API is operational.
    This endpoint can be used by monitoring systems and load balancers.
    """
    return {"status": True}


@router.get("/version/")
async def version() -> dict[str, str]:
    """API version information.

    Returns the current API version information.
    Useful for clients to check compatibility.
    """
    return {"version": "1.0.0", "name": "FastAPI Backend Microservice"}
