# FairPact - Deployment & Infrastructure Guide v1.0

## Document Information
- **Version:** 1.0
- **Last Updated:** 2025-12-08
- **Target Environment:** Production-ready infrastructure
- **Related Documents:** [Implementation Plan](./implementation_plan_v2.md), [Security Guide](./security_compliance.md)

---

## Table of Contents
1. [Infrastructure Overview](#1-infrastructure-overview)
2. [Docker Configuration](#2-docker-configuration)
3. [Database Setup](#3-database-setup)
4. [Backend Deployment](#4-backend-deployment)
5. [Frontend Deployment](#5-frontend-deployment)
6. [Monitoring & Logging](#6-monitoring--logging)
7. [Backup & Disaster Recovery](#7-backup--disaster-recovery)
8. [CI/CD Pipeline](#8-cicd-pipeline)
9. [Scaling Strategy](#9-scaling-strategy)
10. [Cost Optimization](#10-cost-optimization)

---

## 1. Infrastructure Overview

### 1.1 Architecture Diagram

```mermaid
graph TB
    subgraph "Edge/CDN"
        CF[Cloudflare CDN]
    end

    subgraph "Frontend"
        Vercel[Vercel Edge Network]
    end

    subgraph "Application Server (VPS)"
        LB[Nginx Load Balancer]
        API1[FastAPI Instance 1]
        API2[FastAPI Instance 2]
        Worker1[Celery Worker 1]
        Worker2[Celery Worker 2]
    end

    subgraph "Data Layer"
        PG[(PostgreSQL)]
        Redis[(Redis)]
        Minio[MinIO S3]
    end

    subgraph "Monitoring"
        Prometheus[Prometheus]
        Grafana[Grafana]
        Loki[Loki]
    end

    subgraph "External Services"
        Sentry[Sentry]
        Drive[Google Drive]
        Gemini[Gemini API]
    end

    CF --> Vercel
    Vercel --> LB
    LB --> API1
    LB --> API2
    API1 --> PG
    API2 --> PG
    API1 --> Redis
    API2 --> Redis
    API1 --> Minio
    API2 --> Minio
    Worker1 --> Redis
    Worker2 --> Redis
    Worker1 --> PG
    Worker2 --> PG
    API1 --> Drive
    API1 --> Gemini
    API1 --> Sentry

    Prometheus --> Grafana
    API1 --> Prometheus
    API2 --> Prometheus
    API1 --> Loki
    API2 --> Loki
```

### 1.2 Technology Stack Summary

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend Hosting** | Vercel | Next.js deployment, Edge functions |
| **CDN** | Cloudflare | DDoS protection, caching, SSL |
| **Application Server** | Hetzner VPS (CX41) | Backend API, workers |
| **Web Server** | Nginx | Reverse proxy, load balancing |
| **Database** | PostgreSQL 15 (Managed) | Supabase or self-hosted |
| **Cache/Queue** | Redis 7 | Session storage, Celery broker |
| **Object Storage** | MinIO | Document storage (S3-compatible) |
| **Monitoring** | Prometheus + Grafana | Metrics and dashboards |
| **Logging** | Loki | Centralized log aggregation |
| **Error Tracking** | Sentry | Error monitoring and alerts |

### 1.3 Resource Requirements

#### Minimum (MVP - 100 users)
- **VPS:** Hetzner CX41 (4 vCPU, 16GB RAM, 160GB SSD) - €12.90/month
- **Database:** Supabase Free Tier (500MB) - €0/month
- **Redis:** 512MB instance - €0-5/month
- **Storage:** 50GB MinIO - Included in VPS
- **Total:** ~€15-20/month

#### Recommended (Production - 1000 users)
- **VPS:** Hetzner CX51 (8 vCPU, 32GB RAM, 320GB SSD) - €26.90/month
- **Database:** Supabase Pro (8GB) - €25/month
- **Redis:** 2GB instance - €10/month
- **Storage:** 200GB dedicated - €5/month
- **Monitoring:** Grafana Cloud Free Tier - €0/month
- **Total:** ~€70/month

---

## 2. Docker Configuration

### 2.1 Docker Compose (Development)

```yaml
# docker-compose.yml
version: '3.8'

services:
  # PostgreSQL with pgvector
  postgres:
    image: pgvector/pgvector:pg15
    container_name: fairpact-db
    environment:
      POSTGRES_DB: fairpact
      POSTGRES_USER: fairpact
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/migrations:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U fairpact"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis
  redis:
    image: redis:7-alpine
    container_name: fairpact-redis
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # MinIO (S3-compatible storage)
  minio:
    image: minio/minio:latest
    container_name: fairpact-minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: fairpact-backend
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://fairpact:${POSTGRES_PASSWORD}@postgres:5432/fairpact
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379/0
      MINIO_ENDPOINT: minio:9000
      MINIO_ACCESS_KEY: ${MINIO_ACCESS_KEY}
      MINIO_SECRET_KEY: ${MINIO_SECRET_KEY}
    volumes:
      - ./backend:/app
      - uploaded_files:/app/uploads
    ports:
      - "8000:8000"
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload

  # Celery Worker
  celery-worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: fairpact-worker
    depends_on:
      - redis
      - postgres
    environment:
      DATABASE_URL: postgresql://fairpact:${POSTGRES_PASSWORD}@postgres:5432/fairpact
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379/0
    volumes:
      - ./backend:/app
      - uploaded_files:/app/uploads
    command: celery -A tasks worker --loglevel=info --concurrency=2

  # Frontend (Development)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    container_name: fairpact-frontend
    depends_on:
      - backend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    ports:
      - "3000:3000"
    command: npm run dev

volumes:
  postgres_data:
  redis_data:
  minio_data:
  uploaded_files:
```

### 2.2 Production Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    container_name: fairpact-nginx
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - static_files:/var/www/static
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend-1
      - backend-2
    restart: unless-stopped

  backend-1:
    image: fairpact-backend:${VERSION}
    container_name: fairpact-backend-1
    env_file:
      - .env.production
    volumes:
      - uploaded_files:/app/uploads
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G

  backend-2:
    image: fairpact-backend:${VERSION}
    container_name: fairpact-backend-2
    env_file:
      - .env.production
    volumes:
      - uploaded_files:/app/uploads
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G

  celery-worker-1:
    image: fairpact-backend:${VERSION}
    container_name: fairpact-worker-1
    env_file:
      - .env.production
    volumes:
      - uploaded_files:/app/uploads
    command: celery -A tasks worker --loglevel=info --concurrency=4
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G

  celery-worker-2:
    image: fairpact-backend:${VERSION}
    container_name: fairpact-worker-2
    env_file:
      - .env.production
    volumes:
      - uploaded_files:/app/uploads
    command: celery -A tasks worker --loglevel=info --concurrency=4
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G

  prometheus:
    image: prom/prometheus:latest
    container_name: fairpact-prometheus
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: fairpact-grafana
    depends_on:
      - prometheus
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
      GF_INSTALL_PLUGINS: grafana-piechart-panel
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources
    ports:
      - "3001:3000"
    restart: unless-stopped

  loki:
    image: grafana/loki:latest
    container_name: fairpact-loki
    volumes:
      - ./monitoring/loki-config.yml:/etc/loki/local-config.yaml
      - loki_data:/loki
    ports:
      - "3100:3100"
    command: -config.file=/etc/loki/local-config.yaml
    restart: unless-stopped

volumes:
  uploaded_files:
  static_files:
  prometheus_data:
  grafana_data:
  loki_data:
```

### 2.3 Backend Dockerfile (Production)

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim-bookworm AS builder

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    tesseract-ocr \
    tesseract-ocr-pol \
    tesseract-ocr-eng \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Runtime stage
FROM python:3.11-slim-bookworm

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-pol \
    tesseract-ocr-eng \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Set working directory
WORKDIR /app

# Copy application code
COPY --chown=appuser:appuser . .

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

---

## 3. Database Setup

### 3.1 PostgreSQL Configuration (Production)

```sql
-- postgresql.conf optimizations

# Memory
shared_buffers = 4GB                 # 25% of RAM
effective_cache_size = 12GB          # 75% of RAM
work_mem = 64MB
maintenance_work_mem = 1GB

# Connections
max_connections = 200

# WAL
wal_buffers = 16MB
checkpoint_completion_target = 0.9
max_wal_size = 4GB
min_wal_size = 1GB

# Query Planning
random_page_cost = 1.1               # For SSD
effective_io_concurrency = 200       # For SSD

# Logging
log_min_duration_statement = 1000    # Log slow queries (>1s)
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
```

### 3.2 Database Initialization Script

```bash
#!/bin/bash
# scripts/init_db.sh

set -e

echo "Creating database..."
createdb fairpact

echo "Enabling extensions..."
psql -d fairpact <<EOF
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
EOF

echo "Running migrations..."
cd backend
alembic upgrade head

echo "Seeding data..."
python scripts/seed_data.py

echo "Database initialized successfully!"
```

### 3.3 Backup Script

```bash
#!/bin/bash
# scripts/backup_db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgresql"
DB_NAME="fairpact"

mkdir -p $BACKUP_DIR

echo "Starting backup at $(date)"

# Full backup
pg_dump -Fc $DB_NAME > $BACKUP_DIR/fairpact_$DATE.dump

# Compress
gzip $BACKUP_DIR/fairpact_$DATE.dump

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/fairpact_$DATE.dump.gz s3://fairpact-backups/db/

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.dump.gz" -mtime +30 -delete

echo "Backup completed at $(date)"
```

---

## 4. Backend Deployment

### 4.1 Nginx Configuration

```nginx
# nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 2048;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 50M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=60r/m;
    limit_req_zone $binary_remote_addr zone=upload_limit:10m rate=10r/m;

    # Upstream backend
    upstream backend {
        least_conn;
        server backend-1:8000 max_fails=3 fail_timeout=30s;
        server backend-2:8000 max_fails=3 fail_timeout=30s;
    }

    # HTTP redirect to HTTPS
    server {
        listen 80;
        server_name api.fairpact.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name api.fairpact.com;

        # SSL certificates
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        # SSL configuration
        ssl_protocols TLSv1.3 TLSv1.2;
        ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
        ssl_prefer_server_ciphers on;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Security headers
        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # API endpoints
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;

            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 120s;
        }

        # Upload endpoint (larger timeout)
        location /api/v1/documents/upload {
            limit_req zone=upload_limit burst=5 nodelay;

            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

            # Extended timeouts for uploads
            proxy_connect_timeout 300s;
            proxy_send_timeout 300s;
            proxy_read_timeout 300s;

            client_max_body_size 50M;
        }

        # Health check
        location /health {
            access_log off;
            proxy_pass http://backend;
        }
    }
}
```

### 4.2 Systemd Service (Alternative to Docker)

```ini
# /etc/systemd/system/fairpact-backend.service
[Unit]
Description=FairPact Backend API
After=network.target postgresql.service redis.service

[Service]
Type=notify
User=fairpact
Group=fairpact
WorkingDirectory=/opt/fairpact/backend
Environment="PATH=/opt/fairpact/venv/bin"
EnvironmentFile=/opt/fairpact/.env.production
ExecStart=/opt/fairpact/venv/bin/uvicorn main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --workers 4 \
    --log-level info
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

---

## 5. Frontend Deployment

### 5.1 Vercel Configuration

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NEXT_PUBLIC_API_URL": "https://api.fairpact.com",
    "NEXTAUTH_URL": "https://fairpact.com",
    "NEXTAUTH_SECRET": "@nextauth-secret"
  },
  "regions": ["fra1", "iad1"],
  "functions": {
    "api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://api.fairpact.com/api/:path*"
    }
  ]
}
```

### 5.2 Next.js Configuration (Production)

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Image optimization
  images: {
    domains: ['lh3.googleusercontent.com', 'storage.fairpact.com'],
    formats: ['image/avif', 'image/webp'],
  },

  // Internationalization
  i18n: {
    locales: ['pl', 'en'],
    defaultLocale: 'pl',
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
    ];
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  },

  // Production source maps (for error tracking)
  productionBrowserSourceMaps: true,
};

module.exports = nextConfig;
```

---

## 6. Monitoring & Logging

### 6.1 Prometheus Configuration

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets: ['backend-1:8000', 'backend-2:8000']
    metrics_path: /metrics

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']
```

### 6.2 Grafana Dashboard (JSON)

```json
{
  "dashboard": {
    "title": "FairPact Overview",
    "panels": [
      {
        "title": "API Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Response Time (P95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, http_request_duration_seconds_bucket)"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])"
          }
        ]
      }
    ]
  }
}
```

### 6.3 Application Logging

```python
# backend/logging_config.py
import logging
from pythonjsonlogger import jsonlogger

def setup_logging():
    """Configure structured logging."""
    logger = logging.getLogger()

    handler = logging.StreamHandler()
    formatter = jsonlogger.JsonFormatter(
        fmt='%(asctime)s %(name)s %(levelname)s %(message)s',
        datefmt='%Y-%m-%dT%H:%M:%S'
    )
    handler.setFormatter(formatter)

    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

    return logger
```

---

## 7. Backup & Disaster Recovery

### 7.1 Backup Strategy

| Component | Frequency | Retention | Method |
|-----------|-----------|-----------|---------|
| Database | Daily | 30 days | pg_dump to S3 |
| User Files | Real-time | Until user deletion | Versioned S3 bucket |
| Configuration | On change | Git history | Git repository |
| Logs | Continuous | 90 days | Loki aggregation |

### 7.2 Automated Backup Script

```bash
#!/bin/bash
# scripts/backup_all.sh

set -e

BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_ROOT="/backups/$BACKUP_DATE"

mkdir -p "$BACKUP_ROOT"

echo "=== Starting full backup at $(date) ==="

# 1. Database backup
echo "Backing up database..."
pg_dump -Fc fairpact > "$BACKUP_ROOT/database.dump"

# 2. Redis backup
echo "Backing up Redis..."
redis-cli --rdb "$BACKUP_ROOT/redis.rdb"

# 3. Configuration backup
echo "Backing up configuration..."
tar -czf "$BACKUP_ROOT/config.tar.gz" \
    /opt/fairpact/.env.production \
    /opt/fairpact/docker-compose.prod.yml \
    /opt/fairpact/nginx/

# 4. User files metadata
echo "Backing up file metadata..."
aws s3 sync s3://fairpact-uploads "$BACKUP_ROOT/uploads-metadata" \
    --exclude "*" --include "*.json"

# 5. Upload to offsite storage
echo "Uploading to S3..."
tar -czf - "$BACKUP_ROOT" | \
    aws s3 cp - "s3://fairpact-backups/full_backup_$BACKUP_DATE.tar.gz"

# 6. Cleanup old local backups
find /backups -name "20*" -mtime +7 -exec rm -rf {} \;

echo "=== Backup completed at $(date) ==="
```

### 7.3 Disaster Recovery Plan

#### RTO (Recovery Time Objective): 4 hours
#### RPO (Recovery Point Objective): 24 hours

**Recovery Steps:**

1. **Provision new infrastructure** (30 minutes)
   ```bash
   # On new VPS
   git clone https://github.com/fairpact/fairpact.git
   cd fairpact
   cp .env.example .env.production
   # Fill in credentials
   ```

2. **Restore database** (1 hour)
   ```bash
   # Download latest backup
   aws s3 cp s3://fairpact-backups/$(aws s3 ls s3://fairpact-backups/db/ | sort | tail -n 1 | awk '{print $4}') ./backup.dump.gz

   # Restore
   gunzip backup.dump.gz
   pg_restore -d fairpact backup.dump
   ```

3. **Deploy application** (1 hour)
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

4. **Verify and test** (1.5 hours)
   - Run health checks
   - Test critical workflows
   - Verify data integrity

---

## 8. CI/CD Pipeline

### 8.1 GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run tests
        run: |
          cd backend && pytest
          cd ../frontend && npm test

  build-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker image
        run: |
          docker build -t fairpact-backend:${{ github.sha }} ./backend

      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker tag fairpact-backend:${{ github.sha }} fairpact/backend:latest
          docker push fairpact/backend:latest

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

  deploy-backend:
    needs: build-backend
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USERNAME }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/fairpact
            docker-compose pull
            docker-compose up -d --force-recreate
            docker image prune -f
```

---

## 9. Scaling Strategy

### 9.1 Vertical Scaling (Short-term)

| Load Level | VPS Tier | Specs | Cost/month |
|------------|----------|-------|------------|
| 0-500 users | CX41 | 4 vCPU, 16GB RAM | €12.90 |
| 500-2K users | CX51 | 8 vCPU, 32GB RAM | €26.90 |
| 2K-5K users | CCX33 | 8 vCPU (dedicated), 32GB | €69.90 |

### 9.2 Horizontal Scaling (Long-term)

```yaml
# kubernetes/deployment.yml (future)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fairpact-backend
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
  selector:
    matchLabels:
      app: fairpact-backend
  template:
    spec:
      containers:
      - name: backend
        image: fairpact/backend:latest
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: fairpact-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: fairpact-backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## 10. Cost Optimization

### 10.1 Monthly Cost Breakdown (Production)

| Service | Cost | Optimization Strategy |
|---------|------|----------------------|
| VPS (Hetzner CX51) | €26.90 | Use spot instances for workers |
| Database (Supabase Pro) | €25.00 | Connection pooling, query optimization |
| CDN (Cloudflare) | €0.00 | Free tier sufficient for MVP |
| Frontend (Vercel) | €0.00 | Free tier (Pro if needed: €20) |
| Monitoring (Grafana Cloud) | €0.00 | Self-hosted alternative |
| Storage (MinIO) | Included | Lifecycle policies for cleanup |
| **Total** | **€51.90** | Can scale down to €12.90 for MVP |

### 10.2 Cost-Saving Tips

1. **Use object lifecycle policies** - Auto-delete guest uploads after 24h
2. **Implement query caching** - Reduce database load
3. **Optimize images** - Use Next.js image optimization
4. **Monitor API costs** - Set Gemini API budget limits
5. **Use free tiers** - Vercel, Cloudflare, Supabase free tiers cover MVP

---

**Deployment Checklist:**

- [ ] Domain registered and DNS configured
- [ ] SSL certificates obtained (Let's Encrypt)
- [ ] Environment variables configured
- [ ] Database initialized and migrated
- [ ] Backup automation configured
- [ ] Monitoring dashboards set up
- [ ] CI/CD pipeline tested
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Documentation updated

---

**Document End**
