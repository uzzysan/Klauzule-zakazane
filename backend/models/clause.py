"""Clause database models for prohibited clause detection."""
from datetime import datetime
from typing import List, Optional
from uuid import UUID, uuid4

from pgvector.sqlalchemy import Vector
from sqlalchemy import Boolean, CheckConstraint, Date, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from database.connection import Base


class ClauseCategory(Base):
    """Category/taxonomy for prohibited clauses."""

    __tablename__ = "clause_categories"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)

    # Category info
    code: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    name_en: Mapped[str] = mapped_column(String(255), nullable=False)
    name_pl: Mapped[str] = mapped_column(String(255), nullable=False)
    description_en: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    description_pl: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Classification
    default_risk_level: Mapped[str] = mapped_column(String(20), default="medium", nullable=False)
    parent_category_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("clause_categories.id"), nullable=True
    )

    # Metadata
    clause_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    clauses: Mapped[List["ProhibitedClause"]] = relationship(
        "ProhibitedClause", back_populates="category", foreign_keys="ProhibitedClause.category_id"
    )
    parent: Mapped[Optional["ClauseCategory"]] = relationship(
        "ClauseCategory", remote_side=[id], backref="children"
    )

    __table_args__ = (
        CheckConstraint("default_risk_level IN ('high', 'medium', 'low')", name="valid_risk_level"),
    )

    def __repr__(self) -> str:
        return f"<ClauseCategory(code={self.code}, name_pl={self.name_pl})>"


class LegalReference(Base):
    """Legal articles and references for clauses."""

    __tablename__ = "legal_references"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)

    # Reference info
    article_code: Mapped[str] = mapped_column(String(100), nullable=False)
    article_title: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    full_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Source
    law_name: Mapped[str] = mapped_column(String(255), nullable=False)
    jurisdiction: Mapped[str] = mapped_column(String(50), default="PL", nullable=False)
    effective_date: Mapped[Optional[datetime]] = mapped_column(Date, nullable=True)

    # Links
    official_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    clause_references: Mapped[List["ClauseLegalReference"]] = relationship(
        "ClauseLegalReference", back_populates="legal_reference"
    )

    def __repr__(self) -> str:
        return f"<LegalReference(article_code={self.article_code}, law_name={self.law_name})>"


class ProhibitedClause(Base):
    """Database of prohibited/risky clause patterns."""

    __tablename__ = "prohibited_clauses"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True), nullable=True, index=True
    )
    category_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("clause_categories.id"), nullable=False
    )

    # Clause content
    clause_text: Mapped[str] = mapped_column(Text, nullable=False)
    normalized_text: Mapped[str] = mapped_column(Text, nullable=False)
    variations: Mapped[Optional[list]] = mapped_column(ARRAY(Text), default=list)

    # Classification
    risk_level: Mapped[str] = mapped_column(String(20), default="medium", nullable=False)
    language: Mapped[str] = mapped_column(String(10), default="pl", nullable=False)

    # Vector embedding (384 dimensions for all-MiniLM-L6-v2)
    embedding = mapped_column(Vector(384), nullable=True)

    # Source
    source: Mapped[str] = mapped_column(String(50), default="standard", nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)

    # Usage stats
    usage_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    detection_accuracy: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Metadata
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tags: Mapped[Optional[list]] = mapped_column(ARRAY(Text), default=list)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now(), nullable=False
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)

    # Relationships
    category: Mapped["ClauseCategory"] = relationship("ClauseCategory", back_populates="clauses")
    legal_references: Mapped[List["ClauseLegalReference"]] = relationship(
        "ClauseLegalReference", back_populates="clause", cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint("risk_level IN ('high', 'medium', 'low')", name="valid_clause_risk_level"),
        CheckConstraint(
            "source IN ('standard', 'user', 'community', 'imported')", name="valid_clause_source"
        ),
        CheckConstraint("confidence >= 0.0 AND confidence <= 1.0", name="valid_clause_confidence"),
    )

    def __repr__(self) -> str:
        return f"<ProhibitedClause(id={self.id}, risk_level={self.risk_level})>"


class ClauseLegalReference(Base):
    """Many-to-many relationship between clauses and legal references."""

    __tablename__ = "clause_legal_references"

    clause_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("prohibited_clauses.id", ondelete="CASCADE"),
        primary_key=True,
    )
    legal_reference_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("legal_references.id", ondelete="CASCADE"),
        primary_key=True,
    )

    # Relationship metadata
    relevance_score: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Timestamp
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)

    # Relationships
    clause: Mapped["ProhibitedClause"] = relationship(
        "ProhibitedClause", back_populates="legal_references"
    )
    legal_reference: Mapped["LegalReference"] = relationship(
        "LegalReference", back_populates="clause_references"
    )

    def __repr__(self) -> str:
        return f"<ClauseLegalReference(clause_id={self.clause_id}, legal_reference_id={self.legal_reference_id})>"
