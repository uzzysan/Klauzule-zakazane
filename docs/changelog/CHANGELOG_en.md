# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
