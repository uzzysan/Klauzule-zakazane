# Code Style and Conventions

## Python Backend

### General
- **Formatter**: black (default config)
- **Import Sorting**: isort
- **Linter**: flake8
- **Type Checker**: mypy
- **Docstrings**: Google-style docstrings with triple quotes
- **Type Hints**: Required for all function signatures

### Naming Conventions
- **Files**: snake_case (e.g., `document_service.py`)
- **Classes**: PascalCase (e.g., `ProhibitedClause`)
- **Functions/Variables**: snake_case (e.g., `analyze_document`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)
- **Private**: Prefix with underscore (e.g., `_internal_method`)

### Structure
- **Models**: SQLAlchemy models in `models/` directory
- **Schemas**: Pydantic schemas in `schemas/` directory
- **Services**: Business logic in `services/` directory
- **API Endpoints**: FastAPI routers in `api/` directory

### Database
- **Async Operations**: All database operations use async/await
- **UUID**: Primary keys use UUID (uuid4)
- **Timestamps**: Use `func.now()` for server-side timestamps
- **Soft Deletes**: Use `deleted_at` field for soft deletes

## Frontend (Next.js)
- **Framework**: Next.js with TypeScript
- **Styling**: TailwindCSS with custom color scheme
- **Color Scheme**:
  - Light mode: Ecru/Brown palette (`#F5F5DC` background, `#3E2723` text, `#8D6E63` accents)
  - Dark mode: Dark Brown/Orange (`#1A120B` background, `#E0E0E0` text, `#E65100` accents)
