"""Celery task for synchronizing prohibited clauses from external source database."""
import asyncio
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import uuid4

from celery_app import celery_app
from config import settings
from database.connection import get_celery_db_context
from models.clause import ClauseCategory, ClauseLegalReference, LegalReference, ProhibitedClause
from sqlalchemy import create_engine, select, text

logger = logging.getLogger(__name__)

# Lazy-loaded embedding model (loaded only when needed)
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


@celery_app.task(bind=True, name="tasks.sync.sync_prohibited_clauses")
def sync_prohibited_clauses(self) -> Dict[str, int]:
    """
    Synchronize prohibited clauses from external source database.

    This task runs periodically (configured in Celery Beat) to fetch
    new prohibited clauses from the scraper database.

    Returns:
        Dict with sync statistics (added, updated, skipped, errors)
    """
    return asyncio.run(async_sync_prohibited_clauses())


def fetch_clauses_from_source_db() -> List[Dict[str, Any]]:
    """
    Fetch prohibited clauses from external source database.

    Returns:
        List of dictionaries containing clause data from external database.
    """
    source_db_url = settings.source_database_url.get_secret_value()

    if not source_db_url:
        logger.error("SOURCE_DATABASE_URL not configured")
        return []

    logger.info("Connecting to external source database...")

    try:
        engine = create_engine(source_db_url)

        with engine.connect() as conn:
            # Check available tables
            result = conn.execute(
                text(
                    """
                    SELECT table_name
                    FROM information_schema.tables
                    WHERE table_schema = 'public'
                """
                )
            )
            tables = [row[0] for row in result]
            logger.info(f"Available tables: {tables}")

            # Find the table with prohibited clauses
            possible_tables = [
                "postanowienia_niedozwolone",
                "klauzule",
                "clauses",
                "prohibited_clauses",
            ]

            table_name = None
            for tname in possible_tables:
                if tname in tables:
                    table_name = tname
                    break

            if not table_name and tables:
                table_name = tables[0]
                logger.warning(f"Using first available table: {table_name}")

            if not table_name:
                logger.error("No tables found in external database")
                return []

            logger.info(f"Fetching data from table: {table_name}")

            # Get column information
            result = conn.execute(
                text(
                    f"""
                    SELECT column_name, data_type
                    FROM information_schema.columns
                    WHERE table_name = '{table_name}'
                """
                )
            )
            columns = {row[0]: row[1] for row in result}
            logger.info(f"Available columns: {list(columns.keys())}")

            # Build query based on available columns
            select_fields = [
                "postanowienie_niedozwolone",
                "data_wyroku",
                "sygnatura",
                "numer_postanowienia",
                "branza",
                "powod",
                "pozwany",
                "data_wpisu",
                "zagadnienie",
            ]

            select_fields = [f for f in select_fields if f in columns]

            if "postanowienie_niedozwolone" not in select_fields:
                logger.error("Required column 'postanowienie_niedozwolone' not found")
                return []

            # Fetch data
            query = f"""
                SELECT {', '.join(select_fields)}
                FROM {table_name}
                WHERE postanowienie_niedozwolone IS NOT NULL
                AND postanowienie_niedozwolone != ''
            """
            logger.info("Executing query...")

            result = conn.execute(text(query))
            rows = result.fetchall()

            logger.info(f"Fetched {len(rows)} rows from source database")

            # Convert to dictionaries
            clauses = []
            for row in rows:
                clause_data = {}
                for i, field in enumerate(select_fields):
                    clause_data[field] = row[i]
                clauses.append(clause_data)

            return clauses

    except Exception as e:
        logger.error(f"Error fetching from source database: {e}")
        import traceback

        traceback.print_exc()
        return []


async def get_or_create_category(session) -> ClauseCategory:
    """Get or create default category for imported clauses."""
    code = "court_decisions"

    result = await session.execute(select(ClauseCategory).where(ClauseCategory.code == code))
    category = result.scalar_one_or_none()

    if not category:
        category = ClauseCategory(
            id=uuid4(),
            code=code,
            name_pl="Klauzule niedozwolone z orzeczeń sądowych",
            name_en="Prohibited clauses from court decisions",
            description_pl="Klauzule uznane za niedozwolone przez polskie sądy",
            description_en="Clauses deemed prohibited by Polish courts",
            default_risk_level="high",
            is_active=True,
        )
        session.add(category)
        await session.flush()
        logger.info(f"Created category: {code}")

    return category


async def get_existing_clause_texts(session) -> set:
    """Get set of all existing clause texts for fast lookup."""
    result = await session.execute(select(ProhibitedClause.clause_text))
    return {row[0] for row in result}


async def import_new_clause(
    session,
    clause_data: Dict[str, Any],
    category: ClauseCategory,
) -> Optional[ProhibitedClause]:
    """Import a single new clause into the database."""
    try:
        clause_text = clause_data.get("postanowienie_niedozwolone", "").strip()

        if not clause_text:
            return None

        # Generate embedding
        embedding = generate_embedding(clause_text)

        # Build tags from metadata
        tags = []
        if clause_data.get("branza"):
            tags.append(f"branza:{clause_data['branza']}")
        if clause_data.get("zagadnienie"):
            tags.append(f"zagadnienie:{clause_data['zagadnienie']}")

        # Build notes
        notes_parts = []
        if clause_data.get("numer_postanowienia"):
            notes_parts.append(f"Numer: {clause_data['numer_postanowienia']}")
        if clause_data.get("powod"):
            notes_parts.append(f"Powód: {clause_data['powod']}")
        if clause_data.get("pozwany"):
            notes_parts.append(f"Pozwany: {clause_data['pozwany']}")
        if clause_data.get("data_wpisu"):
            notes_parts.append(f"Data wpisu: {clause_data['data_wpisu']}")
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

        # Create legal reference if court decision info available
        data_wyroku = clause_data.get("data_wyroku")
        sygnatura = clause_data.get("sygnatura", "")
        if isinstance(sygnatura, str):
            sygnatura = sygnatura.strip()

        if sygnatura:
            result = await session.execute(
                select(LegalReference).where(LegalReference.article_code == sygnatura)
            )
            legal_ref = result.scalar_one_or_none()

            if not legal_ref:
                legal_ref = LegalReference(
                    id=uuid4(),
                    article_code=sygnatura,
                    article_title=f"Wyrok sądowy - {sygnatura}",
                    description=f"Klauzula uznana za niedozwoloną wyrokiem o sygnaturze {sygnatura}",
                    law_name="Orzeczenie Sądu Ochrony Konkurencji i Konsumentów",
                    jurisdiction="PL",
                    effective_date=data_wyroku if isinstance(data_wyroku, datetime) else None,
                )
                session.add(legal_ref)
                await session.flush()

            # Link clause to legal reference
            clause_legal_ref = ClauseLegalReference(
                clause_id=clause.id,
                legal_reference_id=legal_ref.id,
                relevance_score=1.0,
                notes=f"Wyrok z dnia: {data_wyroku}" if data_wyroku else None,
            )
            session.add(clause_legal_ref)

        return clause

    except Exception as e:
        logger.error(f"Error importing clause: {e}")
        return None


async def async_sync_prohibited_clauses() -> Dict[str, int]:
    """
    Actual async implementation of clause synchronization.

    Compares source database with app database and imports only new clauses.

    Returns:
        Dict with keys: added, skipped, errors, total_source, total_app
    """
    logger.info("Starting prohibited clauses synchronization")

    stats = {
        "added": 0,
        "skipped": 0,
        "errors": 0,
        "total_source": 0,
        "total_app": 0,
    }

    try:
        # Fetch all clauses from source database
        source_clauses = fetch_clauses_from_source_db()
        stats["total_source"] = len(source_clauses)

        if not source_clauses:
            logger.warning("No clauses fetched from source database")
            return stats

        logger.info(f"Fetched {len(source_clauses)} clauses from source database")

        async with get_celery_db_context() as db:
            # Get existing clause texts for fast lookup
            existing_texts = await get_existing_clause_texts(db)
            stats["total_app"] = len(existing_texts)

            logger.info(f"App database has {len(existing_texts)} existing clauses")

            # Get or create category
            category = await get_or_create_category(db)

            # Find new clauses (not in app database)
            new_clauses = []
            for clause_data in source_clauses:
                clause_text = clause_data.get("postanowienie_niedozwolone", "").strip()
                if clause_text and clause_text not in existing_texts:
                    new_clauses.append(clause_data)
                else:
                    stats["skipped"] += 1

            logger.info(f"Found {len(new_clauses)} new clauses to import")

            # Import new clauses
            for i, clause_data in enumerate(new_clauses, 1):
                if i % 10 == 0:
                    logger.info(f"Progress: {i}/{len(new_clauses)}")

                clause = await import_new_clause(db, clause_data, category)
                if clause:
                    stats["added"] += 1
                else:
                    stats["errors"] += 1

            # Update category clause count
            if stats["added"] > 0:
                category.clause_count = stats["total_app"] + stats["added"]
                await db.commit()
                logger.info(f"Committed {stats['added']} new clauses")

        logger.info("=" * 60)
        logger.info("Sync completed!")
        logger.info(f"Source database: {stats['total_source']} clauses")
        logger.info(f"App database before: {stats['total_app']} clauses")
        logger.info(f"New clauses added: {stats['added']}")
        logger.info(f"Skipped (already exist): {stats['skipped']}")
        logger.info(f"Errors: {stats['errors']}")
        logger.info("=" * 60)

        return stats

    except Exception as e:
        logger.error(f"Fatal error during sync: {e}")
        import traceback

        traceback.print_exc()
        stats["errors"] += 1
        return stats
