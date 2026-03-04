# Codacy Integration for FairPact Project

## API Token
- Token: WaLrtVtwZvG8KqzvxRTI (configured in scripts)

## Available Scripts

### codacy-api.sh
Helper script for Codacy API operations:
```bash
./scripts/codacy/codacy-api.sh repo-info      # Repository info
./scripts/codacy/codacy-api.sh analysis       # Latest analysis
./scripts/codacy/codacy-api.sh grade          # Quality grade
./scripts/codacy/codacy-api.sh issues         # Code issues
./scripts/codacy/codacy-api.sh security       # Security issues
./scripts/codacy/codacy-api.sh trigger        # Trigger analysis
```

### code-review.sh
Automated code review script:
```bash
./scripts/codacy/code-review.sh pre-commit    # Pre-commit review
./scripts/codacy/code-review.sh status        # Check status
./scripts/codacy/code-review.sh issues        # Show issues
./scripts/codacy/code-review.sh trigger       # Post-commit trigger
```

## Configuration
- `.codacy.yml` - Main configuration file
- Excluded paths: tests, node_modules, .next, venv, docs, nginx, ops
- Enabled patterns: ESLint, Pylint, Bandit (security)

## Quality Thresholds
- A (90-100%): Excellent
- B (80-89%): Good  
- C (60-79%): Acceptable
- D (40-59%): Poor
- E (0-39%): Very Poor

## Web Dashboard
https://app.codacy.com/gh/uzzysan/Klauzule-zakazane

## Usage in Code Review
When doing code review:
1. Run `./scripts/codacy/code-review.sh pre-commit` before committing
2. Check grade is at least C before approving
3. Address any security issues immediately
4. View detailed analysis on web dashboard
