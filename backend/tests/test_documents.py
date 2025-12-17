"""Tests for document API endpoints."""
from io import BytesIO
from uuid import uuid4

import pytest
from httpx import AsyncClient

from models.document import Document
from models.user import User
from tests.conftest import auth_headers


class TestDocumentHealth:
    """Tests for GET /api/v1/documents/health endpoint."""

    async def test_health_check(self, client: AsyncClient):
        """Test document service health check."""
        response = await client.get("/api/v1/documents/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "documents"


class TestUploadDocument:
    """Tests for POST /api/v1/documents/upload endpoint."""

    async def test_upload_pdf_as_guest(self, client: AsyncClient, mocker):
        """Test uploading PDF document as guest user."""
        # Mock storage service
        mock_upload = mocker.patch(
            "api.documents.storage_service.upload_file",
            return_value=("test-file.pdf", "abc123", 1024),
        )
        mock_get_url = mocker.patch(
            "api.documents.storage_service.get_file_url",
            return_value="http://storage/test-file.pdf",
        )
        # Mock Celery task
        mock_task = mocker.MagicMock()
        mock_task.id = "task-123"
        mocker.patch(
            "tasks.document_processing.process_document.delay",
            return_value=mock_task,
        )

        # Create test PDF file
        pdf_content = b"%PDF-1.4 test content"
        files = {
            "file": ("test.pdf", BytesIO(pdf_content), "application/pdf"),
        }

        response = await client.post(
            "/api/v1/documents/upload",
            files=files,
            data={
                "language": "pl",
                "analysis_mode": "offline",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "document_id" in data
        assert data["filename"] == "test.pdf"

    async def test_upload_pdf_as_authenticated_user(
        self, client: AsyncClient, test_user: User, user_token: str, mocker
    ):
        """Test uploading PDF document as authenticated user."""
        # Mock storage service
        mocker.patch(
            "api.documents.storage_service.upload_file",
            return_value=("test-file.pdf", "abc123", 1024),
        )
        mocker.patch(
            "api.documents.storage_service.get_file_url",
            return_value="http://storage/test-file.pdf",
        )
        # Mock Celery task
        mock_task = mocker.MagicMock()
        mock_task.id = "task-123"
        mocker.patch(
            "tasks.document_processing.process_document.delay",
            return_value=mock_task,
        )

        pdf_content = b"%PDF-1.4 test content"
        files = {
            "file": ("test.pdf", BytesIO(pdf_content), "application/pdf"),
        }

        response = await client.post(
            "/api/v1/documents/upload",
            files=files,
            data={"language": "pl"},
            headers=auth_headers(user_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert "document_id" in data

    async def test_upload_invalid_file_type(self, client: AsyncClient):
        """Test uploading file with invalid type fails."""
        # Create test file with invalid type
        files = {
            "file": ("test.exe", BytesIO(b"test content"), "application/x-msdownload"),
        }

        response = await client.post(
            "/api/v1/documents/upload",
            files=files,
            data={"language": "pl"},
        )

        assert response.status_code == 400
        data = response.json()
        assert data["detail"]["error"]["code"] == "INVALID_FILE_TYPE"

    async def test_upload_invalid_language(self, client: AsyncClient, mocker):
        """Test uploading with invalid language fails."""
        # Mock storage to avoid actual upload
        mocker.patch(
            "api.documents.storage_service.upload_file",
            return_value=("test-file.pdf", "abc123", 1024),
        )

        pdf_content = b"%PDF-1.4 test content"
        files = {
            "file": ("test.pdf", BytesIO(pdf_content), "application/pdf"),
        }

        response = await client.post(
            "/api/v1/documents/upload",
            files=files,
            data={"language": "invalid"},
        )

        assert response.status_code == 400
        data = response.json()
        assert data["detail"]["error"]["code"] == "INVALID_LANGUAGE"

    async def test_upload_invalid_analysis_mode(self, client: AsyncClient, mocker):
        """Test uploading with invalid analysis mode fails."""
        # Mock storage to avoid actual upload
        mocker.patch(
            "api.documents.storage_service.upload_file",
            return_value=("test-file.pdf", "abc123", 1024),
        )

        pdf_content = b"%PDF-1.4 test content"
        files = {
            "file": ("test.pdf", BytesIO(pdf_content), "application/pdf"),
        }

        response = await client.post(
            "/api/v1/documents/upload",
            files=files,
            data={"language": "pl", "analysis_mode": "invalid"},
        )

        assert response.status_code == 400
        data = response.json()
        assert data["detail"]["error"]["code"] == "INVALID_ANALYSIS_MODE"


class TestGetDocument:
    """Tests for GET /api/v1/documents/{document_id} endpoint."""

    async def test_get_document_success(self, client: AsyncClient, db_session):
        """Test getting existing document."""
        # Create a test document
        doc_id = uuid4()
        document = Document(
            id=doc_id,
            filename="stored-file.pdf",
            original_filename="test.pdf",
            size_bytes=1024,
            mime_type="application/pdf",
            language="pl",
            status="completed",
            upload_url="http://storage/stored-file.pdf",
            sha256_hash="abc123",
        )
        db_session.add(document)
        await db_session.commit()

        response = await client.get(f"/api/v1/documents/{doc_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["document_id"] == str(doc_id)
        assert data["filename"] == "test.pdf"
        assert data["status"] == "completed"

    async def test_get_document_not_found(self, client: AsyncClient):
        """Test getting non-existent document fails."""
        response = await client.get(f"/api/v1/documents/{uuid4()}")

        assert response.status_code == 404
        data = response.json()
        assert data["detail"]["error"]["code"] == "NOT_FOUND"

    async def test_get_deleted_document(self, client: AsyncClient, db_session):
        """Test getting soft-deleted document fails."""
        from datetime import datetime

        doc_id = uuid4()
        document = Document(
            id=doc_id,
            filename="deleted-file.pdf",
            original_filename="deleted.pdf",
            size_bytes=1024,
            mime_type="application/pdf",
            language="pl",
            status="completed",
            upload_url="http://storage/deleted-file.pdf",
            sha256_hash="def456",
            deleted_at=datetime.utcnow(),
        )
        db_session.add(document)
        await db_session.commit()

        response = await client.get(f"/api/v1/documents/{doc_id}")

        assert response.status_code == 404
