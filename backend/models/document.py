"""Document models."""
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import BigInteger, Boolean, CheckConstraint, Float, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from database.connection import Base


class Document(Base):
    """Document model representing uploaded files."""

    __tablename__ = "documents"

    # Primary key
    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)

    # Foreign keys
    user_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # File metadata
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    pages: Mapped[Optional[int]] = mapped_column(nullable=True)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)

    # Language & processing
    language: Mapped[str] = mapped_column(String(10), default="pl", nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="uploaded", nullable=False)

    # Storage
    upload_url: Mapped[str] = mapped_column(Text, nullable=False)
    drive_file_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    drive_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # OCR metadata
    ocr_required: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    ocr_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    ocr_confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Checksums
    sha256_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    # Celery task tracking
    celery_task_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    expires_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)

    # Relationships
    user: Mapped[Optional["User"]] = relationship(
        "User",
        back_populates="documents",
        foreign_keys=[user_id],
    )
    metadata_record: Mapped[Optional["DocumentMetadata"]] = relationship(
        "DocumentMetadata",
        back_populates="document",
        uselist=False,
        cascade="all, delete-orphan",
    )
    analyses: Mapped[list["Analysis"]] = relationship(
        "Analysis",
        back_populates="document",
        cascade="all, delete-orphan",
    )

    # Constraints
    __table_args__ = (
        CheckConstraint(
            "status IN ('uploaded', 'processing', 'completed', 'failed', 'expired')",
            name="valid_document_status",
        ),
        CheckConstraint(
            "size_bytes > 0 AND size_bytes <= 52428800",  # 50MB max
            name="valid_size",
        ),
    )

    def __repr__(self) -> str:
        """String representation."""
        return f"<Document(id={self.id}, filename={self.filename}, status={self.status})>"


class DocumentMetadata(Base):
    """Document metadata model for extracted text and structure."""

    __tablename__ = "document_metadata"

    # Primary key
    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)

    # Foreign key
    document_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    # Document properties
    title: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    author: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    subject: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    keywords: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)

    # Extracted text
    full_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    text_length: Mapped[Optional[int]] = mapped_column(nullable=True)
    word_count: Mapped[Optional[int]] = mapped_column(nullable=True)

    # Structure
    sections: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    paragraphs: Mapped[Optional[int]] = mapped_column(nullable=True)

    # Timestamp
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)

    # Relationships
    document: Mapped["Document"] = relationship("Document", back_populates="metadata_record")

    def __repr__(self) -> str:
        """String representation."""
        return f"<DocumentMetadata(id={self.id}, document_id={self.document_id}, word_count={self.word_count})>"
