#!/bin/bash

#===============================================================================
# FairPact - Skrypt automatycznego uruchomienia aplikacji
#===============================================================================
# Sprawdza wymagane zależności, uruchamia kontenery i serwisy deweloperskie.
# Użycie: ./start-app.sh [--stop] [--status] [--help]
#===============================================================================

set -e

# Kolory dla outputu
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Konfiguracja
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.dev.yml"

# Porty
FRONTEND_PORT=3000
BACKEND_PORT=8000

# PID files
PID_DIR="$SCRIPT_DIR/.pids"
BACKEND_PID_FILE="$PID_DIR/backend.pid"
FRONTEND_PID_FILE="$PID_DIR/frontend.pid"
CELERY_PID_FILE="$PID_DIR/celery.pid"

#-------------------------------------------------------------------------------
# Funkcje pomocnicze
#-------------------------------------------------------------------------------


# Initialize environment variables
init_environment() {
    # Detect container engine
    if command -v podman &> /dev/null; then
        CONTAINER_ENGINE="podman"
        COMPOSE_CMD="podman-compose"
    elif command -v docker &> /dev/null; then
        CONTAINER_ENGINE="docker"
        if docker compose version &> /dev/null 2&>1; then
            COMPOSE_CMD="docker compose"
        else
            COMPOSE_CMD="docker-compose"
        fi
    fi
}

print_header() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}        ${GREEN}FairPact - Contract Analysis Application${NC}              ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    echo -e "${BLUE}[*]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

check_command() {
    command -v "$1" &> /dev/null
}

#-------------------------------------------------------------------------------
# Sprawdzanie wymagań systemowych
#-------------------------------------------------------------------------------

check_requirements() {
    print_step "Sprawdzanie wymagań systemowych..."
    local missing_deps=()

    # Python
    if check_command python3; then
        print_success "Python: $(python3 --version 2>&1 | cut -d' ' -f2)"
    else
        missing_deps+=("python3")
        print_error "Python3 nie jest zainstalowany"
    fi

    # Node.js
    if check_command node; then
        print_success "Node.js: $(node --version)"
    else
        missing_deps+=("nodejs")
        print_error "Node.js nie jest zainstalowany"
    fi

    # npm
    if check_command npm; then
        print_success "npm: $(npm --version)"
    else
        missing_deps+=("npm")
        print_error "npm nie jest zainstalowany"
    fi

    # Podman lub Docker
    if check_command podman; then
        print_success "Podman: $(podman --version | cut -d' ' -f3)"
        CONTAINER_ENGINE="podman"
    elif check_command docker; then
        print_success "Docker: $(docker --version | cut -d' ' -f3 | tr -d ',')"
        CONTAINER_ENGINE="docker"
    else
        missing_deps+=("podman lub docker")
        print_error "Podman ani Docker nie są zainstalowane"
    fi

    # podman-compose lub docker-compose
    if check_command podman-compose; then
        print_success "podman-compose: zainstalowany"
        COMPOSE_CMD="podman-compose"
    elif check_command docker-compose; then
        print_success "docker-compose: zainstalowany"
        COMPOSE_CMD="docker-compose"
    elif check_command docker && docker compose version &> /dev/null; then
        print_success "docker compose: zainstalowany"
        COMPOSE_CMD="docker compose"
    else
        missing_deps+=("podman-compose lub docker-compose")
        print_error "podman-compose ani docker-compose nie są zainstalowane"
    fi

    # uv (opcjonalnie)
    if check_command uv; then
        print_success "uv: $(uv --version | cut -d' ' -f2)"
        USE_UV=true
    else
        print_warning "uv nie jest zainstalowany (użyję pip)"
        USE_UV=false
    fi

    # Jeśli brakuje zależności
    if [ ${#missing_deps[@]} -gt 0 ]; then
        echo ""
        print_error "Brakujące zależności: ${missing_deps[*]}"
        echo ""
        echo -e "${YELLOW}Instrukcje instalacji:${NC}"
        echo ""
        echo "  Python3:        sudo apt install python3 python3-venv python3-pip"
        echo "  Node.js + npm:  sudo apt install nodejs npm"
        echo "  Podman:         sudo apt install podman"
        echo "  podman-compose: pip install podman-compose"
        echo ""
        exit 1
    fi

    echo ""
    print_success "Wszystkie wymagania spełnione!"
}

#-------------------------------------------------------------------------------
# Zarządzanie kontenerami
#-------------------------------------------------------------------------------

start_containers() {
    print_step "Uruchamianie kontenerów (PostgreSQL, Redis, MinIO)..."
    cd "$SCRIPT_DIR"
    
    # Sprawdź stan kontenerów i ustal akcję
    local need_start=false
    local need_remove=false
    
    for container in fairpact-dev-db fairpact-dev-redis fairpact-dev-minio fairpact-dev-adminer; do
        if $CONTAINER_ENGINE ps -a --format "{{.Names}}" | grep -q "^${container}$"; then
            # Kontener istnieje - sprawdź czy działa
            if ! $CONTAINER_ENGINE ps --format "{{.Names}}" | grep -q "^${container}$"; then
                # Kontener istnieje ale nie działa - usuń go
                need_remove=true
            fi
        else
            need_start=true
        fi
    done
    
    # Usuń zatrzymane kontenery jeśli potrzeba
    if [ "$need_remove" = true ]; then
        print_step "Usuwanie zatrzymanych kontenerów..."
        $COMPOSE_CMD -f "$COMPOSE_FILE" down 2>&1 | grep -v "^podman" || true
        need_start=true
    fi
    
    # Uruchom kontenery jeśli potrzeba
    if [ "$need_start" = true ]; then
        $COMPOSE_CMD -f "$COMPOSE_FILE" up -d postgres redis minio adminer 2>&1 | grep -v "^podman" || true
    fi
    
    print_success "Kontenery uruchomione"

    print_step "Oczekiwanie na gotowość PostgreSQL..."
    local attempt=0
    while [ $attempt -lt 30 ]; do
        if $CONTAINER_ENGINE exec fairpact-dev-db pg_isready -U fairpact -d fairpact &> /dev/null; then
            print_success "PostgreSQL gotowy"
            return
        fi
        attempt=$((attempt + 1))
        sleep 1
    done
    print_warning "PostgreSQL może nie być jeszcze gotowy, kontynuuję..."
}

stop_containers() {
    print_step "Zatrzymywanie kontenerów..."
    cd "$SCRIPT_DIR"
    $COMPOSE_CMD -f "$COMPOSE_FILE" down 2>&1 | grep -v "^podman" || true
    print_success "Kontenery zatrzymane"
}

#-------------------------------------------------------------------------------
# Backend
#-------------------------------------------------------------------------------

setup_backend_venv() {
    print_step "Konfiguracja środowiska Python dla backendu..."
    cd "$BACKEND_DIR"

    if [ ! -d ".venv" ]; then
        python3 -m venv .venv
    fi

    source .venv/bin/activate

    if [ "$USE_UV" = true ]; then
        uv pip install -e ".[dev]" --quiet 2>/dev/null || uv pip install -e ".[dev]"
    else
        pip install -e ".[dev]" --quiet 2>/dev/null || pip install -e ".[dev]"
    fi

    print_success "Środowisko Python skonfigurowane"
}

run_migrations() {
    print_step "Uruchamianie migracji bazy danych..."
    cd "$BACKEND_DIR"
    source .venv/bin/activate

    if [ "$USE_UV" = true ]; then
        uv run alembic upgrade head
    else
        python -m alembic upgrade head
    fi

    print_success "Migracje wykonane"
}

start_backend() {
    print_step "Uruchamianie backendu FastAPI..."
    cd "$BACKEND_DIR"
    source .venv/bin/activate

    mkdir -p "$PID_DIR" "$SCRIPT_DIR/.logs"

    if [ "$USE_UV" = true ]; then
        nohup uv run uvicorn main:app --host 0.0.0.0 --port $BACKEND_PORT --reload > "$SCRIPT_DIR/.logs/backend.log" 2>&1 &
    else
        nohup python -m uvicorn main:app --host 0.0.0.0 --port $BACKEND_PORT --reload > "$SCRIPT_DIR/.logs/backend.log" 2>&1 &
    fi

    echo $! > "$BACKEND_PID_FILE"
    print_success "Backend uruchomiony (PID: $(cat $BACKEND_PID_FILE))"
}

start_celery() {
    print_step "Uruchamianie Celery worker..."
    cd "$BACKEND_DIR"
    source .venv/bin/activate

    mkdir -p "$PID_DIR" "$SCRIPT_DIR/.logs"

    if [ "$USE_UV" = true ]; then
        nohup uv run celery -A celery_app worker -Q documents,sync,celery --loglevel=info > "$SCRIPT_DIR/.logs/celery.log" 2>&1 &
    else
        nohup python -m celery -A celery_app worker -Q documents,sync,celery --loglevel=info > "$SCRIPT_DIR/.logs/celery.log" 2>&1 &
    fi

    echo $! > "$CELERY_PID_FILE"
    print_success "Celery worker uruchomiony (PID: $(cat $CELERY_PID_FILE))"
}

#-------------------------------------------------------------------------------
# Frontend
#-------------------------------------------------------------------------------

setup_frontend() {
    print_step "Konfiguracja frontendu Next.js..."
    cd "$FRONTEND_DIR"

    if [ ! -d "node_modules" ]; then
        npm install --silent 2>/dev/null || npm install
    fi

    print_success "Frontend skonfigurowany"
}

start_frontend() {
    print_step "Uruchamianie frontendu Next.js..."
    cd "$FRONTEND_DIR"

    mkdir -p "$PID_DIR" "$SCRIPT_DIR/.logs"

    nohup npm run dev > "$SCRIPT_DIR/.logs/frontend.log" 2>&1 &

    echo $! > "$FRONTEND_PID_FILE"
    print_success "Frontend uruchomiony (PID: $(cat $FRONTEND_PID_FILE))"
}

#-------------------------------------------------------------------------------
# Zatrzymywanie serwisów
#-------------------------------------------------------------------------------

stop_services() {
    print_step "Zatrzymywanie serwisów..."

    for pid_file in "$BACKEND_PID_FILE" "$CELERY_PID_FILE" "$FRONTEND_PID_FILE"; do
        if [ -f "$pid_file" ]; then
            PID=$(cat "$pid_file")
            kill -9 "$PID" 2>/dev/null || true
            rm -f "$pid_file"
        fi
    done

    pkill -9 -f "uvicorn main:app" 2>/dev/null || true
    pkill -9 -f "celery -A celery_app" 2>/dev/null || true
    pkill -9 -f "next dev" 2>/dev/null || true
    pkill -9 -f "next-serv" 2>/dev/null || true

    stop_containers
}

#-------------------------------------------------------------------------------
# Status
#-------------------------------------------------------------------------------

show_status() {
    print_header
    echo -e "${BLUE}Status serwisów:${NC}"
    echo ""

    echo -e "${CYAN}Kontenery:${NC}"
    $CONTAINER_ENGINE ps --filter "name=fairpact" --format "  {{.Names}}: {{.Status}}" 2>/dev/null || echo "  Brak"
    echo ""

    echo -e "${CYAN}Backend:${NC}"
    if [ -f "$BACKEND_PID_FILE" ] && kill -0 "$(cat $BACKEND_PID_FILE)" 2>/dev/null; then
        echo -e "  Status: ${GREEN}Uruchomiony${NC} | URL: http://localhost:$BACKEND_PORT"
    else
        echo -e "  Status: ${RED}Zatrzymany${NC}"
    fi

    echo -e "${CYAN}Celery:${NC}"
    if [ -f "$CELERY_PID_FILE" ] && kill -0 "$(cat $CELERY_PID_FILE)" 2>/dev/null; then
        echo -e "  Status: ${GREEN}Uruchomiony${NC}"
    else
        echo -e "  Status: ${RED}Zatrzymany${NC}"
    fi

    echo -e "${CYAN}Frontend:${NC}"
    if [ -f "$FRONTEND_PID_FILE" ] && kill -0 "$(cat $FRONTEND_PID_FILE)" 2>/dev/null; then
        echo -e "  Status: ${GREEN}Uruchomiony${NC} | URL: http://localhost:$FRONTEND_PORT"
    else
        echo -e "  Status: ${RED}Zatrzymany${NC}"
    fi
    echo ""
}

#-------------------------------------------------------------------------------
# Informacje końcowe
#-------------------------------------------------------------------------------

show_services_info() {
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC}              ${CYAN}Aplikacja uruchomiona pomyślnie!${NC}                 ${GREEN}║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}Dostępne serwisy:${NC}"
    echo ""
    echo -e "  ${CYAN}Frontend:${NC}        http://localhost:${FRONTEND_PORT}"
    echo -e "  ${CYAN}Backend API:${NC}     http://localhost:${BACKEND_PORT}"
    echo -e "  ${CYAN}API Docs:${NC}        http://localhost:${BACKEND_PORT}/docs"
    echo -e "  ${CYAN}Adminer (DB):${NC}    http://localhost:8080"
    echo -e "  ${CYAN}MinIO Console:${NC}   http://localhost:9001"
    echo ""
    echo -e "${BLUE}Dane logowania MinIO:${NC}  fairpact_admin / fairpact_admin_pass"
    echo -e "${BLUE}Dane logowania DB:${NC}    fairpact / fairpact_dev_pass"
    echo ""
    echo -e "${YELLOW}Logi:${NC}        tail -f .logs/backend.log"
    echo -e "${YELLOW}Zatrzymanie:${NC} ./start-app.sh --stop"
    echo -e "${YELLOW}Status:${NC}      ./start-app.sh --status"
    echo ""
}

#-------------------------------------------------------------------------------
# Pomoc
#-------------------------------------------------------------------------------

show_help() {
    echo "FairPact - Skrypt uruchomienia aplikacji"
    echo ""
    echo "Użycie: $0 [opcja]"
    echo ""
    echo "Opcje:"
    echo "  (brak)     Uruchom wszystkie serwisy"
    echo "  --stop     Zatrzymaj wszystkie serwisy"
    echo "  --status   Pokaż status serwisów"
    echo "  --help     Pokaż tę pomoc"
    echo ""
}

#-------------------------------------------------------------------------------
# Main
#-------------------------------------------------------------------------------

main() {
    case "${1:-}" in
        --stop)
            print_header
            init_environment
            stop_services
            print_success "Wszystkie serwisy zatrzymane"
            ;;
        --status)
            show_status
            ;;
        --help|-h)
            show_help
            ;;
        "")
            print_header
            check_requirements
            mkdir -p "$SCRIPT_DIR/.logs"
            start_containers
            setup_backend_venv
            run_migrations
            start_backend
            start_celery
            setup_frontend
            start_frontend
            print_step "Oczekiwanie na uruchomienie serwisów..."
            sleep 5
            show_services_info
            ;;
        *)
            print_error "Nieznana opcja: $1"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
