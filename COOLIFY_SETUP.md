# Konfiguracja FairPact w Coolify (OVH jako zdalny serwer)

Ten dokument opisuje jak dodać OVH jako zdalny serwer w Coolify i zarządzać FairPact z poziomu panelu Coolify.

## ✅ Status

- **Klucz SSH**: Wygenerowany na OVH (`~/.ssh/coolify_ed25519`)
- **Serwer przygotowany**: Katalog `/opt/coolify` utworzony, Docker skonfigurowany
- **Coolify Compose**: `coolify-compose.yml` przygotowany (używa obrazów GHCR)

## 📋 Instrukcja konfiguracji

### Krok 1: Dodanie serwera w Coolify

1. Zaloguj się do panelu Coolify: `https://coolify.sourcier.pl`
2. Przejdź do: **Settings** → **Servers** → **Add Server**
3. Wypełnij formularz:
   - **Name**: `FairPact-OVH`
   - **IP Address**: `147.135.211.101`
   - **User**: `ubuntu`
   - **Port**: `22`
   - **Private Key**: Wklej poniższy klucz prywatny:

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACAWC6RI5w7uWHYKlihA7dWs0INWv8PJg8LoUpbmpMUomAAAAJgr7AjGK+wI
xgAAAAtzc2gtZWQyNTUxOQAAACAWC6RI5w7uWHYKlihA7dWs0INWv8PJg8LoUpbmpMUomA
AAAEDp94RzpAx9mEH0/yOm+5fq6+VEgTa6NZp8ddQ2uroC+hYLpEjnDu5YdgqWKEDt1azQ
g1a/w8mDwuhSluakxSiYAAAAEGNvb2xpZnlAZmFpcnBhY3QBAgMEBQ==
-----END OPENSSH PRIVATE KEY-----
```

4. Kliknij **Check Connection** - powinno pokazać "Server is reachable"
5. Zapisz serwer

### Krok 2: Konfiguracja projektu w Coolify

1. Przejdź do: **Projects** → **Add New**
2. Uzupełnij:
   - **Name**: `FairPact`
   - **Description**: `FairPact - Platforma analizy klauzul abuzywnych`
3. Kliknij **Create**

### Krok 3: Dodanie usługi (Resource)

1. W projekcie FairPact kliknij **Add New Resource**
2. Wybierz: **Docker Compose** (nie "Application"!)
3. Wypełnij:
   - **Name**: `fairpact-stack`
   - **Server**: `FairPact-OVH` (wcześniej dodany)
   - **Base Directory**: `/opt/coolify/fairpact`
4. W sekcji **Docker Compose File**: Wklej zawartość pliku `coolify-compose.yml`

### Krok 4: Konfiguracja zmiennych środowiskowych (Secrets)

W Coolify przejdź do zakładki **Secrets** i dodaj wszystkie zmienne z `.env.production`:

#### Wymagane zmienne (Production):

```bash
# Database
DATABASE_URL=postgresql+asyncpg://fairpact:FAIRPACT_DB_PASSWORD@localhost:5432/fairpact

# Redis
REDIS_URL=redis://localhost:6379/0

# MinIO
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=MINIO_ACCESS_KEY
MINIO_SECRET_KEY=MINIO_SECRET_KEY
MINIO_BUCKET_NAME=fairpact-documents

# Security
JWT_SECRET_KEY=JWT_SECRET_KEY

# AI
OPENROUTER_API_KEY=sk-or-v1-...

# Monitoring
SENTRY_DSN=https://...sentry.io/...

# Application
LOG_LEVEL=INFO
WORKER_TIMEOUT=600
MAX_FILE_SIZE=104857600
ALLOWED_ORIGINS=https://fairpact.pl,https://www.fairpact.pl
ENVIRONMENT=production
NEXT_PUBLIC_API_URL=https://fairpact.pl

# Grafana
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=STRONG_PASSWORD
```

**⚠️ WAŻNE**: Zamień wartości placeholderów na prawdziwe wartości z pliku `.env.production` na serwerze OVH!

### Krok 5: Deploy

1. Kliknij **Deploy**
2. Coolify pobierze obrazy z GHCR i uruchomi kontenery na OVH
3. Sprawdź logi w zakładce **Logs**

## 🔧 Dodatkowa konfiguracja

### SSL/TLS (Caddy/Nginx)

Coolify może zarządzać SSL automatycznie, ale obecnie masz ręczną konfigurację Caddy. Opcje:

#### Opcja A: Zachowaj obecną konfigurację Caddy
- Nie zmieniaj nic - Caddy działa jako reverse proxy
- Kontenery nasłuchują na localhost (127.0.0.1)
- Caddy obsługuje SSL

#### Opcja B: Pozwól Coolify zarządzać SSL
- Zmień ports w docker-compose na `3000:3000` (bez 127.0.0.1)
- Coolify automatycznie skonfiguruje Let's Encrypt
- Możesz wyłączyć Caddy na OVH lub zmienić porty

### Monitoring

Coolify ma wbudowane monitoring (Netdata/Prometheus), ale FairPact ma własne Grafana + Prometheus:

- Grafana: http://localhost:3001 (na OVH) → https://grafana.fairpact.pl (przez Caddy)
- Prometheus: http://localhost:9090 (na OVH)

## 🔄 Workflow deploymentu

### Przy zmianach w kodzie:

1. **GitHub Actions automatycznie**:
   - Buduje obrazy Docker
   - Pushuje do GHCR (`ghcr.io/uzzysan/fairpact-*:latest`)

2. **Ręcznie w Coolify** (lub webhook):
   - Przejdź do projektu FairPact
   - Kliknij **Redeploy** lub **Pull Latest Images**
   - Coolify pobierze nowe obrazy z GHCR

### Automatyczny redeploy (opcjonalnie):

W Coolify możesz skonfigurować webhook URL - GitHub Actions może go wywołać po pushu obrazów.

## 📝 Różnice między docker-compose.prod.yml a coolify-compose.yml

| Aspekt | docker-compose.prod.yml | coolify-compose.yml |
|--------|------------------------|---------------------|
| **Obrazy** | Buduje lokalnie z Dockerfile | Używa gotowych z GHCR |
| **Zarządzanie** | Ręczne (docker compose) | Przez panel Coolify |
| **Zmienne** | Z pliku `.env.production` | Z Secrets w Coolify |
| **Monitoring** | Dostępny przez SSH | Dostępny przez Coolify |

## 🚨 Ważne uwagi

1. **Bazy danych** nadal działają jako osobne kontenery na OVH (postgres, redis, minio) - Coolify nie zarządza nimi
2. **Huggingface cache** (`/app/.cache/huggingface`) jest utrwalany w wolumenie
3. **Worker** ma przydzielone 6GB RAM i 5 CPU - upewnij się, że serwer OVH ma wystarczające zasoby
4. **Autoscale** workerów: 3-10 procesów (konfigurowalne)

## 🐛 Troubleshooting

### Problem: "Server is not reachable"
- Sprawdź czy klucz prywatny jest poprawnie wklejony
- Sprawdź czy port 22 jest otwarty na OVH: `ssh -p 22 ubuntu@147.135.211.101`
- Upewnij się, że klucz publiczny jest w `~/.ssh/authorized_keys`

### Problem: Kontenery się nie uruchamiają
- Sprawdź logi w Coolify (zakładka Logs)
- Sprawdź czy wszystkie zmienne środowiskowe są ustawione w Secrets
- Upewnij się, że bazy danych na OVH są uruchomione: `ssh ubuntu@147.135.211.101 "docker ps | grep postgres"`

### Problem: "Image not found"
- Upewnij się, że obrazy są publiczne w GHCR: https://github.com/uzzysan?tab=packages
- Jeśli obrazy są private, musisz skonfigurować GHCR credentials w Coolify

## 📞 Wsparcie

W razie problemów:
1. Sprawdź dokumentację Coolify: https://coolify.io/docs/
2. Community: https://coolify.io/discord
3. Logi: `ssh ubuntu@147.135.211.101 "docker logs fairpact-backend"`
