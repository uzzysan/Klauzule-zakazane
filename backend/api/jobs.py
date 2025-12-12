"""API endpoints for job status tracking."""
from celery.result import AsyncResult
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from celery_app import celery_app
from database.connection import get_db
from models.document import Document
from models.analysis import Analysis

router = APIRouter(prefix="/api/v1/jobs", tags=["jobs"])


@router.get("/{job_id}")
async def get_job_status(job_id: str, db: AsyncSession = Depends(get_db)) -> dict:
    """
    Get status of an async job.

    - **job_id**: Celery task ID

    Returns job status and result/error information.

    Uses database as primary source of truth to avoid Celery deserialization issues.
    """
    response = {
        "job_id": job_id,
        "status": "queued",
        "result": None,
        "error": None,
        "meta": None,
    }

    try:
        # First, check the database for document status (primary source of truth)
        result = await db.execute(
            select(Document).where(Document.celery_task_id == job_id)
        )
        document = result.scalar_one_or_none()

        if document:
            # Document found - check its status
            if document.status == "completed":
                # Get analysis result from database
                analysis_result = await db.execute(
                    select(Analysis)
                    .where(Analysis.document_id == document.id)
                    .order_by(Analysis.created_at.desc())
                    .limit(1)
                )
                analysis = analysis_result.scalar_one_or_none()

                response["status"] = "completed"
                response["result"] = {
                    "document_id": str(document.id),
                    "status": "completed",
                    "pages": document.pages,
                    "analysis": {
                        "analysis_id": str(analysis.id) if analysis else None,
                        "total_clauses_found": analysis.total_clauses_found if analysis else 0,
                        "high_risk_count": analysis.high_risk_count if analysis else 0,
                        "medium_risk_count": analysis.medium_risk_count if analysis else 0,
                        "low_risk_count": analysis.low_risk_count if analysis else 0,
                        "risk_score": analysis.risk_score if analysis else 0,
                    } if analysis else None,
                }
                return response

            elif document.status == "failed":
                response["status"] = "failed"
                response["error"] = "Document processing failed"
                return response

            elif document.status == "processing":
                # Still processing - try to get progress from Celery (with error handling)
                response["status"] = "processing"
                try:
                    task_result = AsyncResult(job_id, app=celery_app)
                    if task_result.state == "PROCESSING" and task_result.info:
                        response["meta"] = task_result.info
                    else:
                        response["meta"] = {"stage": "processing"}
                except Exception:
                    response["meta"] = {"stage": "processing"}
                return response

            else:
                # uploaded or other status - check Celery for real status
                response["status"] = "queued"
                response["meta"] = {"stage": "queued"}
                return response

        # No document found - fall back to Celery (for backwards compatibility)
        # This handles edge cases where job_id doesn't correspond to a document
        try:
            task_result = AsyncResult(job_id, app=celery_app)

            if task_result.state == "PENDING":
                response["status"] = "queued"
            elif task_result.state == "PROCESSING":
                response["status"] = "processing"
                try:
                    response["meta"] = task_result.info
                except Exception:
                    response["meta"] = {"stage": "unknown"}
            elif task_result.state == "SUCCESS":
                response["status"] = "completed"
                try:
                    response["result"] = task_result.result
                except Exception:
                    response["result"] = {"analysis_id": None}
            elif task_result.state == "FAILURE":
                response["status"] = "failed"
                try:
                    response["error"] = str(task_result.info)
                except Exception:
                    response["error"] = "Task failed (details unavailable)"

        except Exception as e:
            # If Celery query fails, return unknown status
            response["status"] = "queued"
            response["meta"] = {"stage": "unknown", "note": "Unable to query task status"}

        return response

    except Exception as e:
        # Database error - return error response
        return {
            "job_id": job_id,
            "status": "failed",
            "result": None,
            "error": f"Unable to retrieve job status: {str(e)}",
            "meta": None,
        }


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
