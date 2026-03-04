# Codacy Integration Setup

## Overview

Codacy is integrated into this project for automated code quality analysis and security scanning.

## Configuration Files

- `.codacy.yml` - Codacy configuration with excluded paths and enabled patterns
- `scripts/codacy/codacy-api.sh` - API helper script for querying Codacy
- `scripts/codacy/code-review.sh` - Automated code review script

## Quick Start

### Check Repository Status
```bash
./scripts/codacy/codacy-api.sh repo-info
```

### Check Code Quality Grade
```bash
./scripts/codacy/codacy-api.sh grade
```

### View Code Issues
```bash
./scripts/codacy/codacy-api.sh issues
```

### Run Pre-Commit Review
```bash
./scripts/codacy/code-review.sh pre-commit
```

## Git Hook Integration

To automatically run code review before each commit:

```bash
# Create pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
./scripts/codacy/code-review.sh pre-commit
EOF

# Make it executable
chmod +x .git/hooks/pre-commit
```

## API Token

The API token is pre-configured in the scripts. To use a different token:

```bash
export CODACY_API_TOKEN="your-token-here"
./scripts/codacy/codacy-api.sh repo-info
```

## Codacy Web Dashboard

View detailed analysis at:
https://app.codacy.com/gh/uzzysan/Klauzule-zakazane

## Quality Gates

### Grade Thresholds
- **A (Excellent)**: 90-100%
- **B (Good)**: 80-89%
- **C (Acceptable)**: 60-79%
- **D (Poor)**: 40-59%
- **E (Very Poor)**: 0-39%

### Pre-Commit Checks
The `code-review.sh` script performs:
1. Local linting (ESLint, Flake8)
2. Type checking (TypeScript)
3. Codacy grade verification
4. Issue detection

## Supported Languages

- TypeScript/JavaScript (Frontend)
- Python (Backend)
- Dockerfile

## Excluded Paths

- Test files (`*.test.ts`, `*.spec.ts`)
- Build outputs (`.next/`, `dist/`, `build/`)
- Dependencies (`node_modules/`, `venv/`)
- Documentation (`docs/`)
- Infrastructure (`nginx/`, `ops/`, `monitoring/`)

## CI/CD Integration

Add to your GitHub Actions:

```yaml
- name: Run Codacy Analysis
  uses: codacy/codacy-analysis-cli-action@master
  with:
    project-token: ${{ secrets.CODACY_PROJECT_TOKEN }}
    upload: true
```
