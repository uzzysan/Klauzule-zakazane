#!/bin/bash
docker compose -f /opt/fairpact/docker-compose.prod.yml exec -T nginx nginx -s reload
