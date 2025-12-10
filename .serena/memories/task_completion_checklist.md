# Task Completion Checklist

When completing a task in this project, ensure the following steps are completed:

## Backend Tasks

### Code Changes
- [ ] Format code with `black .`
- [ ] Sort imports with `isort .`
- [ ] Check for linting errors with `flake8`
- [ ] Run type checking with `mypy .`
- [ ] Run tests with `pytest`
- [ ] Update tests if functionality changed
- [ ] Update docstrings if public API changed

### Database Changes
- [ ] Create Alembic migration: `uv run alembic revision --autogenerate -m "description"`
- [ ] Review migration file for correctness
- [ ] Apply migration: `uv run alembic upgrade head`
- [ ] Test migration rollback: `uv run alembic downgrade -1` then `upgrade head`

### API Changes
- [ ] Update Pydantic schemas if needed
- [ ] Check API documentation at http://localhost:8000/docs
- [ ] Test endpoints manually or with automated tests
- [ ] Update CORS settings if needed

## Frontend Tasks

### Code Changes
- [ ] Run ESLint: `npm run lint`
- [ ] Test in development mode: `npm run dev`
- [ ] Test production build: `npm run build && npm run start`
- [ ] Verify responsive design (mobile, tablet, desktop)
- [ ] Test both light and dark modes

## Documentation
- [ ] Update README.md if setup changed
- [ ] Update CLAUDE.md if architecture changed
- [ ] Add code comments for complex logic
- [ ] Update API documentation if endpoints changed

## Git
- [ ] Review changes with `git diff`
- [ ] Stage relevant files only
- [ ] Write clear commit message
- [ ] Push to appropriate branch
