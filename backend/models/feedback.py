"""Admin feedback and metrics models."""
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from database.connection import Base
from sqlalchemy import Boolean, Date, Float, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func


class AnalysisFeedback(Base):
    """Feedback from admin reviewers on flagged clauses."""

    __tablename__ = "analysis_feedback"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)

    # Reference to flagged clause
    flagged_clause_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("flagged_clauses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Feedback
    is_correct: Mapped[bool] = mapped_column(
        Boolean, nullable=False, comment="Was this a true positive?"
    )
    reviewer_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        comment="Admin user who reviewed",
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    flagged_clause: Mapped["FlaggedClause"] = relationship(
        "FlaggedClause", back_populates="feedback"
    )

    def __repr__(self) -> str:
        return f"<AnalysisFeedback(id={self.id}, is_correct={self.is_correct})>"


class ModelMetrics(Base):
    """Track model performance metrics over time."""

    __tablename__ = "model_metrics"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)

    # Date of metrics
    date: Mapped[datetime] = mapped_column(Date, nullable=False, unique=True, index=True)

    # Metrics
    true_positives: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    false_positives: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    true_negatives: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    false_negatives: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Calculated metrics
    precision: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    recall: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    f1_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    accuracy: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Additional info
    total_reviews: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<ModelMetrics(date={self.date}, precision={self.precision})>"


# Import to avoid circular dependency
from models.analysis import FlaggedClause  # noqa: E402, F401
