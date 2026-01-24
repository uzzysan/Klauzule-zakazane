# FairPact

FairPact is a web application designed to analyze contracts and identify prohibited clauses using OCR and NLP.

## Project Structure

- `frontend/`: Next.js application (React, TailwindCSS, TypeScript)
- `backend/`: FastAPI application (Python, PostgreSQL, Celery, Redis)
- `docs/`: Technical Documentation (API, Architecture, Guides)
- `IMPLEMENTATION_SUMMARY.md`: Current implementation status and recent changes

## Setup Instructions

### Quick Start (Recommended)

The project includes automation scripts for easy setup.

1. **Install system dependencies** (requires sudo):
   ```bash
   ./install-dependencies.sh
   ```
   This installs Podman, Python, Node.js, and development libraries.

2. **Start the application**:
   ```bash
   ./start-app.sh
   ```
   This script will:
   - Check requirements
   - Setup Python virtual environment
   - Install dependencies (Python & Node.js)
   - Start all services (PostgreSQL, Redis, MinIO, Celery, API, Frontend)

### Manual Setup

See specific README files in subdirectories:
- [Backend Setup](backend/README.md)
- [Frontend Setup](frontend/README.md) (Note: Check `package.json` for scripts)

The application will be available at:
- Frontend: <http://localhost:3000>
- Backend API: <http://localhost:8000>
- API Documentation: <http://localhost:8000/docs>

## Current Status

As of the latest update (see `IMPLEMENTATION_SUMMARY.md`):

### Backend
- **Analysis**: Configuration for similarity thresholds implemented.
- **Admin API**: Endpoints for feedback, metrics, and pending reviews.
- **Database**: Schemas for documents, analyses, prohibited clauses, and feedback.
- **Services**: OCR, Vector Search (pgvector), Celery Tasks.

### Frontend
- **Upload**: File upload with drag-and-drop.
- **Analysis View**: Display of results, risk scores, and flagged clauses.
- **Navigation**: Improved flow after upload.

## Documentation

- **[Documentation Index](docs/README_en.md)** - Start here
- [API Specification](docs/api/endpoints_en.md)
- [Database Schema](docs/architecture/database_schema_en.md)
- [Implementation Summary](IMPLEMENTATION_SUMMARY.md)
