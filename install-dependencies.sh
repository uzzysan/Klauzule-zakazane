#!/bin/bash
# FairPact - Skrypt instalacji zależności systemowych
# Ten skrypt instaluje wszystkie wymagane pakiety systemowe dla aplikacji FairPact

set -e

# Kolory
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_error() {
    echo -e "${RED}[BŁĄD]${NC} $1"
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info "Instalacja zależności systemowych dla FairPact"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Wykryj system operacyjny
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VERSION=$VERSION_ID
else
    log_error "Nie można wykryć systemu operacyjnego!"
    exit 1
fi

log_info "Wykryty system: $OS $VERSION"
echo ""

# Instalacja w zależności od systemu operacyjnego
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    log_info "Instalacja pakietów dla Ubuntu/Debian..."
    
    sudo apt-get update
    
    log_info "Instalowanie narzędzi deweloperskich..."
    sudo apt-get install -y build-essential
    
    log_info "Instalowanie Pythona i narzędzi..."
    sudo apt-get install -y \
        python3 \
        python3-pip \
        python3-dev \
        python3-venv
    
    log_info "Instalowanie bibliotek dla Pillow (przetwarzanie obrazów)..."
    sudo apt-get install -y \
        libjpeg-dev \
        zlib1g-dev \
        libpng-dev \
        libfreetype6-dev \
        liblcms2-dev \
        libopenjp2-7-dev \
        libtiff-dev \
        libwebp-dev
    
    log_info "Instalowanie dodatkowych bibliotek..."
    sudo apt-get install -y \
        libxml2-dev \
        libxslt1-dev \
        libffi-dev \
        libssl-dev
    
    log_info "Instalowanie Podman i Podman Compose..."
    sudo apt-get install -y podman
    
    # Instalacja podman-compose przez pip
    if ! command -v podman-compose &> /dev/null; then
        sudo pip3 install podman-compose
    fi
    
    log_info "Instalowanie Node.js i npm..."
    if ! command -v node &> /dev/null; then
        # Instalacja Node.js (możesz zmienić wersję)
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    
    log_success "Wszystkie pakiety zostały zainstalowane!"
    
elif [ "$OS" = "fedora" ] || [ "$OS" = "rhel" ] || [ "$OS" = "centos" ]; then
    log_info "Instalacja pakietów dla Fedora/RHEL/CentOS..."
    
    log_info "Instalowanie narzędzi deweloperskich..."
    sudo dnf groupinstall -y "Development Tools"
    
    log_info "Instalowanie Pythona i narzędzi..."
    sudo dnf install -y \
        python3 \
        python3-pip \
        python3-devel
    
    log_info "Instalowanie bibliotek dla Pillow..."
    sudo dnf install -y \
        libjpeg-turbo-devel \
        zlib-devel \
        libpng-devel \
        freetype-devel \
        lcms2-devel \
        openjpeg2-devel \
        libtiff-devel \
        libwebp-devel
    
    log_info "Instalowanie dodatkowych bibliotek..."
    sudo dnf install -y \
        libxml2-devel \
        libxslt-devel \
        libffi-devel \
        openssl-devel
    
    log_info "Instalowanie Podman i Podman Compose..."
    sudo dnf install -y podman podman-compose
    
    log_info "Instalowanie Node.js i npm..."
    if ! command -v node &> /dev/null; then
        sudo dnf install -y nodejs npm
    fi
    
    log_success "Wszystkie pakiety zostały zainstalowane!"
    
elif [ "$OS" = "arch" ] || [ "$OS" = "manjaro" ]; then
    log_info "Instalacja pakietów dla Arch Linux/Manjaro..."
    
    log_info "Instalowanie narzędzi deweloperskich..."
    sudo pacman -S --needed --noconfirm base-devel
    
    log_info "Instalowanie Pythona i narzędzi..."
    sudo pacman -S --needed --noconfirm \
        python \
        python-pip
    
    log_info "Instalowanie bibliotek dla Pillow..."
    sudo pacman -S --needed --noconfirm \
        libjpeg-turbo \
        zlib \
        libpng \
        freetype2 \
        lcms2 \
        openjpeg2 \
        libtiff \
        libwebp
    
    log_info "Instalowanie dodatkowych bibliotek..."
    sudo pacman -S --needed --noconfirm \
        libxml2 \
        libxslt \
        openssl
    
    log_info "Instalowanie Podman..."
    sudo pacman -S --needed --noconfirm podman
    
    # Instalacja podman-compose przez pip
    if ! command -v podman-compose &> /dev/null; then
        sudo pip install podman-compose
    fi
    
    log_info "Instalowanie Node.js i npm..."
    if ! command -v node &> /dev/null; then
        sudo pacman -S --needed --noconfirm nodejs npm
    fi
    
    log_success "Wszystkie pakiety zostały zainstalowane!"
    
else
    log_error "Nieobsługiwany system operacyjny: $OS"
    echo ""
    echo "Ręcznie zainstaluj następujące pakiety:"
    echo "  - Narzędzia deweloperskie (gcc, make, itp.)"
    echo "  - Python 3 (z nagłówkami i pip)"
    echo "  - Biblioteki: libjpeg, zlib, libpng, freetype"
    echo "  - Podman i podman-compose"
    echo "  - Node.js i npm (opcjonalnie)"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_success "Instalacja zakończona pomyślnie!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
log_info "Możesz teraz uruchomić aplikację za pomocą:"
echo "  ./start-app.sh"
echo ""
