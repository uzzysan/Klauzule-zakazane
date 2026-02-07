# System Monitorowania FairPact

**Wersja:** 1.0  
**Data utworzenia:** 2026-02-07  
**Status:** Aktywny

## Przegląd

System monitorowania FairPact zbiera i wizualizuje metryki dotyczące ruchu, wydajności i zdrowia aplikacji. Pozwala to na:
- Śledzenie obciążenia serwera w czasie rzeczywistym
- Wykrywanie problemów przed ich wpływem na użytkowników
- Podejmowanie świadomych decyzji dotyczących skalowania
- Analizę wzorców użytkowania i wydajności

## Architektura

### Komponenty

1. **Prometheus** - Baza danych szeregów czasowych zbierająca metryki
   - Port: 9090
   - Retention: 15 dni
   - Scrape interval: 10-15s (w zależności od źródła)

2. **Grafana** - Platforma wizualizacji metryk
   - Port: 3001
   - Auto-provisioning dashboardów i datasources
   - 3 główne dashboardy (Traffic, System, Business)

3. **Exporters**:
   - **Backend API** (`/metrics`) - Metryki FastAPI
   - **Nginx Exporter** - Metryki serwera web
   - **Node Exporter** - Metryki systemu operacyjnego

### Przepływ danych

```
Backend API → Prometheus (scrape co 10s)
Nginx → nginx-exporter → Prometheus (scrape co 15s)
System OS → node-exporter → Prometheus (scrape co 15s)
Prometheus → Grafana (visualize)
Prometheus → Alerts (evaluate rules)
```

## Metryki

### Metryki API (Backend)

#### Domyślne (z prometheus-fastapi-instrumentator)
- `http_requests_total` - Całkowita liczba requestów HTTP
  - Labels: `method`, `handler`, `status`
- `http_request_duration_seconds` - Czas trwania requestów (histogram)
  - Labels: `method`, `handler`
- `http_requests_inprogress` - Liczba requestów w trakcie przetwarzania
  - Labels: `method`, `handler`
- `http_response_size_bytes` - Rozmiar odpowiedzi HTTP (histogram)
  - Labels: `method`, `endpoint`

#### Custom metryki
- `visitor_sessions_total` - Liczba unikalnych sesji użytkowników
  - Labels: `user_type` (guest, authenticated)
- `document_uploads_total` - Liczba uploadowanych dokumentów
  - Labels: `file_type` (pdf, docx, image), `status` (success, error)
- `analysis_duration_seconds` - Czas trwania analiz (histogram)
  - Labels: `analysis_type` (ocr, nlp, vector_search, gemini)
- `active_users_total` - Liczba aktywnych użytkowników (gauge)
  - Labels: `time_window` (5m, 1h, 24h)
- `endpoint_requests_by_status_total` - Requesty per endpoint z kodem statusu
  - Labels: `method`, `endpoint`, `status_code`

### Metryki Systemu (Node Exporter)

- `node_cpu_seconds_total` - Użycie CPU per core i tryb
- `node_memory_MemAvailable_bytes` - Dostępna pamięć RAM
- `node_memory_MemTotal_bytes` - Całkowita pamięć RAM
- `node_filesystem_avail_bytes` - Dostępne miejsce na dysku
- `node_filesystem_size_bytes` - Całkowity rozmiar systemu plików
- `node_network_receive_bytes_total` - Bajty otrzymane przez interfejs sieciowy
- `node_network_transmit_bytes_total` - Bajty wysłane przez interfejs sieciowy
- `node_load1`, `node_load5`, `node_load15` - System load average

### Metryki Nginx

- `nginx_connections_active` - Aktywne połączenia
- `nginx_connections_accepted` - Zaakceptowane połączenia
- `nginx_connections_handled` - Obsłużone połączenia
- `nginx_http_requests_total` - Całkowita liczba requestów HTTP

## Dashboardy Grafana

### 1. Traffic Overview (`fairpact-traffic`)
**Cel:** Monitorowanie ruchu i wydajności API

**Panele:**
- Requests Per Second - Wykres requestów/sekundę per endpoint
- Requests/min (Total) - Gauge całkowitego ruchu
- Active Users (1h) - Liczba aktywnych użytkowników w ostatniej godzinie
- Top 10 Endpoints - Najczęściej używane endpointy (pie chart)
- Response Time Distribution - Histogram czasów odpowiedzi (P50, P95, P99)
- Error Rate by Status Code - Współczynnik błędów 2xx/4xx/5xx

**Kiedy monitorować:**
- Podczas deploymentu
- Po dodaniu nowych funkcji
- Przy podejrzeniu problemów z wydajnością

### 2. System Health (`fairpact-system`)
**Cel:** Monitorowanie zdrowia infrastruktury

**Panele:**
- CPU Usage - Użycie procesora w %
- Memory Usage - Użycie pamięci RAM w %
- Disk Usage - Zajętość dysku (gauge)
- Network Traffic - Ruch sieciowy (RX/TX)
- Requests In Progress - Liczba requestów w trakcie
- System Load Average - Obciążenie systemu (1m, 5m, 15m)

**Progi alarmowe:**
- CPU > 80% przez 10 min → Rozważ skalowanie
- Memory > 85% przez 10 min → Rozważ skalowanie
- Disk > 90% → Wyczyść dane lub zwiększ storage

### 3. Business Metrics (`fairpact-business`)
**Cel:** Monitorowanie metryk biznesowych

**Panele:**
- Document Uploads (24h) - Liczba uploadów w ciągu doby
- Upload Success Rate - Współczynnik sukcesu uploadów (gauge)
- Active Users - Aktywni użytkownicy (5m, 1h, 24h)
- Document Uploads Over Time - Wykres uploadów w czasie
- Analysis Duration - Czasy analiz (P50, P95, P99)
- Visitor Sessions by Type - Podział sesji (guest vs authenticated)
- Uploads by File Type - Podział uploadów według typu pliku

**Wskaźniki KPI:**
- Upload Success Rate > 95% (zielony), 90-95% (żółty), <90% (czerwony)
- Analysis Duration P95 < 30s
- Active Users 24h - trend wzrostowy wskazuje na rosnącą popularność

## Alerty

### Konfiguracja alertów

Alerty są zdefiniowane w `monitoring/alerts.yml` i grupowane według kategorii:

#### API Alerts
1. **HighRequestRate** - >1000 req/min przez 5 min
   - Severity: warning
   - Akcja: Sprawdź czy to organiczny ruch, rozważ skalowanie

2. **HighResponseTime** - P95 > 2s przez 5 min
   - Severity: warning
   - Akcja: Sprawdź logi aplikacji, zidentyfikuj wąskie gardła

3. **HighErrorRate** - >5% błędów 5xx przez 2 min
   - Severity: critical
   - Akcja: Natychmiastowa interwencja, sprawdź logi

4. **APIDown** - Backend nie odpowiada przez 1 min
   - Severity: critical
   - Akcja: Restart kontenera, sprawdź logi

#### System Alerts
1. **HighCPUUsage** - CPU > 80% przez 10 min
   - Severity: warning
   - Akcja: **CZAS NA SKALOWANIE SERWERA**

2. **HighMemoryUsage** - RAM > 85% przez 10 min
   - Severity: warning
   - Akcja: **CZAS NA SKALOWANIE SERWERA**

3. **CriticalMemoryUsage** - RAM > 95% przez 2 min
   - Severity: critical
   - Akcja: Natychmiast restart/skalowanie, ryzyko OOM

4. **HighDiskUsage** - Dysk > 90%
   - Severity: warning
   - Akcja: Wyczyść logi, stare backupy, lub zwiększ storage

5. **DiskWillFillIn4Hours** - Przewidywane wyczerpanie miejsca
   - Severity: warning
   - Akcja: Proaktywne czyszczenie lub rozszerzenie dysku

#### Business Alerts
1. **LowUploadSuccessRate** - <90% sukcesu przez 10 min
   - Severity: warning
   - Akcja: Sprawdź logi backendu, problemy z OCR lub storage

2. **SlowAnalysisProcessing** - P95 > 30s przez 10 min
   - Severity: warning
   - Akcja: Sprawdź obciążenie Celery workerów, rozważ dodanie workerów

### Przyszłe rozszerzenia alertów

Możliwe do dodania później:
- Integracja z emailem lub Slackiem (Alertmanager)
- PagerDuty dla krytycznych alertów
- Webhook do własnego systemu notyfikacji

## Przewodnik Skalowania

### Kiedy skalować? - Progi decyzyjne

#### Skalowanie VERTICAL (większy VPS)
Rozważ, gdy **3 lub więcej** z poniższych warunków jest spełnionych:

1. CPU > 70% średnio przez >1 godzinę
2. Memory > 80% średnio przez >1 godzinę
3. Load Average 15m > liczba vCPU × 0.7
4. Response Time P95 > 1.5s regularnie
5. Requests/min > 800 stabilnie

**Aktualny plan skalowania:**
- Starter: Hetzner CX41 (4 vCPU, 16GB RAM) - €12.90/m - do 500 użytkowników
- Scale-up 1: Hetzner CX51 (8 vCPU, 32GB RAM) - €26.90/m - do 2000 użytkowników
- Scale-up 2: Hetzner CCX33 (8 dedicated vCPU, 32GB) - €69.90/m - do 5000+ użytkowników

#### Skalowanie HORIZONTAL (więcej instancji backendu)
Rozważ, gdy:
- Request rate > 2000/min
- Requests in progress > 100 regularnie
- Pojedyncze instancje API nie nadążają mimo dobrego CPU/RAM

W `docker-compose.prod.yml` dodaj `backend-2`, `backend-3` itd.

#### Optymalizacja PRZED skalowaniem

Zanim skałujesz hardware, sprawdź:
1. **Cache** - Czy używasz Redis cache dla często odczytywanych danych?
2. **Database** - Czy query'e są zoptymalizowane? Connection pooling?
3. **Static files** - Czy serwowane przez CDN?
4. **Code** - Czy są oczywiste wąskie gardła w kodzie?

## Użytkowanie

### Dostęp do dashboardów

**Produkcja:**
- Grafana: https://grafana.fairpact.pl (port 3001)
- Prometheus: https://prometheus.fairpact.pl (port 9090) - tylko dla admina

**Lokalne (development):**
- Grafana: http://localhost:3001
- Prometheus: http://localhost:9090
- Backend metrics: http://localhost:8000/metrics

**Dane logowania Grafana:**
- Username: `admin`
- Password: Zdefiniowane w zmiennej `GRAFANA_PASSWORD` w `.env.production`

### Przykładowe zapytania Prometheus

```promql
# Średni czas odpowiedzi per endpoint (ostatnie 5 min)
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])

# Liczba błędów 5xx per minuta
sum(rate(http_requests_total{status=~"5.."}[1m])) * 60

# Top 5 najwolniejszych endpointów
topk(5, histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])))

# Użytkownicy aktywni w ostatniej godzinie
sum(active_users_total{time_window="1h"})

# Przewidywanie: czy dysk zapełni się w ciągu 24h?
predict_linear(node_filesystem_avail_bytes[6h], 24*3600) < 0
```

## Integracja w Kodzie

### Używanie custom metryk

```python
from monitoring import record_document_upload, AnalysisTimer

# Rejestracja uploadu dokumentu
record_document_upload(file_type="pdf", status="success")

# Pomiar czasu trwania analizy
with AnalysisTimer("ocr"):
    # ... kod OCR
    pass
```

### Śledzenie użytkowników

Middleware `UserTrackingMiddleware` automatycznie:
- Rejestruje nowe sesje użytkowników
- Aktualizuje metryki aktywnych użytkowników
- Rozróżnia gości od zalogowanych użytkowników

## Troubleshooting

### Prometheus nie zbiera metryk
1. Sprawdź czy target jest "UP" w Prometheus UI (`/targets`)
2. Zweryfikuj czy endpoint `/metrics` jest dostępny: `curl http://backend-1:8000/metrics`
3. Sprawdź logi Prometheus: `docker logs fairpact-prometheus`

### Grafana nie pokazuje danych
1. Sprawdź czy datasource Prometheus jest skonfigurowany (Settings → Data Sources)
2. Test connection w datasource powinien zwrócić "Data source is working"
3. Sprawdź czy w Prometheus są dane dla używanych metryk

### Alerty nie działają
1. Sprawdź czy reguły są załadowane: Prometheus UI → Alerts
2. Zweryfikuj składnię `alerts.yml`: `promtool check rules monitoring/alerts.yml`
3. Sprawdź evaluation time w Prometheus

## Bezpieczeństwo

- Prometheus i Grafana **NIE POWINNY** być publicznie dostępne w produkcji
- Dostęp przez VPN lub IP whitelisting
- Hasło Grafana przechowywane w zmiennych środowiskowych, nie w repozytorium
- `/metrics` endpoint może zawierać wrażliwe dane - rozważ autoryzację w przyszłości

## Backup i Retention

- **Prometheus data**: 15 dni retention, backup nie wymagany (dane metryczne, nie krytyczne)
- **Grafana dashboardy**: Backup automatyczny przez Git (pliki JSON w repo)
- **Grafana konfiguracja**: Provisioning przez pliki YAML w repo

## Koszty

Przy aktualnej konfiguracji (self-hosted):
- VPS: €12.90-26.90/m (w zależności od rozmiaru)
- Prometheus storage: ~10-20GB dla 15 dni retention (included in VPS)
- Grafana: 0€ (open source, self-hosted)
- **Koszt monitorowania: 0€** (poza kosztem VPS który i tak jest potrzebny)

Alternatywa: Grafana Cloud Free Tier - 10k serii, 50GB logów, 14 dni retention - 0€/m

## Kontakt i Wsparcie

W razie problemów:
1. Sprawdź tę dokumentację
2. Zobacz `RUNBOOK.md` dla procedur operacyjnych
3. Sprawdź logi: `docker logs <container_name>`
4. Alerty w Prometheus UI pokazują aktualny stan systemu
