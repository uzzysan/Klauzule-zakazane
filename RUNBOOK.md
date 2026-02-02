# FairPact Operational Runbook

## 1. Service Management
All services are managed via Docker Compose.

### Check Status
```bash
cd /opt/fairpact
docker compose -f docker-compose.prod.yml ps
./scripts/monitor.sh
```

### Restart Services
```bash
# Restart all
./scripts/deploy.sh

# Restart specific service
docker compose -f docker-compose.prod.yml restart backend-1
docker compose -f docker-compose.prod.yml restart nginx
```

### View Logs
```bash
# Backend logs
./scripts/view-logs.sh backend

# Nginx logs
./scripts/view-logs.sh nginx
```

## 2. Updates & Deployment
To deploy a new version:
```bash
cd /opt/fairpact
./scripts/deploy.sh [branch_name]
```
Default branch is `main`.

## 3. Backups & Restoration

### Manual Backup
```bash
./scripts/backup.sh
```
Backups are stored in `/backups/fairpact/YYYYMMDD_HHMMSS.tar.gz`.

### Restore Database
1. Extract backup: `tar -xzf BACKUP_FILE.tar.gz`
2. Copy SQL to container: `docker cp db_backup.sql fairpact-postgres:/tmp/`
3. Restore:
```bash
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d fairpact -f /tmp/db_backup.sql
```

## 4. Troubleshooting

### "502 Bad Gateway"
- Check if backend is running: `docker ps`
- Check backend logs: `./scripts/view-logs.sh backend`
- Check Nginx logs: `./scripts/view-logs.sh nginx`

### "Database Connection Failed"
- Check Postgres status: `docker compose -f docker-compose.prod.yml ps postgres`
- Check logs: `./scripts/view-logs.sh postgres`

### Disk Space Issues
- Check usage: `df -h`
- Clean old docker objects: `docker system prune -a` (CAUTION: Removes unused images)
