#!/bin/bash

# FairPact Deployment Script
# Usage: ./deploy.sh [branch]

set -e

APP_DIR="/opt/fairpact"
BRANCH=${1:-main}
LOG_FILE="/var/log/fairpact/deploy.log"

echo "Starting deployment at $(date)..." | tee -a "$LOG_FILE"

# Navigate to application directory
cd "$APP_DIR"

# Pull latest code
echo "Pulling latest code from $BRANCH..." | tee -a "$LOG_FILE"
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

# Build images
echo "Building Docker images..." | tee -a "$LOG_FILE"
docker compose -f docker-compose.prod.yml build

# Stop existing containers
echo "Stopping existing containers..." | tee -a "$LOG_FILE"
docker compose -f docker-compose.prod.yml down --remove-orphans

# Start services
echo "Starting services..." | tee -a "$LOG_FILE"
docker compose -f docker-compose.prod.yml up -d

# Wait for services to start
echo "Waiting for services to initialize..." | tee -a "$LOG_FILE"
sleep 15

# Run Migrations
echo "Running database migrations..." | tee -a "$LOG_FILE"
if docker compose -f docker-compose.prod.yml exec -T backend-1 alembic upgrade head; then
    echo "Migrations applied successfully." | tee -a "$LOG_FILE"
else
    echo "ERROR: Migrations failed!" | tee -a "$LOG_FILE"
    exit 1
fi

# Seed Database
echo "Seeding initial data..." | tee -a "$LOG_FILE"
if docker compose -f docker-compose.prod.yml exec -T backend-1 python database/seed_clauses.py; then
    echo "Database seeded successfully." | tee -a "$LOG_FILE"
else
    echo "WARNING: Database seeding failed (might already be seeded)." | tee -a "$LOG_FILE"
    # Don't fail the deploy for seeding issues as it might be idempotent failure
fi

# Check health (hitting backend inside container to verify it's up)
echo "Checking system health..." | tee -a "$LOG_FILE"
if docker compose -f docker-compose.prod.yml exec -T backend-1 curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "Backend is healthy." | tee -a "$LOG_FILE"
else
    echo "WARNING: Backend health check failed!" | tee -a "$LOG_FILE"
    # We might want to exit 1 here if critical
fi

# Show status
echo "Deployment complete. Current status:" | tee -a "$LOG_FILE"
docker compose -f docker-compose.prod.yml ps

echo "Done at $(date)." | tee -a "$LOG_FILE"
