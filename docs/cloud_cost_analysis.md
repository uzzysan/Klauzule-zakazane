# Analiza Kosztów i Strategii Wdrożenia (Cloud Comparison)

Dokument przedstawia porównanie szacowanych kosztów wdrożenia aplikacji FairPact na środowisko produkcyjne u pięciu popularnych dostawców chmurowych.

## 1. Założenia Infrastruktury (Medium Scale)

Do kalkulacji przyjęto następujące parametry, zgodne z dokumentem `scaling_strategy.md`:

*   **Lokalizacja**: Europa (np. Frankfurt, Warszawa, Irlandia).
*   **Aplikacja (API)**: 2 kontenery (HA), każdy: 1 vCPU, 2 GB RAM.
*   **Worker (Celery)**: 1 kontener (do OCR/Analizy), 2 vCPU, 4 GB RAM.
*   **Baza Danych**: Managed PostgreSQL (High Availability opcjonalne, przyjęto Single AZ dla porównania podstawowego), klasa: ~2 vCPU, 4-8 GB RAM, 20 GB Storage.
*   **Cache**: Managed Redis (podstawowa instancja, np. AWS cache.t4g.micro).
*   **Object Storage**: 50 GB danych, 100 GB transferu wyjściowego.
*   **Traffic & LB**: Load Balancer, SSL termination, transfer wliczony lub osobno.

---

## 2. Zestawienie Szacunkowych Kosztów Miesięcznych (Miesięcznie)

Ceny są orientacyjne (stan na Q4 2024/2025) i mogą się różnić w zależności od regionu i konkretnego planu.

| Komponent | AWS (Elastic) | Azure (Container Apps) | Google Cloud (Cloud Run) | Heroku (PaaS) | Linode (Akamai) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Compute - API** (2x) | ~$40 (Fargate Spot/Small) | ~$45 (Container Apps) | ~$35 (Cloud Run - on demand) | $100 (2x Standard-2x) | $24 (2x Dedicated 2GB) |
| **Compute - Worker** (1x) | ~$30 (Fargate Medium) | ~$35 (Container Apps) | ~$30 (Cloud Run Jobs) | $50 (1x Standard-2x) | $24 (1x Dedicated 4GB) |
| **Managed DB** (Postgres) | ~$80 (RDS t3.medium) | ~$75 (Flex Server) | ~$70 (Cloud SQL) | $200+ (Standard 0/2) | $60 (Managed DB) |
| **Managed Redis** | ~$25 (ElastiCache micro) | ~$40 (Azure Redis Basic) | ~$35 (Memorystore) | $30 (Premium 0) | ~$20 (Managed) |
| **Storage & Network** | ~$10 (S3 + ALB) | ~$15 (Blob + LB) | ~$10 (GCS + LB) | $5 (Bucketeer/S3) | $5 (Obj Storage) |
| **Load Balancer** | ~$20 (ALB) | Wliczone* | Wliczone* | Wliczone (Router) | $10 (NodeBalancer) |
| **SUMA MIESIĘCZNIE** | **~$205 - $300** | **~$210 - $310** | **~$180 - $280** | **~$385 - $600+** | **~$143 - $160** |

*\*W usługach Serverless (Container Apps, Cloud Run) prosty routing jest często w cenie lub bardzo tani. Dedykowany LB to dodatkowy koszt.*

---

## 3. Szczegółowa Analiza Dostawców

### A. Linode (Akamai Connected Cloud) - **Najlepszy stosunek ceny do wydajności**
*   **Opis**: Idealne rozwiązanie dla startupów szukających surowej mocy obliczeniowej w niskiej cenie.
*   **Trudność wdrożenia**: **Wysoka/Średnia**. Wymaga samodzielnej konfiguracji (VPS) lub użycia "Biednego Kubernetes" (LKE jest tani, ale trzeba nim zarządzać).
*   **Zalety**:
    *   Zdecydowanie najniższe koszty (nawet o 50% taniej niż AWS).
    *   Przewidywalne rachunki (Flat rate).
    *   Prosty panel zarządzania.
*   **Wady**:
    *   Mniej usług zarządzanych ("Managed Services") niż u gigantów.
    *   Brak zaawansowanych narzędzi enterprise (np. skomplikowane polityki IAM).

### B. Heroku - **Najłatwiejsze wdrożenie, najwyższa cena**
*   **Opis**: Klasyczny PaaS. Wrzucasz kod (`git push`), a on działa.
*   **Trudność wdrożenia**: **Bardzo Niska**. Zero konfiguracji serwerów.
*   **Zalety**:
    *   Natychmiastowe wdrożenie (Time-to-market).
    *   Łatwe dodatki (Add-ons) do Redis/Postgres.
*   **Wady**:
    *   **Koszty rosną wykładniczo**. Worker 4GB RAM na Heroku to koszt rzędu $250-500/mies. (Performance-M Dyno). W tabeli przyjęto tańszy wariant, który może być za słaby.
    *   Ograniczone możliwości tuningu infrastruktury.
    *   Spanie (sleeping) darmowych/tanich dyno.

### C. Google Cloud Platform (GCP) - **Lider Serverless (Cloud Run)**
*   **Opis**: Cloud Run to świetna abstrakcja ("Run my Docker container"). Skaluje się do zera.
*   **Trudność wdrożenia**: **Średnia**. Wymaga konteneryzacji, ale same usługi są przyjazne.
*   **Zalety**:
    *   Cloud Run jest idealny do API typu Request-Response.
    *   Bardzo szybkie autoskalowanie.
    *   Świetna integracja narzędzi AI/ML (jeśli planujecie rozwój w tę stronę).
*   **Wady**:
    *   Worker Celery w Cloud Run wymaga specyficznej konfiguracji (np. `--no-cpu-throttling`) lub użycia Cloud Run Jobs, co może być droższe przy ciągłym działaniu 24/7.
    *   Skomplikowany panel IAM.

### D. AWS (Amazon Web Services) - **Standard Przemysłowy**
*   **Opis**: Najbezpieczniejszy wybór pod kątem przyszłego skalowania i rekrutacji specjalistów.
*   **Trudność wdrożenia**: **Wysoka**. Mnogość usług (ECS, EKS, Fargate, App Runner) i konfiguracji VPC/IAM.
*   **Zalety**:
    *   Największa dojrzałość i stabilność usług.
    *   ECS Fargate to świetny kompromis między zarządzaniem a serverless.
    *   RDS Aurora Serverless v2 pozwala na precyzyjne skalowanie bazy.
*   **Wady**:
    *   Skomplikowany cennik (Transfer, NAT Gateways, CloudWatch Logs - ukryte koszty).
    *   Wysoki próg wejścia (krzywa uczenia).

### E. Azure - **Solidny dla korporacji**
*   **Opis**: Azure Container Apps to odpowiedź na Cloud Run, bardzo udana.
*   **Trudność wdrożenia**: **Średnia/Wysoka**.
*   **Zalety**:
    *   Świetna integracja, jeśli firma już korzysta z Office365/GitHub.
    *   Azure Container Apps wspiera KEDA (skalowanie workera na podstawie długości kolejki Redis - **kluczowe dla projektu**).
*   **Wady**:
    *   Panel (Portal) bywa powolny i mało intuicyjny.
    *   Wdrożenie bazy PostgreSQL Flexible Server bywa droższe niż u konkurencji przy małych instancjach.

---

## 4. Rekomendacja Managera Wdrożeń

Dla projektu **FairPact**, biorąc pod uwagę architekturę opartą o kolejkę zadań (Celery + Redis) i potrzebę skalowania Workerów w oparciu o obciążenie:

**Rekomendacja 1: Google Cloud Platform (Cloud Run) lub Azure (Container Apps)**
Obie platformy oferują nowoczesne środowisko Serverless dla kontenerów. Azure Container Apps ma wbudowane wsparcie dla **KEDA** (Kubernetes Event-driven Autoscaling), co idealnie wpisuje się w potrzebę skalowania workera w zależności od liczby dokumentów w Redis. Kosztowo wyjdzie rozsądnie (~$200), a odchodzi utrzymanie serwerów.

**Rekomendacja 2: Linode (Jeśli budżet jest priorytetem)**
Jeśli chcecie zamknąć się w kwocie poniżej $150/mies., Linode (lub DigitalOcean/Hetzner) na dedykowanych VPS-ach z Docker Compose (lub małym klastrem K8s) będzie bezkonkurencyjne cenowo, ale musicie zatrudnić DevOpsa do konfiguracji backupów, firewalli i monitoringu.

**Odradzam**:
*   **Heroku**: Przy wymaganiach Worker 4GB RAM koszty będą nieproporcjonalnie wysokie.
*   **AWS (dla małego zespołu)**: Chyba że macie doświadczenie. Konfiguracja VPC, Subnets, Security Groups w AWS to spory narzut pracy na start.
