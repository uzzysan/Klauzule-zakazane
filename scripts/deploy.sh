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

# Ensure maculewicz.pro placeholder exists
if [ ! -f /var/www/maculewicz.pro/index.html ]; then
    echo "Creating maculewicz.pro placeholder..." | tee -a "$LOG_FILE"
    sudo mkdir -p /var/www/maculewicz.pro
    sudo tee /var/www/maculewicz.pro/index.html > /dev/null << 'HTMLEOF'
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Maculewicz.pro - Strona w budowie</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .container { text-align: center; max-width: 600px; }
        h1 { font-size: 3rem; margin-bottom: 1rem; font-weight: 700; }
        p { font-size: 1.25rem; margin-bottom: 2rem; opacity: 0.9; }
        .icon { font-size: 5rem; margin-bottom: 2rem; }
        .links { margin-top: 3rem; }
        .links a { display: inline-block; margin: 0.5rem; padding: 0.75rem 1.5rem; background: rgba(255, 255, 255, 0.2); color: #fff; text-decoration: none; border-radius: 8px; transition: all 0.3s ease; backdrop-filter: blur(10px); }
        .links a:hover { background: rgba(255, 255, 255, 0.3); transform: translateY(-2px); }
        @media (max-width: 768px) { h1 { font-size: 2rem; } p { font-size: 1rem; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">🚧</div>
        <h1>Strona w budowie</h1>
        <p>Pracujemy nad czymś wyjątkowym. Wróć wkrótce!</p>
        <div class="links">
            <a href="https://ev-assist.maculewicz.pro">EV Assist</a>
            <a href="https://fairpact.pl">FairPact</a>
        </div>
    </div>
</body>
</html>
HTMLEOF
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
    # Don't fail the deploy for seeding issues as it might be idempotent failure
fi

# Check health (hitting backend inside container to verify it's up)
echo "Checking system health..." | tee -a "$LOG_FILE"
if docker compose -f docker-compose.prod.yml exec -T backend-1 curl -f http://localhost:8000/health/live > /dev/null 2>&1; then
    echo "Backend is healthy." | tee -a "$LOG_FILE"
else
    echo "WARNING: Backend health check failed!" | tee -a "$LOG_FILE"
    # We might want to exit 1 here if critical
fi

# Show status
echo "Deployment complete. Current status:" | tee -a "$LOG_FILE"
docker compose -f docker-compose.prod.yml ps

echo "Done at $(date)." | tee -a "$LOG_FILE"
