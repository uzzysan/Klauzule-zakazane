# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FairPact is a contract analysis web application that identifies prohibited clauses using OCR and NLP. The application supports both offline rule-based analysis and optional AI enhancements.

## Architecture

This is a monorepo with two main components:
- **Frontend**: Next.js (React) + TailwindCSS application
- **Backend**: FastAPI (Python) for OCR, document parsing, and NLP analysis

### Core Analysis Pipeline
1. **Document Upload** → Frontend accepts PDFs, Word docs, or images (including camera capture)
2. **OCR Processing** → Backend uses Tesseract/EasyOCR for text extraction
3. **Document Parsing** → `pdfplumber` (PDF) and `python-docx` (Word) extract structured text
4. **Analysis Engine** → Hybrid search combining:
   - Keyword matching with fuzzy logic (Levenshtein distance)
   - Vector similarity using local models (`sentence-transformers` with `all-MiniLM-L6-v2`)
   - PostgreSQL with `pgvector` extension for semantic search
   - Optional Gemini API integration for advanced AI analysis
5. **Result Presentation** → Side-by-side view showing original document with highlighted risks

### Data Storage Strategy
- **Guest users**: Temporary storage with 24h retention (local filesystem or MinIO/S3)
- **Authenticated users**: Documents stored in user's Google Drive via Drive API
- **Clause Database**: PostgreSQL with vector embeddings for semantic search
- **Authentication**: NextAuth.js with Google OAuth as primary provider

## Development Commands

### Frontend Development
```bash
cd frontend
npm install                 # Install dependencies
npm run dev                # Start dev server (http://localhost:3000)
npm run build              # Production build
npm run start              # Start production server
npm run lint               # Run ESLint
```

### Backend Development
```bash
cd backend
python3 -m venv venv       # Create virtual environment (first time only)
source venv/bin/activate   # Activate venv (Linux/Mac)
pip install -r requirements.txt  # Install dependencies
uvicorn main:app --reload  # Start dev server (http://localhost:8000)
pytest                     # Run tests
```

**Note**: If `python3 -m venv venv` fails with ensurepip error, install `python3-venv` system package first.

## Technology Choices

### Why Local Models for "Non-AI" Mode?
The app uses `sentence-transformers` with local inference (no external API) to provide semantic search capabilities while meeting the "offline analysis" requirement. This is considered rule-based because:
- Models run locally without cloud dependencies
- Uses embeddings for similarity matching, not generative AI
- Deterministic results for the same input

### Color Scheme
- **Light mode**: Ecru/Brown palette (`#F5F5DC` background, `#3E2723` text, `#8D6E63` accents)
- **Dark mode**: Dark Brown/Orange (`#1A120B` background, `#E0E0E0` text, `#E65100` accents)

## Planned Features (Not Yet Implemented)
- Clause database CRUD API
- Google Drive integration
- Camera capture for mobile
- Feedback loop system
- Admin panel for clause management
- Cron job for guest file cleanup

## Database Schema (To Be Implemented)
PostgreSQL with `pgvector` extension will store:
- User metadata
- Clause database with vector embeddings
- User feedback and ratings
- Analysis history

## Deployment Plan
- **Frontend**: Vercel or Dockerized VPS
- **Backend**: Docker container on Hetzner/DigitalOcean/Railway
- **Database**: Managed Postgres (Supabase/Neon) or self-hosted
- **CI/CD**: GitHub Actions
