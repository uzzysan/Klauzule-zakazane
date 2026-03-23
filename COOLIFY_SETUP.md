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
   - **Private Key**: Wklej poniższy klucz prywatny (WAŻNE: skopiuj dokładnie wszystko wraz z nagłówkami `-----BEGIN` i `-----END`):

```
-----BEGIN RSA PRIVATE KEY-----
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
-----END RSA PRIVATE KEY-----
```

4. Kliknij **Check Connection** - powinno pokazać "Server is reachable"
5. Zapisz serwer

**⚠️ WAŻNE**: Jeśli Coolify nadal pokazuje błąd, upewnij się że:
- Skopiowałeś CAŁY klucz wraz z liniami `-----BEGIN RSA PRIVATE KEY-----` i `-----END RSA PRIVATE KEY-----`
- Nie ma żadnych dodatkowych spacji na początku lub końcu linii
- Klucz jest w formacie RSA (jak powyżej), nie OpenSSH

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
