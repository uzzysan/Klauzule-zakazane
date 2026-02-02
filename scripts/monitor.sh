#!/bin/bash

# FairPact Monitoring Dashboard
# Usage: ./monitor.sh

APP_DIR="/opt/fairpact"
LOG_DIR="/var/log/fairpact"

echo "========================================================"
echo "FairPact System Status - $(date)"
echo "========================================================"
echo ""

echo "[Docker Containers]"
docker compose -f "$APP_DIR/docker-compose.prod.yml" ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo "[Resource Usage]"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
echo ""

echo "[Disk Usage]"
df -h | grep -E "Filesystem|/dev/root|/var/lib/docker"
echo ""

echo "[Memory Usage]"
free -h
echo ""

echo "[System Load]"
uptime
echo ""

echo "[Health Check]"
curl -s --max-time 2 http://localhost:8000/health && echo " - OK" || echo " - ERROR"
echo ""

echo "[Recent Errors (Last 10 lines)]"
echo "--- Backend ---"
docker logs --tail 10 fairpact-backend 2>&1 | grep -iE "error|exception|critical" || echo "No recent errors found."
echo "--- Nginx ---"
docker logs --tail 10 fairpact-nginx 2>&1 | grep -iE "error|warn" || echo "No recent errors found."

echo ""
echo "========================================================"
