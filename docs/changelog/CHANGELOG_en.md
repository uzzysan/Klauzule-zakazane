# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-12-18

### Added

- **Backend:** JWT-based authentication system with bcrypt password hashing
  - User registration (`POST /api/v1/auth/register`)
  - User login (`POST /api/v1/auth/login`)
  - Current user info (`GET /api/v1/auth/me`)
  - Token refresh (`POST /api/v1/auth/refresh`)
  - Password change (`POST /api/v1/auth/change-password`)
- **Backend:** Role-based access control (admin/reviewer roles)
- **Backend:** Admin API endpoints
  - Model metrics (`GET /api/v1/admin/metrics`)
  - Pending reviews (`GET /api/v1/admin/pending-reviews`)
  - Feedback submission (`POST /api/v1/admin/feedback`)
  - Clause sync trigger (`POST /api/v1/admin/sync-clauses`)
- **Backend:** Comprehensive test suite (41 tests) covering auth, admin, and documents
- **Backend:** User, AnalysisFeedback, and ModelMetrics database models
- **Frontend:** Authentication system with Zustand store for state management
- **Frontend:** Admin dashboard (`/admin`) with:
  - Login form for admin/reviewer users
  - Metrics overview with confusion matrix
  - Pending reviews list
  - Clause sync trigger (admin only)
- **Frontend:** Review interface (`/admin/review/[analysisId]`) with:
  - Flagged clause review with feedback buttons (TP/FP)
  - Optional notes for feedback
  - Progress tracking
  - Filter by risk level or review status
- **Scripts:** Startup automation script (`start-app.sh`)

### Changed

- Updated CLAUDE.md with current project status
- Removed outdated phase planning files (PHASE_0_SETUP.md, PHASE_1_PROGRESS.md, PROJECT_STATUS.md, START_HERE.md)

## [1.1.0] - 2025-12-13

### Added

- **Backend (BCK-1):** Asynchronous file upload using `run_in_executor` to prevent event loop blocking.
- **Backend (BCK-2):** Health check endpoints `/health/live` and `/health/ready` for load balancer integration.
- **Backend (BCK-3):** Celery task `sync_prohibited_clauses` driven by Celery Beat for external data synchronization.
- **Backend (BCK-6):** Dedicated Celery `worker` and `beat` services in `docker-compose.dev.yml`.
- **Backend (BCK-4):** Integration of `PyMuPDF` (fitz) for faster and more accurate PDF parsing, replacing `pdfplumber`.
- **Frontend (FND-5):** Dockerization preparation with `output: 'standalone'` and multi-stage `Dockerfile`.

### Fixed

- **Backend (BCK-5):** Graceful handling of MinIO connection failures during application startup.
- **Backend:** Fixed naming conflict for root health check endpoint.

### Security

- **Backend:** `upload_file` enforces secure filename generation (existing feature, reinforced in async implementation).

## [1.0.0] - 2025-12-08

### Added

- Initial project structure.
- Implementation Plan v2.0.
- Database Schema with pgvector support.
- API Specification.
- Basic MinIO storage service.
- Basic OCR service using Tesseract (via wrapper) and EasyOCR.
