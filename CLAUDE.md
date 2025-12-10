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
   - Vector similarity using local models (`sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`)
   - PostgreSQL with `pgvector` extension for semantic search (384-dimensional embeddings)
   - Optional Gemini API integration for advanced AI analysis
5. **Result Presentation** → Side-by-side view showing original document with highlighted risks

### Prohibited Clause Database (✅ IMPLEMENTED)
The system now includes **7,233 prohibited clauses** from Polish court decisions:
- **Source**: External PostgreSQL database with real court rulings
- **Coverage**: Multiple industries (Real Estate, E-commerce, Financial Services, Education, etc.)
- **Embeddings**: 384-dimensional vectors for semantic similarity search
- **Metadata**: Court decision references (sygnatura), judgment dates, industry tags, party information
- **Legal References**: 5,009 unique court decisions linked to clauses
- **Import Tool**: Automated import script at `backend/database/import_clauses.py`

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

#### Quick Start (Recommended: uv)
```bash
cd backend
uv venv                    # Create virtual environment
source .venv/bin/activate  # Activate venv (Linux/Mac)
uv pip install -e ".[dev]" # Install all dependencies
uvicorn main:app --reload  # Start dev server (http://localhost:8000)
pytest                     # Run tests
```

#### Alternative (pip)
```bash
cd backend
python3 -m venv venv       # Create virtual environment (first time only)
source venv/bin/activate   # Activate venv (Linux/Mac)
pip install -r requirements.txt  # Install dependencies
uvicorn main:app --reload  # Start dev server (http://localhost:8000)
pytest                     # Run tests
```

#### Database Commands
```bash
# Start development services (PostgreSQL, Redis, MinIO)
podman-compose -f docker-compose.dev.yml up -d

# Run migrations
uv run alembic upgrade head

# Import prohibited clauses (one-time setup)
PYTHONPATH=$PWD:$PYTHONPATH python database/import_clauses.py
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

## Implemented Features
- ✅ **Clause Database**: 7,233 prohibited clauses with vector embeddings
- ✅ **Database Models**: ProhibitedClause, ClauseCategory, LegalReference
- ✅ **Vector Search**: pgvector extension for semantic similarity
- ✅ **Import Tool**: Automated data import from external sources
- ✅ **Database Migrations**: Alembic setup with initial schema

## Planned Features (Not Yet Implemented)
- Clause database CRUD API endpoints
- Document analysis pipeline integration
- Google Drive integration
- Camera capture for mobile
- Feedback loop system
- Admin panel for clause management
- Cron job for guest file cleanup

## Database Schema (✅ IMPLEMENTED)
PostgreSQL with `pgvector` extension stores:
- **Prohibited Clauses**: 7,233 entries with 384-dim embeddings
- **Legal References**: 5,009 court decisions
- **Clause Categories**: Industry and risk classification
- **Metadata**: Tags, notes, court case information
- User metadata (planned)
- User feedback and ratings (planned)
- Analysis history (planned)

## Deployment Plan
- **Frontend**: Vercel or Dockerized VPS
- **Backend**: Docker container on Hetzner/DigitalOcean/Railway
- **Database**: Managed Postgres (Supabase/Neon) or self-hosted
- **CI/CD**: GitHub Actions
