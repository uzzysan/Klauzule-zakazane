#!/bin/bash

# FairPact Auto-Deploy Script (for cron)
# Only deploys if there are new commits on remote that we don't have locally

APP_DIR="/opt/fairpact"
BRANCH="master"
LOG_FILE="/var/log/fairpact/auto-deploy.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

cd "$APP_DIR"

# Fetch latest changes from remote
git fetch origin "$BRANCH" 2>/dev/null

# Check if remote has commits that local doesn't have
# (commits reachable from origin/master but not from HEAD)
NEW_COMMITS=$(git rev-list HEAD..origin/"$BRANCH" --count)

if [ "$NEW_COMMITS" -eq 0 ]; then
    LOCAL_HASH=$(git rev-parse --short HEAD)
    log "No new commits on remote. Local at: $LOCAL_HASH. Skipping deployment."
    exit 0
fi

LOCAL_HASH=$(git rev-parse --short HEAD)
REMOTE_HASH=$(git rev-parse --short origin/"$BRANCH")
log "Found $NEW_COMMITS new commit(s) on remote! Local: $LOCAL_HASH -> Remote: $REMOTE_HASH"
log "Starting deployment..."

# Run the full deployment script
if /opt/fairpact/scripts/deploy.sh "$BRANCH"; then
    log "Deployment completed successfully."
else
    log "ERROR: Deployment failed!"
    exit 1
fi
