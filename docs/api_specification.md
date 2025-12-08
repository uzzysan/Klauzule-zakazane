# FairPact - API Specification v1.0

## Document Information
- **Version:** 1.0
- **Last Updated:** 2025-12-08
- **Base URL:** `https://api.fairpact.com` (Production)
- **Base URL:** `http://localhost:8000` (Development)
- **API Version:** v1
- **Related Documents:** [Implementation Plan](./implementation_plan_v2.md)

---

## Table of Contents
1. [Authentication](#1-authentication)
2. [Documents API](#2-documents-api)
3. [Analysis API](#3-analysis-api)
4. [Clauses API](#4-clauses-api)
5. [Users API](#5-users-api)
6. [Jobs API](#6-jobs-api)
7. [Error Handling](#7-error-handling)
8. [Rate Limiting](#8-rate-limiting)
9. [Webhooks](#9-webhooks)

---

## 1. Authentication

### Authentication Methods

#### 1.1 Session-Based (Frontend)
- **Method:** HTTP-only cookies managed by NextAuth.js
- **Header:** `Cookie: next-auth.session-token=<token>`
- **Expiry:** 30 days (sliding)

#### 1.2 API Key (Third-party integrations)
- **Method:** Bearer token
- **Header:** `Authorization: Bearer <api_key>`
- **Expiry:** Never (unless revoked)

#### 1.3 Guest Access
- **Method:** Anonymous session ID
- **Header:** `X-Guest-Session: <guest_id>`
- **Expiry:** 24 hours

### Endpoints

#### POST `/auth/session`
Create guest session or validate user session.

**Request:**
```json
{
  "mode": "guest" | "user"
}
```

**Response:**
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

## 2. Documents API

### POST `/api/v1/documents/upload`
Upload a document for analysis.

**Authentication:** Required (session or API key)

**Request:**
- **Content-Type:** `multipart/form-data`

**Form Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | Document file (PDF, DOCX, JPG, PNG) |
| `language` | String | No | Document language (`pl`, `en`). Default: `pl` |
| `analysis_mode` | String | No | `offline` or `ai`. Default: `offline` |
| `custom_clauses` | Boolean | No | Include user's custom clauses. Default: `true` |
| `save_to_drive` | Boolean | No | Save to Google Drive (requires auth). Default: `false` |

**Response:**
```json
{
  "document_id": "doc_9f8e7d6c",
  "filename": "contract.pdf",
  "size_bytes": 245760,
  "pages": 5,
  "upload_url": "https://storage.fairpact.com/uploads/doc_9f8e7d6c.pdf",
  "created_at": "2025-12-08T14:30:00Z"
}
```

**Error Codes:**
- `400` - Invalid file type or size
- `402` - Quota exceeded (guest users)
- `413` - File too large
- `429` - Rate limit exceeded

---

### GET `/api/v1/documents/{document_id}`
Retrieve document metadata.

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `document_id` | String | Unique document identifier |

**Response:**
```json
{
  "document_id": "doc_9f8e7d6c",
  "filename": "contract.pdf",
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
List user's documents.

**Authentication:** Required (user only)

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | Integer | No | Page number (1-indexed). Default: `1` |
| `limit` | Integer | No | Items per page (1-100). Default: `20` |
| `status` | String | No | Filter by status |
| `sort` | String | No | Sort field (`created_at`, `filename`). Default: `created_at` |
| `order` | String | No | Sort order (`asc`, `desc`). Default: `desc` |

**Response:**
```json
{
  "documents": [
    {
      "document_id": "doc_9f8e7d6c",
      "filename": "contract.pdf",
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
Delete a document and its analysis.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

---

## 3. Analysis API

### POST `/api/v1/analysis/start`
Start document analysis.

**Authentication:** Required

**Request:**
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

**Response:**
```json
{
  "job_id": "job_xyz789",
  "status": "queued",
  "estimated_duration_seconds": 15,
  "created_at": "2025-12-08T14:35:00Z"
}
```

**Status Codes:**
- `202` - Analysis job created
- `400` - Invalid request
- `404` - Document not found

---

### GET `/api/v1/analysis/{analysis_id}`
Retrieve analysis results.

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `analysis_id` | String | Unique analysis identifier |

**Response:**
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
Export analysis report.

**Authentication:** Required

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `format` | String | Yes | Export format (`pdf`, `json`, `csv`) |
| `include_original` | Boolean | No | Include original document. Default: `false` |

**Response:**
- **Content-Type:** `application/pdf` or `application/json` or `text/csv`
- **Headers:** `Content-Disposition: attachment; filename="analysis_report.pdf"`

---

### POST `/api/v1/analysis/{analysis_id}/feedback`
Submit feedback on analysis results.

**Authentication:** Required

**Request:**
```json
{
  "helpful": true,
  "flagged_clause_id": "clause_001",
  "feedback_type": "false_positive" | "false_negative" | "incorrect_category" | "other",
  "comment": "This clause is actually standard arbitration language",
  "corrected_category": "standard_arbitration"
}
```

**Response:**
```json
{
  "success": true,
  "feedback_id": "fb_456def",
  "message": "Thank you for your feedback"
}
```

---

## 4. Clauses API

### GET `/api/v1/clauses`
List prohibited clauses database.

**Authentication:** Optional (public clauses) / Required (custom clauses)

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | String | No | Filter by category |
| `language` | String | No | Filter by language (`pl`, `en`) |
| `source` | String | No | `standard`, `user`, `all`. Default: `standard` |
| `search` | String | No | Text search query |
| `page` | Integer | No | Page number |
| `limit` | Integer | No | Items per page (max 100) |

**Response:**
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
Add custom clause to user's database.

**Authentication:** Required

**Request:**
```json
{
  "text": "Sprzedający zastrzega sobie prawo do zmiany cen bez uprzedzenia",
  "category": "unilateral_change",
  "risk_level": "medium",
  "notes": "Common in B2B contracts but unfair for consumers",
  "variations": [
    "ceny mogą ulec zmianie",
    "zastrzegamy prawo do modyfikacji cen"
  ]
}
```

**Response:**
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
Get detailed clause information.

**Authentication:** Optional (public) / Required (user clauses)

**Response:**
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
Update custom clause.

**Authentication:** Required (owner only)

**Request:**
```json
{
  "text": "Updated clause text",
  "category": "new_category",
  "risk_level": "high",
  "notes": "Updated notes"
}
```

**Response:**
```json
{
  "clause_id": "clause_user_abc123",
  "updated_at": "2025-12-08T15:00:00Z",
  "embedding_regenerated": true
}
```

---

### DELETE `/api/v1/clauses/{clause_id}`
Delete custom clause.

**Authentication:** Required (owner only)

**Response:**
```json
{
  "success": true,
  "message": "Clause deleted successfully"
}
```

---

### GET `/api/v1/clauses/categories`
List available clause categories.

**Authentication:** None

**Response:**
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

## 5. Users API

### GET `/api/v1/users/me`
Get current user profile.

**Authentication:** Required

**Response:**
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
Update user preferences.

**Authentication:** Required

**Request:**
```json
{
  "preferences": {
    "language": "en",
    "default_analysis_mode": "ai",
    "email_notifications": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "user_id": "user_789xyz",
  "updated_at": "2025-12-08T15:10:00Z"
}
```

---

### GET `/api/v1/users/me/stats`
Get user statistics.

**Authentication:** Required

**Response:**
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
Delete user account (GDPR compliance).

**Authentication:** Required

**Request:**
```json
{
  "confirmation": "DELETE",
  "reason": "optional reason for deletion"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account scheduled for deletion",
  "deletion_date": "2025-12-15T00:00:00Z"
}
```

---

## 6. Jobs API

### GET `/api/v1/jobs/{job_id}`
Get job status (for async operations).

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `job_id` | String | Unique job identifier |

**Response:**
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

**When completed:**
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

## 7. Error Handling

### Error Response Format

All errors follow this structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context"
    },
    "request_id": "req_abc123xyz",
    "timestamp": "2025-12-08T15:00:00Z"
  }
}
```

### Standard Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `INVALID_REQUEST` | Malformed request body or parameters |
| 401 | `UNAUTHORIZED` | Missing or invalid authentication |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Resource already exists |
| 413 | `PAYLOAD_TOO_LARGE` | File exceeds size limit |
| 422 | `VALIDATION_ERROR` | Request validation failed |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |
| 503 | `SERVICE_UNAVAILABLE` | Temporary service outage |

### Example Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid document format",
    "details": {
      "file": "Only PDF, DOCX, JPG, PNG files are supported",
      "received_type": "application/zip"
    },
    "request_id": "req_abc123xyz",
    "timestamp": "2025-12-08T15:00:00Z"
  }
}
```

---

## 8. Rate Limiting

### Rate Limit Headers

All responses include rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1733673600
```

### Rate Limits by Tier

| Tier | Requests/Minute | Analyses/Day | File Uploads/Hour |
|------|-----------------|--------------|-------------------|
| Guest | 10 | 3 | 5 |
| Free | 60 | 10 | 20 |
| Pro | 300 | 100 | 100 |
| Enterprise | 1000 | Unlimited | 500 |

### Rate Limit Response

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
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

## 9. Webhooks

### POST `/api/v1/webhooks`
Register a webhook endpoint.

**Authentication:** Required (Pro/Enterprise only)

**Request:**
```json
{
  "url": "https://your-server.com/webhooks/fairpact",
  "events": ["analysis.completed", "analysis.failed"],
  "secret": "your_webhook_secret"
}
```

**Response:**
```json
{
  "webhook_id": "wh_789xyz",
  "url": "https://your-server.com/webhooks/fairpact",
  "events": ["analysis.completed", "analysis.failed"],
  "active": true,
  "created_at": "2025-12-08T15:20:00Z"
}
```

### Webhook Event Payload

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

### Webhook Signature Verification

Webhooks are signed using HMAC SHA256:

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

## Appendix: Data Models

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

**Document End**
