# FairPact - Dokumentacja Infrastruktury

## Architektura Systemu

### Serwery

| Serwer | IP | Rola | Zasoby |
|--------|-----|------|--------|
| **OVH** | 147.135.211.101 | Główny (FairPact + Bazy) | 6 vCPU, 12GB RAM |
| **Coolify** | 5.189.139.149 | Panel zarządzania + n8n | 4 vCPU, 8GB RAM |
| **Contabo** | 173.249.37.239 | n8n workflows | 4 vCPU, 8GB RAM |

### Komunikacja Między Serwerami

- **SSH**: Bezpośrednie połączenie przez publiczne IP
- **VPN**: ❌ WireGuard wyłączony (powodował problemy z routingiem)
- **Bazy danych**: Lokalne na OVH (postgres, redis, minio)

---

## Architektura FairPact (OVH)

### Kontenery Docker

```
┌─────────────────────────────────────────────────────────────┐
│                         OVH VPS                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  Frontend    │  │   Backend    │  │  Celery Worker   │   │
│  │   (Next.js)  │  │   (FastAPI)  │  │   (Python/ML)    │   │
│  │   :3000      │  │    :8000     │  │   Autoscale 3-10 │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  Celery Beat │  │  Prometheus  │  │     Grafana      │   │
│  │  (Scheduler) │  │  (Metrics)   │  │   (Dashboard)    │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  PostgreSQL  │  │    Redis     │  │     MinIO        │   │
│  │  (pgvector)  │  │   (Queue)    │  │  (Object Store)  │   │
│  │   :5432      │  │    :6379     │  │     :9000        │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Zasoby Przydzielone

| Usługa | CPU | RAM | Uwagi |
|--------|-----|-----|-------|
| Frontend | 0.5 | 512 MB | Statyczny export |
| Backend | 1.5 | 2 GB | 2 repliki w nginx |
| Worker | 5.0 | 6 GB | Autoscale 3-10 procesów |
| Beat | 0.25 | 512 MB | Scheduler |
| Prometheus | 0.5 | 1 GB | Metryki |
| Grafana | 0.25 | 512 MB | Dashboard |
| PostgreSQL | - | - | Hostowany lokalnie |
| Redis | - | - | Hostowany lokalnie |
| MinIO | - | - | Hostowany lokalnie |

---

## Konfiguracja Worker (Celery)

### Autoscaling
```bash
celery -A celery_app worker --autoscale=10,3 -Q celery,documents,sync
```

- **Minimum**: 3 procesy (małe obciążenie)
- **Maksimum**: 10 procesów (dużo zadań)
- **Kolejki**: `celery`, `documents`, `sync`

### Dlaczego nie więcej CPU?
- Serwer ma 6 rdzeni - zostawiamy 1 dla systemu
- 6GB RAM na workera - więcej może spowodować OOM

### Czas Analizy Dokumentu
- **Obecnie**: ~5 minut (322s) dla dużych dokumentów
- **Przyczyna**: Brak GPU - embeddings obliczane na CPU
- **Opcje poprawy**: Dodanie GPU do OVH (kosztowne) lub akceptacja obecnej wydajności

---

## Sieć i Bezpieczeństwo

### Firewall (UFW + Fail2ban)

#### Otwarte Porty
- 22/tcp - SSH
- 80/tcp - HTTP (Caddy)
- 443/tcp - HTTPS (Caddy)

#### Whitelist Fail2ban
```
ignoreip = 127.0.0.1/8 147.135.211.101 5.189.139.149 173.249.37.239
```

### Reverse Proxy (Caddy)

```
fairpact.pl → 127.0.0.1:3000 (Frontend)
api.fairpact.pl → 127.0.0.1:8000 (Backend)
grafana.fairpact.pl → 127.0.0.1:3001 (Grafana)
```

---

## Coolify Integration

### Status
- ✅ Klucz SSH dodany do OVH
- ✅ IP Coolify w whiteliście fail2ban
- ✅ WireGuard wyłączony
- ⏳ Dodanie serwera w panelu Coolify

### Deployment
- Obrazy Docker budowane przez GitHub Actions
- Push do GHCR (GitHub Container Registry)
- Coolify pobiera i uruchamia kontenery na OVH

Szczegóły w [COOLIFY_SETUP.md](./COOLIFY_SETUP.md)

---

## Zmiany w Infrastrukturze

### 2026-03-23 - Migracja baz danych
- Przeniesiono PostgreSQL, Redis, MinIO z Coolify do OVH
- Eliminacja 27ms latencji VPN (WireGuard)
- Poprawa stabilności pollingu

### 2026-03-23 - Wyłączenie WireGuard
- Usunięto VPN między serwerami
- Bezpośrednia komunikacja przez publiczne IP
- Uproszczenie konfiguracji sieciowej

### 2026-03-23 - Optymalizacja Workera
- Zwiększenie RAM z 4GB do 6GB
- Zwiększenie CPU z 4 do 5
- Dodanie autoscalingu (3-10 procesów)

---

## Troubleshooting

### Problem z połączeniem SSH między serwerami
1. Sprawdź czy IP nie jest zbanowane: `sudo fail2ban-client status sshd`
2. Sprawdź firewall: `sudo ufw status`
3. Sprawdź iptables: `sudo iptables -L INPUT -n`

### Problem z worker (timeout analizy)
1. Sprawdź logi: `docker logs fairpact-worker`
2. Sprawdź zasoby: `docker stats`
3. Zwiększ timeout w aplikacji (WORKER_TIMEOUT)

### Problem z Coolify
1. Sprawdź czy IP Coolify jest w whiteliście fail2ban
2. Sprawdź czy klucz SSH jest dodany do authorized_keys
3. Sprawdź logi SSH: `sudo tail -f /var/log/auth.log`
