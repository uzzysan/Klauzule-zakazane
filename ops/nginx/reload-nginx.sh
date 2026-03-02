#!/bin/bash
# Reload nginx on host (not in Docker anymore)
# nginx now runs as a system service

# Test configuration first
if sudo nginx -t; then
    echo "Configuration valid, reloading nginx..."
    sudo systemctl reload nginx || sudo nginx -s reload
    echo "Nginx reloaded successfully"
else
    echo "ERROR: Nginx configuration test failed!"
    exit 1
fi
