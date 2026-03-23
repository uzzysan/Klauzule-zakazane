
## Optymalizacja wydajności (2026-03-23)

### Zasoby Celery Workera



### Autoscaling
Celery automatycznie dostosowuje liczbę procesów:
- **Minimum**: 3 procesy (dla małego obciążenia)
- **Maksimum**: 10 procesów (gdy dużo zadań w kolejce)

### Dlaczego nie więcej?
- Serwer OVH ma 6 rdzeni CPU - zostawiamy 1 dla systemu i innych usług
- 11GB RAM - 6GB dla workera, reszta dla innych kontenerów

