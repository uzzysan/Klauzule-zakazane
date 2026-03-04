#!/bin/bash
# Automated Code Review using Codacy API
# This script performs automated code review before commits

set -e

CODACY_API_TOKEN="${CODACY_API_TOKEN:-WaLrtVtwZvG8KqzvxRTI}"
PROJECT_NAME="Klauzule-zakazane"
PROJECT_OWNER="uzzysan"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "master")

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if there are uncommitted changes
check_uncommitted() {
    if git diff --cached --quiet; then
        log_warning "No staged changes found. Run 'git add' first."
        return 1
    fi
    return 0
}

# Get changed files
get_changed_files() {
    git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx|py)$' || true
}

# Run local linters first
run_local_checks() {
    log_info "Running local code checks..."
    
    local has_errors=0
    
    # Check TypeScript/JavaScript files
    if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
        log_info "Checking frontend code..."
        cd frontend
        
        if npm run lint --silent 2>/dev/null; then
            log_success "Frontend linting passed"
        else
            log_error "Frontend linting failed"
            has_errors=1
        fi
        
        if npm run type-check --silent 2>/dev/null; then
            log_success "TypeScript type check passed"
        else
            log_warning "TypeScript type check has issues"
        fi
        
        cd ..
    fi
    
    # Check Python files
    if [ -d "backend" ] && [ -f "backend/requirements.txt" ]; then
        log_info "Checking backend code..."
        cd backend
        
        if command -v flake8 &> /dev/null; then
            if flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics 2>/dev/null; then
                log_success "Python flake8 check passed"
            else
                log_warning "Python flake8 found issues"
            fi
        fi
        
        cd ..
    fi
    
    return $has_errors
}

# Check Codacy analysis status
check_codacy_status() {
    log_info "Checking Codacy analysis status for branch: $CURRENT_BRANCH"
    
    local response=$(curl -s \
        -H "api-token: $CODACY_API_TOKEN" \
        "https://app.codacy.com/api/v3/analysis/organizations/gh/$PROJECT_OWNER/repositories/$PROJECT_NAME/analysis?branch=$CURRENT_BRANCH")
    
    # Check if analysis exists
    if echo "$response" | grep -q "\"status\""; then
        local status=$(echo "$response" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
        local grade=$(echo "$response" | grep -o '"grade":"[^"]*"' | head -1 | cut -d'"' -f4)
        
        log_info "Codacy Analysis Status: $status"
        log_info "Code Quality Grade: $grade"
        
        case "$grade" in
            A|B)
                log_success "Excellent code quality!"
                return 0
                ;;
            C)
                log_warning "Code quality is acceptable but could be improved"
                return 0
                ;;
            D|E)
                log_error "Code quality issues detected. Consider fixing before commit."
                return 1
                ;;
            *)
                log_warning "Could not determine code quality grade"
                return 0
                ;;
        esac
    else
        log_warning "No Codacy analysis found for this branch yet"
        return 0
    fi
}

# Get Codacy issues for changed files
get_codacy_issues() {
    log_info "Fetching Codacy issues for changed files..."
    
    local response=$(curl -s \
        -H "api-token: $CODACY_API_TOKEN" \
        "https://app.codacy.com/api/v3/analysis/organizations/gh/$PROJECT_OWNER/repositories/$PROJECT_NAME/issues?branch=$CURRENT_BRANCH")
    
    local issue_count=$(echo "$response" | grep -o '"total":[^,}]*' | head -1 | cut -d':' -f2 || echo "0")
    
    log_info "Total issues found: $issue_count"
    
    if [ "$issue_count" -gt 0 ]; then
        log_warning "Found $issue_count issues. Run 'scripts/codacy/codacy-api.sh issues' for details."
        
        # Show security issues if any
        local security_issues=$(echo "$response" | grep -c '"securityIssue"' || echo "0")
        if [ "$security_issues" -gt 0 ]; then
            log_error "SECURITY: Found $security_issues security issues that should be addressed!"
        fi
    else
        log_success "No issues found!"
    fi
    
    return 0
}

# Pre-commit review
pre_commit_review() {
    echo "========================================"
    echo "  Automated Code Review - Codacy"
    echo "========================================"
    echo ""
    
    local exit_code=0
    
    # Check uncommitted changes
    if ! check_uncommitted; then
        exit 1
    fi
    
    # Show changed files
    local changed_files=$(get_changed_files)
    if [ -z "$changed_files" ]; then
        log_warning "No relevant source files changed (only .ts, .tsx, .js, .jsx, .py files are checked)"
        exit 0
    fi
    
    log_info "Changed files:"
    echo "$changed_files" | while read file; do
        echo "  - $file"
    done
    echo ""
    
    # Run local checks
    if ! run_local_checks; then
        log_error "Local checks failed. Please fix issues before committing."
        exit_code=1
    fi
    echo ""
    
    # Check Codacy status (non-blocking if API fails)
    check_codacy_status || true
    echo ""
    
    # Get Codacy issues (non-blocking)
    get_codacy_issues || true
    echo ""
    
    if [ $exit_code -eq 0 ]; then
        log_success "Code review completed successfully!"
        echo ""
        echo "You can now commit your changes:"
        echo "  git commit -m 'your message'"
    else
        log_error "Code review found issues. Please fix them before committing."
        echo ""
        echo "To bypass this check (not recommended):"
        echo "  git commit --no-verify -m 'your message'"
    fi
    
    return $exit_code
}

# Post-commit analysis trigger
post_commit_trigger() {
    log_info "Triggering Codacy analysis for latest commit..."
    
    curl -s -X POST \
        -H "api-token: $CODACY_API_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"branch\":\"$CURRENT_BRANCH\"}" \
        "https://app.codacy.com/api/v3/analysis/organizations/gh/$PROJECT_OWNER/repositories/$PROJECT_NAME/analyze"
    
    log_success "Analysis triggered. Check https://app.codacy.com/gh/$PROJECT_OWNER/$PROJECT_NAME for results."
}

# Main
show_help() {
    cat << EOF
Codacy Code Review Script

Usage: $0 <command>

Commands:
  pre-commit     Run full code review before committing
  trigger        Trigger Codacy analysis after commit
  status         Check current analysis status
  issues         Show current issues
  help           Show this help

Examples:
  $0 pre-commit    # Run before git commit
  $0 trigger       # Trigger analysis after push
  $0 status        # Check analysis status

Integration with Git Hooks:
  Add to .git/hooks/pre-commit:
    scripts/codacy/code-review.sh pre-commit

EOF
}

case "${1:-help}" in
    pre-commit)
        pre_commit_review
        ;;
    trigger)
        post_commit_trigger
        ;;
    status)
        check_codacy_status
        ;;
    issues)
        get_codacy_issues
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
