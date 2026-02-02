#!/bin/bash

# FairPact Backup Script
# Usage: ./backup.sh

set -e

BACKUP_ROOT="/backups/fairpact"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_ROOT/$DATE"
APP_DIR="/opt/fairpact"
LOG_FILE="/var/log/fairpact/backup.log"

mkdir -p "$BACKUP_DIR"
echo "Starting backup at $(date)..." >> "$LOG_FILE"

# Database Backup
echo "Backing up database..." >> "$LOG_FILE"
docker compose -f "$APP_DIR/docker-compose.prod.yml" exec -T postgres pg_dump -U postgres fairpact > "$BACKUP_DIR/db_backup.sql"

# Config Backup
echo "Backing up configuration..." >> "$LOG_FILE"
cp "$APP_DIR/.env.production" "$BACKUP_DIR/"
cp "$APP_DIR/docker-compose.prod.yml" "$BACKUP_DIR/"
cp "$APP_DIR/nginx/nginx.conf" "$BACKUP_DIR/"

# Load Env Vars for MinIO
if [ -f "$APP_DIR/.env.production" ]; then
    export $(grep -v '^#' "$APP_DIR/.env.production" | xargs)
fi

# MinIO Backup
echo "Backing up MinIO data..." >> "$LOG_FILE"
# We use a temporary container to export the bucket data
# Note: This assumes fairpact-network matches what's in docker-compose
docker run --rm \
    --network fairpact-network \
    -v "$BACKUP_DIR/minio_backup:/backup" \
    --entrypoint sh \
    minio/mc -c "
      mc alias set myminio http://fairpact-minio:9000 $MINIO_ACCESS_KEY $MINIO_SECRET_KEY && \
      mc mirror myminio/$MINIO_BUCKET_NAME /backup \
    " >> "$LOG_FILE" 2>&1 || echo "WARNING: MinIO backup failed" >> "$LOG_FILE"

# Compress
echo "Compressing backup..." >> "$LOG_FILE"
cd "$BACKUP_ROOT"
tar -czf "$DATE.tar.gz" "$DATE"
rm -rf "$DATE"

# Cleanup old backups (keep last 3 days - assuming daily backups)
echo "Cleaning up old backups..." >> "$LOG_FILE"
find "$BACKUP_ROOT" -name "*.tar.gz" -mtime +3 -delete

echo "Backup complete: $BACKUP_ROOT/$DATE.tar.gz" >> "$LOG_FILE"
