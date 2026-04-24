"""Celery task for synchronizing prohibited clauses from UOKiK decisions."""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Set
from uuid import uuid4

from sqlalchemy import select

from celery_app import celery_app
from config import settings
from database.connection import get_celery_db_context
from models.clause import ClauseCategory, ClauseLegalReference, LegalReference, ProhibitedClause
from services.uokik_pdf_extractor import PDFExtractionError, UokikPDFExtractor
from services.uokik_scraper import UokikScraper, UokikScraperError

logger = logging.getLogger(__name__)

# Lazy-loaded embedding model
_embedding_model = None


def get_embedding_model():
    """Get or initialize the embedding model (lazy loading)."""
    global _embedding_model
    if _embedding_model is None:
        from sentence_transformers import SentenceTransformer

        MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
        logger.info(f"Loading embedding model: {MODEL_NAME}")
        _embedding_model = SentenceTransformer(MODEL_NAME)
    return _embedding_model


def generate_embedding(text: str) -> List[float]:
    """Generate vector embedding for text."""
    model = get_embedding_model()
    embedding = model.encode(text, convert_to_numpy=True)
    return embedding.tolist()


def normalize_text(text: str) -> str:
    """Normalize clause text for matching."""
    return text.lower().strip()


async def get_or_create_category(session) -> ClauseCategory:
    """Get or create category for UOKiK decisions."""
    code = "uokik_decisions"

    result = await session.execute(select(ClauseCategory).where(ClauseCategory.code == code))
    category = result.scalar_one_or_none()

    if not category:
        category = ClauseCategory(
            id=uuid4(),
            code=code,
            name_pl="Klauzule niedozwolone z decyzji UOKiK",
            name_en="Prohibited clauses from UOKiK decisions",
            description_pl="Klauzule uznane za niedozwolone w decyzjach Prezesa UOKiK",
            description_en="Clauses deemed prohibited in UOKiK President decisions",
            default_risk_level="high",
            is_active=True,
        )
        session.add(category)
        await session.flush()
        logger.info(f"Created category: {code}")

    return category


async def get_existing_signatures_last_year(session) -> Set[str]:
    """Get set of existing signatures from the last year.

    Args:
        session: Database session.

    Returns:
        Set of article_code (signature) strings.
    """
    one_year_ago = datetime.now() - timedelta(days=365)

    result = await session.execute(
        select(LegalReference.article_code)
        .where(
            LegalReference.effective_date >= one_year_ago,
        )
    )
    signatures = {row[0] for row in result if row[0]}
    logger.info(f"Found {len(signatures)} existing signatures from last year")
    return signatures


async def get_all_existing_signatures(session) -> Set[str]:
    """Get all existing signatures from legal references.

    Args:
        session: Database session.

    Returns:
        Set of all article_code strings.
    """
    result = await session.execute(select(LegalReference.article_code))
    signatures = {row[0] for row in result if row[0]}
    logger.info(f"Found {len(signatures)} total existing signatures")
    return signatures


async def save_clause_to_db(
    session,
    clause_data: Dict[str, Any],
    category: ClauseCategory,
) -> Optional[ProhibitedClause]:
    """Save extracted clause to database.

    Args:
        session: Database session.
        clause_data: Extracted clause data from LLM.
        category: Category to assign.

    Returns:
        Created ProhibitedClause or None.
    """
    try:
        clause_text = clause_data.get("clause_text", "").strip()
        if not clause_text or len(clause_text) < 10:
            logger.warning("Skipping empty or too short clause")
            return None

        # Check for exact duplicate
        result = await session.execute(
            select(ProhibitedClause).where(ProhibitedClause.clause_text == clause_text)
        )
        if result.scalar_one_or_none():
            logger.debug(f"Clause already exists: {clause_text[:50]}...")
            return None

        # Generate embedding
        embedding = generate_embedding(clause_text)

        # Build tags
        tags = []
        if clause_data.get("industry"):
            tags.append(f"branza:{clause_data['industry']}")
        if clause_data.get("contract_types"):
            for ct in clause_data["contract_types"]:
                tags.append(f"umowa:{ct}")

        # Build notes
        notes_parts = []
        if clause_data.get("decision_number"):
            notes_parts.append(f"Decyzja nr: {clause_data['decision_number']}")
        if clause_data.get("parties"):
            notes_parts.append(f"Strony: {clause_data['parties']}")
        if clause_data.get("pdf_url"):
            notes_parts.append(f"PDF: {clause_data['pdf_url']}")
        notes = " | ".join(notes_parts) if notes_parts else None

        # Create prohibited clause
        clause = ProhibitedClause(
            id=uuid4(),
            category_id=category.id,
            clause_text=clause_text,
            normalized_text=normalize_text(clause_text),
            risk_level="high",
            language="pl",
            embedding=embedding,
            source="imported",
            confidence=1.0,
            is_active=True,
            tags=tags if tags else None,
            notes=notes,
        )
        session.add(clause)
        await session.flush()

        # Create legal reference
        signature = clause_data.get("signature", "").strip()
        court_date_str = clause_data.get("court_date")
        court_date = None
        if court_date_str:
            try:
                court_date = datetime.strptime(str(court_date_str), "%Y-%m-%d").date()
            except ValueError:
                logger.warning(f"Could not parse date: {court_date_str}")

        if signature:
            result = await session.execute(
                select(LegalReference).where(LegalReference.article_code == signature)
            )
            legal_ref = result.scalar_one_or_none()

            if not legal_ref:
                decision_number = clause_data.get("decision_number", "")
                title = f"Decyzja UOKiK {decision_number}" if decision_number else f"Decyzja UOKiK - {signature}"
                legal_ref = LegalReference(
                    id=uuid4(),
                    article_code=signature,
                    article_title=title,
                    description=f"Klauzula uznana za niedozwoloną w decyzji UOKiK o sygnaturze {signature}",
                    law_name="Decyzja Prezesa Urzędu Ochrony Konkurencji i Konsumentów",
                    jurisdiction="PL",
                    effective_date=court_date,
                )
                session.add(legal_ref)
                await session.flush()

            # Link clause to legal reference
            clause_legal_ref = ClauseLegalReference(
                clause_id=clause.id,
                legal_reference_id=legal_ref.id,
                relevance_score=1.0,
                notes=f"Decyzja z dnia: {court_date}" if court_date else None,
            )
            session.add(clause_legal_ref)

        logger.info(f"Imported clause: {clause_text[:80]}...")
        return clause

    except Exception as e:
        logger.error(f"Error saving clause to DB: {e}")
        import traceback

        traceback.print_exc()
        return None


@celery_app.task(
    bind=True,
    name="tasks.uokik_sync.sync_uokik_clauses",
    time_limit=7200,  # 2 hours hard limit
    soft_time_limit=6900,  # 1h 55m soft limit
    queue="sync",
)
def sync_uokik_clauses(self, dry_run: bool = False, start_year: int = 2017) -> Dict[str, int]:
    """Synchronize prohibited clauses from UOKiK decisions.

    This task:
    1. Scrapes UOKiK website for new decisions
    2. Downloads decision PDFs
    3. Extracts prohibited clauses using LLM
    4. Saves new clauses to database with embeddings

    Args:
        dry_run: If True, don't save to database (only log).
        start_year: First year to scrape.

    Returns:
        Dict with sync statistics.
    """
    return asyncio.run(async_sync_uokik_clauses(dry_run, start_year))


async def async_sync_uokik_clauses(dry_run: bool = False, start_year: int = 2017) -> Dict[str, int]:
    """Async implementation of UOKiK clause synchronization."""
    stats = {
        "decisions_found": 0,
        "pdfs_downloaded": 0,
        "clauses_extracted": 0,
        "clauses_added": 0,
        "clauses_skipped": 0,
        "errors": 0,
    }

    extractor = UokikPDFExtractor()
    extractor.cleanup_old_pdfs()

    async with get_celery_db_context() as db:
        # Get existing signatures to skip
        existing_signatures = await get_all_existing_signatures(db)
        category = await get_or_create_category(db)

        # Scrape UOKiK decisions
        try:
            async with UokikScraper(headless=True) as scraper:
                logger.info("Starting UOKiK scraper...")
                decisions = await scraper.scrape_decisions(
                    start_year=start_year,
                    existing_signatures=list(existing_signatures),
                )
        except UokikScraperError as e:
            logger.error(f"Scraper failed: {e}")
            stats["errors"] += 1
            return stats

        stats["decisions_found"] = len(decisions)
        logger.info(f"Found {len(decisions)} new decisions to process")

        if dry_run:
            logger.info("DRY RUN - not saving to database")
            for i, decision in enumerate(decisions, 1):
                logger.info(f"[{i}/{len(decisions)}] Would process: {decision.get('signature', 'N/A')} - {decision.get('pdf_url', 'N/A')}")
            return stats

        # Process each decision
        for i, decision in enumerate(decisions, 1):
            signature = decision.get("signature", "N/A")
            pdf_url = decision.get("pdf_url", "")

            logger.info(f"[{i}/{len(decisions)}] Processing decision: {signature}")

            if not pdf_url:
                logger.warning(f"No PDF URL for decision {signature}, skipping")
                stats["errors"] += 1
                continue

            try:
                # Extract clauses from PDF
                clauses = await extractor.extract_clauses_from_pdf(
                    url=pdf_url,
                    metadata=decision,
                    filename=f"{signature.replace('/', '_')}.pdf",
                )

                stats["pdfs_downloaded"] += 1
                stats["clauses_extracted"] += len(clauses)

                # Save each clause
                for clause_data in clauses:
                    clause = await save_clause_to_db(db, clause_data, category)
                    if clause:
                        stats["clauses_added"] += 1
                    else:
                        stats["clauses_skipped"] += 1

            except PDFExtractionError as e:
                logger.error(f"PDF extraction failed for {signature}: {e}")
                stats["errors"] += 1
            except Exception as e:
                logger.error(f"Unexpected error processing {signature}: {e}")
                stats["errors"] += 1

        # Commit all changes
        if stats["clauses_added"] > 0:
            await db.commit()
            logger.info(f"Committed {stats['clauses_added']} new clauses")

    logger.info("=" * 60)
    logger.info("UOKiK sync completed!")
    logger.info(f"Decisions found: {stats['decisions_found']}")
    logger.info(f"PDFs processed: {stats['pdfs_downloaded']}")
    logger.info(f"Clauses extracted: {stats['clauses_extracted']}")
    logger.info(f"Clauses added: {stats['clauses_added']}")
    logger.info(f"Clauses skipped: {stats['clauses_skipped']}")
    logger.info(f"Errors: {stats['errors']}")
    logger.info("=" * 60)

    return stats
