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

### Development Setup

To run the components locally during development:

**Backend:**
Run the FastAPI server with hot-reloading using the local `.env` file:
```bash
uvicorn backend.main:app --reload --env-file .env
```

**Frontend:**
1. Create a local environment file:
   ```bash
   cp frontend/.env.example frontend/.env.local
   ```
2. Open `frontend/.env.local` and populate it with the required values (Sentry DSNs, API URL, etc.) as indicated in the file.
3. Start the development server:
   ```bash
   cd frontend
   npm run dev
   ```

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

## Sentry Error Monitoring

FairPact uses Sentry for error tracking and performance monitoring across both backend and frontend.

### Configuration

1. **Backend Sentry Setup**
   - Set `SENTRY_DSN` in `.env` or `.env.production`
   - Set `SENTRY_ENVIRONMENT` (development/production)
   - Backend DSN: `https://bcffe5f128aa717326853629eebee3bd@o4510815941492736.ingest.de.sentry.io/4510818226798672`

2. **Frontend Sentry Setup**
   - Set `NEXT_PUBLIC_SENTRY_DSN` in `frontend/.env.local` or `.env.production.frontend`
   - Set `SENTRY_DSN` for server-side tracking
   - Set `SENTRY_ENVIRONMENT` (development/production)
   - Frontend DSN: `https://0c9b6f3a5f11b012183637004bdfdfa7@o4510815941492736.ingest.de.sentry.io/4510818196717648`

### Testing Sentry Integration

**Backend:**
```bash
curl http://localhost:8000/health/sentry-test
```
This endpoint deliberately raises an error that should appear in your Sentry dashboard.

**Frontend:**
- Visit `http://localhost:3000/sentry-test` and click "Throw Client Error"
- Visit `http://localhost:3000/api/sentry-test` to test server-side error tracking

Check your Sentry dashboard at https://sentry.io to verify errors are being captured.

### Production Considerations

- Adjust `traces_sample_rate` in production (currently 1.0 = 100%)
- Consider setting to 0.1-0.2 (10-20%) to reduce costs
- Review `send_default_pii` setting for privacy compliance
- Monitor Sentry quota usage

## Wsparcie projektu

Jeśli chcesz wesprzeć rozwój FairPact, możesz to zrobić przez:

[![Wesprzyj mnie](https://suppi.pl/api/widget/button.svg?fill=6457FF&textColor=ffffff)](https://suppi.pl/rafcio)
