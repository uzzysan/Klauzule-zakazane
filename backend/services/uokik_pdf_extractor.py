"""Service for extracting prohibited clauses from UOKiK decision PDFs."""
import logging
import tempfile
from pathlib import Path
from typing import Dict, List, Optional

import httpx

from services.llm_extractor import LLMExtractorError, get_llm_extractor
from services.parser import document_parser

logger = logging.getLogger(__name__)

DEFAULT_UOKIK_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "application/pdf,*/*",
    "Accept-Language": "pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7",
    "Referer": "https://decyzje.uokik.gov.pl/",
}


class PDFExtractionError(Exception):
    """Raised when PDF extraction fails."""

    pass


class UokikPDFExtractor:
    """Extracts prohibited clauses from UOKiK decision PDFs."""

    def __init__(self, tmp_dir: Optional[str] = None):
        """Initialize extractor.

        Args:
            tmp_dir: Directory for temporary PDF files. If None, uses system temp.
        """
        self.tmp_dir = Path(tmp_dir) if tmp_dir else Path(tempfile.gettempdir()) / "uokik_pdfs"
        self.tmp_dir.mkdir(parents=True, exist_ok=True)

    async def download_pdf(self, url: str, filename: Optional[str] = None) -> Path:
        """Download PDF from URL.

        Args:
            url: PDF URL.
            filename: Optional filename to save as.

        Returns:
            Path to downloaded PDF.

        Raises:
            PDFExtractionError: If download fails.
        """
        if not filename:
            filename = url.split("/")[-1] or "decision.pdf"
            if not filename.endswith(".pdf"):
                filename += ".pdf"

        pdf_path = self.tmp_dir / filename

        try:
            logger.info(f"Downloading PDF from {url}")
            async with httpx.AsyncClient(
                headers=DEFAULT_UOKIK_HEADERS, timeout=60, follow_redirects=True
            ) as client:
                response = await client.get(url)
                response.raise_for_status()

                # Verify it's a PDF
                content_type = response.headers.get("content-type", "")
                if "pdf" not in content_type and not response.content.startswith(b"%PDF"):
                    raise PDFExtractionError(
                        f"Downloaded file is not a PDF (content-type: {content_type})"
                    )

                pdf_path.write_bytes(response.content)
                logger.info(f"PDF saved to {pdf_path} ({len(response.content)} bytes)")
                return pdf_path

        except httpx.HTTPError as e:
            raise PDFExtractionError(f"Failed to download PDF from {url}: {e}")
        except Exception as e:
            raise PDFExtractionError(f"Unexpected error downloading PDF: {e}")

    def extract_text_from_pdf(self, pdf_path: Path) -> str:
        """Extract text from PDF using existing parser.

        Args:
            pdf_path: Path to PDF file.

        Returns:
            Extracted text.

        Raises:
            PDFExtractionError: If text extraction fails.
        """
        try:
            logger.info(f"Extracting text from {pdf_path}")
            parsed = document_parser.parse_pdf(str(pdf_path))

            if not parsed.full_text or len(parsed.full_text.strip()) < 50:
                raise PDFExtractionError(
                    f"PDF text extraction returned too little text ({len(parsed.full_text or '')} chars). "
                    "Document may be a scanned image."
                )

            logger.info(f"Extracted {len(parsed.full_text)} chars from {parsed.pages} pages")
            return parsed.full_text

        except Exception as e:
            if isinstance(e, PDFExtractionError):
                raise
            raise PDFExtractionError(f"Failed to extract text from PDF: {e}")

    async def extract_clauses_from_pdf(
        self,
        url: str,
        metadata: Optional[Dict] = None,
        filename: Optional[str] = None,
    ) -> List[Dict]:
        """Full pipeline: download PDF, extract text, run LLM.

        Args:
            url: PDF URL.
            metadata: Optional metadata about the decision.
            filename: Optional filename override.

        Returns:
            List of extracted clause dictionaries.

        Raises:
            PDFExtractionError: If any step fails.
        """
        metadata = metadata or {}
        pdf_path: Optional[Path] = None

        try:
            # Step 1: Download
            pdf_path = await self.download_pdf(url, filename)

            # Step 2: Extract text
            text = self.extract_text_from_pdf(pdf_path)

            # Step 3: LLM extraction
            extractor = get_llm_extractor()
            clauses = extractor.extract_clauses(text)

            # Enrich with metadata
            for clause in clauses:
                clause["pdf_url"] = url
                clause["source"] = "uokik_decision"
                # Use provided metadata if LLM didn't extract something
                if not clause.get("signature") and metadata.get("signature"):
                    clause["signature"] = metadata["signature"]
                if not clause.get("court_date") and metadata.get("date"):
                    clause["court_date"] = metadata["date"]
                if not clause.get("decision_number") and metadata.get("decision_number"):
                    clause["decision_number"] = metadata["decision_number"]

            logger.info(f"Extracted {len(clauses)} clauses from {url}")
            return clauses

        except LLMExtractorError as e:
            raise PDFExtractionError(f"LLM extraction failed: {e}")
        finally:
            # Cleanup downloaded PDF
            if pdf_path and pdf_path.exists():
                try:
                    pdf_path.unlink()
                    logger.debug(f"Cleaned up {pdf_path}")
                except OSError as e:
                    logger.warning(f"Failed to cleanup {pdf_path}: {e}")

    def cleanup_old_pdfs(self, max_age_hours: int = 24) -> int:
        """Remove old temporary PDF files.

        Args:
            max_age_hours: Maximum age of files to keep.

        Returns:
            Number of files removed.
        """
        import time

        removed = 0
        cutoff = time.time() - (max_age_hours * 3600)

        for pdf_file in self.tmp_dir.glob("*.pdf"):
            if pdf_file.stat().st_mtime < cutoff:
                try:
                    pdf_file.unlink()
                    removed += 1
                except OSError:
                    pass

        if removed:
            logger.info(f"Cleaned up {removed} old PDF files")
        return removed
