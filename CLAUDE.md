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

### Backend (✅ Complete)
- ✅ **Clause Database**: 7,233 prohibited clauses with vector embeddings
- ✅ **Database Models**: Document, Analysis, FlaggedClause, ProhibitedClause, LegalReference
- ✅ **Vector Search**: pgvector extension for semantic similarity
- ✅ **Document Upload API**: `POST /api/v1/documents/upload` (PDF, DOCX, images)
- ✅ **Analysis Service**: Hybrid search (vector + keyword matching)
- ✅ **Analysis API**: Results retrieval endpoints
- ✅ **Celery Pipeline**: Async document processing with OCR/parsing
- ✅ **Database Migrations**: Alembic setup with full schema

### Frontend (🚧 In Progress)
- ✅ **Project Setup**: Next.js 14 + TailwindCSS + Zustand
- ✅ **Theme System**: Light/Dark mode with CSS variables
- 🚧 **Upload Page**: File upload with drag & drop
- 🚧 **Results Page**: Analysis results with risk highlighting
- ⏳ **Navigation & Layout**: Header, footer, responsive design

## Current Development Phase: Frontend MVP

### Phase 1: Core UI Components
- [ ] Button, Card, Input components
- [ ] FileUpload with drag & drop
- [ ] RiskBadge, ProgressBar components
- [ ] Loading states and error handling

### Phase 2: Upload Flow
- [ ] Upload page with file selection
- [ ] File validation (type, size)
- [ ] Upload progress indicator
- [ ] Redirect to results on completion

### Phase 3: Results Display
- [ ] Analysis summary (risk score, counts)
- [ ] Flagged clauses list with highlighting
- [ ] Document text viewer with markers
- [ ] Export/download functionality

### Phase 4: Polish & Navigation
- [ ] Header with theme toggle
- [ ] Landing page improvements
- [ ] Mobile responsiveness
- [ ] Error pages (404, 500)

## Planned Features (Future)
- Clause database CRUD API endpoints
- Google Drive integration
- Camera capture for mobile
- Feedback loop system
- Admin panel for clause management
- Cron job for guest file cleanup
- User authentication (NextAuth.js)

## Database Schema (✅ IMPLEMENTED)
PostgreSQL with `pgvector` extension stores:
- **Documents**: Upload metadata, status tracking
- **Document Metadata**: Extracted text, word count, sections
- **Analyses**: Analysis jobs with results summary
- **Flagged Clauses**: Individual matches with confidence scores
- **Prohibited Clauses**: 7,233 entries with 384-dim embeddings
- **Legal References**: 5,009 court decisions
- **Clause Categories**: Industry and risk classification

## Deployment Plan
- **Frontend**: Vercel or Dockerized VPS
- **Backend**: Docker container on Hetzner/DigitalOcean/Railway
- **Database**: Managed Postgres (Supabase/Neon) or self-hosted
- **CI/CD**: GitHub Actions
