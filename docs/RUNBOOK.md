# FairPact Operations Runbook

## Service Management
All services are containerized and managed via Docker Compose.

### Checking Status
```bash
cd /opt/fairpact
docker compose -f docker-compose.prod.yml ps
```
All services should be `Up` or `healthy`.

### Restarting Services
To restart all services:
```bash
cd /opt/fairpact
docker compose -f docker-compose.prod.yml restart
```

To restart a specific service (e.g., backend):
```bash
docker compose -f docker-compose.prod.yml restart backend-1
```

### Viewing Logs
Use the helper script:
```bash
/opt/fairpact/scripts/view-logs.sh [service_name] [lines]
# Example: /opt/fairpact/scripts/view-logs.sh backend-1 100
```
Or native docker:
```bash
docker compose -f docker-compose.prod.yml logs -f --tail=100 [service_name]
```

## Backup & Restoration

### Triggering Manual Backup
```bash
/opt/fairpact/scripts/backup.sh
```
Backups are stored in `/backups/fairpact/`.

### Restoring Database
1. Stop the application: `docker compose ... stop backend-1 worker`
2. Extract backup:
   ```bash
   cd /backups/fairpact
   tar -xzf 20240101_120000.tar.gz
   ```
3. Restore Postgres:
   ```bash
   cat 20240101_120000/db_backup.sql | docker exec -i fairpact-postgres psql -U fairpact -d fairpact
   ```
4. Start application: `docker compose ... start`

## Deployment Updates
To deploy the latest code from GitHub:
```bash
sudo -u deploy /opt/fairpact/scripts/deploy.sh
```

## Troubleshooting

### "Backend Unhealthy"
1. Check logs: `docker logs fairpact-backend-1`
2. Check DB connection: `docker logs fairpact-postgres`
3. Verify resource usage: `docker stats`

### "Nginx 502 Bad Gateway"
1. Backend is likely down. Check backend container status.
2. Check Nginx logs: `docker logs fairpact-nginx`

### "Disk Space Full"
1. Check usage: `df -h`
2. Prune Docker objects: `docker system prune -a` (CAUTION)
3. Clear old logs: `journalctl --vacuum-time=1d`
