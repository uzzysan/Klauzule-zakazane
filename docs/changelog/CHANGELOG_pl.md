# Dziennik Zmian (Changelog)

Wszystkie znaczące zmiany w tym projekcie będą dokumentowane w tym pliku.

Format bazuje na [Keep a Changelog](https://keepachangelog.com/pl/1.0.0/),
a projekt przestrzega [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-12-18

### Dodano

- **Backend:** System uwierzytelniania JWT z hashowaniem haseł bcrypt
  - Rejestracja użytkownika (`POST /api/v1/auth/register`)
  - Logowanie użytkownika (`POST /api/v1/auth/login`)
  - Informacje o użytkowniku (`GET /api/v1/auth/me`)
  - Odświeżanie tokenu (`POST /api/v1/auth/refresh`)
  - Zmiana hasła (`POST /api/v1/auth/change-password`)
- **Backend:** Kontrola dostępu oparta na rolach (role admin/reviewer)
- **Backend:** Endpointy API administracyjnego
  - Metryki modelu (`GET /api/v1/admin/metrics`)
  - Oczekujące recenzje (`GET /api/v1/admin/pending-reviews`)
  - Przesyłanie feedbacku (`POST /api/v1/admin/feedback`)
  - Wyzwalanie synchronizacji klauzul (`POST /api/v1/admin/sync-clauses`)
- **Backend:** Kompleksowy zestaw testów (41 testów) obejmujący auth, admin i dokumenty
- **Backend:** Modele bazy danych User, AnalysisFeedback i ModelMetrics
- **Frontend:** System uwierzytelniania z magazynem stanu Zustand
- **Frontend:** Panel administracyjny (`/admin`) z:
  - Formularzem logowania dla użytkowników admin/reviewer
  - Przeglądem metryk z macierzą pomyłek
  - Listą oczekujących recenzji
  - Wyzwalaniem synchronizacji klauzul (tylko admin)
- **Frontend:** Interfejs recenzji (`/admin/review/[analysisId]`) z:
  - Recenzją klauzul z przyciskami feedbacku (TP/FP)
  - Opcjonalnymi notatkami do feedbacku
  - Śledzeniem postępu
  - Filtrowaniem według poziomu ryzyka lub statusu recenzji
- **Skrypty:** Skrypt automatyzacji uruchamiania (`start-app.sh`)

### Zmieniono

- Zaktualizowano CLAUDE.md o aktualny status projektu
- Usunięto przestarzałe pliki planowania faz (PHASE_0_SETUP.md, PHASE_1_PROGRESS.md, PROJECT_STATUS.md, START_HERE.md)

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
