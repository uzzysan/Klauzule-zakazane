# Dziennik Zmian (Changelog)

Wszystkie znaczące zmiany w tym projekcie będą dokumentowane w tym pliku.

Format bazuje na [Keep a Changelog](https://keepachangelog.com/pl/1.0.0/),
a projekt przestrzega [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-12-13

### Dodano
- **Backend (BCK-1):** Asynchroniczny upload plików przy użyciu `run_in_executor`, zapobiegający blokowaniu pętli zdarzeń.
- **Backend (BCK-2):** Endpointy health check `/health/live` i `/health/ready` dla integracji z load balancerem.
- **Backend (BCK-3):** Zadanie Celery `sync_prohibited_clauses` sterowane przez Celery Beat do synchronizacji danych zewnętrznych.
- **Backend (BCK-6):** Dedykowane serwisy Celery `worker` i `beat` w `docker-compose.dev.yml`.
- **Backend (BCK-4):** Integracja `PyMuPDF` (fitz) dla szybszego i dokładniejszego parsowania PDF (zastąpienie `pdfplumber`).
- **Frontend (FND-5):** Przygotowanie do konteneryzacji (Docker) z `output: 'standalone'` i wieloetapowym `Dockerfile`.

### Naprawiono
- **Backend (BCK-5):** Graceful handling (bezpieczna obsługa) błędów połączenia z MinIO podczas startu aplikacji.
- **Backend:** Rozwiązano konflikt nazw dla głównego endpointu health check.

### Bezpieczeństwo
- **Backend:** `upload_file` wymusza bezpieczne generowanie nazw plików.

## [1.0.0] - 2025-12-08

### Dodano
- Początkowa struktura projektu.
- Plan Wdrożenia v2.0.
- Schemat bazy danych ze wsparciem pgvector.
- Specyfikacja API.
- Podstawowy serwis zapisu MinIO.
- Podstawowy serwis OCR.
