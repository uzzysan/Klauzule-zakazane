# FairPact - Baza Wiedzy Diagnostycznej

## 1. Przegląd Aplikacji
**Cel:** Analiza umów pod kątem klauzul zakazanych (abuzywnych) w oparciu o rejestr UOKiK.

### Główne komponenty (kontenery Docker):
- **fairpact-nginx** (nginx:alpine) - Reverse proxy, SSL (512MB)
- **fairpact-frontend** (Next.js 14) - UI aplikacji (512MB)
- **fairpact-backend** (FastAPI) - API REST (2GB)
- **fairpact-worker** (Celery) - Przetwarzanie dokumentów (1.5GB)
- **fairpact-beat** (Celery Beat) - Zadania cykliczne (512MB)
- **fairpact-postgres** (pgvector:pg15) - Baza danych + wektory (2.5GB)
- **fairpact-redis** (redis:7-alpine) - Broker Celery (1GB)
- **fairpact-minio** (minio) - Storage plików (1GB)

## 2. Architektura Bazy Danych

### Rozszerzenia PostgreSQL:
- `uuid-ossp` - UUID
- `pgvector` - wyszukiwanie wektorowe
- `pg_trgm` - fuzzy search

### Główne tabele:
- `prohibited_clauses` - 7,233 klauzul z embeddingami (Vector 384)
- `clause_categories` - kategorie klauzul
- `legal_references` - podstawy prawne
- `documents` - przesłane dokumenty
- `document_metadata` - metadane (JSONB)
- `analyses` - wyniki analiz
- `flagged_clauses` - znalezione klauzule

### Model embeddingów:
- `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` (384 dim)

## 3. Pipeline Analizy

```
Upload → MinIO → Celery → Parse/OCR → Segment → Embed → pgvector → Results
```

1. Upload (POST /api/v1/documents/upload) → MinIO
2. Celery `tasks.process_document`:
   - Download z MinIO
   - Parse (pdfplumber/python-docx) lub OCR (Tesseract)
   - Segmentacja (min 50 znaków, max 500 segmentów)
3. Analiza (services/analysis.py):
   - Embedding segmentów
   - pgvector cosine similarity
   - Hybrid: 0.7*vector + 0.3*keyword
4. Progi ryzyka: HIGH ≥0.93, MEDIUM ≥0.86, LOW ≥0.80

## 4. Kluczowe Endpointy

- POST `/api/v1/documents/upload` - Upload
- GET `/api/v1/documents/{id}` - Dokument
- GET `/api/v1/analysis/document/{id}` - Analiza
- GET `/api/v1/analysis/{id}/clauses` - Klauzule
- POST `/api/v1/admin/sync-clauses` - Sync UOKiK
- GET `/health` - Health check

## 5. Konfiguracja

**Pliki:**
- `/opt/fairpact/.env.production` - backend
- `/opt/fairpact/.env.production.frontend` - frontend

**Krytyczne zmienne:**
- DATABASE_URL, REDIS_URL, REDIS_PASSWORD
- MINIO_*, SECRET_KEY, JWT_SECRET_KEY

## 6. Polecenia Diagnostyczne

```bash
# Status
sudo docker compose -f docker-compose.prod.yml ps

# Logi
sudo docker compose -f docker-compose.prod.yml logs --tail=100 backend-1
sudo docker compose -f docker-compose.prod.yml logs --tail=100 celery-worker-1
sudo docker compose -f docker-compose.prod.yml logs --tail=100 postgres

# Baza danych
sudo docker exec -it fairpact-postgres psql -U postgres -d fairpact

# Test Celery
sudo docker exec fairpact-backend python -c "from celery_app import celery; print(celery.control.ping())"

# Restart
sudo docker compose -f docker-compose.prod.yml restart backend-1
sudo docker compose -f docker-compose.prod.yml restart celery-worker-1
```

## 7. Typowe Problemy

**Worker unhealthy:** Logi workera, połączenie Redis/PostgreSQL
**502 Bad Gateway:** Status backend, logi nginx
**Brak wyników:** Klauzule w bazie?, embeddingi?, progi?
**Wolne:** RAM (embeddingi w pamięci), worker load

## 8. Ścieżki

```
/opt/fairpact/
├── backend/
│   ├── main.py, config.py, celery_app.py
│   ├── services/analysis.py
│   ├── tasks/document_processing.py
│   ├── models/, api/, database/
├── frontend/
├── nginx/
├── docker-compose.prod.yml
└── .env.production
```

## 9. Naprawione Problemy (2026-02-07)

### Problem: Worker nie przetwarza dokumentów (status "processing" zawiesza się)

**Objawy:**
- Dokumenty w statusie `processing` nie kończą przetwarzania
- Worker w logach pokazuje `celery@... ready.` ale nie przetwarza tasków
- `celery inspect active` pokazuje puste

**Diagnoza:**
```bash
# Sprawdź na jakich kolejkach nasłuchuje worker
sudo docker exec fairpact-worker celery -A celery_app inspect active_queues

# Sprawdź gdzie trafiają taski (Redis)
sudo docker exec fairpact-backend python -c "
import redis
from celery_app import celery_app
r = redis.from_url(celery_app.conf.broker_url)
print('celery:', r.llen('celery'))
print('documents:', r.llen('documents'))
print('sync:', r.llen('sync'))
"
```

**Root cause:** Worker nasłuchiwał tylko na kolejce `celery`, ale taski były routowane do kolejek `documents` i `sync` (zdefiniowane w `celery_app.py:task_routes`).

**Rozwiązanie:** Dodaj flagi kolejek do docker-compose.prod.yml:
```yaml
command: celery -A celery_app worker --loglevel=info --concurrency=2 -Q celery,documents,sync
```

### Problem: ImportError: cannot import 'cached_download' from huggingface_hub

**Root cause:** `sentence-transformers==2.2.2` używał przestarzałej funkcji `cached_download`.

**Rozwiązanie:** Zaktualizuj w `backend/requirements.txt`:
```
sentence-transformers>=3.0.0
torch>=2.4.0
```

### Problem: PermissionError przy pobieraniu modeli HuggingFace

**Root cause:** Kontener uruchamiany jako `appuser` nie miał katalogu cache.

**Rozwiązanie:** Dodaj do `backend/Dockerfile`:
```dockerfile
# Create HuggingFace cache directory
RUN mkdir -p /app/.cache/huggingface && chown -R appuser:appuser /app/.cache

ENV HF_HOME=/app/.cache/huggingface
ENV TRANSFORMERS_CACHE=/app/.cache/huggingface
```

### Ponowne przetworzenie dokumentu po naprawie
```bash
sudo docker exec fairpact-backend python -c "
from tasks.document_processing import process_document
task = process_document.delay(
    document_id='DOC_UUID',
    object_name='guest/FILENAME.pdf',
    mime_type='application/pdf',
    language='pl',
)
print('Task:', task.id)
"
```

## 10. GitHub Push z 2FA

Gdy masz 2FA na GitHubie i nie możesz pushować przez HTTPS, użyj GitHub MCP API:
1. Stwórz branch przez `create_branch`
2. Pushuj pliki przez `push_files`
3. Stwórz PR przez `create_pull_request`

To omija problem autentykacji, bo MCP używa tokenu OAuth.
