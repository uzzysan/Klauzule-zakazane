"""Celery tasks for document processing."""
import tempfile
from pathlib import Path
from typing import Dict

from celery_app import celery_app
from services.ocr import ocr_service
from services.parser import document_parser
from services.storage import storage_service


@celery_app.task(bind=True, name="tasks.process_document")
def process_document(
    self,
    document_id: str,
    object_name: str,
    mime_type: str,
    language: str = "pol",
) -> Dict:
    """
    Process uploaded document: extract text, run OCR if needed, parse structure.

    Args:
        document_id: Unique document identifier
        object_name: MinIO object name
        mime_type: Document MIME type
        language: Document language (pol or eng)

    Returns:
        Dict with processing results
    """
    try:
        # Update task state
        self.update_state(state="PROCESSING", meta={"stage": "downloading"})

        # Download file from MinIO
        file_data = storage_service.download_file(object_name)

        # Create temporary file
        suffix = Path(object_name).suffix
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp_file:
            tmp_file.write(file_data)
            tmp_path = tmp_file.name

        try:
            # Update state
            self.update_state(state="PROCESSING", meta={"stage": "parsing"})

            # Parse based on MIME type
            if mime_type == "application/pdf":
                parsed = document_parser.parse_pdf(tmp_path, language)
            elif mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                parsed = document_parser.parse_docx(tmp_path)
            elif mime_type in ["image/jpeg", "image/png"]:
                parsed = document_parser.parse_image(tmp_path, language)
            else:
                raise ValueError(f"Unsupported MIME type: {mime_type}")

            # Update state
            self.update_state(state="PROCESSING", meta={"stage": "extracting_metadata"})

            # Build result
            result = {
                "document_id": document_id,
                "status": "completed",
                "text_extracted": parsed.full_text[:500],  # Preview
                "full_text_length": len(parsed.full_text),
                "pages": parsed.pages,
                "word_count": parsed.word_count,
                "metadata": parsed.metadata,
                "sections_count": len(parsed.sections),
                "ocr_used": parsed.ocr_result is not None,
                "ocr_confidence": parsed.ocr_result.confidence if parsed.ocr_result else None,
            }

            # Clean up temp file
            Path(tmp_path).unlink(missing_ok=True)

            return result

        except Exception as e:
            # Clean up temp file on error
            Path(tmp_path).unlink(missing_ok=True)
            raise

    except Exception as e:
        # Update state to failed
        self.update_state(
            state="FAILURE",
            meta={
                "error": str(e),
                "document_id": document_id,
            },
        )
        raise


@celery_app.task(name="tasks.test_celery")
def test_celery() -> str:
    """Simple task for testing Celery connection."""
    return "Celery is working!"
