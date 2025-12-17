#!/bin/bash
# FairPact - Skrypt automatycznego uruchamiania aplikacji
# Ten skrypt sprawdza wymagane zależności i uruchamia backend oraz frontend aplikacji

set -e  # Zatrzymaj wykonywanie skryptu w przypadku błędu

# Kolory dla lepszej czytelności
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funkcja do wyświetlania kolorowych komunikatów
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[OSTRZEŻENIE]${NC} $1"
}

log_error() {
    echo -e "${RED}[BŁĄD]${NC} $1"
}

# Sprawdź czy skrypt jest uruchomiony z właściwego katalogu
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

log_info "Sprawdzanie katalogu projektu..."
if [ ! -f "docker-compose.dev.yml" ]; then
    log_error "Nie znaleziono pliku docker-compose.dev.yml w bieżącym katalogu!"
    log_error "Upewnij się, że uruchamiasz skrypt z głównego katalogu projektu."
    exit 1
fi
log_success "Katalog projektu: $SCRIPT_DIR"

# Sprawdź wymagane pakiety
log_info "Sprawdzanie wymaganych pakietów..."

# Sprawdź podman
if ! command -v podman &> /dev/null; then
    log_error "Podman nie jest zainstalowany!"
    echo "Zainstaluj Podman za pomocą:"
    echo "  - Fedora/RHEL: sudo dnf install podman"
    echo "  - Ubuntu/Debian: sudo apt-get install podman"
    echo "  - Arch: sudo pacman -S podman"
    exit 1
fi
log_success "Podman zainstalowany: $(podman --version)"

# Sprawdź podman-compose
if ! command -v podman-compose &> /dev/null; then
    log_error "Podman-compose nie jest zainstalowany!"
    echo "Zainstaluj podman-compose za pomocą:"
    echo "  pip install podman-compose"
    echo "  lub:"
    echo "  sudo dnf install podman-compose"
    exit 1
fi
log_success "Podman-compose zainstalowany: $(podman-compose --version)"

# Sprawdź Python3
if ! command -v python3 &> /dev/null; then
    log_error "Python3 nie jest zainstalowany!"
    echo "Zainstaluj Python3 za pomocą menedżera pakietów swojej dystrybucji."
    exit 1
fi
log_success "Python3 zainstalowany: $(python3 --version)"

# Sprawdź pip
if ! command -v pip3 &> /dev/null && ! command -v pip &> /dev/null; then
    log_error "pip nie jest zainstalowany!"
    echo "Zainstaluj pip za pomocą:"
    echo "  sudo apt-get install python3-pip  # Ubuntu/Debian"
    echo "  lub:"
    echo "  sudo dnf install python3-pip      # Fedora/RHEL"
    exit 1
fi
log_success "pip zainstalowany"

# Sprawdź Node.js i npm (dla frontendu)
if ! command -v node &> /dev/null; then
    log_warning "Node.js nie jest zainstalowany - frontend nie uruchomi się w trybie dev!"
    log_warning "Frontend będzie dostępny tylko przez kontenery Docker."
else
    log_success "Node.js zainstalowany: $(node --version)"
fi

if ! command -v npm &> /dev/null; then
    log_warning "npm nie jest zainstalowany - frontend nie uruchomi się w trybie dev!"
else
    log_success "npm zainstalowany: $(npm --version)"
fi

echo ""
log_info "Wszystkie wymagane pakiety są zainstalowane!"
echo ""

# Sprawdź czy środowisko wirtualne Python istnieje
log_info "Sprawdzanie środowiska wirtualnego Python..."
if [ ! -d "backend/venv" ]; then
    log_warning "Środowisko wirtualne Python nie istnieje. Tworzę nowe..."
    
    # Sprawdź czy python3-venv jest zainstalowany
    if ! python3 -m venv --help &> /dev/null; then
        log_error "Moduł venv nie jest dostępny!"
        echo "Zainstaluj python3-venv:"
        echo "  sudo apt-get install python3-venv  # Ubuntu/Debian"
        echo "  lub:"
        echo "  sudo dnf install python3-venv      # Fedora/RHEL"
        exit 1
    fi
    
    cd backend
    python3 -m venv venv
    cd ..
    log_success "Środowisko wirtualne utworzone"
else
    log_success "Środowisko wirtualne istnieje"
fi

# Aktywuj środowisko wirtualne i zainstaluj zależności
log_info "Aktywowanie środowiska wirtualnego i instalacja zależności..."
source backend/venv/bin/activate

if [ -f "backend/requirements.txt" ]; then
    log_info "Instalowanie zależności Python..."
    pip install -q --upgrade pip
    pip install -q -r backend/requirements.txt
    log_success "Zależności Python zainstalowane"
else
    log_warning "Plik requirements.txt nie został znaleziony"
fi

# Sprawdź czy zależności frontendu są zainstalowane
if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
    log_info "Sprawdzanie zależności frontendu..."
    if [ ! -d "frontend/node_modules" ]; then
        if command -v npm &> /dev/null; then
            log_info "Instalowanie zależności npm..."
            cd frontend
            npm install
            cd ..
            log_success "Zależności npm zainstalowane"
        else
            log_warning "npm nie jest dostępne - pomijam instalację zależności frontendu"
        fi
    else
        log_success "Zależności npm są już zainstalowane"
    fi
fi

echo ""
log_info "Uruchamianie kontenerów za pomocą podman-compose..."
echo ""

# Zatrzymaj istniejące kontenery (jeśli działają)
log_info "Zatrzymywanie istniejących kontenerów..."
podman-compose -f docker-compose.dev.yml down 2>/dev/null || true

# Uruchom kontenery
log_info "Uruchamianie nowych kontenerów..."
podman-compose -f docker-compose.dev.yml up -d --build

# Poczekaj na uruchomienie serwisów
log_info "Czekam na uruchomienie serwisów..."
sleep 10

# Sprawdź status kontenerów
log_info "Sprawdzanie statusu kontenerów..."
echo ""
podman-compose -f docker-compose.dev.yml ps

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_success "Aplikacja FairPact została uruchomiona!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}Dostępne usługi:${NC}"
echo ""
echo -e "  ${BLUE}📊 PostgreSQL Database:${NC}    localhost:5432"
echo -e "  ${BLUE}🔴 Redis:${NC}                  localhost:6379"
echo -e "  ${BLUE}📦 MinIO (S3):${NC}              localhost:9000"
echo -e "  ${BLUE}🎛️  MinIO Console:${NC}          http://localhost:9001"
echo -e "  ${BLUE}🗄️  Adminer (DB UI):${NC}        http://localhost:8080"
echo ""
echo -e "${YELLOW}Uwaga:${NC} Backend API i Frontend muszą być uruchomione osobno w trybie dev:"
echo ""
echo -e "  ${GREEN}Backend API:${NC}"
echo -e "    cd backend"
echo -e "    source venv/bin/activate"
echo -e "    uvicorn main:app --reload --host 0.0.0.0 --port 8000"
echo -e "    Dostępny pod: ${BLUE}http://localhost:8000${NC}"
echo ""
echo -e "  ${GREEN}Frontend:${NC}"
echo -e "    cd frontend"
echo -e "    npm run dev"
echo -e "    Dostępny pod: ${BLUE}http://localhost:3000${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
log_info "Aby zatrzymać kontenery, użyj:"
echo "  podman-compose -f docker-compose.dev.yml down"
echo ""
log_info "Aby zobaczyć logi kontenerów:"
echo "  podman-compose -f docker-compose.dev.yml logs -f"
echo ""
