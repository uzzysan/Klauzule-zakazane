#!/bin/bash

# FairPact Log Viewer
# Usage: ./view-logs.sh [service_name] [lines]

SERVICE=${1:-backend-1}
LINES=${2:-100}

APP_DIR="/opt/fairpact"

# Map common aliases to service names
case "$SERVICE" in
    "backend"|"api") SERVICE="backend-1" ;;
    "frontend"|"web") SERVICE="frontend" ;;
    "db"|"postgres") SERVICE="postgres" ;;
    "worker"|"celery") SERVICE="celery-worker-1" ;;
    "beat") SERVICE="celery-beat" ;;
    "proxy") SERVICE="nginx" ;;
esac

echo "Viewing last $LINES lines for $SERVICE..."
docker compose -f "$APP_DIR/docker-compose.prod.yml" logs --tail "$LINES" -f "$SERVICE"
