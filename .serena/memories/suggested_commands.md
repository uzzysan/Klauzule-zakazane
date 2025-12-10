# Suggested Commands

## Backend Development

### Setup (using uv - recommended)
```bash
cd backend
uv venv
source .venv/bin/activate
uv pip install -e ".[dev]"
cp .env.example .env
```

### Setup (using pip - alternative)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install -r requirements-dev.txt
cp .env.example .env
```

### Running the Server
```bash
cd backend
uvicorn main:app --reload
```

### Database Migrations
```bash
cd backend
uv run alembic revision --autogenerate -m "description"
uv run alembic upgrade head
uv run alembic downgrade -1
```

### Code Quality
```bash
cd backend
black .                    # Format code
isort .                    # Sort imports
flake8                     # Lint
mypy .                     # Type check
pytest                     # Run tests
pytest --cov               # Run tests with coverage

# Run all checks
black . && isort . && flake8 && mypy . && pytest
```

### Celery Worker
```bash
cd backend
celery -A celery_app worker --loglevel=info
```

## Frontend Development
```bash
cd frontend
npm install                # Install dependencies
npm run dev               # Start dev server (http://localhost:3000)
npm run build             # Production build
npm run start             # Start production server
npm run lint              # Run ESLint
```

## Docker
```bash
docker-compose -f docker-compose.dev.yml up -d    # Start services
docker-compose -f docker-compose.dev.yml down     # Stop services
```

## API Documentation
- Interactive docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Health check: http://localhost:8000/health
