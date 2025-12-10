# FairPact Project Overview

## Purpose
FairPact is a contract analysis web application that identifies prohibited clauses in Polish contracts using OCR and NLP. The application supports both offline rule-based analysis and optional AI enhancements.

## Architecture
This is a monorepo with two main components:
- **Frontend**: Next.js (React) + TailwindCSS application
- **Backend**: FastAPI (Python) for OCR, document parsing, and NLP analysis

## Core Analysis Pipeline
1. **Document Upload** → Frontend accepts PDFs, Word docs, or images (including camera capture)
2. **OCR Processing** → Backend uses Tesseract/EasyOCR for text extraction
3. **Document Parsing** → `pdfplumber` (PDF) and `python-docx` (Word) extract structured text
4. **Analysis Engine** → Hybrid search combining:
   - Keyword matching with fuzzy logic (Levenshtein distance)
   - Vector similarity using local models (`sentence-transformers` with `all-MiniLM-L6-v2`)
   - PostgreSQL with `pgvector` extension for semantic search
   - Optional Gemini API integration for advanced AI analysis
5. **Result Presentation** → Side-by-side view showing original document with highlighted risks

## Data Storage Strategy
- **Guest users**: Temporary storage with 24h retention (local filesystem or MinIO/S3)
- **Authenticated users**: Documents stored in user's Google Drive via Drive API
- **Clause Database**: PostgreSQL with vector embeddings for semantic search
- **Authentication**: NextAuth.js with Google OAuth as primary provider
