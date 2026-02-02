#!/bin/bash

# Simple Health Check Script

URL="https://fairpact.pl/health/live"
LOG_FILE="/var/log/fairpact/health.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL")

if [ "$STATUS" -eq 200 ]; then
    echo "$DATE - OK - Status $STATUS" >> "$LOG_FILE"
    exit 0
else
    echo "$DATE - ERROR - Status $STATUS" >> "$LOG_FILE"
    exit 1
fi
