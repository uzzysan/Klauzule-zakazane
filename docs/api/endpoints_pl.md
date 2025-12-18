# FairPact - Specyfikacja API v1.0

## Informacje o Dokumencie
- **Wersja:** 1.0
- **Ostatnia aktualizacja:** 2025-12-18
- **Bazowy URL:** `https://api.fairpact.com` (Produkcja)
- **Bazowy URL:** `http://localhost:8000` (Development)
- **Wersja API:** v1

---

## Spis Treści
1. [Uwierzytelnianie](#1-uwierzytelnianie)
2. [API Dokumentów](#2-api-dokumentów)
3. [API Analizy](#3-api-analizy)
4. [API Klauzul](#4-api-klauzul)
5. [API Użytkowników](#5-api-użytkowników)
6. [API Zadań](#6-api-zadań)
7. [Obsługa Błędów](#7-obsługa-błędów)
8. [Limitowanie Zapytań](#8-limitowanie-zapytań)
9. [API Administracyjne](#9-api-administracyjne)
10. [Webhooks](#10-webhooks)

---

## 1. Uwierzytelnianie

### Metody Uwierzytelniania

#### 1.1 Oparte na Sesji (Frontend)
- **Metoda:** Ciasteczka HTTP-only zarządzane przez NextAuth.js
- **Nagłówek:** `Cookie: next-auth.session-token=<token>`
- **Wygasa:** 30 dni (przesuwne)

#### 1.2 Klucz API (Integracje zewnętrzne)
- **Metoda:** Token Bearer
- **Nagłówek:** `Authorization: Bearer <api_key>`
- **Wygasa:** Nigdy (chyba że odwołany)

#### 1.3 Dostęp Gościnny
- **Metoda:** Anonimowe ID sesji
- **Nagłówek:** `X-Guest-Session: <guest_id>`
- **Wygasa:** 24 godziny

### Endpointy

#### POST `/auth/session`
Utwórz sesję gościa lub zweryfikuj sesję użytkownika.

**Żądanie:**
```json
{
  "mode": "guest" | "user"
}
```

**Odpowiedź:**
```json
{
  "session_id": "guest_abc123xyz",
  "expires_at": "2025-12-09T16:00:00Z",
  "quota": {
    "analyses_remaining": 3,
    "max_file_size_mb": 10
  }
}
```

---

## 2. API Dokumentów

### POST `/api/v1/documents/upload`
Prześlij dokument do analizy.

**Uwierzytelnianie:** Wymagane (sesja lub klucz API)

**Żądanie:**
- **Content-Type:** `multipart/form-data`

**Pola Formularza:**
| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| `file` | Plik | Tak | Plik dokumentu (PDF, DOCX, JPG, PNG) |
| `language` | String | Nie | Język dokumentu (`pl`, `en`). Domyślnie: `pl` |
| `analysis_mode` | String | Nie | `offline` lub `ai`. Domyślnie: `offline` |
| `custom_clauses` | Boolean | Nie | Uwzględnij własne klauzule użytkownika. Domyślnie: `true` |
| `save_to_drive` | Boolean | Nie | Zapisz na Google Drive (wymaga autoryzacji). Domyślnie: `false` |

**Odpowiedź:**
```json
{
  "document_id": "doc_9f8e7d6c",
  "filename": "umowa.pdf",
  "size_bytes": 245760,
  "pages": 5,
  "upload_url": "https://storage.fairpact.com/uploads/doc_9f8e7d6c.pdf",
  "created_at": "2025-12-08T14:30:00Z"
}
```

**Kody Błędów:**
- `400` - Nieprawidłowy typ pliku lub rozmiar
- `402` - Przekroczono limit (użytkownicy gościnni)
- `413` - Plik zbyt duży
- `429` - Przekroczono limit zapytań

---

### GET `/api/v1/documents/{document_id}`
Pobierz metadane dokumentu.

**Uwierzytelnianie:** Wymagane

**Parametry Ścieżki:**
| Parametr | Typ | Opis |
|----------|-----|------|
| `document_id` | String | Unikalny identyfikator dokumentu |

**Odpowiedź:**
```json
{
  "document_id": "doc_9f8e7d6c",
  "filename": "umowa.pdf",
  "size_bytes": 245760,
  "pages": 5,
  "language": "pl",
  "status": "uploaded" | "processing" | "completed" | "failed",
  "upload_url": "https://storage.fairpact.com/uploads/doc_9f8e7d6c.pdf",
  "drive_url": "https://drive.google.com/file/d/...",
  "created_at": "2025-12-08T14:30:00Z",
  "analysis_id": "analysis_abc123"
}
```

---

### GET `/api/v1/documents`
Pobierz listę dokumentów użytkownika.

**Uwierzytelnianie:** Wymagane (tylko użytkownik)

**Parametry Query:**
| Parametr | Typ | Wymagane | Opis |
|----------|-----|----------|------|
| `page` | Integer | Nie | Numer strony (indeksowany od 1). Domyślnie: `1` |
| `limit` | Integer | Nie | Elementów na stronę (1-100). Domyślnie: `20` |
| `status` | String | Nie | Filtruj po statusie |
| `sort` | String | Nie | Pole sortowania (`created_at`, `filename`). Domyślnie: `created_at` |
| `order` | String | Nie | Kolejność sortowania (`asc`, `desc`). Domyślnie: `desc` |

**Odpowiedź:**
```json
{
  "documents": [
    {
      "document_id": "doc_9f8e7d6c",
      "filename": "umowa.pdf",
      "pages": 5,
      "status": "completed",
      "created_at": "2025-12-08T14:30:00Z",
      "risk_summary": {
        "high": 2,
        "medium": 5,
        "low": 1
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

---

### DELETE `/api/v1/documents/{document_id}`
Usuń dokument i jego analizę.

**Uwierzytelnianie:** Wymagane

**Odpowiedź:**
```json
{
  "success": true,
  "message": "Dokument usunięty pomyślnie"
}
```

---

## 3. API Analizy

### POST `/api/v1/analysis/start`
Rozpocznij analizę dokumentu.

**Uwierzytelnianie:** Wymagane

**Żądanie:**
```json
{
  "document_id": "doc_9f8e7d6c",
  "mode": "offline" | "ai",
  "options": {
    "confidence_threshold": 0.75,
    "max_clauses": 50,
    "include_explanations": true,
    "language": "pl"
  }
}
```

**Odpowiedź:**
```json
{
  "job_id": "job_xyz789",
  "status": "queued",
  "estimated_duration_seconds": 15,
  "created_at": "2025-12-08T14:35:00Z"
}
```

**Kody Statusu:**
- `202` - Zadanie analizy utworzone
- `400` - Nieprawidłowe żądanie
- `404` - Dokument nie znalezion

---

### GET `/api/v1/analysis/{analysis_id}`
Pobierz wyniki analizy.

**Uwierzytelnianie:** Wymagane

**Parametry Ścieżki:**
| Parametr | Typ | Opis |
|----------|-----|------|
| `analysis_id` | String | Unikalny identyfikator analizy |

**Odpowiedź:**
```json
{
  "analysis_id": "analysis_abc123",
  "document_id": "doc_9f8e7d6c",
  "status": "completed",
  "mode": "offline",
  "started_at": "2025-12-08T14:35:00Z",
  "completed_at": "2025-12-08T14:35:18Z",
  "duration_seconds": 18,
  "results": {
    "text_extracted": "Niniejsza umowa...",
    "total_clauses_checked": 87,
    "flagged_clauses": [
      {
        "clause_id": "clause_001",
        "text": "Wszelkie spory będą rozstrzygane bez możliwości odwołania",
        "location": {
          "page": 3,
          "paragraph": 12,
          "position": {
            "start": 245,
            "end": 312
          }
        },
        "risk_level": "high",
        "confidence": 0.92,
        "category": "unfair_arbitration",
        "explanation": "Ta klauzula pozbawia konsumenta prawa do odwołania, co jest sprzeczne z art. 385 Kodeksu Cywilnego.",
        "legal_reference": {
          "article": "Art. 385 § 1 KC",
          "url": "https://isap.sejm.gov.pl/..."
        },
        "matched_by": ["keyword", "vector_similarity"]
      }
    ],
    "summary": {
      "risk_score": 72,
      "risk_distribution": {
        "high": 2,
        "medium": 5,
        "low": 1
      },
      "categories": {
        "unfair_arbitration": 1,
        "liability_waiver": 1,
        "hidden_fees": 3,
        "unilateral_change": 2,
        "unclear_terms": 1
      }
    }
  },
  "metadata": {
    "ocr_used": false,
    "ocr_confidence": null,
    "ai_enhanced": false,
    "processing_nodes": 1
  }
}
```

---

### GET `/api/v1/analysis/{analysis_id}/export`
Eksportuj raport analizy.

**Uwierzytelnianie:** Wymagane

**Parametry Query:**
| Parametr | Typ | Wymagane | Opis |
|----------|-----|----------|------|
| `format` | String | Tak | Format eksportu (`pdf`, `json`, `csv`) |
| `include_original` | Boolean | Nie | Dołącz oryginalny dokument. Domyślnie: `false` |

**Odpowiedź:**
- **Content-Type:** `application/pdf` lub `application/json` lub `text/csv`
- **Headers:** `Content-Disposition: attachment; filename="analysis_report.pdf"`

---

### POST `/api/v1/analysis/{analysis_id}/feedback`
Prześlij feedback do wyników analizy.

**Uwierzytelnianie:** Wymagane

**Żądanie:**
```json
{
  "helpful": true,
  "flagged_clause_id": "clause_001",
  "feedback_type": "false_positive" | "false_negative" | "incorrect_category" | "other",
  "comment": "Ta klauzula jest standardowym zapisem arbitrażowym",
  "corrected_category": "standard_arbitration"
}
```

**Odpowiedź:**
```json
{
  "success": true,
  "feedback_id": "fb_456def",
  "message": "Dziękujemy za Twój feedback"
}
```

---

## 4. API Klauzul

### GET `/api/v1/clauses`
Pobierz listę klauzul niedozwolonych.

**Uwierzytelnianie:** Opcjonalne (klauzule publiczne) / Wymagane (własne klauzule)

**Parametry Query:**
| Parametr | Typ | Wymagane | Opis |
|----------|-----|----------|------|
| `category` | String | Nie | Filtruj po kategorii |
| `language` | String | Nie | Filtruj po języku (`pl`, `en`) |
| `source` | String | Nie | `standard`, `user`, `all`. Domyślnie: `standard` |
| `search` | String | Nie | Wyszukiwanie tekstowe |
| `page` | Integer | Nie | Numer strony |
| `limit` | Integer | Nie | Elementów na stronę (max 100) |

**Odpowiedź:**
```json
{
  "clauses": [
    {
      "clause_id": "clause_001",
      "text": "Konsument zrzeka się prawa do odwołania",
      "category": "unfair_arbitration",
      "risk_level": "high",
      "language": "pl",
      "legal_reference": {
        "article": "Art. 385 § 1 KC",
        "description": "Klauzula niedozwolona w umowach konsumenckich",
        "url": "https://isap.sejm.gov.pl/..."
      },
      "variations": [
        "bez możliwości odwołania",
        "rezygnacja z prawa do apelacji"
      ],
      "source": "standard",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 87
  }
}
```

---

### POST `/api/v1/clauses`
Dodaj własną klauzulę do bazy użytkownika.

**Uwierzytelnianie:** Wymagane

**Żądanie:**
```json
{
  "text": "Sprzedający zastrzega sobie prawo do zmiany cen bez uprzedzenia",
  "category": "unilateral_change",
  "risk_level": "medium",
  "notes": "Częste w B2B, ale nieuczciwe dla konsumentów",
  "variations": [
    "ceny mogą ulec zmianie",
    "zastrzegamy prawo do modyfikacji cen"
  ]
}
```

**Odpowiedź:**
```json
{
  "clause_id": "clause_user_abc123",
  "text": "Sprzedający zastrzega sobie prawo do zmiany cen bez uprzedzenia",
  "category": "unilateral_change",
  "risk_level": "medium",
  "source": "user",
  "created_at": "2025-12-08T14:40:00Z",
  "embedding_generated": true
}
```

---

### GET `/api/v1/clauses/{clause_id}`
Pobierz szczegółowe informacje o klauzuli.

**Uwierzytelnianie:** Opcjonalne (publiczne) / Wymagane (klauzule użytkownika)

**Odpowiedź:**
```json
{
  "clause_id": "clause_001",
  "text": "Konsument zrzeka się prawa do odwołania",
  "category": "unfair_arbitration",
  "risk_level": "high",
  "language": "pl",
  "legal_reference": {
    "article": "Art. 385 § 1 KC",
    "description": "Klauzula niedozwolona w umowach konsumenckich",
    "url": "https://isap.sejm.gov.pl/...",
    "court_decisions": [
      {
        "case_number": "XVII AmC 1234/20",
        "court": "Sąd Ochrony Konkurencji i Konsumentów",
        "date": "2020-05-15",
        "summary": "Uznano za niedozwoloną"
      }
    ]
  },
  "variations": ["bez możliwości odwołania"],
  "usage_count": 1247,
  "detection_accuracy": 0.94,
  "source": "standard",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-11-30T10:00:00Z"
}
```

---

### PUT `/api/v1/clauses/{clause_id}`
Zaktualizuj własną klauzulę.

**Uwierzytelnianie:** Wymagane (tylko właściciel)

**Żądanie:**
```json
{
  "text": "Zaktualizowany tekst klauzuli",
  "category": "new_category",
  "risk_level": "high",
  "notes": "Zaktualizowane notatki"
}
```

**Odpowiedź:**
```json
{
  "clause_id": "clause_user_abc123",
  "updated_at": "2025-12-08T15:00:00Z",
  "embedding_regenerated": true
}
```

---

### DELETE `/api/v1/clauses/{clause_id}`
Usuń własną klauzulę.

**Uwierzytelnianie:** Wymagane (tylko właściciel)

**Odpowiedź:**
```json
{
  "success": true,
  "message": "Klauzula usunięta pomyślnie"
}
```

---

### GET `/api/v1/clauses/categories`
Lista dostępnych kategorii klauzul.

**Uwierzytelnianie:** Brak

**Odpowiedź:**
```json
{
  "categories": [
    {
      "id": "unfair_arbitration",
      "name": "Unfair Arbitration Clauses",
      "name_pl": "Nieuczciwe klauzule arbitrażowe",
      "description": "Clauses that unfairly limit dispute resolution options",
      "clause_count": 12,
      "risk_level": "high"
    },
    {
      "id": "hidden_fees",
      "name": "Hidden Fees",
      "name_pl": "Ukryte opłaty",
      "description": "Non-transparent cost clauses",
      "clause_count": 23,
      "risk_level": "medium"
    }
  ]
}
```

---

## 5. API Użytkowników

### GET `/api/v1/users/me`
Pobierz profil obecnego użytkownika.

**Uwierzytelnianie:** Wymagane

**Odpowiedź:**
```json
{
  "user_id": "user_789xyz",
  "email": "user@example.com",
  "name": "Jan Kowalski",
  "avatar_url": "https://lh3.googleusercontent.com/...",
  "subscription": {
    "tier": "free" | "pro" | "enterprise",
    "quota": {
      "analyses_per_month": 10,
      "used_this_month": 3,
      "max_file_size_mb": 10,
      "custom_clauses_limit": 50
    },
    "features": {
      "ai_analysis": false,
      "google_drive": true,
      "api_access": false,
      "priority_support": false
    }
  },
  "preferences": {
    "language": "pl",
    "default_analysis_mode": "offline",
    "email_notifications": true
  },
  "created_at": "2025-10-15T12:00:00Z"
}
```

---

### PATCH `/api/v1/users/me`
Zaktualizuj preferencje użytkownika.

**Uwierzytelnianie:** Wymagane

**Żądanie:**
```json
{
  "preferences": {
    "language": "en",
    "default_analysis_mode": "ai",
    "email_notifications": false
  }
}
```

**Odpowiedź:**
```json
{
  "success": true,
  "user_id": "user_789xyz",
  "updated_at": "2025-12-08T15:10:00Z"
}
```

---

### GET `/api/v1/users/me/stats`
Pobierz statystyki użytkownika.

**Uwierzytelnianie:** Wymagane

**Odpowiedź:**
```json
{
  "user_id": "user_789xyz",
  "stats": {
    "total_analyses": 47,
    "documents_uploaded": 52,
    "clauses_detected": 234,
    "high_risk_found": 18,
    "custom_clauses_created": 5,
    "feedback_submitted": 12
  },
  "usage_this_month": {
    "analyses": 3,
    "quota_remaining": 7
  },
  "most_common_categories": [
    {
      "category": "hidden_fees",
      "count": 15
    },
    {
      "category": "liability_waiver",
      "count": 12
    }
  ]
}
```

---

### DELETE `/api/v1/users/me`
Usuń konto użytkownika (Zgodność z RODO).

**Uwierzytelnianie:** Wymagane

**Żądanie:**
```json
{
  "confirmation": "DELETE",
  "reason": "opcjonalny powód usunięcia"
}
```

**Odpowiedź:**
```json
{
  "success": true,
  "message": "Konto zaplanowane do usunięcia",
  "deletion_date": "2025-12-15T00:00:00Z"
}
```

---

## 6. API Zadań

### GET `/api/v1/jobs/{job_id}`
Pobierz status zadania (dla operacji asynchronicznych).

**Uwierzytelnianie:** Wymagane

**Parametry Ścieżki:**
| Parametr | Typ | Opis |
|----------|-----|------|
| `job_id` | String | Unikalny identyfikator zadania |

**Odpowiedź:**
```json
{
  "job_id": "job_xyz789",
  "type": "document_analysis",
  "status": "queued" | "processing" | "completed" | "failed",
  "progress": {
    "current_step": "ocr_extraction",
    "total_steps": 4,
    "percentage": 50
  },
  "created_at": "2025-12-08T14:35:00Z",
  "started_at": "2025-12-08T14:35:05Z",
  "completed_at": null,
  "result": null,
  "error": null
}
```

**Po zakończeniu:**
```json
{
  "job_id": "job_xyz789",
  "type": "document_analysis",
  "status": "completed",
  "progress": {
    "current_step": "completed",
    "total_steps": 4,
    "percentage": 100
  },
  "created_at": "2025-12-08T14:35:00Z",
  "started_at": "2025-12-08T14:35:05Z",
  "completed_at": "2025-12-08T14:35:18Z",
  "result": {
    "analysis_id": "analysis_abc123"
  }
}
```

---

## 7. Obsługa Błędów

### Format Odpowiedzi Błędu

Wszystkie błędy mają następującą strukturę:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Czytelny komunikat błędu",
    "details": {
      "field": "Dodatkowy kontekst"
    },
    "request_id": "req_abc123xyz",
    "timestamp": "2025-12-08T15:00:00Z"
  }
}
```

### Standardowe Kody Błędów

| HTTP Status | Kod Błędu | Opis |
|-------------|------------|------|
| 400 | `INVALID_REQUEST` | Nieprawidłowe żądanie lub parametry |
| 401 | `UNAUTHORIZED` | Brak lub nieprawidłowe uwierzytelnienie |
| 403 | `FORBIDDEN` | Brak uprawnień |
| 404 | `NOT_FOUND` | Zasób nie znaleziony |
| 409 | `CONFLICT` | Zasób już istnieje |
| 413 | `PAYLOAD_TOO_LARGE` | Plik przekracza limit rozmiaru |
| 422 | `VALIDATION_ERROR` | Błąd walidacji żądania |
| 429 | `RATE_LIMIT_EXCEEDED` | Zbyt wiele zapytań |
| 500 | `INTERNAL_ERROR` | Błąd serwera |
| 503 | `SERVICE_UNAVAILABLE` | Tymczasowa niedostępność serwisu |

---

## 8. Limitowanie Zapytań

### Nagłówki Limitów

Wszystkie odpowiedzi zawierają nagłówki limitów:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1733673600
```

### Limity według Planu

| Plan | Zapytania/Minutę | Analizy/Dzień | Upload Plików/Godzinę |
|------|------------------|---------------|-----------------------|
| Guest | 10 | 3 | 5 |
| Free | 60 | 10 | 20 |
| Pro | 300 | 100 | 100 |
| Enterprise | 1000 | Bez limitu | 500 |

### Odpowiedź Limitu

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Zbyt wiele zapytań. Spróbuj ponownie później.",
    "details": {
      "limit": 10,
      "reset_at": "2025-12-08T15:01:00Z"
    },
    "request_id": "req_abc123xyz",
    "timestamp": "2025-12-08T15:00:00Z"
  }
}
```

---

## 9. API Administracyjne

### POST `/api/v1/admin/feedback`
Prześlij feedback dla oflagowanej klauzuli.

**Uwierzytelnianie:** Wymagane (Recenzent/Admin)

**Żądanie:**
```json
{
  "flagged_clause_id": "cla_123abc",
  "is_correct": true,
  "notes": "Opcjonalne notatki"
}
```

**Odpowiedź:**
```json
{
  "id": "fb_xyz789",
  "flagged_clause_id": "cla_123abc",
  "is_correct": true,
  "reviewer_id": "user_admin1",
  "notes": "Opcjonalne notatki",
  "created_at": "2025-12-18T10:00:00Z"
}
```

---

### GET `/api/v1/admin/pending-reviews`
Pobierz analizy oczekujące na recenzję.

**Uwierzytelnianie:** Wymagane (Recenzent/Admin)

**Parametry Query:**
| Parametr | Typ | Wymagane | Opis |
|----------|-----|----------|------|
| `limit` | Integer | Nie | Max elementów (domyślnie: 20) |

**Odpowiedź:**
```json
[
  {
    "analysis_id": "an_123",
    "document_id": "doc_456",
    "filename": "umowa.pdf",
    "total_clauses": 15,
    "high_risk_count": 2,
    "completed_at": "2025-12-18T09:30:00Z",
    "has_feedback": false
  }
]
```

---

### GET `/api/v1/admin/metrics`
Pobierz metryki wydajności modelu.

**Uwierzytelnianie:** Wymagane (Recenzent/Admin)

**Parametry Query:**
| Parametr | Typ | Wymagane | Opis |
|----------|-----|----------|------|
| `days` | Integer | Nie | Liczba dni (domyślnie: 30) |

**Odpowiedź:**
```json
[
  {
    "id": "met_123",
    "date": "2025-12-17",
    "true_positives": 50,
    "false_positives": 2,
    "true_negatives": 100,
    "false_negatives": 1,
    "precision": 0.96,
    "recall": 0.98,
    "f1_score": 0.97,
    "accuracy": 0.99,
    "total_reviews": 53
  }
]
```

---

### POST `/api/v1/admin/sync-clauses`
Wyzwól ręczną synchronizację klauzul niedozwolonych.

**Uwierzytelnianie:** Wymagane (Tylko Admin)

**Odpowiedź:**
```json
{
  "message": "Synchronizacja klauzul rozpoczęta",
  "task_id": "task_sync_123",
  "status": "queued"
}
```

---

## 10. Webhooks

### POST `/api/v1/webhooks`
Zarejestruj endpoint webhooka.

**Uwierzytelnianie:** Wymagane (Tylko Pro/Enterprise)

**Żądanie:**
```json
{
  "url": "https://twoj-serwer.pl/webhooks/fairpact",
  "events": ["analysis.completed", "analysis.failed"],
  "secret": "twoj_sekret_webhooka"
}
```

**Odpowiedź:**
```json
{
  "webhook_id": "wh_789xyz",
  "url": "https://twoj-serwer.pl/webhooks/fairpact",
  "events": ["analysis.completed", "analysis.failed"],
  "active": true,
  "created_at": "2025-12-08T15:20:00Z"
}
```

### Payload Zdarzenia Webhook

```json
{
  "event": "analysis.completed",
  "timestamp": "2025-12-08T15:25:00Z",
  "data": {
    "analysis_id": "analysis_abc123",
    "document_id": "doc_9f8e7d6c",
    "status": "completed",
    "risk_score": 72
  },
  "signature": "sha256=..."
}
```

### Weryfikacja Podpisu Webhook

Webhooki są podpisane przy użyciu HMAC SHA256:

```python
import hmac
import hashlib

signature = hmac.new(
    webhook_secret.encode(),
    request_body,
    hashlib.sha256
).hexdigest()

expected_signature = f"sha256={signature}"
```

---

## Załącznik: Modele Danych

### Document
```typescript
interface Document {
  document_id: string;
  user_id: string | null;
  filename: string;
  size_bytes: number;
  pages: number;
  language: 'pl' | 'en';
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  upload_url: string;
  drive_url?: string;
  created_at: string; // ISO 8601
  analysis_id?: string;
}
```

### Analysis
```typescript
interface Analysis {
  analysis_id: string;
  document_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  mode: 'offline' | 'ai';
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  results?: AnalysisResults;
  error?: string;
}
```

### FlaggedClause
```typescript
interface FlaggedClause {
  clause_id: string;
  text: string;
  location: {
    page: number;
    paragraph: number;
    position: { start: number; end: number };
  };
  risk_level: 'high' | 'medium' | 'low';
  confidence: number; // 0-1
  category: string;
  explanation: string;
  legal_reference: {
    article: string;
    url: string;
  };
  matched_by: string[];
}
```

---

**Koniec Dokumentu**
