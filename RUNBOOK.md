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

## 5. Monitoring

### Access Dashboards
- **Grafana**: http://localhost:3001 (production: https://grafana.fairpact.pl)
  - Username: `admin`
  - Password: From `GRAFANA_PASSWORD` env variable
- **Prometheus**: http://localhost:9090
- **Metrics endpoint**: http://localhost:8000/metrics

### Key Metrics to Monitor
1. **Traffic Overview Dashboard** - Request rate, response times, error rates
2. **System Health Dashboard** - CPU, Memory, Disk usage
3. **Business Metrics Dashboard** - Uploads, active users, analysis times

### When to Scale Server

#### IMMEDIATE ACTION Required (Critical)
- CPU > 95% for >5 minutes → Restart services or scale NOW
- Memory > 95% for >2 minutes → Risk of OOM, scale immediately
- Error rate > 10% → Check logs, may need rollback
- API Down alert → Restart backend containers

#### PLAN TO SCALE (Warning)
Scale server when **3 or more** of these conditions persist for >1 hour:
- CPU > 70% average
- Memory > 80% average
- Response Time P95 > 1.5s
- Request rate > 800/min consistently
- Disk > 90% full

**Scaling Options:**
- Current: Hetzner CX41 (4 vCPU, 16GB) - €12.90/m → ~500 users
- Scale-up 1: Hetzner CX51 (8 vCPU, 32GB) - €26.90/m → ~2000 users
- Scale-up 2: Hetzner CCX33 (8 dedicated vCPU, 32GB) - €69.90/m → 5000+ users

### Alert Responses

#### HighRequestRate (>1000 req/min)
1. Check if traffic is legitimate (not DDoS)
2. Review System Health dashboard for resource usage
3. If sustained, plan server scaling

#### HighResponseTime (P95 > 2s)
1. Check backend logs for slow queries
2. Review Analysis Duration in Business Metrics
3. Consider adding Celery workers if analysis is slow
4. Check database performance

#### HighErrorRate (>5% 5xx errors)
1. **URGENT**: Check backend logs immediately
   ```bash
   docker logs fairpact-backend --tail 100
   ```
2. Check for recent deployments - may need rollback
3. Verify database and Redis connectivity
4. Check Sentry for detailed error traces

#### HighCPUUsage / HighMemoryUsage
1. Check which processes are consuming resources
2. Review Traffic dashboard for unusual patterns
3. **Plan scaling** if this is new baseline
4. Consider optimizations before scaling:
   - Add caching (Redis)
   - Optimize database queries
   - Review code for performance issues

### Quick Health Check Commands
```bash
# Check all services status
docker compose -f docker-compose.prod.yml ps

# Check CPU and memory usage
docker stats --no-stream

# Test backend metrics endpoint
curl http://localhost:8000/metrics | head -20

# Check Prometheus targets
curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health}'

# View active alerts
curl http://localhost:9090/api/v1/alerts | jq '.data.alerts[] | {alert: .labels.alertname, state: .state}'
```

### Monitoring Troubleshooting

**Prometheus not collecting metrics:**
1. Check if backend exposes /metrics: `curl http://backend-1:8000/metrics`
2. Check Prometheus targets: http://localhost:9090/targets
3. Check Prometheus logs: `docker logs fairpact-prometheus`

**Grafana shows no data:**
1. Verify Prometheus datasource: Grafana → Settings → Data Sources
2. Test connection should show "Data source is working"
3. Check if Prometheus has data: http://localhost:9090/graph

**For detailed monitoring documentation, see `MONITORING.md`**
