# Plan Deploymentu Wersji Produkcyjnej - FairPact

## 1. Wstęp

Niniejszy dokument przedstawia analizę opcji wdrożeniowych dla aplikacji FairPact oraz rekomenduje optymalne rozwiązanie pod kątem kosztów, łatwości utrzymania i skalowalności. Celem jest zapewnienie stabilnego, wydajnego i bezpiecznego środowiska produkcyjnego przy zachowaniu racjonalnego budżetu.

W dokumencie przeanalizowano trzy główne podejścia:
1. **Chmura publiczna (Cloud PaaS/Serverless)** - np. AWS, Azure, Google Cloud.
2. **Dedykowana maszyna wirtualna (VPS)** - np. Hetzner, OVH, DigitalOcean.
3. **Konteneryzacja (Docker/Kubernetes)** - jako metoda zarządzania aplikacją.

---

## 2. Analiza Opcji Wdrożeniowych

| Cecha | 1. Cloud PaaS (np. AWS App Runner) | 2. Dedykowany VPS (np. Hetzner) | 3. Kubernetes (Managed K8s) |
| :--- | :--- | :--- | :--- |
| **Koszt (start)** | Wysoki / Nieprzewidywalny ($50-200/mc) | **Niski / Stały (€10-30/mc)** | Bardzo wysoki ($100+/mc) |
| **Skalowalność** | **Bardzo wysoka (Auto-scaling)** | Średnia (Vertical scaling łatwy, Horizontal trudniejszy) | Ekstremalna |
| **Zarządzanie (Ops)** | Niskie (Managed services) | **Wysokie (Linux administration)** | Bardzo wysokie (K8s complexity) |
| **Elastyczność** | Ograniczona (Vendor lock-in) | Pełna kontrola | Pełna kontrola, przenośność |
| **Wydajność** | Zależna od planu (Shared resources) | **Bardzo wysoka (Dedykowane zasoby)** | Wysoka (ale narzut K8s) |

### Wnioski z analizy:
- **Cloud PaaS** oferuje najłatwiejszy start i "święty spokój", ale koszty rosną liniowo lub wykładniczo wraz z ruchem. Dla projektu startupowego (bootstrapping) może to być "zabójca budżetu".
- **Kubernetes** to "armata na muchę" w obecnej fazie projektu. Wprowadza ogromną złożoność operacyjną nieuzasadnioną przy obecnej skali.
- **VPS + Docker Compose** to "złoty środek". Oferuje wydajność wielokrotnie droższych instancji chmurowych za ułamek ceny, przy akceptowalnym nakładzie pracy na konfigurację (jednorazową).

---

## 3. Rekomendowane Rozwiązanie: Model Hybrydowy

Proponujemy architekturę hybrydową wykorzystującą zalety taniego i wydajnego VPS dla backendu oraz globalnej sieci CDN dla frontendu.

### Architektura
1.  **Backend & Baza Danych (Hetzner VPS):**
    *   Wszystkie usługi backendowe (FastAPI, PostgreSQL, Redis, Celery, MinIO) uruchomione jako kontenery **Docker Compose** na pojedynczym, wydajnym serwerze VPS.
    *   **Zaleta:** Bardzo niska cena (ok. €20-30/mc) za dużą moc obliczeniową (np. 4-8 vCPU, 32GB RAM). Lokalna sieć między kontenerami zapewnia minimalne opóźnienia.
2.  **Frontend (Vercel):**
    *   Hosting aplikacji Next.js na platformie Vercel.
    *   **Zaleta:** Darmowy tier na start, globalny CDN, automatyczne buildy, zerowa konfiguracja serwera.

### Uzasadnienie ekonomiczne i techniczne
*   **Koszt całkowity:** ~€30/miesięcznie (w porównaniu do >€150/mc na AWS przy podobnych zasobach).
*   **Łatwość wdrożenia:** Docker Compose definiuje całe środowisko w jednym pliku. Jest to przenośne - przejście do chmury w przyszłości jest trywialne (przeniesienie kontenerów).
*   **Utrzymanie:** Użycie Managed Database (np. Supabase) jest opcją, ale samodzielny hosting na VPS (w kontenerze Docker) przy dobrych skryptach backupowych (już istniejących w projekcie) jest znacznie tańszy i wystarczająco bezpieczny na start.

---

## 4. Szczegółowy Plan Deploymentu

### Faza 1: Przygotowanie Infrastruktury (Tydzień 1)
1.  **Provisioning VPS:**
    *   Zakup instancji Hetzner Cloud (rekomendowana lokalizacja: Niemcy - Falkenstein/Norymberga dla niskich opóźnień w PL).
    *   OS: Ubuntu 24.04 LTS (najnowszy stabilny).
2.  **Konfiguracja Bazowa (Hardening):**
    *   Konfiguracja UFW (Firewall): Otwarcie tylko portów 22 (SSH), 80/443 (HTTP/S).
    *   Zabezpieczenie SSH (klucze, wyłączenie root login, fail2ban).
3.  **Instalacja Docker Engine & Compose:**
    *   Instalacja najnowszych wersji z oficjalnego repozytorium Docker.

### Faza 2: Konfiguracja CI/CD (Tydzień 1)
1.  **GitHub Actions:**
    *   Utworzenie workflow `deploy.yml`.
    *   **Krok Build:** Budowanie obrazów Dockera dla Backend i Worker.
    *   **Krok Push:** Wypychanie obrazów do GitHub Container Registry (GHCR) lub Docker Hub.
    *   **Krok Deploy:** Łączenie się z VPS przez SSH, pobieranie (`pull`) nowych obrazów i restart usług.
2.  **Secrets Management:**
    *   Dodanie zmiennych środowiskowych (klucze API, hasła DB) do GitHub Secrets.
    *   Stworzenie pliku `.env.production` na serwerze (jednorazowo, potem aktualizowany przez CD lub ręcznie przy zmianach konfiguracji).

### Faza 3: Uruchomienie Usług (Tydzień 2)
1.  **Baza Danych i Migracje:**
    *   Uruchomienie kontenera `postgres`.
    *   Wykonanie migracji Alembic.
    *   Zasilenie bazy danymi testowymi/słownikowymi (klauzule).
2.  **Proxy Odsprzęgające (Reverse Proxy):**
    *   Konfiguracja Nginx (lub Traefik) jako punktu wejścia.
    *   **SSL:** Automatyzacja certyfikatów Let's Encrypt (Certbot).
3.  **Frontend:**
    *   Podpięcie repozytorium do Vercel.
    *   Konfiguracja zmiennych środowiskowych (`NEXT_PUBLIC_API_URL` -> domena VPS).

---

## 5. Kosztorys i Skalowanie

### Kosztorys Miesięczny (Szacunek)

| Pozycja | Usługa | Koszt (Netto) | Uwagi |
| :--- | :--- | :--- | :--- |
| **VPS** | Hetzner CX41 | €12.90 | 4 vCPU, 16 GB RAM |
| **Backup** | Hetzner Storage Box / S3 | €1-5 | Tani storage na backupy |
| **Domena** | Rejestrator | ~€1 | Rocznie ok. €12 |
| **Frontend** | Vercel (Hobby) | €0 | Do momentu przekroczenia limitów |
| **Suma** | | **~€20 / mc** | Bardzo niski próg wejścia |

### Plan Rozwoju (Skalowanie)
1.  **Krok 1 (Obecny):** Wszystko na jednym VPS.
2.  **Krok 2 (Wzrost ruchu):** Wyniesienie bazy danych na osobny VPS lub Managed Service (np. Supabase/AWS RDS).
3.  **Krok 3 (Duże obciążenie):** Uruchomienie Load Balancera i wielu instancji VPS z aplikacją (Docker Swarm lub K8s jako ostateczność).

## 6. Utrzymanie (Maintenance)

Dla podejścia opartego na VPS, kluczowe są procedury utrzymaniowe:
1.  **Aktualizacje Systemu:** Comiesięczne `apt update && apt upgrade` (można zautomatyzować `unattended-upgrades`).
2.  **Backupy:** Skrypt `backup.sh` (z istniejącej dokumentacji) uruchamiany codziennie przez cron. Weryfikacja odtwarzalności raz na kwartał.
3.  **Monitoring:** Stack Prometheus + Grafana (już skonfigurowany w Dockerze) do śledzenia zużycia zasobów i dostępności. UptimeRobot do monitorowania z zewnątrz.

*Dokument przygotowany na podstawie analizy obecnej architektury i najlepszych praktyk DevOps.*
