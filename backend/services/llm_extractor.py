"""LLM-based clause extraction service using Gemini API (google-genai)."""
import json
import logging
import re
from typing import Dict, List, Optional

from google import genai
from google.genai import types

from config import settings

logger = logging.getLogger(__name__)

# System prompt for clause extraction
CLAUSE_EXTRACTION_PROMPT = """Jesteś polskim prawnikiem specjalizującym się w prawie konsumenckim i klauzulach abuzywnych (niedozwolonych).

Twoim zadaniem jest analiza poniższego dokumentu (decyzji Prezesa UOKiK lub wyroku sądowego) i wyciągnięcie z niego:
1. **Klauzul uznanych za niedozwolone** – dokładny cytat z umowy/wzorca umowy
2. **Metadanych** wyroku/decyzji

ZASADY:
- Wyciągnij KAŻDĄ klauzulę uznana za niedozwoloną jako osobny wpis.
- Treść klauzuli MUSI być dokładnym cytatem z umowy (w cudzysłowie), nie opisem sądu.
- Jeśli decyzja dotyczy wielu wzorców umów (np. „Umowa na montaż pompy ciepła”, „Umowa na fotowoltaikę”), dodaj informację o tym w polu `contract_types`.
- Data powinna być w formacie YYYY-MM-DD.
- Sygnatura to numer aktu sprawy (np. "RŁO.611.1.2024.MD" lub "XVI Gw 130/24").
- Strony sporu to format: "Powód / Pozwany" lub "Wnioskodawca / Uczestnik".

ZWRÓĆ WYŁĄCZNIE tablicę JSON (listę obiektów) w formacie:
[
  {
    "clause_text": "dokładna treść klauzuli w cudzysłowie...",
    "court_date": "YYYY-MM-DD",
    "signature": "sygnatura aktu",
    "parties": "strony sporu",
    "industry": "branża (np. fotowoltaika, telekomunikacja, bankowość)",
    "contract_types": ["nazwa wzorca umowy 1", "nazwa wzorca umowy 2"],
    "decision_number": "numer decyzji (np. RŁO 3/2024)"
  }
]

Jeśli nie uda się wyciągnąć jakiegoś pola, użyj null lub pustej listy.

Treść dokumentu:
"""


class LLMExtractorError(Exception):
    """Raised when LLM extraction fails."""

    pass


class LLMExtractor:
    """Service for extracting prohibited clauses from legal documents using Gemini."""

    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        """Initialize LLM extractor.

        Args:
            api_key: Gemini API key. If None, uses settings.gemini_api_key.
            model_name: Gemini model name. Defaults to gemini-1.5-flash.
        """
        self.api_key = api_key or (
            settings.gemini_api_key.get_secret_value() if settings.gemini_api_key else None
        )
        if not self.api_key:
            raise LLMExtractorError(
                "Gemini API key not configured. Set GEMINI_API_KEY in environment."
            )

        self.model_name = model_name or "models/gemini-2.5-flash"
        self.client = genai.Client(api_key=self.api_key)
        logger.info(f"LLMExtractor initialized with model: {self.model_name}")

    def extract_clauses(self, document_text: str, max_retries: int = 3) -> List[Dict]:
        """Extract prohibited clauses from legal document text.

        Args:
            document_text: Full text of the legal document.
            max_retries: Maximum number of retries on failure.

        Returns:
            List of dictionaries with extracted clause data.

        Raises:
            LLMExtractorError: If extraction fails after all retries.
        """
        # Truncate if too long (Gemini 1.5 Flash supports ~1M tokens, but let's be safe)
        max_chars = 150_000
        if len(document_text) > max_chars:
            logger.warning(
                f"Document text too long ({len(document_text)} chars), truncating to {max_chars}"
            )
            document_text = document_text[:max_chars]

        prompt = CLAUSE_EXTRACTION_PROMPT + document_text

        for attempt in range(1, max_retries + 1):
            try:
                logger.info(f"LLM extraction attempt {attempt}/{max_retries}")
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.1,  # Low temperature for deterministic extraction
                    ),
                )

                raw_text = response.text
                clauses = self._parse_json_response(raw_text)

                # Validate extracted clauses
                valid_clauses = [c for c in clauses if self._validate_clause(c)]
                logger.info(f"Extracted {len(valid_clauses)} valid clauses from document")
                return valid_clauses

            except Exception as e:
                logger.warning(f"LLM extraction attempt {attempt} failed: {e}")
                if attempt == max_retries:
                    raise LLMExtractorError(
                        f"Failed to extract clauses after {max_retries} attempts: {e}"
                    )

        return []

    def _parse_json_response(self, raw_text: str) -> List[Dict]:
        """Parse JSON response from LLM.

        Args:
            raw_text: Raw text response from Gemini.

        Returns:
            List of clause dictionaries.
        """
        # Clean up markdown code blocks if present
        text = raw_text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

        try:
            data = json.loads(text)
            if isinstance(data, list):
                return data
            elif isinstance(data, dict):
                # Sometimes LLM returns a single object instead of list
                return [data]
            else:
                logger.warning(f"Unexpected response type: {type(data)}")
                return []
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}\nRaw text: {text[:500]}")
            # Try to extract JSON array with regex as fallback
            return self._extract_json_with_regex(text)

    def _extract_json_with_regex(self, text: str) -> List[Dict]:
        """Extract JSON array from text using regex fallback."""
        # Look for JSON array pattern
        match = re.search(r"\[\s*\{.*\}\s*\]", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass
        logger.warning("Regex fallback failed to extract JSON")
        return []

    def _validate_clause(self, clause: Dict) -> bool:
        """Validate extracted clause data.

        Args:
            clause: Clause dictionary from LLM.

        Returns:
            True if clause is valid.
        """
        clause_text = clause.get("clause_text", "")
        if not clause_text or len(clause_text.strip()) < 10:
            logger.debug(f"Clause too short or empty: {clause_text}")
            return False

        # Basic sanity checks
        if len(clause_text) > 5000:
            logger.warning(f"Clause suspiciously long ({len(clause_text)} chars), may be truncated")
            clause["clause_text"] = clause_text[:5000]

        return True


# Singleton instance
llm_extractor: Optional[LLMExtractor] = None


def get_llm_extractor() -> LLMExtractor:
    """Get or create singleton LLM extractor instance."""
    global llm_extractor
    if llm_extractor is None:
        llm_extractor = LLMExtractor()
    return llm_extractor
