"""Pydantic schemas for analysis operations."""
from datetime import datetime
from typing import List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class LegalReferenceResponse(BaseModel):
    """Legal reference schema."""

    article_code: Optional[str] = None
    article_title: Optional[str] = None
    law_name: Optional[str] = None
    description: Optional[str] = None


class FlaggedClauseExplanation(BaseModel):
    """Explanation details for a flagged clause."""

    clause_text: str
    legal_references: List[LegalReferenceResponse] = Field(default_factory=list)
    notes: Optional[str] = None
    tags: Optional[List[str]] = None


class FlaggedClauseResponse(BaseModel):
    """Response schema for a flagged clause."""

    id: UUID
    clause_id: Optional[UUID] = None
    matched_text: str
    start_position: Optional[int] = None
    end_position: Optional[int] = None
    confidence: float = Field(ge=0.0, le=1.0)
    risk_level: Literal["high", "medium", "low"]
    match_type: Literal["keyword", "vector", "hybrid", "ai"]
    explanation: Optional[FlaggedClauseExplanation] = None
    ai_explanation: Optional[str] = None
    created_at: datetime

    class Config:
        """Pydantic config."""

        from_attributes = True


class AnalysisSummaryResponse(BaseModel):
    """Summary response schema for analysis."""

    id: UUID
    document_id: UUID
    mode: Literal["offline", "ai"]
    language: str
    status: Literal["queued", "processing", "completed", "failed", "cancelled"]
    total_clauses_found: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    risk_score: Optional[int] = Field(None, ge=0, le=100)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    created_at: datetime

    class Config:
        """Pydantic config."""

        from_attributes = True


class AnalysisDetailResponse(AnalysisSummaryResponse):
    """Detailed response schema for analysis including flagged clauses."""

    flagged_clauses: List[FlaggedClauseResponse] = Field(default_factory=list)
    summary: Optional[str] = None
    error_code: Optional[str] = None
    error_message: Optional[str] = None


class AnalysisListResponse(BaseModel):
    """Response schema for analysis list."""

    analyses: List[AnalysisSummaryResponse]
    total: int
    page: int
    page_size: int


class DocumentAnalysisResponse(BaseModel):
    """Response schema for document with analysis results."""

    document_id: UUID
    filename: str
    status: str
    language: str
    pages: Optional[int] = None
    created_at: datetime
    latest_analysis: Optional[AnalysisSummaryResponse] = None
