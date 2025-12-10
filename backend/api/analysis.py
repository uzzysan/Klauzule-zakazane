"""API endpoints for analysis operations."""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database.connection import get_db
from models.analysis import Analysis, FlaggedClause
from models.document import Document
from schemas.analysis import (
    AnalysisDetailResponse,
    AnalysisListResponse,
    AnalysisSummaryResponse,
    DocumentAnalysisResponse,
    FlaggedClauseExplanation,
    FlaggedClauseResponse,
)

router = APIRouter(prefix="/api/v1/analysis", tags=["analysis"])


@router.get("/health")
async def health_check() -> dict:
    """Health check endpoint."""
    return {"status": "ok", "service": "analysis"}


@router.get("/document/{document_id}", response_model=DocumentAnalysisResponse)
async def get_document_analysis(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> DocumentAnalysisResponse:
    """
    Get document with its latest analysis result.

    Args:
        document_id: Document UUID

    Returns:
        Document info with latest analysis summary
    """
    # Get document
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.deleted_at.is_(None))
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": "Document not found"}},
        )

    # Get latest analysis
    analysis_result = await db.execute(
        select(Analysis)
        .where(Analysis.document_id == document_id)
        .order_by(Analysis.created_at.desc())
        .limit(1)
    )
    latest_analysis = analysis_result.scalar_one_or_none()

    return DocumentAnalysisResponse(
        document_id=document.id,
        filename=document.original_filename,
        status=document.status,
        language=document.language,
        pages=document.pages,
        created_at=document.created_at,
        latest_analysis=AnalysisSummaryResponse.model_validate(latest_analysis)
        if latest_analysis
        else None,
    )


@router.get("/{analysis_id}", response_model=AnalysisDetailResponse)
async def get_analysis(
    analysis_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> AnalysisDetailResponse:
    """
    Get detailed analysis results including all flagged clauses.

    Args:
        analysis_id: Analysis UUID

    Returns:
        Detailed analysis with flagged clauses
    """
    # Get analysis with flagged clauses
    result = await db.execute(
        select(Analysis)
        .options(selectinload(Analysis.flagged_clauses))
        .where(Analysis.id == analysis_id)
    )
    analysis = result.scalar_one_or_none()

    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": "Analysis not found"}},
        )

    # Convert flagged clauses to response format
    flagged_clauses = []
    for fc in analysis.flagged_clauses:
        explanation = None
        if fc.explanation:
            explanation = FlaggedClauseExplanation(
                clause_text=fc.explanation.get("clause_text", ""),
                legal_references=fc.explanation.get("legal_references", []),
                notes=fc.explanation.get("notes"),
                tags=fc.explanation.get("tags"),
            )

        flagged_clauses.append(
            FlaggedClauseResponse(
                id=fc.id,
                clause_id=fc.clause_id,
                matched_text=fc.matched_text,
                start_position=fc.start_position,
                end_position=fc.end_position,
                confidence=fc.confidence,
                risk_level=fc.risk_level,
                match_type=fc.match_type,
                explanation=explanation,
                ai_explanation=fc.ai_explanation,
                created_at=fc.created_at,
            )
        )

    # Sort by confidence descending
    flagged_clauses.sort(key=lambda x: x.confidence, reverse=True)

    return AnalysisDetailResponse(
        id=analysis.id,
        document_id=analysis.document_id,
        mode=analysis.mode,
        language=analysis.language,
        status=analysis.status,
        total_clauses_found=analysis.total_clauses_found,
        high_risk_count=analysis.high_risk_count,
        medium_risk_count=analysis.medium_risk_count,
        low_risk_count=analysis.low_risk_count,
        risk_score=analysis.risk_score,
        started_at=analysis.started_at,
        completed_at=analysis.completed_at,
        duration_seconds=analysis.duration_seconds,
        created_at=analysis.created_at,
        flagged_clauses=flagged_clauses,
        summary=analysis.summary,
        error_code=analysis.error_code,
        error_message=analysis.error_message,
    )


@router.get("/document/{document_id}/history", response_model=AnalysisListResponse)
async def get_document_analysis_history(
    document_id: UUID,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=50, description="Items per page"),
    db: AsyncSession = Depends(get_db),
) -> AnalysisListResponse:
    """
    Get analysis history for a document.

    Args:
        document_id: Document UUID
        page: Page number (1-indexed)
        page_size: Number of items per page

    Returns:
        Paginated list of analyses
    """
    # Check document exists
    doc_result = await db.execute(
        select(Document).where(Document.id == document_id, Document.deleted_at.is_(None))
    )
    document = doc_result.scalar_one_or_none()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": "Document not found"}},
        )

    # Get total count
    count_result = await db.execute(
        select(func.count(Analysis.id)).where(Analysis.document_id == document_id)
    )
    total = count_result.scalar() or 0

    # Get paginated analyses
    offset = (page - 1) * page_size
    result = await db.execute(
        select(Analysis)
        .where(Analysis.document_id == document_id)
        .order_by(Analysis.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    analyses = result.scalars().all()

    return AnalysisListResponse(
        analyses=[AnalysisSummaryResponse.model_validate(a) for a in analyses],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{analysis_id}/clauses", response_model=list[FlaggedClauseResponse])
async def get_flagged_clauses(
    analysis_id: UUID,
    risk_level: Optional[str] = Query(None, description="Filter by risk level (high, medium, low)"),
    min_confidence: Optional[float] = Query(
        None, ge=0.0, le=1.0, description="Minimum confidence score"
    ),
    db: AsyncSession = Depends(get_db),
) -> list[FlaggedClauseResponse]:
    """
    Get flagged clauses for an analysis with optional filters.

    Args:
        analysis_id: Analysis UUID
        risk_level: Filter by risk level
        min_confidence: Minimum confidence threshold

    Returns:
        List of flagged clauses
    """
    # Check analysis exists
    analysis_result = await db.execute(select(Analysis).where(Analysis.id == analysis_id))
    analysis = analysis_result.scalar_one_or_none()

    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": "Analysis not found"}},
        )

    # Build query with filters
    query = select(FlaggedClause).where(FlaggedClause.analysis_id == analysis_id)

    if risk_level:
        if risk_level not in ["high", "medium", "low"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": {
                        "code": "INVALID_RISK_LEVEL",
                        "message": "Risk level must be high, medium, or low",
                    }
                },
            )
        query = query.where(FlaggedClause.risk_level == risk_level)

    if min_confidence is not None:
        query = query.where(FlaggedClause.confidence >= min_confidence)

    query = query.order_by(FlaggedClause.confidence.desc())

    result = await db.execute(query)
    clauses = result.scalars().all()

    # Convert to response format
    response = []
    for fc in clauses:
        explanation = None
        if fc.explanation:
            explanation = FlaggedClauseExplanation(
                clause_text=fc.explanation.get("clause_text", ""),
                legal_references=fc.explanation.get("legal_references", []),
                notes=fc.explanation.get("notes"),
                tags=fc.explanation.get("tags"),
            )

        response.append(
            FlaggedClauseResponse(
                id=fc.id,
                clause_id=fc.clause_id,
                matched_text=fc.matched_text,
                start_position=fc.start_position,
                end_position=fc.end_position,
                confidence=fc.confidence,
                risk_level=fc.risk_level,
                match_type=fc.match_type,
                explanation=explanation,
                ai_explanation=fc.ai_explanation,
                created_at=fc.created_at,
            )
        )

    return response
