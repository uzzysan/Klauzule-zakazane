# FairPact - Troubleshooting Guide dla Agentów AI

## Ostatnia aktualizacja: 2026-03-23

---

## 1. Błąd HTTP 500 przy uploadzie dokumentu

### Objawy
- Frontend wyświetla błąd "HTTP 500" przy próbie przesłania pliku
- Logi backendu pokazują błąd Celery/Redis

### Przyczyna
Zmienne środowiskowe `CELERY_BROKER_URL` i `CELERY_RESULT_BACKEND` wskazują na stary hostname `redis` lub stare hasło, zamiast centralnego Redis przez VPN.

### Rozwiązanie
```bash
# Na serwerze OVH (147.135.211.101)
cd /opt/fairpact

# Sprawdź aktualne wartości
grep CELERY .env.production

# Powinny wskazywać na:
# CELERY_BROKER_URL=redis://:<PASSWORD>@10.200.200.1:6379/0
# CELERY_RESULT_BACKEND=redis://:<PASSWORD>@10.200.200.1:6379/0

# Jeśli są nieprawidłowe - napraw:
sed -i 's|CELERY_BROKER_URL=redis://:.*@redis:6379/0|CELERY_BROKER_URL=redis://:<PASSWORD>@10.200.200.1:6379/0|' .env.production
sed -i 's|CELERY_RESULT_BACKEND=redis://:.*@redis:6379/0|CELERY_RESULT_BACKEND=redis://:<PASSWORD>@10.200.200.1:6379/0|' .env.production

# Restart kontenerów
docker compose -f docker-compose.prod.yml up -d --no-deps backend-1 celery-worker-1 celery-beat

# Weryfikacja
docker logs fairpact-worker | grep "Connected to redis"
```

---

## 2. Strona fairpact.pl prowadzi do maculewicz.pro (lub odwrotnie)

### Objawy
- fairpact.pl wyświetla stronę osobistą Rafała Maculewicza
- Tytuł strony to "Rafał Maculewicz | Analityk Danych..." zamiast "FairPact..."

### Przyczyna
Aplikacja `rafcio` (strona osobista) uruchomiona przez PM2 zajmuje port 3000, który powinien być zarezerwowany dla FairPact frontendu.

### Rozwiązanie
```bash
# Na serwerze OVH

# 1. Zatrzymaj PM2 rafcio (jeśli działa na porcie 3000)
pm2 stop rafcio
pm2 delete rafcio

# 2. Upewnij się, że port 3000 jest wolny
sudo ss -tlnp | grep 3000
# Powinno pokazać tylko docker-proxy dla fairpact-frontend

# 3. Jeśli port zajęty - zrestartuj fairpact-frontend
cd /opt/fairpact
docker compose -f docker-compose.prod.yml up -d --no-deps frontend

# 4. Uruchom rafcio na porcie 3002 (przez Docker)
# Rafcio powinien działać jako kontener Docker na porcie 3002
# Port 3002 jest skonfigurowany w nginx jako upstream rafcio_app
```

### Architektura portów
| Port | Aplikacja | Domena |
|------|-----------|--------|
| 3000 | FairPact Frontend | fairpact.pl |
| 3002 | Rafcio (strona osobista) | maculewicz.pro |
| 8000 | FairPact Backend | fairpact.pl/api |
| 3001 | Grafana | grafana.fairpact.pl |

---

## 3. Problemy z połączeniem do centralnej bazy danych

### Objawy
- Błędy połączenia z PostgreSQL lub Redis
- Timeout przy próbie zapisu/odczytu

### Weryfikacja połączeń VPN
```bash
# Na OVH - test połączenia do Coolify (10.200.200.1)
ping 10.200.200.1
curl -v telnet://10.200.200.1:5432  # PostgreSQL
curl -v telnet://10.200.200.1:6379  # Redis
curl -v telnet://10.200.200.1:9000  # MinIO
```

### Sprawdź konfigurację .env.production
```bash
cd /opt/fairpact
cat .env.production | grep -E '(DATABASE_URL|REDIS_URL|MINIO)'

# Powinno zawierać:
# DATABASE_URL=postgresql://fairpact_user:<pass>@10.200.200.1:5432/fairpact_db
# REDIS_URL=redis://:<pass>@10.200.200.1:6379/0
# MINIO_ENDPOINT=10.200.200.1:9000
```

---

## 4. Migracja bazy danych FairPact

### Procedura eksportu ze starej bazy
```bash
# Na OVH - eksport starej bazy
docker exec fairpact-postgres pg_dump -U fairpact_user -d fairpact_db \
  --no-owner --no-privileges --clean --if-exists \
  > fairpact_db.sql
```

### Procedura importu do centralnej bazy
```bash
# Na Coolify - przygotowanie
sudo mkdir -p /opt/backups/migration-20260323
sudo mv fairpact_db.sql /opt/backups/migration-20260323/

# Zatrzymaj połączenia (jeśli migracja trwa długo)
docker exec central-postgres psql -U postgres -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='fairpact_db' AND pid <> pg_backend_pid();"

# Wyczyść i zaimportuj
docker exec -i central-postgres psql -U postgres -d fairpact_db < fairpact_db.sql

# Nadaj uprawnienia
docker exec central-postgres psql -U postgres -d fairpact_db -c \
  "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO fairpact_user;"
```

---

## 5. Sprawdzanie statusu wszystkich usług

```bash
# Na OVH
echo "=== Kontenery Docker ==="
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep -E '(fairpact|rafcio)'

echo "=== Porty nasłuchujące ==="
sudo ss -tlnp | grep -E ':(3000|3001|3002|8000)'

echo "=== Testy curl ==="
curl -s https://fairpact.pl/health/ready
curl -s https://maculewicz.pro | grep -o '<title>[^<]*</title>'
```

---

## Architektura infrastruktury

### Serwery
- **OVH** (147.135.211.101): Aplikacje (FairPact, rafcio), Nginx
- **Coolify** (5.189.139.149): Centralne bazy (PostgreSQL, Redis, MinIO)
- **Contabo** (173.249.37.239): n8n workflow automation

### Sieć VPN (Wireguard)
- 10.200.200.1 - Coolify (hub baz danych)
- 10.200.200.2 - OVH (aplikacje)
- 10.200.200.4 - Contabo (n8n)

### Ścieżki krytyczne
- `/opt/fairpact/` - kod aplikacji FairPact
- `/opt/fairpact/.env.production` - zmienne środowiskowe
- `/opt/rafcio/` - kod strony osobistej
- `/etc/nginx/sites-enabled/` - konfiguracja nginx
