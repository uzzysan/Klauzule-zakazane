# Tech Stack

## Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL with `pgvector` extension
- **ORM**: SQLAlchemy (async)
- **Database Migrations**: Alembic
- **Task Queue**: Celery with Redis
- **Storage**: MinIO (S3-compatible)
- **OCR**: Tesseract OCR, EasyOCR
- **Document Parsing**: pdfplumber, python-docx
- **NLP**: sentence-transformers (all-MiniLM-L6-v2)
- **Authentication**: JWT tokens
- **External APIs**: Optional Google Gemini API

## Frontend
- **Framework**: Next.js (React)
- **Styling**: TailwindCSS
- **Authentication**: NextAuth.js with Google OAuth
- **State Management**: TBD

## Development Tools
- **Package Manager**: uv (recommended) or pip
- **Code Formatting**: black, isort
- **Linting**: flake8, mypy
- **Testing**: pytest

## Infrastructure
- **Containers**: Docker, docker-compose
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel (frontend), Docker VPS (backend)
