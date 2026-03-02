"""Import prohibited clauses from external source database.

This script imports Polish prohibited clauses from an external PostgreSQL database
containing court decisions about unfair contract terms.

External DB Schema:
- postanowienie_niedozwolone: The prohibited clause text
- data_wyroku: Date when court decided it's prohibited
- sygnatura: Court decision signature/reference
"""
import asyncio
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import uuid4

from sentence_transformers import SentenceTransformer
from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database.connection import get_db_context
from models.clause import ClauseCategory, ClauseLegalReference, LegalReference, ProhibitedClause

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize sentence transformer model for embeddings (384 dimensions)
MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"  # 384 dimensions
logger.info(f"Loading embedding model: {MODEL_NAME}")
embedding_model = SentenceTransformer(MODEL_NAME)


def fetch_external_clauses() -> List[Dict[str, Any]]:
    """Fetch prohibited clauses from external database.

    Returns:
        List of dictionaries containing clause data from external database.
    """
    source_db_url = settings.source_database_url.get_secret_value()

    if not source_db_url:
        logger.error("SOURCE_DATABASE_URL not configured")
        return []

    logger.info("Connecting to external database...")

    try:
        # Create synchronous engine for external database
        engine = create_engine(source_db_url)

        with engine.connect() as conn:
            # First, check what tables exist
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

            # Try to find the table with prohibited clauses
            # Common table names in Polish databases
            possible_tables = [
                "klauzule_niedozwolone",
                "postanowienia_niedozwolone",
                "klauzule",
                "clauses",
            ]

            table_name = None
            for tname in possible_tables:
                if tname in tables:
                    table_name = tname
                    break

            if not table_name and tables:
                # Use the first table if we can't find a match
                table_name = tables[0]
                logger.warning(f"Using first available table: {table_name}")

            if not table_name:
                logger.error("No tables found in external database")
                return []

            logger.info(f"Fetching data from table: {table_name}")

            # Fetch column information
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

            # Filter to only existing columns
            select_fields = [f for f in select_fields if f in columns]

            if "postanowienie_niedozwolone" not in select_fields:
                logger.error("Required column 'postanowienie_niedozwolone' not found in table")
                return []

            # Fetch data
            query = f"SELECT {', '.join(select_fields)} FROM {table_name} WHERE postanowienie_niedozwolone IS NOT NULL AND postanowienie_niedozwolone != ''"
            logger.info(f"Executing query: {query}")

            result = conn.execute(text(query))
            rows = result.fetchall()

            logger.info(f"Fetched {len(rows)} rows from external database")

            # Convert to dictionaries
            clauses = []
            for row in rows:
                clause_data = {}
                for i, field in enumerate(select_fields):
                    clause_data[field] = row[i]
                clauses.append(clause_data)

            return clauses

    except Exception as e:
        logger.error(f"Error fetching from external database: {e}")
        import traceback

        traceback.print_exc()
        return []


def generate_embedding(text: str) -> List[float]:
    """Generate vector embedding for text using sentence transformers.

    Args:
        text: Input text to generate embedding for.

    Returns:
        List of floats representing the embedding vector.
    """
    embedding = embedding_model.encode(text, convert_to_numpy=True)
    return embedding.tolist()


def normalize_text(text: str) -> str:
    """Normalize clause text for matching.

    Args:
        text: Input text to normalize.

    Returns:
        Normalized text (lowercase, stripped).
    """
    return text.lower().strip()


async def get_or_create_category(
    session: AsyncSession,
    code: str = "court_decisions",
    name_pl: str = "Klauzule niedozwolone z orzeczeń sądowych",
    name_en: str = "Prohibited clauses from court decisions",
) -> ClauseCategory:
    """Get or create default category for imported clauses.

    Args:
        session: Database session.
        code: Category code.
        name_pl: Polish name.
        name_en: English name.

    Returns:
        ClauseCategory instance.
    """
    from sqlalchemy import select

    result = await session.execute(select(ClauseCategory).where(ClauseCategory.code == code))
    category = result.scalar_one_or_none()

    if not category:
        category = ClauseCategory(
            id=uuid4(),
            code=code,
            name_pl=name_pl,
            name_en=name_en,
            description_pl="Klauzule uznane za niedozwolone przez polskie sądy",
            description_en="Clauses deemed prohibited by Polish courts",
            default_risk_level="high",
            is_active=True,
        )
        session.add(category)
        await session.flush()
        logger.info(f"Created category: {code}")

    return category


async def import_clause(
    session: AsyncSession, clause_data: Dict[str, Any], category: ClauseCategory
) -> Optional[ProhibitedClause]:
    """Import a single clause into the database.

    Args:
        session: Database session.
        clause_data: Dictionary with clause data from external DB.
        category: Category to assign the clause to.

    Returns:
        ProhibitedClause instance or None if import failed.
    """
    try:
        clause_text = clause_data.get("postanowienie_niedozwolone", "").strip()

        if not clause_text:
            logger.warning("Skipping empty clause")
            return None

        # Check if clause already exists
        from sqlalchemy import select

        result = await session.execute(
            select(ProhibitedClause).where(ProhibitedClause.clause_text == clause_text)
        )
        existing = result.scalar_one_or_none()

        if existing:
            logger.debug(f"Clause already exists: {clause_text[:50]}...")
            return existing

        # Generate embedding
        logger.debug(f"Generating embedding for: {clause_text[:50]}...")
        embedding = generate_embedding(clause_text)

        # Build tags from available metadata
        tags = []
        if clause_data.get("branza"):
            tags.append(f"branza:{clause_data['branza']}")
        if clause_data.get("zagadnienie"):
            tags.append(f"zagadnienie:{clause_data['zagadnienie']}")

        # Build notes with additional metadata
        notes_parts = []
        if clause_data.get("numer_postanowienia"):
            notes_parts.append(f"Numer postanowienia: {clause_data['numer_postanowienia']}")
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
        sygnatura = clause_data.get("sygnatura", "").strip()

        if sygnatura:
            # Create or get legal reference
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

        logger.info(f"Imported clause: {clause_text[:80]}...")
        return clause

    except Exception as e:
        logger.error(f"Error importing clause: {e}")
        import traceback

        traceback.print_exc()
        return None


async def import_all_clauses() -> None:
    """Main import function to fetch and import all clauses."""
    logger.info("Starting import of prohibited clauses...")

    # Fetch data from external database
    external_clauses = fetch_external_clauses()

    if not external_clauses:
        logger.warning("No clauses fetched from external database")
        return

    logger.info(f"Processing {len(external_clauses)} clauses...")

    # Import into our database
    async with get_db_context() as session:
        # Get or create category
        category = await get_or_create_category(session)

        # Import each clause
        imported_count = 0
        skipped_count = 0

        for i, clause_data in enumerate(external_clauses, 1):
            if i % 10 == 0:
                logger.info(f"Progress: {i}/{len(external_clauses)}")

            clause = await import_clause(session, clause_data, category)
            if clause:
                imported_count += 1
            else:
                skipped_count += 1

        # Update category clause count
        category.clause_count = imported_count

        await session.commit()

        logger.info("=" * 60)
        logger.info("Import complete!")
        logger.info(f"Total clauses processed: {len(external_clauses)}")
        logger.info(f"Successfully imported: {imported_count}")
        logger.info(f"Skipped (duplicates/errors): {skipped_count}")
        logger.info("=" * 60)


if __name__ == "__main__":
    asyncio.run(import_all_clauses())
