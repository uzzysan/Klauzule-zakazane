<#
.SYNOPSIS
    FairPact - Skrypt automatycznego uruchomienia aplikacji (Windows)

.DESCRIPTION
    Sprawdza wymagane zależności, uruchamia kontenery i serwisy deweloperskie.
    Odpowiednik start-app.sh dla systemu Windows.

.EXAMPLE
    .\start-app.ps1
    Uruchamia wszystkie serwisy.

.EXAMPLE
    .\start-app.ps1 -Stop
    Zatrzymuje wszystkie serwisy.
#>

param (
    [switch]$Stop,
    [switch]$Status,
    [switch]$Help
)

$ErrorActionPreference = "Stop"

# --- Konfiguracja ---
$ScriptDir = $PSScriptRoot
$BackendDir = Join-Path $ScriptDir "backend"
$FrontendDir = Join-Path $ScriptDir "frontend"
$ComposeFile = Join-Path $ScriptDir "docker-compose.dev.yml"
$PidDir = Join-Path $ScriptDir ".pids"
$LogDir = Join-Path $ScriptDir ".logs"

$BackendPidFile = Join-Path $PidDir "backend.pid"
$FrontendPidFile = Join-Path $PidDir "frontend.pid"
$CeleryPidFile = Join-Path $PidDir "celery.pid"

$BackendPort = 8000
$FrontendPort = 3000

# --- Funkcje Pomocnicze ---
function Log-Info ($Message) { Write-Host "[INFO] $Message" -ForegroundColor Cyan }
function Log-Success ($Message) { Write-Host "[OK] $Message" -ForegroundColor Green }
function Log-Warning ($Message) { Write-Host "[UWAGA] $Message" -ForegroundColor Yellow }
function Log-Error ($Message) { Write-Host "[BŁĄD] $Message" -ForegroundColor Red }

function Print-Header {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║        FairPact - Contract Analysis Application (Windows)      ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Show-Help {
    Get-Help $MyInvocation.MyCommand.Path -Detailed
}

# --- Sprawdzanie Wymagań ---
function Check-Requirements {
    Log-Info "Sprawdzanie wymagań systemowych..."
    
    # Python
    if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
        Log-Error "Python nie jest zainstalowany."
        exit 1
    }
    
    # Node/NPM
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Log-Error "npm nie jest zainstalowany."
        exit 1
    }

    # Docker/Podman
    $global:DockerCmd = "docker"
    $global:ComposeCmd = $null
    
    if (Get-Command podman -ErrorAction SilentlyContinue) {
        $global:DockerCmd = "podman"
        Log-Success "Wykryto Podman."
        
        if (Get-Command podman-compose -ErrorAction SilentlyContinue) {
            $global:ComposeCmd = "podman-compose"
            Log-Success "Wykryto podman-compose."
        } else {
            Log-Warning "Nie znaleziono 'podman-compose', próbuję 'podman compose'..."
            $global:ComposeCmd = "podman compose"
        }
    } elseif (Get-Command docker -ErrorAction SilentlyContinue) {
        $global:DockerCmd = "docker"
        Log-Success "Wykryto Docker."
        
        if (docker compose version *>&1 | Select-String "Docker Compose") {
             $global:ComposeCmd = "docker compose"
             Log-Success "Wykryto 'docker compose'."
        } elseif (Get-Command docker-compose -ErrorAction SilentlyContinue) {
             $global:ComposeCmd = "docker-compose"
             Log-Success "Wykryto 'docker-compose'."
        }
    }
    
    if (-not $global:ComposeCmd) {
        Log-Error "Nie znaleziono narzędzia compose (podman-compose, docker-compose ani pluginu docker compose)."
        exit 1
    }
    
    # UV Check
    $global:UseUv = $false
    if (Get-Command uv -ErrorAction SilentlyContinue) {
        $global:UseUv = $true
        Log-Success "Wykryto uv - będzie używane do zarządzania Pythonem."
    }
}

# --- Zarządzanie Kontenerami ---
function Start-Containers {
    Log-Info "Uruchamianie kontenerów (PostgreSQL, Redis, MinIO)..."
    Set-Location $ScriptDir
    
    # Rozdzielenie komendy docker compose na argumenty
    $CmdParts = -split $global:ComposeCmd
    $ExeName = $CmdParts[0]
    
    # Resolve full path to executable to avoid Start-Process errors
    $ExeCommand = Get-Command $ExeName -ErrorAction SilentlyContinue
    if (-not $ExeCommand) {
        Log-Error "Nie można znaleźć pliku wykonywalnego: $ExeName"
        exit 1
    }
    $ExePath = $ExeCommand.Source

    $ArgsList = @()
    if ($CmdParts.Length -gt 1) {
        $ArgsList += $CmdParts[1..($CmdParts.Length-1)]
    }
    $ArgsList += @("-f", "$ComposeFile", "up", "-d", "postgres", "redis", "minio", "adminer")

    Log-Info "Wykonywanie: $ExePath $ArgsList"
    Start-Process -FilePath $ExePath -ArgumentList $ArgsList -Wait -NoNewWindow
    Log-Success "Kontenery uruchomione w tle."
}

function Stop-Containers {
    Log-Info "Zatrzymywanie kontenerów..."
    Set-Location $ScriptDir
    
    $CmdParts = -split $global:ComposeCmd
    $ExeName = $CmdParts[0]
    
    $ExeCommand = Get-Command $ExeName -ErrorAction SilentlyContinue
    if (-not $ExeCommand) {
        # Jeśli nie możemy znaleźć komendy, trudno zatrzymać, ale spróbujmy nie failować krytycznie w cleanupie
        Log-Warning "Nie można znaleźć komendy '$ExeName' do zatrzymania kontenerów."
        return
    }
    $ExePath = $ExeCommand.Source

    $ArgsList = @()
    if ($CmdParts.Length -gt 1) {
        $ArgsList += $CmdParts[1..($CmdParts.Length-1)]
    }
    $ArgsList += @("-f", "$ComposeFile", "down")
    
    Start-Process -FilePath $ExePath -ArgumentList $ArgsList -Wait -NoNewWindow
    Log-Success "Kontenery zatrzymane."
}

# --- Backend ---
function Setup-Backend {
    Log-Info "Konfiguracja środowiska Python..."
    Set-Location $BackendDir
    
    if (-not (Test-Path ".venv")) {
        python -m venv .venv
    }
    
    $PythonExe = Join-Path $BackendDir ".venv\Scripts\python.exe"
    
    # Instalacja zależności
    if ($global:UseUv) {
        # uv pip install -e ".[dev]"
        # Uwaga: uv wymaga aktywnego venv lub wskazania go, tu użyjemy python -m pip jeśli uv failuje lub bezpośrednio modules
        # Prościej użyć pip z venv pythona
        & $PythonExe -m pip install -e ".[dev]" --quiet
    } else {
        & $PythonExe -m pip install -e ".[dev]" --quiet
    }
    
    Log-Success "Zależności zainstalowane."
}

function Run-Migrations {
    Log-Info "Uruchamianie migracji..."
    Set-Location $BackendDir
    $PythonExe = Join-Path $BackendDir ".venv\Scripts\python.exe"
    
    & $PythonExe -m alembic upgrade head
    Log-Success "Migracje zakończone."
}

function Start-Backend {
    Log-Info "Uruchamianie Backend (FastAPI)..."
    Set-Location $BackendDir
    if (-not (Test-Path $PidDir)) { New-Item -ItemType Directory -Path $PidDir | Out-Null }
    if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir | Out-Null }
    
    $PythonExe = Join-Path $BackendDir ".venv\Scripts\python.exe"
    $LogFile = Join-Path $LogDir "backend.log"
    
    # Uruchamiamy jako proces w tle
    # PowerShell Start-Process nie pozwala przekierować stdout i stderr do tego samego pliku bezpośrednio
    
    $Process = Start-Process -FilePath $PythonExe `
        -ArgumentList "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "$BackendPort", "--reload" `
        -RedirectStandardOutput $LogFile `
        -PassThru `
        -WindowStyle Hidden
        
    $Process.Id | Out-File -FilePath $BackendPidFile -Encoding ascii
    Log-Success "Backend uruchomiony (PID: $($Process.Id)). Logi: .logs\backend.log"
}

function Start-Celery {
    Log-Info "Uruchamianie Celery Worker..."
    Set-Location $BackendDir
    
    # Celery na Windows ma ograniczenia (wymaga pool=solo lub threads dla deweloperki), 
    # ale spróbujmy standardowo. Jeśli failuje, użytkownik zobaczy w logach.
    # Dodajemy --pool=solo dla stabilności na Windows.
    
    $PythonExe = Join-Path $BackendDir ".venv\Scripts\python.exe"
    $LogFile = Join-Path $LogDir "celery.log"
    
    $Process = Start-Process -FilePath $PythonExe `
        -ArgumentList "-m", "celery", "-A", "celery_app", "worker", "-Q", "documents,sync,celery", "--loglevel=info", "--pool=solo" `
        -RedirectStandardOutput $LogFile `
        -PassThru `
        -WindowStyle Hidden
        
    $Process.Id | Out-File -FilePath $CeleryPidFile -Encoding ascii
    Log-Success "Celery uruchomiony (PID: $($Process.Id)). Logi: .logs\celery.log"
}

# --- Frontend ---
function Setup-Frontend {
    Log-Info "Konfiguracja Frontend..."
    Set-Location $FrontendDir
    if (-not (Test-Path "node_modules")) {
        # npm ci jest bardziej stabilne i szybsze, jeśli jest lockfile
        if (Test-Path "package-lock.json") {
             npm ci --silent
        } else {
             npm install --silent
        }
    }
}

function Start-Frontend {
    Log-Info "Uruchamianie Frontend (Next.js)..."
    Set-Location $FrontendDir
    
    $LogFile = Join-Path $LogDir "frontend.log"
    
    # npm run dev na Windows to cmd /c npm ...
    $Process = Start-Process -FilePath "npm.cmd" `
        -ArgumentList "run", "dev" `
        -RedirectStandardOutput $LogFile `
        -PassThru `
        -WindowStyle Hidden
        
    $Process.Id | Out-File -FilePath $FrontendPidFile -Encoding ascii
    Log-Success "Frontend uruchomiony (PID: $($Process.Id)). Logi: .logs\frontend.log"
}

# --- Zatrzymywanie ---
function Stop-Services {
    Log-Info "Zatrzymywanie serwisów..."
    
    $PidsFiles = @($BackendPidFile, $CeleryPidFile, $FrontendPidFile)
    
    foreach ($File in $PidsFiles) {
        if (Test-Path $File) {
            $PidVal = Get-Content $File
            Log-Info "Zabijanie procesu PID: $PidVal z pliku $(Split-Path $File -Leaf)"
            try {
                Stop-Process -Id $PidVal -ErrorAction SilentlyContinue -Force
            } catch {
                # Ignoruj jeśli już nie istnieje
            }
            Remove-Item $File -Force
        }
    }
    
    # Dodatkowe czyszczenie po nazwach (backup)
    Get-Process uvicorn, celery, node -ErrorAction SilentlyContinue | Where-Object { $_.StartTime -gt (Get-Date).AddDays(-1) } | ForEach-Object {
        # Ostrożnie z zabijaniem wszystkiego, ale w dev env dopuszczalne
        # Write-Host "Checking process $($_.Id)"
    }
    
    Stop-Containers
}

# --- Status ---
function Show-Status {
    Print-Header
    Log-Info "Status serwisów:"
    
    # Sprawdź pliki PID
    $Services = @{
        "Backend" = $BackendPidFile
        "Celery" = $CeleryPidFile
        "Frontend" = $FrontendPidFile
    }
    
    foreach ($Key in $Services.Keys) {
        $File = $Services[$Key]
        $Status = "ZATRZYMANY"
        $Col = "Red"
        
        if (Test-Path $File) {
            $PidVal = Get-Content $File
            if (Get-Process -Id $PidVal -ErrorAction SilentlyContinue) {
                $Status = "URUCHOMIONY (PID: $PidVal)"
                $Col = "Green"
            }
        }
        Write-Host "  $Key : $Status" -ForegroundColor $Col
    }
}

function Show-Info {
    Write-Host ""
    Log-Success "Aplikacja uruchomiona pomyślnie!"
    Write-Host ""
    Write-Host "  Frontend:     http://localhost:$FrontendPort" -ForegroundColor Cyan
    Write-Host "  Backend API:  http://localhost:$BackendPort" -ForegroundColor Cyan
    Write-Host "  API Docs:     http://localhost:$BackendPort/docs" -ForegroundColor Cyan
    Write-Host "  Adminer:      http://localhost:8080" -ForegroundColor Cyan
    Write-Host "  MinIO:        http://localhost:9001" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Zatrzymanie:  .\start-app.ps1 -Stop" -ForegroundColor Yellow
}

# --- Main ---

if ($Help) {
    Show-Help
    exit 0
}

if ($Stop) {
    Print-Header
    check-Requirements # Żeby wiedzieć czym zatrzymać kontenery
    Stop-Services
    exit 0
}

if ($Status) {
    Show-Status
    exit 0
}

# Standardowy start
Print-Header
Check-Requirements

# Utwórz katalogi
if (-not (Test-Path $PidDir)) { New-Item -ItemType Directory -Path $PidDir | Out-Null }
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir | Out-Null }

Start-Containers
Setup-Backend
Run-Migrations
Start-Backend
Start-Celery
Setup-Frontend
Start-Frontend

Start-Sleep -Seconds 5
Show-Info
