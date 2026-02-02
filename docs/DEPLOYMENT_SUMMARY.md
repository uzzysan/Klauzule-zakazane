# Deployment Summary

**Project**: FairPact (Consumer Contract Analysis)
**Domain**: fairpact.pl
**Server IP**: 147.135.211.101

## Architecture
- **Host**: OVH VPS (12GB RAM, Ubuntu 24.04/22.04)
- **Reverse Proxy**: Nginx (Docker) with Let's Encrypt SSL
- **Frontend**: Next.js (Standalone Docker)
- **Backend**: FastAPI (Docker)
- **Database**: PostgreSQL 16 (Docker)
- **Cache/Broker**: Redis (Docker)
- **Storage**: MinIO (Docker) - Local S3 compatible

## Directory Structure
- `/opt/fairpact`: Application code and docker-compose
- `/var/log/fairpact`: Application and deployment logs
- `/backups/fairpact`: Daily backups
- `/etc/letsencrypt`: SSL Certificates

## Key Users
- **deploy**: Main operational user. Runs docker, owns files.
- **root**: System admistration only.

## Network
- **Port 22 (SSH)**: Limited to key-based auth. Fail2Ban protected.
- **Port 80 (HTTP)**: Redirects to 443.
- **Port 443 (HTTPS)**: Main application traffic.
