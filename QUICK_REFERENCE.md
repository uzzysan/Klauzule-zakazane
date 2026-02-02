# Quick Reference Guide

## Locations
- **App Directory**: `/opt/fairpact`
- **Logs**: `/var/log/fairpact`
- **Backups**: `/backups/fairpact`
- **SSL Certs**: `/etc/letsencrypt/live/fairpact.pl/`

## Common Commands

| Action | Command |
|--------|---------|
| **Deploy** | `./scripts/deploy.sh` |
| **Backup** | `./scripts/backup.sh` |
| **Monitor** | `./scripts/monitor.sh` |
| **Logs** | `./scripts/view-logs.sh [service]` |
| **Restart App** | `docker compose -f docker-compose.prod.yml restart` |
| **Restart Nginx** | `docker compose -f docker-compose.prod.yml restart nginx` |
| **Shell Access** | `docker compose -f docker-compose.prod.yml exec backend-1 /bin/bash` |
| **DB Access** | `docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d fairpact` |

## Emergency
- **Stop All**: `docker compose -f docker-compose.prod.yml down`
- **Force Stop**: `docker kill $(docker ps -q)`
