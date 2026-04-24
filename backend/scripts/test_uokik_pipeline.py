"""Test script for UOKiK PDF extraction pipeline.

Usage:
    cd backend
    source .venv/bin/activate
    python scripts/test_uokik_pipeline.py [--pdf PATH] [--api-key KEY]

This script tests the full pipeline on a sample UOKiK decision PDF:
1. Extracts text from PDF
2. Prepares LLM prompt
3. Optionally calls Gemini API to extract clauses
4. Shows the results
"""
import argparse
import json
import os
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.llm_extractor import LLMExtractor, LLMExtractorError
from services.uokik_pdf_extractor import UokikPDFExtractor

SAMPLE_PDF = "/home/uzzy/Pobrane/Decyzja RŁO 3_2024 Am Eco Energy Sp. z o.o. Wersja JAWNA.pdf"


def print_section(title: str):
    print(f"\n{'=' * 60}")
    print(f"  {title}")
    print(f"{'=' * 60}")


def main():
    parser = argparse.ArgumentParser(description="Test UOKiK PDF extraction pipeline")
    parser.add_argument("--pdf", default=SAMPLE_PDF, help="Path to PDF file")
    parser.add_argument("--api-key", default=os.getenv("GEMINI_API_KEY"), help="Gemini API key")
    parser.add_argument("--save-prompt", action="store_true", help="Save prompt to file for manual testing")
    args = parser.parse_args()

    pdf_path = Path(args.pdf)
    if not pdf_path.exists():
        print(f"ERROR: PDF not found: {pdf_path}")
        sys.exit(1)

    # Step 1: Extract text from PDF
    print_section("STEP 1: Extract text from PDF")
    extractor = UokikPDFExtractor()
    text = extractor.extract_text_from_pdf(pdf_path)
    print(f"Extracted {len(text)} characters from {pdf_path.name}")
    print(f"\nFirst 1000 chars:\n{text[:1000]}")
    print(f"\n...\n\nLast 500 chars:\n{text[-500:]}")

    # Step 2: Prepare prompt
    print_section("STEP 2: Prepare LLM prompt")
    from services.llm_extractor import CLAUSE_EXTRACTION_PROMPT

    max_chars = 150_000
    truncated_text = text[:max_chars]
    prompt = CLAUSE_EXTRACTION_PROMPT + truncated_text
    print(f"Prompt length: {len(prompt)} characters")

    if args.save_prompt:
        prompt_file = "/tmp/uokik_test_prompt.txt"
        with open(prompt_file, "w", encoding="utf-8") as f:
            f.write(prompt)
        print(f"\nPrompt saved to: {prompt_file}")
        print("You can copy this prompt to Gemini console to test manually.")

    # Step 3: Call LLM if API key provided
    if args.api_key:
        print_section("STEP 3: Call Gemini API")
        try:
            llm = LLMExtractor(api_key=args.api_key)
            clauses = llm.extract_clauses(text)

            print(f"\nExtracted {len(clauses)} clause(s):\n")
            for i, clause in enumerate(clauses, 1):
                print(f"--- Clause {i} ---")
                print(json.dumps(clause, ensure_ascii=False, indent=2))
                print()

        except LLMExtractorError as e:
            print(f"ERROR: {e}")
            sys.exit(1)
    else:
        print_section("STEP 3: LLM skipped (no API key)")
        print("Set --api-key or GEMINI_API_KEY env var to test LLM extraction.")
        print("Or use --save-prompt to save the prompt for manual testing.")

    print_section("DONE")


if __name__ == "__main__":
    main()
