# 🚀 Quick Start with uv

## Install uv (if needed)

```bash
# Using pip
pip install uv

# Or using the official installer (recommended)
curl -LsSf https://astral.sh/uv/install.sh | sh
```

## Setup (30 seconds!)

```bash
cd backend

# 1. Create virtual environment
uv venv

# 2. Activate it
source .venv/bin/activate  # Linux/Mac
# .venv\Scripts\activate  # Windows

# 3. Install everything (including dev dependencies)
uv pip install -e ".[dev]"

# 4. Copy environment file
cp .env.example .env
# Edit .env if needed (defaults work for local dev)

# 5. Start the server!
uvicorn main:app --reload
```

## Why uv is awesome ⚡

- **10-100x faster** than pip
- Installs in seconds, not minutes
- Better caching
- Compatible with everything pip does

## Verify Installation

```bash
# Check if running
curl http://localhost:8000/health

# Should return: {"status":"ok","environment":"development"}

# Visit API docs
open http://localhost:8000/docs
```

## Common Commands

```bash
# Add a new package
uv pip install package-name

# Update all dependencies
uv pip install -e ".[dev]" --upgrade

# Install just production deps (no dev)
uv pip install -e .

# Freeze dependencies
uv pip freeze > requirements.txt
```

## Troubleshooting

### "uv: command not found"
```bash
# Add to PATH (Linux/Mac)
export PATH="$HOME/.cargo/bin:$PATH"

# Or reinstall
pip install uv
```

### "No such file or directory: .venv"
```bash
# Create venv first
uv venv
source .venv/bin/activate
```

### Import errors
```bash
# Reinstall dependencies
uv pip install -e ".[dev]"
```

---

**Ready!** Your backend is now running with uv 🎉
