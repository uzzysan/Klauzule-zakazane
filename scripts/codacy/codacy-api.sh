#!/bin/bash
# Codacy API Helper Script
# Usage: ./codacy-api.sh <command> [options]
# Requires: CODACY_API_TOKEN environment variable

set -e

CODACY_API_TOKEN="${CODACY_API_TOKEN:-WaLrtVtwZvG8KqzvxRTI}"
CODACY_BASE_URL="https://app.codacy.com/api/v3"
PROJECT_NAME="Klauzule-zakazane"
PROJECT_OWNER="uzzysan"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# API call function
api_call() {
    local method="$1"
    local endpoint="$2"
    local data="${3:-}"
    
    local curl_opts="-s -H \"api-token: $CODACY_API_TOKEN\" -H \"Content-Type: application/json\""
    
    if [ -n "$data" ]; then
        curl_opts="$curl_opts -d '$data'"
    fi
    
    eval "curl $curl_opts -X $method \"$CODACY_BASE_URL$endpoint\""
}

# Get repository information
get_repo_info() {
    log_info "Fetching repository information..."
    api_call "GET" "/analysis/organizations/gh/$PROJECT_OWNER/repositories/$PROJECT_NAME"
}

# Get latest analysis results
get_latest_analysis() {
    log_info "Fetching latest analysis results..."
    api_call "GET" "/analysis/organizations/gh/$PROJECT_OWNER/repositories/$PROJECT_NAME/analysis"
}

# Get code quality grade
get_quality_grade() {
    log_info "Fetching code quality grade..."
    local response=$(api_call "GET" "/analysis/organizations/gh/$PROJECT_OWNER/repositories/$PROJECT_NAME/analysis")
    echo "$response" | grep -o '"grade":"[^"]*"' | head -1
}

# Get issues list
get_issues() {
    log_info "Fetching code issues..."
    local branch="${1:-master}"
    api_call "GET" "/analysis/organizations/gh/$PROJECT_OWNER/repositories/$PROJECT_NAME/issues?branch=$branch"
}

# Get security issues
get_security_issues() {
    log_info "Fetching security issues..."
    api_call "GET" "/analysis/organizations/gh/$PROJECT_OWNER/repositories/$PROJECT_NAME/security/issues"
}

# Get coverage information
get_coverage() {
    log_info "Fetching coverage information..."
    api_call "GET" "/coverage/organizations/gh/$PROJECT_OWNER/repositories/$PROJECT_NAME"
}

# Trigger new analysis
trigger_analysis() {
    log_info "Triggering new analysis..."
    local branch="${1:-master}"
    api_call "POST" "/analysis/organizations/gh/$PROJECT_OWNER/repositories/$PROJECT_NAME/analyze" "{\"branch\":\"$branch\"}"
}

# Get file analysis
get_file_analysis() {
    log_info "Fetching file analysis..."
    local file_path="$1"
    local branch="${2:-master}"
    api_call "GET" "/analysis/organizations/gh/$PROJECT_OWNER/repositories/$PROJECT_NAME/files?path=$file_path&branch=$branch"
}

# Display help
show_help() {
    cat << EOF
Codacy API Helper Script

Usage: $0 <command> [options]

Commands:
  repo-info           Get repository information
  analysis            Get latest analysis results
  grade               Get code quality grade
  issues [branch]     Get code issues (default: master)
  security            Get security issues
  coverage            Get coverage information
  trigger [branch]    Trigger new analysis (default: master)
  file <path> [branch] Get file analysis
  help                Show this help message

Environment Variables:
  CODACY_API_TOKEN    Codacy API token (default: pre-configured)

Examples:
  $0 repo-info
  $0 analysis
  $0 issues develop
  $0 file "frontend/src/app/page.tsx"
  $0 trigger master

EOF
}

# Main command handler
case "${1:-help}" in
    repo-info)
        get_repo_info | python3 -m json.tool 2>/dev/null || get_repo_info
        ;;
    analysis)
        get_latest_analysis | python3 -m json.tool 2>/dev/null || get_latest_analysis
        ;;
    grade)
        get_quality_grade
        ;;
    issues)
        get_issues "$2" | python3 -m json.tool 2>/dev/null || get_issues "$2"
        ;;
    security)
        get_security_issues | python3 -m json.tool 2>/dev/null || get_security_issues
        ;;
    coverage)
        get_coverage | python3 -m json.tool 2>/dev/null || get_coverage
        ;;
    trigger)
        trigger_analysis "$2"
        log_success "Analysis triggered for branch: ${2:-master}"
        ;;
    file)
        if [ -z "$2" ]; then
            log_error "File path required"
            show_help
            exit 1
        fi
        get_file_analysis "$2" "$3" | python3 -m json.tool 2>/dev/null || get_file_analysis "$2" "$3"
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
