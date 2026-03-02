"""Analysis models for document analysis results."""
from datetime import datetime
from typing import List, Optional
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from database.connection import Base


class Analysis(Base):
    """Analysis jobs and results."""

    __tablename__ = "analyses"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    document_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False
    )

    # Configuration
    mode: Mapped[str] = mapped_column(String(20), default="offline", nullable=False)
    language: Mapped[str] = mapped_column(String(10), default="pl", nullable=False)
    options: Mapped[Optional[dict]] = mapped_column(JSONB, default=dict)

    # Status
    status: Mapped[str] = mapped_column(String(50), default="queued", nullable=False)

    # Results
    total_clauses_found: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    high_risk_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    medium_risk_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    low_risk_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    risk_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    results: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    # Processing info
    ai_enhanced: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    processing_node: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    celery_task_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Timing
    started_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    duration_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Errors
    error_code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Timestamp
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)

    # Relationships
    document: Mapped["Document"] = relationship("Document", back_populates="analyses")
    flagged_clauses: Mapped[List["FlaggedClause"]] = relationship(
        "FlaggedClause", back_populates="analysis", cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint(
            "status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')",
            name="valid_analysis_status",
        ),
        CheckConstraint("mode IN ('offline', 'ai')", name="valid_analysis_mode"),
        CheckConstraint(
            "risk_score IS NULL OR (risk_score >= 0 AND risk_score <= 100)", name="valid_risk_score"
        ),
    )

    def __repr__(self) -> str:
        return f"<Analysis(id={self.id}, document_id={self.document_id}, status={self.status})>"


class FlaggedClause(Base):
    """Clauses flagged during analysis."""

    __tablename__ = "flagged_clauses"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    analysis_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False
    )
    clause_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("prohibited_clauses.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Matched text
    matched_text: Mapped[str] = mapped_column(Text, nullable=False)

    # Location in document
    location: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    page_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    start_position: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    end_position: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Scoring
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    risk_level: Mapped[str] = mapped_column(String(20), nullable=False)
    match_type: Mapped[str] = mapped_column(String(50), default="hybrid", nullable=False)

    # Explanation
    explanation: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    ai_explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Timestamp
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)

    # Relationships
    analysis: Mapped["Analysis"] = relationship("Analysis", back_populates="flagged_clauses")
    matched_clause: Mapped[Optional["ProhibitedClause"]] = relationship("ProhibitedClause")
    feedback: Mapped[List["AnalysisFeedback"]] = relationship(
        "AnalysisFeedback", back_populates="flagged_clause", cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint("risk_level IN ('high', 'medium', 'low')", name="valid_flagged_risk_level"),
        CheckConstraint(
            "match_type IN ('keyword', 'vector', 'hybrid', 'ai')", name="valid_match_type"
        ),
        CheckConstraint("confidence >= 0.0 AND confidence <= 1.0", name="valid_flagged_confidence"),
    )

    def __repr__(self) -> str:
        return f"<FlaggedClause(id={self.id}, risk_level={self.risk_level}, confidence={self.confidence})>"


# Import Document here to avoid circular import
from models.clause import ProhibitedClause  # noqa: E402, F401
from models.document import Document  # noqa: E402, F401
from models.feedback import AnalysisFeedback  # noqa: E402, F401
