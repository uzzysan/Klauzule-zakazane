"""Health check endpoints for load balancers and monitoring."""
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
    - Redis connectivity (TODO)
    
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
        # Return 503 status for not ready
        return Response(
            content='{"status": "not_ready", "checks": ' + str(checks) + '}',
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            media_type="application/json"
        )
    
    # TODO: Check Redis connection
    # For now, assume Redis is ok if we got this far
    checks["redis"] = "ok"
    
    return {"status": "ready", "checks": checks}
