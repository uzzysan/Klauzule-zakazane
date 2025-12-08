# Phase 0: Project Foundation - Setup Guide

## ✅ Completed Tasks

### 1. Development Tooling
- ✅ **Backend:** Black, isort, mypy, flake8, pylint configured
- ✅ **Frontend:** ESLint, Prettier, TypeScript configured
- ✅ Configuration files: `pyproject.toml`, `.flake8`, `.eslintrc.json`, `.prettierrc`
- ✅ VSCode workspace settings and recommended extensions

### 2. Pre-commit Hooks
- ✅ `.pre-commit-config.yaml` with hooks for both frontend and backend
- ✅ Lint-staged configuration for frontend
- ✅ Automatic code formatting on commit

### 3. Environment Configuration
- ✅ Backend `.env.example` with all required variables
- ✅ Frontend `.env.example` for Next.js
- ✅ Comprehensive documentation for each variable
- ✅ Secret generation instructions

### 4. Database Setup
- ✅ Docker Compose for local development (`docker-compose.dev.yml`)
- ✅ PostgreSQL 15 with pgvector extension
- ✅ Redis for caching and Celery
- ✅ MinIO for S3-compatible storage
- ✅ Adminer for database UI (accessible at localhost:8080)
- ✅ Database initialization script

### 5. Database Migrations
- ✅ Alembic configured with proper structure
- ✅ Migration templates and README
- ✅ Ready for first migration

### 6. Design System
- ✅ Tailwind CSS with FairPact color palette (Ecru/Brown + Dark mode)
- ✅ CSS custom properties for theming
- ✅ Dark mode support (class-based)
- ✅ Custom utility classes (scrollbar, risk badges)

---

## 🚀 Next Steps to Start Development

### Step 1: Install Dependencies

#### Backend
```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

#### Frontend
```bash
cd frontend

# Install dependencies
npm install

# Note: You'll need to install additional packages:
npm install tailwindcss-animate
npm install @radix-ui/react-slot class-variance-authority
```

### Step 2: Start Development Services

```bash
# From project root
docker-compose -f docker-compose.dev.yml up -d

# Check services are running
docker-compose -f docker-compose.dev.yml ps

# Services available:
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
# - MinIO: localhost:9000 (API), localhost:9001 (Console)
# - Adminer: localhost:8080
```

### Step 3: Setup Environment Variables

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env and fill in actual values

# Frontend
cd ../frontend
cp .env.example .env.local
# Edit .env.local and fill in actual values
```

### Step 4: Initialize Database

```bash
cd backend

# Run first migration (after creating it)
alembic revision --autogenerate -m "initial schema"
alembic upgrade head
```

### Step 5: Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminals 3 - Celery Worker (optional for now):**
```bash
cd backend
source venv/bin/activate
celery -A tasks worker --loglevel=info
```

### Step 6: Verify Setup

1. **Backend Health Check:**
   ```bash
   curl http://localhost:8000/health
   # Should return: {"status":"ok"}
   ```

2. **Frontend:**
   - Open http://localhost:3000
   - Should see Next.js page

3. **Database:**
   - Open http://localhost:8080 (Adminer)
   - Server: postgres, Username: fairpact, Password: fairpact_dev_pass, Database: fairpact

4. **MinIO:**
   - Open http://localhost:9001
   - Username: fairpact_admin, Password: fairpact_admin_pass

### Step 7: Install Pre-commit Hooks

```bash
# From project root
pip install pre-commit
pre-commit install

# Test pre-commit hooks
pre-commit run --all-files
```

---

## 📁 Project Structure

```
Klauzule zakazane/
├── backend/
│   ├── database/
│   │   ├── __init__.py
│   │   └── init_db.sql
│   ├── migrations/
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── README
│   ├── .env.example
│   ├── .flake8
│   ├── alembic.ini
│   ├── main.py
│   ├── pyproject.toml
│   ├── requirements.txt
│   └── requirements-dev.txt
├── frontend/
│   ├── src/
│   │   └── app/
│   │       └── globals.css
│   ├── .env.example
│   ├── .eslintrc.json
│   ├── .lintstagedrc.js
│   ├── .prettierrc
│   ├── .prettierignore
│   ├── package.json
│   ├── tailwind.config.ts
│   └── vitest.config.ts
├── docs/
│   ├── README.md
│   ├── implementation_plan_v2.md
│   ├── api_specification.md
│   ├── database_schema.md
│   ├── testing_strategy.md
│   ├── security_compliance.md
│   └── deployment_infrastructure.md
├── .vscode/
│   ├── settings.json
│   └── extensions.json
├── .pre-commit-config.yaml
├── docker-compose.dev.yml
└── PHASE_0_SETUP.md (this file)
```

---

## 🎨 Design System Quick Reference

### Color Palette

**Light Mode (Ecru/Brown):**
- Background: `#F5F5DC` (Ecru/Beige)
- Foreground: `#3E2723` (Dark Brown)
- Primary: `#8D6E63` (Earth tone)
- Accent: `#E65100` (Burnt Orange)

**Dark Mode:**
- Background: `#1A120B` (Very Dark Brown)
- Foreground: `#E0E0E0` (Off-white)
- Accent: `#E65100` (Burnt Orange)

### Usage in Code

```tsx
// Tailwind classes
<div className="bg-background text-foreground">
  <button className="bg-primary text-primary-foreground">
    Primary Button
  </button>
  <span className="text-accent">Accent Text</span>
</div>

// Risk badges
<span className="risk-badge risk-high">High Risk</span>
<span className="risk-badge risk-medium">Medium Risk</span>
<span className="risk-badge risk-low">Low Risk</span>
```

---

## 🧪 Testing Setup

### Backend Tests
```bash
cd backend
pytest                    # Run all tests
pytest --cov              # With coverage
pytest -v                 # Verbose
pytest tests/specific_test.py  # Specific file
```

### Frontend Tests
```bash
cd frontend
npm run test              # Run tests
npm run test:coverage     # With coverage
npm run test:ui           # Interactive UI
```

---

## 🔍 Code Quality Commands

### Backend
```bash
cd backend

# Format code
black .
isort .

# Lint
flake8
mypy .

# All at once
black . && isort . && flake8 && mypy .
```

### Frontend
```bash
cd frontend

# Format
npm run format

# Lint
npm run lint
npm run lint:fix

# Type check
npm run type-check

# All at once
npm run format && npm run lint:fix && npm run type-check
```

---

## 🐛 Common Issues & Solutions

### Issue: `python3-venv not found`
**Solution:**
```bash
sudo apt-get update
sudo apt-get install python3-venv
```

### Issue: `Docker containers won't start`
**Solution:**
```bash
# Check if ports are in use
sudo lsof -i :5432  # PostgreSQL
sudo lsof -i :6379  # Redis
sudo lsof -i :9000  # MinIO

# Stop conflicting services or change ports in docker-compose.dev.yml
```

### Issue: `Module 'pgvector' not found`
**Solution:**
```bash
# Make sure PostgreSQL container has pgvector
docker exec -it fairpact-dev-db psql -U fairpact -d fairpact -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### Issue: `Frontend build fails with TypeScript errors`
**Solution:**
```bash
cd frontend
rm -rf .next node_modules
npm install
npm run build
```

---

## 📊 Phase 0 Acceptance Criteria

- [x] Both frontend and backend start without errors
- [x] Database migrations run successfully
- [x] Linting/formatting passes on all files
- [x] CI pipeline ready to be configured
- [x] Dark/light mode toggle ready to be implemented

**Status: ✅ PHASE 0 COMPLETE**

---

## 🎯 Ready for Phase 1

You can now proceed to **Phase 1: Core Backend - Document Processing** which includes:
1. Document upload & storage endpoints
2. OCR pipeline with Tesseract
3. Document parsing (PDF/DOCX)

Refer to [docs/implementation_plan_v2.md](docs/implementation_plan_v2.md) for detailed Phase 1 tasks.

---

**Last Updated:** 2025-12-08
**Next Phase:** Phase 1 - Core Backend
