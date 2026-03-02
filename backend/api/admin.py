"""Admin API endpoints for feedback and metrics."""
from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from database.connection import get_db
from fastapi import APIRouter, Depends, HTTPException, status
from models.analysis import FlaggedClause
from models.feedback import AnalysisFeedback, ModelMetrics
from models.user import User
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_admin_user, get_reviewer_user

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


# Pydantic schemas
class FeedbackCreate(BaseModel):
    """Schema for creating feedback."""

    flagged_clause_id: UUID
    is_correct: bool
    notes: Optional[str] = None


class FeedbackResponse(BaseModel):
    """Schema for feedback response."""

    id: UUID
    flagged_clause_id: UUID
    is_correct: bool
    reviewer_id: Optional[UUID]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class MetricsResponse(BaseModel):
    """Schema for metrics response."""

    id: UUID
    date: date
    true_positives: int
    false_positives: int
    true_negatives: int
    false_negatives: int
    precision: Optional[float]
    recall: Optional[float]
    f1_score: Optional[float]
    accuracy: Optional[float]
    total_reviews: int

    class Config:
        from_attributes = True


class PendingReviewItem(BaseModel):
    """Schema for pending review item."""

    analysis_id: UUID
    document_id: UUID
    filename: str
    total_clauses: int
    high_risk_count: int
    completed_at: datetime
    has_feedback: bool


# Endpoints
@router.post("/feedback", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
async def submit_feedback(
    feedback: FeedbackCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_reviewer_user),
) -> FeedbackResponse:
    """
    Submit feedback for a flagged clause.

    - **flagged_clause_id**: ID of the flagged clause
    - **is_correct**: Whether the flag was a true positive
    - **notes**: Optional notes about the feedback
    """
    # Verify flagged_clause exists
    result = await db.execute(
        select(FlaggedClause).where(FlaggedClause.id == feedback.flagged_clause_id)
    )
    flagged_clause = result.scalar_one_or_none()

    if not flagged_clause:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": "Flagged clause not found"}},
        )

    # Check if feedback already exists
    existing = await db.execute(
        select(AnalysisFeedback).where(
            AnalysisFeedback.flagged_clause_id == feedback.flagged_clause_id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error": {"code": "ALREADY_EXISTS", "message": "Feedback already submitted"}},
        )

    # Create feedback
    new_feedback = AnalysisFeedback(
        flagged_clause_id=feedback.flagged_clause_id,
        is_correct=feedback.is_correct,
        notes=feedback.notes,
        reviewer_id=current_user.id,
    )

    db.add(new_feedback)
    await db.commit()
    await db.refresh(new_feedback)

    return FeedbackResponse.model_validate(new_feedback)


@router.get("/pending-reviews", response_model=List[PendingReviewItem])
async def get_pending_reviews(
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_reviewer_user),
) -> List[PendingReviewItem]:
    """
    Get analyses awaiting review (completed analyses without full feedback).

    - **limit**: Maximum number of items to return (default: 20)
    """
    from models.analysis import Analysis
    from models.document import Document
    from sqlalchemy import and_, func

    # Get analyses with clauses that don't have feedback yet
    query = (
        select(Analysis, Document, func.count(AnalysisFeedback.id).label("feedback_count"))
        .join(Document, Analysis.document_id == Document.id)
        .outerjoin(
            AnalysisFeedback,
            and_(
                AnalysisFeedback.flagged_clause_id.in_(
                    select(FlaggedClause.id).where(FlaggedClause.analysis_id == Analysis.id)
                )
            ),
        )
        .where(Analysis.status == "completed")
        .group_by(Analysis.id, Document.id)
        .order_by(Analysis.completed_at.desc())
        .limit(limit)
    )

    result = await db.execute(query)
    rows = result.all()

    items = []
    for analysis, document, feedback_count in rows:
        items.append(
            PendingReviewItem(
                analysis_id=analysis.id,
                document_id=document.id,
                filename=document.original_filename,
                total_clauses=analysis.total_clauses_found,
                high_risk_count=analysis.high_risk_count,
                completed_at=analysis.completed_at,
                has_feedback=feedback_count > 0,
            )
        )

    return items


@router.get("/metrics", response_model=List[MetricsResponse])
async def get_metrics(
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_reviewer_user),
) -> List[MetricsResponse]:
    """
    Get model performance metrics for the last N days.

    - **days**: Number of days to retrieve (default: 30)
    """
    from sqlalchemy import desc

    result = await db.execute(select(ModelMetrics).order_by(desc(ModelMetrics.date)).limit(days))
    metrics = result.scalars().all()

    return [MetricsResponse.model_validate(m) for m in metrics]


@router.get("/health")
async def admin_health_check() -> dict:
    """Health check endpoint for admin API."""
    return {"status": "ok", "service": "admin"}


@router.post("/sync-clauses", status_code=status.HTTP_202_ACCEPTED)
async def trigger_clause_sync(
    _current_user: User = Depends(get_admin_user),
) -> dict:
    """
    Trigger manual synchronization of prohibited clauses from source database.

    Requires admin privileges. The sync runs as a background Celery task.
    """
    from tasks.sync import sync_prohibited_clauses

    task = sync_prohibited_clauses.delay()

    return {
        "message": "Clause synchronization started",
        "task_id": task.id,
        "status": "queued",
    }
