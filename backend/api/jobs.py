"""API endpoints for job status tracking."""
from celery.result import AsyncResult
from fastapi import APIRouter, HTTPException, status

from celery_app import celery_app

router = APIRouter(prefix="/api/v1/jobs", tags=["jobs"])


@router.get("/{job_id}")
async def get_job_status(job_id: str) -> dict:
    """
    Get status of an async job.

    - **job_id**: Celery task ID

    Returns job status and result/error information.
    """
    try:
        # Get task result
        task_result = AsyncResult(job_id, app=celery_app)

        response = {
            "job_id": job_id,
            "status": task_result.state,
            "result": None,
            "error": None,
            "meta": None,
        }

        if task_result.state == "PENDING":
            response["status"] = "queued"

        elif task_result.state == "PROCESSING":
            response["status"] = "processing"
            response["meta"] = task_result.info

        elif task_result.state == "SUCCESS":
            response["status"] = "completed"
            response["result"] = task_result.result

        elif task_result.state == "FAILURE":
            response["status"] = "failed"
            response["error"] = str(task_result.info)

        return response

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": "JOB_ERROR", "message": str(e)}},
        )


@router.post("/test")
async def test_celery() -> dict:
    """
    Test Celery connection by running a simple task.

    Returns task ID that can be checked with GET /jobs/{job_id}
    """
    from tasks.document_processing import test_celery

    task = test_celery.delay()

    return {
        "job_id": task.id,
        "status": "queued",
        "message": "Test task queued. Check status at /api/v1/jobs/{job_id}",
    }
