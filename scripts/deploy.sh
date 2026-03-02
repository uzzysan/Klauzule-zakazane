#!/bin/bash

# FairPact Deployment Script
# Usage: ./deploy.sh [branch]

set -e

APP_DIR="/opt/fairpact"
BRANCH=${1:-master}
LOG_FILE="/var/log/fairpact/deploy.log"

echo "Starting deployment at $(date)..." | tee -a "$LOG_FILE"

# Navigate to application directory
cd "$APP_DIR"

# Ensure .env file exists (copy from .env.production if needed)
if [ ! -f .env ]; then
    if [ -f .env.production ]; then
        echo "Creating .env from .env.production..." | tee -a "$LOG_FILE"
        cp .env.production .env
    else
        echo "ERROR: No .env or .env.production file found!" | tee -a "$LOG_FILE"
        exit 1
    fi
fi

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
if docker compose -f docker-compose.prod.yml exec -T backend-1 python -m database.seed_clauses; then
    echo "Database seeded successfully." | tee -a "$LOG_FILE"
else
    echo "WARNING: Database seeding failed (might already be seeded)." | tee -a "$LOG_FILE"
fi

# Check health (hitting backend via localhost since it's exposed to host)
echo "Checking system health..." | tee -a "$LOG_FILE"
for i in {1..10}; do
    if curl -f http://localhost:8000/health/live > /dev/null 2>&1; then
        echo "Backend is healthy." | tee -a "$LOG_FILE"
        break
    fi
    if [ $i -eq 10 ]; then
        echo "WARNING: Backend health check failed after 10 attempts!" | tee -a "$LOG_FILE"
    fi
    sleep 2
done

# Check frontend is accessible
echo "Checking frontend accessibility..." | tee -a "$LOG_FILE"
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "Frontend is accessible." | tee -a "$LOG_FILE"
else
    echo "WARNING: Frontend accessibility check failed!" | tee -a "$LOG_FILE"
fi

# Reload host nginx to ensure it's using latest configuration
echo "Reloading host nginx..." | tee -a "$LOG_FILE"
if sudo systemctl reload nginx 2>/dev/null || sudo nginx -s reload 2>/dev/null; then
    echo "Host nginx reloaded successfully." | tee -a "$LOG_FILE"
else
    echo "WARNING: Could not reload host nginx (might not be running on host yet)." | tee -a "$LOG_FILE"
fi

# Show status
echo "Deployment complete. Current status:" | tee -a "$LOG_FILE"
docker compose -f docker-compose.prod.yml ps

echo "Done at $(date)." | tee -a "$LOG_FILE"
