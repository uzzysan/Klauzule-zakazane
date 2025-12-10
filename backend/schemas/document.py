"""Pydantic schemas for document operations."""
from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class DocumentUploadRequest(BaseModel):
    """Request schema for document upload."""

    language: Literal["pl", "en"] = Field(default="pl", description="Document language")
    analysis_mode: Literal["offline", "ai"] = Field(default="offline", description="Analysis mode")
    custom_clauses: bool = Field(
        default=True, description="Include user's custom clauses in analysis"
    )
    save_to_drive: bool = Field(
        default=False, description="Save to Google Drive (requires authentication)"
    )


class DocumentUploadResponse(BaseModel):
    """Response schema for document upload."""

    document_id: UUID
    filename: str
    size_bytes: int
    pages: Optional[int] = None
    upload_url: str
    created_at: datetime

    class Config:
        """Pydantic config."""

        from_attributes = True


class DocumentMetadata(BaseModel):
    """Document metadata schema."""

    document_id: UUID
    filename: str
    original_filename: str
    size_bytes: int
    pages: Optional[int]
    mime_type: str
    language: str
    status: str
    ocr_required: bool
    ocr_completed: bool
    ocr_confidence: Optional[float]
    created_at: datetime

    class Config:
        """Pydantic config."""

        from_attributes = True


class DocumentListResponse(BaseModel):
    """Response schema for document list."""

    documents: list[DocumentMetadata]
    pagination: dict


class FileValidationError(BaseModel):
    """File validation error details."""

    field: str
    message: str
    received_value: Optional[str] = None


# File upload constraints
MAX_FILE_SIZE_MB = 50
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

ALLOWED_MIME_TYPES = {
    "application/pdf": [".pdf"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
}

ALLOWED_EXTENSIONS = {ext for exts in ALLOWED_MIME_TYPES.values() for ext in exts}
