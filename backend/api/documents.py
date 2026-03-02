"""API endpoints for document operations."""
import base64
import hashlib
import hmac
import json
import os
import traceback
from datetime import datetime, timedelta
from typing import List, Optional
from uuid import UUID, uuid4

from config import settings
from database.connection import get_db
from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Request,
    Response,
    UploadFile,
    status,
)
from models.document import Document
from models.user import User
from schemas.document import (
    ALLOWED_EXTENSIONS,
    ALLOWED_MIME_TYPES,
    MAX_FILE_SIZE_BYTES,
    DocumentUploadResponse,
)
from services.storage import storage_service
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_optional_user

router = APIRouter(prefix="/api/v1/documents", tags=["documents"])


# --- Cookie Helpers ---
COOKIE_NAME = "fairpact_guest_access"


def _sign_data(data: str) -> str:
    """Sign data using HMAC-SHA256."""
    key = settings.secret_key.get_secret_value().encode()
    signature = hmac.new(key, data.encode(), hashlib.sha256).hexdigest()
    return f"{base64.urlsafe_b64encode(data.encode()).decode()}.{signature}"


def _verify_data(signed_data: str) -> Optional[str]:
    """Verify signed data and return original string."""
    try:
        data_b64, signature = signed_data.split(".")
        data = base64.urlsafe_b64decode(data_b64).decode()
        expected_signature = hmac.new(
            settings.secret_key.get_secret_value().encode(),
            data.encode(),
            hashlib.sha256,
        ).hexdigest()
        if hmac.compare_digest(signature, expected_signature):
            return data
    except Exception:
        pass
    return None


def _get_guest_documents(request: Request) -> List[str]:
    """Get list of allowed document IDs from cookie."""
    cookie = request.cookies.get(COOKIE_NAME)
    if not cookie:
        return []
    data = _verify_data(cookie)
    if data:
        try:
            return json.loads(data)
        except json.JSONDecodeError:
            pass
    return []


def _add_guest_document(response: Response, request: Request, document_id: str) -> None:
    """Add document ID to guest cookie."""
    docs = _get_guest_documents(request)
    if document_id not in docs:
        docs.append(document_id)

    # Store max 50 docs to prevent cookie bloat
    if len(docs) > 50:
        docs = docs[-50:]

    data = json.dumps(docs)
    signed = _sign_data(data)

    # Set cookie with 8h expiry to match retention
    max_age = settings.guest_file_retention_hours * 3600
    response.set_cookie(
        key=COOKIE_NAME,
        value=signed,
        max_age=max_age,
        httponly=True,
        samesite="lax",
        secure=False,  # Set to True in production with HTTPS
    )


def validate_file(file: UploadFile) -> int:
    """Validate uploaded file and return file size."""
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

    return file_size


@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_200_OK)
async def upload_document(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    file: UploadFile = File(..., description="Document file to upload"),
    language: str = Form(default="pl", description="Document language (pl or en)"),
    analysis_mode: str = Form(default="offline", description="Analysis mode (offline or ai)"),
    custom_clauses: bool = Form(default=True, description="Include user's custom clauses"),
    save_to_drive: bool = Form(default=False, description="Save to Google Drive"),
    current_user: Optional[User] = Depends(get_optional_user),
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
            detail={"error": {"code": "INVALID_ANALYSIS_MODE", "message": "Invalid analysis mode"}},
        )

    # Extract user_id from authenticated user (if any)
    user_id = str(current_user.id) if current_user else None

    try:
        # Upload file to storage
        object_name, checksum, actual_file_size = await storage_service.upload_file(
            file_data=file.file,
            original_filename=file.filename or "unknown",
            content_type=file.content_type or "application/octet-stream",
            user_id=user_id,
        )

        # Generate presigned URL for access
        upload_url = storage_service.get_file_url(object_name)

        # Generate document ID
        document_id = uuid4()

        # Determine if this is a guest upload (set expiration)
        expires_at = None
        if user_id is None:
            expires_at = datetime.utcnow() + timedelta(hours=settings.guest_file_retention_hours)

        # Create document record in database
        document = Document(
            id=document_id,
            user_id=UUID(user_id) if user_id else None,
            filename=object_name,
            original_filename=file.filename or "unknown",
            size_bytes=actual_file_size,
            mime_type=file.content_type or "application/octet-stream",
            language=language,
            status="processing",
            upload_url=upload_url,
            sha256_hash=checksum,
            expires_at=expires_at,
        )

        db.add(document)
        await db.flush()  # Get the ID assigned

        # Queue document processing task
        from tasks.document_processing import process_document

        task = process_document.delay(
            document_id=str(document_id),
            object_name=object_name,
            mime_type=file.content_type or "application/octet-stream",
            language=language,
        )

        # Update document with task ID
        document.celery_task_id = task.id
        await db.commit()

        # Grant access to guest if applicable
        if user_id is None:
            _add_guest_document(response, request, str(document_id))

        return DocumentUploadResponse(
            document_id=document_id,
            filename=file.filename or "unknown",
            size_bytes=actual_file_size,
            pages=None,  # Will be determined during processing
            upload_url=upload_url,
            created_at=document.created_at,
        )

    except ValueError as e:
        await db.rollback()
        print(f"Storage Error Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": "STORAGE_ERROR", "message": str(e)}},
        )
    except Exception as e:
        await db.rollback()
        print(f"Internal Error Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": "INTERNAL_ERROR", "message": str(e)}},
        )


@router.get("/health")
async def health_check() -> dict:
    """Health check endpoint."""
    return {"status": "ok", "service": "documents"}


@router.get("/{document_id}")
async def get_document(
    document_id: UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
) -> dict:
    """Get document by ID."""
    from sqlalchemy import select

    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.deleted_at.is_(None))
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": "Document not found"}},
        )

    # CHECK 1: Expiration
    if document.expires_at and datetime.utcnow() > document.expires_at:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,  # Treat as not found/deleted
            detail={"error": {"code": "EXPIRED", "message": "Document session expired"}},
        )

    # CHECK 2: Access Control
    if document.user_id:
        # Owned document - check user
        if not current_user or current_user.id != document.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"error": {"code": "ACCESS_DENIED", "message": "Access denied"}},
            )
    else:
        # Guest document - check cookie
        allowed_docs = _get_guest_documents(request)
        if str(document.id) not in allowed_docs:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": {
                        "code": "ACCESS_DENIED",
                        "message": "Access restricted to uploader session",
                    }
                },
            )

    return {
        "document_id": str(document.id),
        "filename": document.original_filename,
        "size_bytes": document.size_bytes,
        "pages": document.pages,
        "language": document.language,
        "status": document.status,
        "ocr_required": document.ocr_required,
        "ocr_completed": document.ocr_completed,
        "ocr_confidence": document.ocr_confidence,
        "created_at": document.created_at.isoformat(),
        "upload_url": document.upload_url,
        "celery_task_id": document.celery_task_id,
        "expires_at": document.expires_at.isoformat() if document.expires_at else None,
    }
