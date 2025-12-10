"""Celery tasks for document processing."""
import asyncio
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Dict
from uuid import UUID

from celery_app import celery_app
from services.parser import document_parser
from services.storage import storage_service


async def _store_metadata_and_analyze(
    document_id: str,
    parsed_result: object,
    language: str,
) -> Dict:
    """
    Store document metadata and run clause analysis.

    Args:
        document_id: Document UUID string
        parsed_result: Parsed document result from parser
        language: Document language (pl or en)

    Returns:
        Dict with analysis results
    """
    from sqlalchemy import select

    from database.connection import get_db_context
    from models.analysis import Analysis, FlaggedClause
    from models.document import Document, DocumentMetadata
    from services.analysis import get_analysis_service

    async with get_db_context() as session:
        doc_uuid = UUID(document_id)

        # Get the document
        result = await session.execute(select(Document).where(Document.id == doc_uuid))
        document = result.scalar_one_or_none()
        if not document:
            raise ValueError(f"Document not found: {document_id}")

        # Store document metadata
        metadata = DocumentMetadata(
            document_id=doc_uuid,
            title=parsed_result.metadata.get("title"),
            author=parsed_result.metadata.get("author"),
            subject=parsed_result.metadata.get("subject"),
            keywords=parsed_result.metadata.get("keywords"),
            full_text=parsed_result.full_text,
            text_length=len(parsed_result.full_text),
            word_count=parsed_result.word_count,
            sections={
                "sections": [
                    s.__dict__ if hasattr(s, "__dict__") else str(s) for s in parsed_result.sections
                ]
            },
            paragraphs=len(parsed_result.sections),
        )
        session.add(metadata)

        # Update document status and page count
        document.pages = parsed_result.pages
        document.ocr_required = parsed_result.ocr_result is not None
        document.ocr_completed = parsed_result.ocr_result is not None
        document.ocr_confidence = (
            parsed_result.ocr_result.confidence if parsed_result.ocr_result else None
        )

        # Create analysis record
        analysis = Analysis(
            document_id=doc_uuid,
            mode="offline",
            language=language,
            status="processing",
            started_at=datetime.utcnow(),
        )
        session.add(analysis)
        await session.flush()  # Get analysis ID

        # Run clause analysis
        analysis_service = get_analysis_service()
        analysis_result = await analysis_service.analyze_document(
            session=session,
            document_text=parsed_result.full_text,
            language=language,
        )

        # Store flagged clauses
        for match in analysis_result.matches:
            flagged = FlaggedClause(
                analysis_id=analysis.id,
                clause_id=match.clause_id,
                matched_text=match.matched_text,
                start_position=match.start_position,
                end_position=match.end_position,
                confidence=match.similarity_score,
                risk_level=match.risk_level,
                match_type=match.match_type,
                explanation={
                    "clause_text": match.clause_text,
                    "legal_references": match.legal_references,
                    "notes": match.notes,
                    "tags": match.tags,
                },
            )
            session.add(flagged)

        # Update analysis with results
        analysis.status = "completed"
        analysis.completed_at = datetime.utcnow()
        analysis.duration_seconds = int(
            (analysis.completed_at - analysis.started_at).total_seconds()
        )
        analysis.total_clauses_found = len(analysis_result.matches)
        analysis.high_risk_count = analysis_result.high_risk_count
        analysis.medium_risk_count = analysis_result.medium_risk_count
        analysis.low_risk_count = analysis_result.low_risk_count
        analysis.risk_score = analysis_result.risk_score

        # Update document status
        document.status = "completed"

        await session.commit()

        return {
            "analysis_id": str(analysis.id),
            "total_clauses_found": analysis.total_clauses_found,
            "high_risk_count": analysis.high_risk_count,
            "medium_risk_count": analysis.medium_risk_count,
            "low_risk_count": analysis.low_risk_count,
            "risk_score": analysis.risk_score,
            "segments_analyzed": analysis_result.total_segments_analyzed,
        }


@celery_app.task(bind=True, name="tasks.process_document")
def process_document(
    self,
    document_id: str,
    object_name: str,
    mime_type: str,
    language: str = "pol",
) -> Dict:
    """
    Process uploaded document: extract text, run OCR if needed, analyze for prohibited clauses.

    Args:
        document_id: Unique document identifier
        object_name: MinIO object name
        mime_type: Document MIME type
        language: Document language (pol or eng)

    Returns:
        Dict with processing results
    """
    # Map language codes
    lang_map = {"pl": "pol", "en": "eng", "pol": "pol", "eng": "eng"}
    ocr_language = lang_map.get(language, "pol")
    analysis_language = "pl" if language in ["pl", "pol"] else "en"

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
                parsed = document_parser.parse_pdf(tmp_path, ocr_language)
            elif (
                mime_type
                == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ):
                parsed = document_parser.parse_docx(tmp_path)
            elif mime_type in ["image/jpeg", "image/png"]:
                parsed = document_parser.parse_image(tmp_path, ocr_language)
            else:
                raise ValueError(f"Unsupported MIME type: {mime_type}")

            # Update state
            self.update_state(state="PROCESSING", meta={"stage": "analyzing"})

            # Store metadata and run analysis
            analysis_result = asyncio.run(
                _store_metadata_and_analyze(
                    document_id=document_id,
                    parsed_result=parsed,
                    language=analysis_language,
                )
            )

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
                "analysis": analysis_result,
            }

            # Clean up temp file
            Path(tmp_path).unlink(missing_ok=True)

            return result

        except Exception:
            # Clean up temp file on error
            Path(tmp_path).unlink(missing_ok=True)
            raise

    except Exception as e:
        # Update state to failed and mark document as failed
        self.update_state(
            state="FAILURE",
            meta={
                "error": str(e),
                "document_id": document_id,
            },
        )
        # Try to update document status to failed
        try:
            asyncio.run(_mark_document_failed(document_id, str(e)))
        except Exception:
            pass  # Best effort
        raise


async def _mark_document_failed(document_id: str, error_message: str) -> None:
    """Mark document as failed in database."""
    from sqlalchemy import select

    from database.connection import get_db_context
    from models.document import Document

    async with get_db_context() as session:
        result = await session.execute(select(Document).where(Document.id == UUID(document_id)))
        document = result.scalar_one_or_none()
        if document:
            document.status = "failed"
            await session.commit()


@celery_app.task(name="tasks.test_celery")
def test_celery() -> str:
    """Simple task for testing Celery connection."""
    return "Celery is working!"
