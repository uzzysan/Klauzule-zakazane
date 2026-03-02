"""Health check endpoints for load balancers and monitoring."""
import redis.asyncio as redis

from config import settings
from database.connection import get_db
from fastapi import APIRouter, Depends, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/live", status_code=status.HTTP_200_OK)
async def liveness_check() -> dict:
    """
    Liveness probe endpoint.

    Returns 200 OK if the service is running.
    Used by load balancers to determine if the instance should receive traffic.
    """
    return {"status": "ok", "check": "liveness"}


@router.get("/ready", status_code=status.HTTP_200_OK)
async def readiness_check(db: AsyncSession = Depends(get_db)) -> dict:
    """
    Readiness probe endpoint.

    Returns 200 OK if the service is ready to handle requests.
    Checks:
    - Database connectivity
    - Redis connectivity

    Used by load balancers to determine if the instance is ready.
    """
    from fastapi import Response

    checks = {}

    # Check database connection
    try:
        result = await db.execute(text("SELECT 1"))
        result.scalar()
        checks["database"] = "ok"
    except Exception as e:
        checks["database"] = f"error: {str(e)}"

    # Check Redis connection
    try:
        redis_client = redis.from_url(settings.redis_url)
        await redis_client.ping()
        await redis_client.aclose()
        checks["redis"] = "ok"
    except Exception as e:
        checks["redis"] = f"error: {str(e)}"

    # Return 503 if any check failed
    has_errors = any("error" in str(v) for v in checks.values())
    if has_errors:
        return Response(
            content='{"status": "not_ready", "checks": ' + str(checks).replace("'", '"') + "}",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            media_type="application/json",
        )

    return {"status": "ready", "checks": checks}


@router.get("/sentry-test", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
async def sentry_test() -> dict:
    """
    Test endpoint to verify Sentry error tracking.

    Raises a deliberate exception that should be captured by Sentry.
    Use this endpoint to confirm Sentry integration is working correctly.

    **Warning:** This endpoint intentionally raises an error.
    """
    raise ValueError("Sentry test error - if you see this in Sentry, integration is working!")
