#!/bin/bash

# Disk Space Alert Script
# Usage: ./check-disk.sh

THRESHOLD=80
LOG_FILE="/var/log/fairpact/system-alerts.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Check root filesystem
USAGE=$(df / | grep / | awk '{ print $5 }' | sed 's/%//g')

if [ "$USAGE" -gt "$THRESHOLD" ]; then
    MESSAGE="$DATE - WARNING: Disk usage is at ${USAGE}% (Threshold: ${THRESHOLD}%)"
    echo "$MESSAGE" >> "$LOG_FILE"
    
    # Optional: Send email or webhook
    # echo "$MESSAGE" | mail -s "Disk Space Alert - FairPact" admin@example.com
else
    # Only log if specifically debugging, otherwise keep quiet
    # echo "$DATE - OK: Disk usage is at ${USAGE}%" >> "$LOG_FILE"
    :
fi
