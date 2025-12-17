# Raport Badawczy: Analiza Narzędzi OCR i Parsowania PDF

**Data:** 2025-12-13  
**Status:** Zakończony  
**Autor:** Role AI (Researcher)

## 1. Cel Badania
Celem badania było wyłonienie najskuteczniejszego zestawu narzędzi do ekstrakcji tekstu i tabel z polskich dokumentów prawnych (umów). Kluczowe aspekty to:
- Dokładność ekstrakcji tekstu z zachowaniem polskich znaków.
- Zdolność do odczytu struktury dokumentu (tabele, nagłówki).
- Wydajność (czas przetwarzania).
- Możliwość działania w trybie offline (wymóg projektu).

## 2. Metodologia
Testy przeprowadzono na przykładowym dokumencie `dane_testowe/enea-1.pdf` (Umowa kompleksowa ENEA, 1.1MB).

### Narzędzia testowane:
1.  **PDF Parsing (Native PDFs):**
    - `pdfplumber` (v0.10.3)
    - `PyMuPDF` (fitz) (v1.26.7)
2.  **OCR (Scanned Documents):**
    - `Tesseract 5` (via `pytesseract`)
    - `EasyOCR` (via `easyocr`)

## 3. Wyniki (Findings)

### 3.1 Parsowanie PDF (Native PDF)
| Narzędzie | Czas (1 strona) | Liczba Tabel | Jakość Tekstu | Uwagi |
|-----------|-----------------|--------------|---------------|-------|
| **pdfplumber** | ~1.10s | 12 | Średnia | Tekst nieco "poszatkowany", problemy z kolejnością sekcji. |
| **PyMuPDF** | ~3.75s | 13 | **Wysoka** | Bardzo dobre zachowanie struktury wizualnej. Wykryto więcej tabel. |

**Obserwacja:** Mimo że `pdfplumber` był w tym teście szybszy (prawdopodobnie ze względu na specyfikę detekcji tabel w PyMuPDF, która jest bardziej zaawansowana), jakość wyjściowa z `PyMuPDF` jest znacząco lepsza dla celów analizy semantycznej. Tekst jest spójny, co jest kluczowe dla NLP.

### 3.2 OCR (Dokumenty zaskanowane - symulacja)
Testy przeprowadzono na wygenerowanym obrazie pierwszej strony dokumentu.

| Narzędzie | Status | Czas | Uwagi |
|-----------|--------|------|-------|
| **Tesseract** | ❌ Niepowodzenie | N/A | Brak binarnego pliku `tesseract` w systemie. Wymagana instalacja systemowa (apt). |
| **EasyOCR** | ✅ Sukces | ~29.0s | Poprawnie odczytano tekst (polskie znaki, numery). Bardzo wolny na CPU. |

## 4. Rekomendacje

### 4.1 Podstawowy Silnik Parsowania
Rekomenduję **PyMuPDF (fitz)** jako główne narzędzie do przetwarzania dokumentów cyfrowych (native PDF).
- **Powód:** Lepsza jakość ekstrahowanego tekstu i struktury, co bezpośrednio wpłynie na jakość analizy klauzul.
- **Akcja:** Zaktualizować `requirements.txt` / `pyproject.toml` o `pymupdf`.

### 4.2 Obsługa OCR
Aktualna infrastruktura (brak `tesseract`) wymusza użycie **EasyOCR** lub instalację Tesseracta.
- **Rekomendacja:** Używać EasyOCR tylko jako **fallback** dla dokumentów, które nie posiadają warstwy tekstowej.
- **Optymalizacja:** Ze względu na czas (~30s/strona), proces OCR musi być asynchroniczny (kolejkowany w Celery).
- **System:** Jeśli to możliwe, należy zainstalować `tesseract-ocr` i `tesseract-ocr-pol` na serwerze produkcyjnym, gdyż będzie on znacznie szybszy (zwykle <1s/strona) od EasyOCR na CPU.

### 4.3 Strategia Hybrydowa
Należy wdrożyć logikę:
1.  Sprawdź czy PDF ma warstwę tekstową.
2.  Jeśli TAK -> Użyj **PyMuPDF**.
3.  Jeśli NIE -> Użyj **EasyOCR** (lub Tesseract po instalacji).

## 5. Ryzyka
- **Wydajność OCR:** 30 sekund na stronę przy EasyOCR na CPU to wąskie gardło. Długa umowa (10 stron) zajmie 5 minut. Użytkownik może zrezygnować.
- **Brak Tesseracta:** Uzależnienie od wolnego EasyOCR.

## 6. Zasoby
- Dokumentacja PyMuPDF: https://pymupdf.readthedocs.io/
- Dokumentacja EasyOCR: https://github.com/JaidedAI/EasyOCR
