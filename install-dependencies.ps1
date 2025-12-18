# FairPact - Skrypt weryfikacji zależności systemowych (Windows)
# Ten skrypt sprawdza obecność wymaganych narzędzi.

$ErrorActionPreference = "Stop"

# Kolory
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"

function Log-Info ($Message) {
    Write-Host "[INFO] $Message" -ForegroundColor $Cyan
}

function Log-Success ($Message) {
    Write-Host "[OK] $Message" -ForegroundColor $Green
}

function Log-Warning ($Message) {
    Write-Host "[UWAGA] $Message" -ForegroundColor $Yellow
}

function Log-Error ($Message) {
    Write-Host "[BŁĄD] $Message" -ForegroundColor $Red
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Log-Info "Weryfikacja zależności systemowych dla FairPact (Windows)"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host ""

$MissingDeps = @()

# 1. Sprawdź Python
Log-Info "Sprawdzanie Python..."
if (Get-Command python -ErrorAction SilentlyContinue) {
    $PyVer = python --version 2>&1
    Log-Success "Znaleziono: $PyVer"
} else {
    Log-Error "Nie znaleziono Pythona."
    $MissingDeps += "Python 3"
}

# 2. Sprawdź Node.js
Log-Info "Sprawdzanie Node.js..."
if (Get-Command node -ErrorAction SilentlyContinue) {
    $NodeVer = node --version
    Log-Success "Znaleziono: $NodeVer"
} else {
    Log-Error "Nie znaleziono Node.js."
    $MissingDeps += "Node.js (LTS)"
}

# 3. Sprawdź Docker / Podman
Log-Info "Sprawdzanie Docker / Podman..."
$ContainerEngine = $null
if (Get-Command docker -ErrorAction SilentlyContinue) {
    $DockerVer = docker --version
    Log-Success "Znaleziono: $DockerVer"
    $ContainerEngine = "docker"
} elseif (Get-Command podman -ErrorAction SilentlyContinue) {
    $PodmanVer = podman --version
    Log-Success "Znaleziono: $PodmanVer"
    $ContainerEngine = "podman"
} else {
    Log-Error "Nie znaleziono Docker Desktop ani Podman."
    $MissingDeps += "Docker Desktop lub Podman"
}

# 4. Sprawdź uv (opcjonalne)
Log-Info "Sprawdzanie narzędzia 'uv' (opcjonalne, zalecane)..."
if (Get-Command uv -ErrorAction SilentlyContinue) {
    $UvVer = uv --version
    Log-Success "Znaleziono: $UvVer"
} else {
    Log-Warning "Nie znaleziono 'uv'. Skrypty będą używać standardowego 'pip'."
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if ($MissingDeps.Count -gt 0) {
    Log-Error "Brakuje następujących zależności:"
    foreach ($Dep in $MissingDeps) {
        Write-Host "  - $Dep" -ForegroundColor $Red
    }
    
    Write-Host ""
    Log-Info "Sugerowana instalacja (jeśli masz zainstalowany 'winget'):"
    if ($MissingDeps -contains "Python 3") {
        Write-Host "  winget install Python.Python.3.11"
    }
    if ($MissingDeps -contains "Node.js (LTS)") {
        Write-Host "  winget install OpenJS.NodeJS.LTS"
    }
    if ($MissingDeps -contains "Docker Desktop lub Podman") {
        Write-Host "  winget install Docker.DockerDesktop"
    }
    
    Write-Host ""
    Write-Host "Zainstaluj brakujące narzędzia i uruchom skrypt ponownie."
    exit 1
} else {
    Log-Success "Wszystkie wymagane zależności są zainstalowane!"
    Log-Info "Możesz uruchomić aplikację za pomocą: .\start-app.ps1"
}
