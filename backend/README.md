# FairPact Backend

FastAPI-based backend for contract analysis.

## Quick Start with uv (Recommended)

```bash
# Install uv if you haven't already
pip install uv
# Or: curl -LsSf https://astral.sh/uv/install.sh | sh

# Create virtual environment
uv venv

# Activate virtual environment
source .venv/bin/activate  # Linux/Mac
# .venv\Scripts\activate  # Windows

# Install all dependencies (including dev)
uv pip install -e ".[dev]"

# Copy environment variables
cp .env.example .env
# Edit .env with your values

# Start development server
uvicorn main:app --reload
```

## Quick Start with pip (Alternative)

```bash
# Create virtual environment
python3 -m venv venv

# Activate
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Setup environment
cp .env.example .env

# Start server
uvicorn main:app --reload
```

## Why uv?

- **10-100x faster** than pip
- Better dependency resolution
- Automatic virtual environment management
- Compatible with pip (uses same package index)

## Development Commands

```bash
# Format code
black .
isort .

# Lint
flake8
mypy .

# Test
pytest
pytest --cov

# All checks
black . && isort . && flake8 && mypy . && pytest
```

## API Documentation

Once running, visit:
- Interactive docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Environment Variables

See `.env.example` for all required variables. Minimum required:

```bash
DATABASE_URL=postgresql://fairpact:fairpact_dev_pass@localhost:5432/fairpact
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here
MINIO_ACCESS_KEY=fairpact_admin
MINIO_SECRET_KEY=fairpact_admin_pass
```

Generate secrets:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Project Structure

```
backend/
├── api/              # API endpoints
├── database/         # Database models & connection
├── migrations/       # Alembic migrations
├── schemas/          # Pydantic schemas
├── services/         # Business logic
├── config.py         # Configuration
├── main.py           # FastAPI app
└── pyproject.toml    # Dependencies & tools
```
