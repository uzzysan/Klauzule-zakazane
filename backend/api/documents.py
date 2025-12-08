"""API endpoints for document operations."""
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from fastapi.responses import JSONResponse

from schemas.document import (
    ALLOWED_EXTENSIONS,
    ALLOWED_MIME_TYPES,
    MAX_FILE_SIZE_BYTES,
    DocumentUploadResponse,
)
from services.storage import storage_service

router = APIRouter(prefix="/api/v1/documents", tags=["documents"])


def validate_file(file: UploadFile) -> None:
    """Validate uploaded file."""
    # Check file size
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to start

    if file_size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail={
                "error": {
                    "code": "FILE_TOO_LARGE",
                    "message": f"File size exceeds maximum allowed size of {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB",
                    "details": {"file_size_mb": file_size / (1024 * 1024)},
                }
            },
        )

    # Check file type
    content_type = file.content_type
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "INVALID_FILE_TYPE",
                    "message": "Invalid file type. Only PDF, DOCX, JPG, PNG are allowed.",
                    "details": {
                        "received_type": content_type,
                        "allowed_types": list(ALLOWED_MIME_TYPES.keys()),
                    },
                }
            },
        )

    # Check file extension
    if file.filename:
        import os

        _, ext = os.path.splitext(file.filename.lower())
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": {
                        "code": "INVALID_FILE_EXTENSION",
                        "message": f"Invalid file extension. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
                        "details": {"received_extension": ext},
                    }
                },
            )


@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_200_OK)
async def upload_document(
    file: UploadFile = File(..., description="Document file to upload"),
    language: str = Form(default="pl", description="Document language (pl or en)"),
    analysis_mode: str = Form(
        default="offline", description="Analysis mode (offline or ai)"
    ),
    custom_clauses: bool = Form(
        default=True, description="Include user's custom clauses"
    ),
    save_to_drive: bool = Form(default=False, description="Save to Google Drive"),
    user_id: Optional[str] = None,  # TODO: Get from auth dependency
) -> DocumentUploadResponse:
    """
    Upload a document for analysis.

    - **file**: Document file (PDF, DOCX, JPG, PNG) - max 50MB
    - **language**: Document language (default: pl)
    - **analysis_mode**: offline or ai (default: offline)
    - **custom_clauses**: Include custom clauses in analysis (default: true)
    - **save_to_drive**: Save to Google Drive (requires authentication)
    """
    # Validate file
    validate_file(file)

    # Validate language
    if language not in ["pl", "en"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "INVALID_LANGUAGE", "message": "Invalid language"}},
        )

    # Validate analysis mode
    if analysis_mode not in ["offline", "ai"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {"code": "INVALID_ANALYSIS_MODE", "message": "Invalid analysis mode"}
            },
        )

    try:
        # Upload file to storage
        object_name, checksum, file_size = storage_service.upload_file(
            file_data=file.file,
            original_filename=file.filename or "unknown",
            content_type=file.content_type or "application/octet-stream",
            user_id=user_id,
        )

        # Generate presigned URL for access
        upload_url = storage_service.get_file_url(object_name)

        # Generate document ID
        document_id = uuid4()

        # TODO: Save to database
        # - Create document record
        # - Queue analysis job

        from datetime import datetime

        return DocumentUploadResponse(
            document_id=document_id,
            filename=file.filename or "unknown",
            size_bytes=file_size,
            pages=None,  # Will be determined during processing
            upload_url=upload_url,
            created_at=datetime.utcnow(),
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": "STORAGE_ERROR", "message": str(e)}},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": "INTERNAL_ERROR", "message": "An error occurred"}},
        )


@router.get("/health")
async def health_check() -> dict:
    """Health check endpoint."""
    return {"status": "ok", "service": "documents"}
