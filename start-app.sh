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

# Sprawdź zależności systemowe wymagane do kompilacji pakietów Python
log_info "Sprawdzanie zależności systemowych dla pakietów Python..."

MISSING_DEPS=()
INSTALL_COMMANDS=()

# Wykryj system operacyjny
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    OS=$(uname -s)
fi

# Sprawdź gcc (kompilator C)
if ! command -v gcc &> /dev/null; then
    MISSING_DEPS+=("gcc (kompilator C)")
fi

# Sprawdź czy są zainstalowane nagłówki Pythona
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
    if ! dpkg -l | grep -q "python${PYTHON_VERSION}-dev"; then
        MISSING_DEPS+=("python3-dev (nagłówki Python)")
    fi
    
    # Sprawdź biblioteki dla Pillow
    PILLOW_DEPS=("libjpeg-dev" "zlib1g-dev" "libpng-dev" "libfreetype6-dev")
    for dep in "${PILLOW_DEPS[@]}"; do
        if ! dpkg -l | grep -q "$dep"; then
            MISSING_DEPS+=("$dep")
        fi
    done
    
    if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
        INSTALL_COMMANDS+=("sudo apt-get update")
        INSTALL_COMMANDS+=("sudo apt-get install -y build-essential python3-dev libjpeg-dev zlib1g-dev libpng-dev libfreetype6-dev")
    fi
    
elif [ "$OS" = "fedora" ] || [ "$OS" = "rhel" ] || [ "$OS" = "centos" ]; then
    if ! rpm -q python3-devel &> /dev/null; then
        MISSING_DEPS+=("python3-devel (nagłówki Python)")
    fi
    
    # Sprawdź biblioteki dla Pillow
    PILLOW_DEPS=("libjpeg-turbo-devel" "zlib-devel" "libpng-devel" "freetype-devel")
    for dep in "${PILLOW_DEPS[@]}"; do
        if ! rpm -q "$dep" &> /dev/null; then
            MISSING_DEPS+=("$dep")
        fi
    done
    
    if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
        INSTALL_COMMANDS+=("sudo dnf groupinstall -y 'Development Tools'")
        INSTALL_COMMANDS+=("sudo dnf install -y python3-devel libjpeg-turbo-devel zlib-devel libpng-devel freetype-devel")
    fi
    
elif [ "$OS" = "arch" ] || [ "$OS" = "manjaro" ]; then
    # Arch zwykle ma wszystko w base-devel
    if ! pacman -Qq base-devel &> /dev/null; then
        MISSING_DEPS+=("base-devel")
    fi
    
    if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
        INSTALL_COMMANDS+=("sudo pacman -S --needed base-devel python libjpeg-turbo zlib libpng freetype2")
    fi
fi

if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
    log_error "Brakujące zależności systemowe:"
    for dep in "${MISSING_DEPS[@]}"; do
        echo "  - $dep"
    done
    echo ""
    log_error "Te pakiety są wymagane do kompilacji pakietów Python (np. Pillow)."
    echo ""
    if [ ${#INSTALL_COMMANDS[@]} -gt 0 ]; then
        log_info "Zainstaluj je za pomocą następujących komend:"
        for cmd in "${INSTALL_COMMANDS[@]}"; do
            echo "  $cmd"
        done
    fi
    echo ""
    read -p "Czy chcesz kontynuować mimo brakujących zależności? (t/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Tt]$ ]]; then
        log_error "Instalacja przerwana. Zainstaluj wymagane pakiety i uruchom skrypt ponownie."
        exit 1
    fi
    log_warning "Kontynuacja mimo brakujących zależności - mogą wystąpić błędy podczas instalacji pakietów Python!"
else
    log_success "Wszystkie wymagane zależności systemowe są zainstalowane"
fi

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
    
    # Spróbuj zainstalować zależności
    if pip install -q -r backend/requirements.txt; then
        log_success "Zależności Python zainstalowane"
    else
        log_error "Wystąpił błąd podczas instalacji zależności Python!"
        echo ""
        echo "Najbardziej prawdopodobne przyczyny:"
        echo "  1. Brakujące biblioteki systemowe (np. dla Pillow, lxml)"
        echo "  2. Niekompatybilna wersja Pythona"
        echo "  3. Problemy z siecią"
        echo ""
        log_info "Spróbuj uruchomić instalację ręcznie aby zobaczyć szczegóły błędu:"
        echo "  source backend/venv/bin/activate"
        echo "  pip install -r backend/requirements.txt"
        echo ""
        
        # Sprawdź czy to problem z Pillow
        if grep -q "Pillow" backend/requirements.txt; then
            log_warning "W requirements.txt znajduje się Pillow - upewnij się, że masz zainstalowane:"
            if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
                echo "  sudo apt-get install -y build-essential python3-dev libjpeg-dev zlib1g-dev libpng-dev libfreetype6-dev"
            elif [ "$OS" = "fedora" ] || [ "$OS" = "rhel" ] || [ "$OS" = "centos" ]; then
                echo "  sudo dnf install -y gcc python3-devel libjpeg-turbo-devel zlib-devel libpng-devel freetype-devel"
            fi
        fi
        
        echo ""
        read -p "Czy chcesz kontynuować mimo błędów? (t/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Tt]$ ]]; then
            log_error "Instalacja przerwana."
            exit 1
        fi
        log_warning "Kontynuacja mimo błędów - aplikacja może nie działać poprawnie!"
    fi
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
