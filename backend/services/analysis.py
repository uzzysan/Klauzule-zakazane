"""Clause analysis service for detecting prohibited clauses in documents."""
import re
from dataclasses import dataclass
from typing import List, Optional
from uuid import UUID

from models.clause import ClauseLegalReference, LegalReference, ProhibitedClause
from sentence_transformers import SentenceTransformer
from sqlalchemy import select
from sqlalchemy import text as sql_text
from sqlalchemy.ext.asyncio import AsyncSession

# Embedding model (same as used for import)
MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
_embedding_model: Optional[SentenceTransformer] = None


def get_embedding_model() -> SentenceTransformer:
    """Get or initialize the embedding model (lazy loading)."""
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = SentenceTransformer(MODEL_NAME)
    return _embedding_model


@dataclass
class ClauseMatch:
    """Represents a match between document text and a prohibited clause."""

    clause_id: UUID
    clause_text: str
    matched_text: str
    similarity_score: float
    match_type: str  # 'vector', 'keyword', 'hybrid'
    risk_level: str
    start_position: int
    end_position: int
    legal_references: List[dict]
    category_name: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None


@dataclass
class AnalysisResult:
    """Result of document analysis."""

    matches: List[ClauseMatch]
    total_segments_analyzed: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    risk_score: int  # 0-100


class ClauseAnalysisService:
    """Service for analyzing documents against prohibited clause database."""

    # Minimum segment length for analysis
    MIN_SEGMENT_LENGTH = 50

    # Maximum segments to analyze to avoid timeout
    MAX_SEGMENTS = 500

    def __init__(self) -> None:
        """Initialize the analysis service."""
        from config import settings

        self.model = get_embedding_model()

        # Load thresholds from configuration (can be adjusted via environment variables)
        self.VECTOR_THRESHOLD_LOW = settings.analysis_threshold_low
        self.VECTOR_THRESHOLD_MEDIUM = settings.analysis_threshold_medium
        self.VECTOR_THRESHOLD_HIGH = settings.analysis_threshold_high

    def segment_text(self, text: str) -> List[tuple[str, int, int]]:
        """
        Split document text into analyzable segments.

        Returns list of (segment_text, start_position, end_position).
        """
        segments = []

        # First, try to split by paragraphs
        paragraphs = re.split(r"\n\s*\n", text)

        current_position = 0
        for para in paragraphs:
            para = para.strip()
            if len(para) >= self.MIN_SEGMENT_LENGTH:
                # Find actual position in original text
                start = text.find(para, current_position)
                if start == -1:
                    start = current_position
                end = start + len(para)

                segments.append((para, start, end))
                current_position = end

        # Also split long paragraphs by sentences if they're too long
        final_segments = []
        for seg_text, start, end in segments:
            if len(seg_text) > 1000:
                # Split by sentences
                sentences = re.split(r"(?<=[.!?])\s+", seg_text)
                sentence_start = start
                for sentence in sentences:
                    if len(sentence) >= self.MIN_SEGMENT_LENGTH:
                        sentence_end = sentence_start + len(sentence)
                        final_segments.append((sentence, sentence_start, sentence_end))
                        sentence_start = sentence_end + 1
            else:
                final_segments.append((seg_text, start, end))

        # Limit segments to avoid timeout
        if len(final_segments) > self.MAX_SEGMENTS:
            final_segments = final_segments[: self.MAX_SEGMENTS]

        return final_segments

    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding vector for text."""
        embedding = self.model.encode(text, convert_to_numpy=True)
        return embedding.tolist()

    async def find_similar_clauses(
        self,
        session: AsyncSession,
        text: str,
        threshold: float = 0.65,
        limit: int = 5,
    ) -> List[tuple[ProhibitedClause, float]]:
        """
        Find prohibited clauses similar to the given text using vector similarity.

        Returns list of (clause, similarity_score) tuples.
        """
        # Generate embedding for query text
        query_embedding = self.generate_embedding(text)

        # Format embedding for PostgreSQL
        embedding_str = "[" + ",".join(str(x) for x in query_embedding) + "]"

        # Use pgvector cosine distance (1 - cosine_similarity)
        # Lower distance = higher similarity
        query = f"""
            SELECT
                pc.id,
                pc.clause_text,
                pc.normalized_text,
                pc.risk_level,
                pc.notes,
                pc.tags,
                pc.category_id,
                1 - (pc.embedding <=> '{embedding_str}'::vector) as similarity
            FROM prohibited_clauses pc
            WHERE pc.is_active = true
            AND pc.embedding IS NOT NULL
            AND 1 - (pc.embedding <=> '{embedding_str}'::vector) >= :threshold
            ORDER BY pc.embedding <=> '{embedding_str}'::vector
            LIMIT :limit
        """

        result = await session.execute(sql_text(query), {"threshold": threshold, "limit": limit})

        matches = []
        for row in result.fetchall():
            # Fetch full clause object
            clause_result = await session.execute(
                select(ProhibitedClause).where(ProhibitedClause.id == row[0])
            )
            clause = clause_result.scalar_one_or_none()
            if clause:
                matches.append((clause, row[7]))  # clause, similarity

        return matches

    async def get_legal_references(self, session: AsyncSession, clause_id: UUID) -> List[dict]:
        """Get legal references for a clause."""
        result = await session.execute(
            select(LegalReference)
            .join(ClauseLegalReference)
            .where(ClauseLegalReference.clause_id == clause_id)
        )
        references = result.scalars().all()

        return [
            {
                "article_code": ref.article_code,
                "article_title": ref.article_title,
                "law_name": ref.law_name,
                "description": ref.description,
            }
            for ref in references
        ]

    def keyword_match(self, text: str, clause_text: str) -> float:
        """
        Calculate keyword match score using Jaccard similarity.

        Returns score between 0 and 1.
        """
        # Normalize texts
        text_words = set(re.findall(r"\w+", text.lower()))
        clause_words = set(re.findall(r"\w+", clause_text.lower()))

        if not text_words or not clause_words:
            return 0.0

        # Calculate Jaccard similarity
        intersection = len(text_words & clause_words)
        union = len(text_words | clause_words)

        return intersection / union if union > 0 else 0.0

    async def analyze_segment(
        self,
        session: AsyncSession,
        segment_text: str,
        start_position: int,
        end_position: int,
    ) -> List[ClauseMatch]:
        """
        Analyze a single text segment against the clause database.

        Returns list of ClauseMatch objects.
        """
        matches = []

        # Vector similarity search
        similar_clauses = await self.find_similar_clauses(
            session,
            segment_text,
            threshold=self.VECTOR_THRESHOLD_LOW,
            limit=3,
        )

        for clause, vector_score in similar_clauses:
            # Also calculate keyword similarity for hybrid scoring
            keyword_score = self.keyword_match(segment_text, clause.clause_text)

            # Hybrid score: weighted average
            hybrid_score = (vector_score * 0.7) + (keyword_score * 0.3)

            # Skip matches below the minimum threshold (VECTOR_THRESHOLD_LOW = 80%)
            if hybrid_score < self.VECTOR_THRESHOLD_LOW:
                continue

            # Determine risk level based on similarity score, not clause's original risk
            if hybrid_score >= self.VECTOR_THRESHOLD_HIGH:
                risk_level = "high"
            elif hybrid_score >= self.VECTOR_THRESHOLD_MEDIUM:
                risk_level = "medium"
            else:
                risk_level = "low"

            # Determine match type based on which method contributed more
            if vector_score > 0.8 and keyword_score > 0.3:
                match_type = "hybrid"
            elif vector_score > keyword_score:
                match_type = "vector"
            else:
                match_type = "keyword"

            # Get legal references
            legal_refs = await self.get_legal_references(session, clause.id)

            match = ClauseMatch(
                clause_id=clause.id,
                clause_text=clause.clause_text,
                matched_text=segment_text,
                similarity_score=hybrid_score,
                match_type=match_type,
                risk_level=risk_level,
                start_position=start_position,
                end_position=end_position,
                legal_references=legal_refs,
                notes=clause.notes,
                tags=clause.tags,
            )
            matches.append(match)

        return matches

    async def analyze_document(
        self,
        session: AsyncSession,
        document_text: str,
        language: str = "pl",
    ) -> AnalysisResult:
        """
        Analyze entire document for prohibited clauses.

        Args:
            session: Database session
            document_text: Full text of the document
            language: Document language (pl or en)

        Returns:
            AnalysisResult with all matches and statistics
        """
        # Segment the document
        segments = self.segment_text(document_text)

        all_matches: List[ClauseMatch] = []
        seen_clause_ids = set()

        for segment_text, start, end in segments:
            segment_matches = await self.analyze_segment(session, segment_text, start, end)

            # Deduplicate matches (same clause matched in similar segments)
            for match in segment_matches:
                if match.clause_id not in seen_clause_ids:
                    all_matches.append(match)
                    seen_clause_ids.add(match.clause_id)

        # Sort by similarity score descending
        all_matches.sort(key=lambda m: m.similarity_score, reverse=True)

        # Count by risk level
        high_risk = sum(1 for m in all_matches if m.risk_level == "high")
        medium_risk = sum(1 for m in all_matches if m.risk_level == "medium")
        low_risk = sum(1 for m in all_matches if m.risk_level == "low")

        # Calculate overall risk score (0-100)
        # Weight: high=10, medium=5, low=2, capped at 100
        risk_score = min(100, (high_risk * 10) + (medium_risk * 5) + (low_risk * 2))

        return AnalysisResult(
            matches=all_matches,
            total_segments_analyzed=len(segments),
            high_risk_count=high_risk,
            medium_risk_count=medium_risk,
            low_risk_count=low_risk,
            risk_score=risk_score,
        )


# Singleton instance (lazy initialization)
_analysis_service: Optional[ClauseAnalysisService] = None


def get_analysis_service() -> ClauseAnalysisService:
    """Get or create the analysis service instance."""
    global _analysis_service
    if _analysis_service is None:
        _analysis_service = ClauseAnalysisService()
    return _analysis_service
