# FairPact - Security & Compliance Guide v1.0

## Document Information
- **Version:** 1.0
- **Last Updated:** 2025-12-08
- **Compliance Target:** GDPR, WCAG 2.1 AA
- **Related Documents:** [Implementation Plan](./implementation_plan_v2.md), [API Specification](./api_specification.md)

---

## Table of Contents
1. [Security Overview](#1-security-overview)
2. [Authentication & Authorization](#2-authentication--authorization)
3. [Data Protection](#3-data-protection)
4. [Input Validation & Sanitization](#4-input-validation--sanitization)
5. [API Security](#5-api-security)
6. [Infrastructure Security](#6-infrastructure-security)
7. [GDPR Compliance](#7-gdpr-compliance)
8. [Data Privacy](#8-data-privacy)
9. [Incident Response](#9-incident-response)
10. [Security Checklist](#10-security-checklist)

---

## 1. Security Overview

### 1.1 Security Principles

1. **Defense in Depth:** Multiple layers of security controls
2. **Least Privilege:** Minimum necessary permissions
3. **Secure by Default:** Security is not opt-in
4. **Privacy by Design:** Data protection built into architecture
5. **Zero Trust:** Verify everything, trust nothing

### 1.2 Threat Model

#### Assets to Protect
- **User Data:** Personal information, uploaded documents
- **Analysis Results:** Contract analysis data
- **Credentials:** API keys, OAuth tokens, session cookies
- **Business Logic:** Clause database, ML models
- **Infrastructure:** Servers, databases, storage

#### Threat Actors
| Actor | Motivation | Capability | Likelihood |
|-------|------------|------------|------------|
| Script Kiddies | Vandalism | Low | High |
| Competitors | Business intelligence | Medium | Medium |
| Cybercriminals | Financial gain | High | Low |
| Nation State | Espionage | Very High | Very Low |

#### Attack Vectors
- Web application vulnerabilities (OWASP Top 10)
- API abuse and scraping
- Social engineering
- Supply chain attacks
- DDoS attacks

---

## 2. Authentication & Authorization

### 2.1 Authentication Methods

#### OAuth 2.0 (Google)

**Implementation:**
```typescript
// frontend/lib/auth.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/drive.file",
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    },
  },
  cookies: {
    sessionToken: {
      name: "__Secure-next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true, // HTTPS only
      },
    },
  },
};
```

**Security Measures:**
- ✅ HTTPS-only cookies
- ✅ HTTP-only flag (prevents XSS)
- ✅ SameSite=Lax (CSRF protection)
- ✅ Secure flag (HTTPS requirement)
- ✅ Short-lived access tokens (1 hour)
- ✅ Refresh token rotation

#### Guest Sessions

**Implementation:**
```python
# backend/auth/guest_session.py
import secrets
from datetime import datetime, timedelta

def create_guest_session() -> dict:
    """Create anonymous guest session."""
    session_id = f"guest_{secrets.token_urlsafe(32)}"

    return {
        "session_id": session_id,
        "expires_at": datetime.utcnow() + timedelta(hours=24),
        "quota": {
            "analyses_remaining": 3,
            "max_file_size_mb": 10,
        }
    }
```

**Security Measures:**
- ✅ Cryptographically random session IDs
- ✅ 24-hour expiration
- ✅ Rate limiting (stricter than authenticated)
- ✅ No PII collection

### 2.2 Authorization

#### Role-Based Access Control (RBAC)

```python
# backend/auth/permissions.py
from enum import Enum
from functools import wraps

class Role(str, Enum):
    GUEST = "guest"
    USER = "user"
    PRO = "pro"
    ADMIN = "admin"

class Permission(str, Enum):
    READ_CLAUSES = "read:clauses"
    WRITE_CLAUSES = "write:clauses"
    DELETE_CLAUSES = "delete:clauses"
    USE_AI_MODE = "use:ai_mode"
    ACCESS_API = "access:api"
    ADMIN_PANEL = "access:admin"

ROLE_PERMISSIONS = {
    Role.GUEST: [Permission.READ_CLAUSES],
    Role.USER: [
        Permission.READ_CLAUSES,
        Permission.WRITE_CLAUSES,
    ],
    Role.PRO: [
        Permission.READ_CLAUSES,
        Permission.WRITE_CLAUSES,
        Permission.DELETE_CLAUSES,
        Permission.USE_AI_MODE,
        Permission.ACCESS_API,
    ],
    Role.ADMIN: list(Permission),
}

def require_permission(permission: Permission):
    """Decorator to check user permissions."""
    def decorator(func):
        @wraps(func)
        async def wrapper(request, *args, **kwargs):
            user = request.state.user
            user_permissions = ROLE_PERMISSIONS.get(user.role, [])

            if permission not in user_permissions:
                raise HTTPException(status_code=403, detail="Insufficient permissions")

            return await func(request, *args, **kwargs)
        return wrapper
    return decorator
```

#### Resource Ownership

```python
# backend/auth/ownership.py
async def verify_document_ownership(user_id: str, document_id: str) -> bool:
    """Verify user owns the document."""
    document = await db.documents.find_one({"id": document_id})

    if not document:
        return False

    return document["user_id"] == user_id

async def can_access_resource(user: User, resource_id: str, resource_type: str) -> bool:
    """Check if user can access a resource."""
    if user.role == Role.ADMIN:
        return True

    if resource_type == "document":
        return await verify_document_ownership(user.id, resource_id)

    if resource_type == "clause":
        clause = await db.clauses.find_one({"id": resource_id})
        # Public clauses are accessible to all
        if clause["source"] == "standard":
            return True
        # Custom clauses only accessible to creator
        return clause["user_id"] == user.id

    return False
```

---

## 3. Data Protection

### 3.1 Encryption

#### Data at Rest

**Database Encryption:**
```sql
-- PostgreSQL: Enable encryption at tablespace level
CREATE TABLESPACE encrypted_space
    LOCATION '/var/lib/postgresql/encrypted'
    WITH (encryption = 'on', cipher = 'aes256');

-- Store sensitive data in encrypted tablespace
CREATE TABLE users (
    ...
    google_refresh_token TEXT -- Encrypted column
) TABLESPACE encrypted_space;
```

**Application-Level Encryption:**
```python
# backend/crypto/encryption.py
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
import base64
import os

class EncryptionService:
    def __init__(self):
        # Derive key from environment variable
        salt = os.getenv("ENCRYPTION_SALT").encode()
        kdf = PBKDF2(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(os.getenv("MASTER_KEY").encode()))
        self.cipher = Fernet(key)

    def encrypt(self, plaintext: str) -> str:
        """Encrypt sensitive data."""
        return self.cipher.encrypt(plaintext.encode()).decode()

    def decrypt(self, ciphertext: str) -> str:
        """Decrypt sensitive data."""
        return self.cipher.decrypt(ciphertext.encode()).decode()

# Usage
encryptor = EncryptionService()
encrypted_token = encryptor.encrypt(user.google_refresh_token)
```

#### Data in Transit

**TLS Configuration:**
```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name fairpact.com;

    # SSL Certificate
    ssl_certificate /etc/letsencrypt/live/fairpact.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/fairpact.com/privkey.pem;

    # Modern TLS configuration
    ssl_protocols TLSv1.3 TLSv1.2;
    ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers on;

    # HSTS (63072000 seconds = 2 years)
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # OCSP stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

### 3.2 Data Masking & Redaction

```python
# backend/utils/data_masking.py
import re

def mask_email(email: str) -> str:
    """Mask email for logs: user@example.com -> u***@example.com"""
    local, domain = email.split("@")
    return f"{local[0]}***@{domain}"

def mask_api_key(key: str) -> str:
    """Show only first 8 characters: sk_abc123xyz -> sk_abc12***"""
    if len(key) <= 8:
        return "***"
    return f"{key[:8]}***"

def redact_pii(text: str) -> str:
    """Remove PII from text for logging."""
    # Redact emails
    text = re.sub(r'[\w\.-]+@[\w\.-]+\.\w+', '[EMAIL_REDACTED]', text)

    # Redact phone numbers (Polish format)
    text = re.sub(r'\+?48\s?\d{3}\s?\d{3}\s?\d{3}', '[PHONE_REDACTED]', text)

    # Redact PESEL (Polish ID number)
    text = re.sub(r'\b\d{11}\b', '[PESEL_REDACTED]', text)

    return text
```

### 3.3 Secure File Storage

```python
# backend/storage/secure_storage.py
import hashlib
import secrets
from pathlib import Path

class SecureFileStorage:
    def __init__(self, base_path: str):
        self.base_path = Path(base_path)

    def generate_secure_filename(self, original_filename: str, user_id: str) -> str:
        """Generate unpredictable filename."""
        # Create random filename to prevent enumeration
        random_part = secrets.token_urlsafe(16)

        # Hash user_id + timestamp for namespace isolation
        namespace = hashlib.sha256(f"{user_id}{int(time.time())}".encode()).hexdigest()[:8]

        # Preserve extension
        extension = Path(original_filename).suffix

        return f"{namespace}_{random_part}{extension}"

    async def store_file(self, file_content: bytes, filename: str, user_id: str) -> str:
        """Store file securely."""
        # Generate secure filename
        secure_name = self.generate_secure_filename(filename, user_id)

        # Calculate checksum
        checksum = hashlib.sha256(file_content).hexdigest()

        # Store with restricted permissions
        file_path = self.base_path / user_id / secure_name
        file_path.parent.mkdir(parents=True, exist_ok=True)

        file_path.write_bytes(file_content)
        file_path.chmod(0o600)  # Read/write for owner only

        return str(file_path), checksum

    async def validate_file(self, file_path: str, expected_checksum: str) -> bool:
        """Verify file integrity."""
        file_content = Path(file_path).read_bytes()
        actual_checksum = hashlib.sha256(file_content).hexdigest()
        return actual_checksum == expected_checksum
```

---

## 4. Input Validation & Sanitization

### 4.1 Backend Validation (Pydantic)

```python
# backend/schemas/document.py
from pydantic import BaseModel, validator, Field
from typing import Literal
import re

class DocumentUploadRequest(BaseModel):
    language: Literal["pl", "en"] = "pl"
    analysis_mode: Literal["offline", "ai"] = "offline"
    custom_clauses: bool = True

    @validator("language")
    def validate_language(cls, v):
        if v not in ["pl", "en"]:
            raise ValueError("Invalid language code")
        return v

class ClauseCreateRequest(BaseModel):
    text: str = Field(..., min_length=10, max_length=5000)
    category: str = Field(..., regex=r"^[a-z_]+$")
    risk_level: Literal["high", "medium", "low"]
    notes: str = Field(default="", max_length=1000)

    @validator("text")
    def sanitize_text(cls, v):
        # Remove potentially dangerous characters
        v = re.sub(r'[<>]', '', v)  # Remove angle brackets
        v = v.strip()
        return v

    @validator("category")
    def validate_category(cls, v):
        # Ensure category exists
        valid_categories = ["unfair_arbitration", "liability_waiver", ...]
        if v not in valid_categories:
            raise ValueError(f"Invalid category: {v}")
        return v
```

### 4.2 Frontend Validation (Zod)

```typescript
// frontend/lib/validation.ts
import { z } from "zod";

export const documentUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, "File must be less than 10MB")
    .refine(
      (file) => ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png"].includes(file.type),
      "Invalid file type. Only PDF, DOCX, JPG, PNG are allowed"
    ),
  language: z.enum(["pl", "en"]).default("pl"),
  analysisMode: z.enum(["offline", "ai"]).default("offline"),
});

export const clauseCreateSchema = z.object({
  text: z
    .string()
    .min(10, "Clause text must be at least 10 characters")
    .max(5000, "Clause text must not exceed 5000 characters")
    .regex(/^[^<>]*$/, "Clause text cannot contain HTML tags"),
  category: z.string().regex(/^[a-z_]+$/, "Invalid category format"),
  riskLevel: z.enum(["high", "medium", "low"]),
  notes: z.string().max(1000).optional(),
});
```

### 4.3 SQL Injection Prevention

```python
# backend/database/query.py
from sqlalchemy import text

# GOOD: Parameterized queries
async def get_clauses_by_category(category_id: str):
    query = text("""
        SELECT * FROM prohibited_clauses
        WHERE category_id = :category_id
        AND deleted_at IS NULL
    """)
    result = await db.execute(query, {"category_id": category_id})
    return result.fetchall()

# BAD: String interpolation (NEVER DO THIS)
async def get_clauses_by_category_BAD(category_id: str):
    query = f"SELECT * FROM prohibited_clauses WHERE category_id = '{category_id}'"
    # Vulnerable to SQL injection!
    result = await db.execute(query)
    return result.fetchall()
```

### 4.4 XSS Prevention

```typescript
// frontend/components/ClauseDetail.tsx
import DOMPurify from "isomorphic-dompurify";

export function ClauseDetail({ clause }: { clause: Clause }) {
  // Sanitize user-generated content before rendering
  const sanitizedNotes = DOMPurify.sanitize(clause.notes, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br"],
    ALLOWED_ATTR: [],
  });

  return (
    <div>
      <h3>{clause.text}</h3>
      {/* Safe: React escapes by default */}
      <p>{clause.explanation}</p>

      {/* Dangerous: Only use for sanitized HTML */}
      <div dangerouslySetInnerHTML={{ __html: sanitizedNotes }} />
    </div>
  );
}
```

---

## 5. API Security

### 5.1 Rate Limiting

```python
# backend/middleware/rate_limit.py
from fastapi import Request, HTTPException
from redis import asyncio as aioredis
from datetime import timedelta

class RateLimiter:
    def __init__(self, redis_client: aioredis.Redis):
        self.redis = redis_client

    async def check_rate_limit(
        self,
        key: str,
        max_requests: int,
        window_seconds: int
    ) -> bool:
        """Check if request is within rate limit."""
        current = await self.redis.incr(key)

        if current == 1:
            await self.redis.expire(key, window_seconds)

        if current > max_requests:
            ttl = await self.redis.ttl(key)
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Try again in {ttl} seconds",
                headers={"Retry-After": str(ttl)}
            )

        return True

# Middleware
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Determine user tier
    user = getattr(request.state, "user", None)
    tier = user.subscription_tier if user else "guest"

    # Rate limits by tier
    limits = {
        "guest": (10, 60),      # 10 requests per minute
        "free": (60, 60),       # 60 requests per minute
        "pro": (300, 60),       # 300 requests per minute
        "enterprise": (1000, 60) # 1000 requests per minute
    }

    max_requests, window = limits[tier]

    # Create rate limit key
    identifier = user.id if user else request.client.host
    key = f"rate_limit:{identifier}"

    # Check rate limit
    rate_limiter = RateLimiter(request.app.state.redis)
    await rate_limiter.check_rate_limit(key, max_requests, window)

    response = await call_next(request)
    return response
```

### 5.2 CORS Configuration

```python
# backend/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://fairpact.com",
        "https://www.fairpact.com",
        "http://localhost:3000",  # Development only
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
    expose_headers=["X-RateLimit-Limit", "X-RateLimit-Remaining"],
    max_age=86400,  # 24 hours
)
```

### 5.3 CSRF Protection

```python
# backend/middleware/csrf.py
from fastapi import Request, HTTPException
import secrets
import hmac

class CSRFProtection:
    def __init__(self, secret_key: str):
        self.secret_key = secret_key

    def generate_token(self, session_id: str) -> str:
        """Generate CSRF token for session."""
        random_part = secrets.token_urlsafe(32)
        signature = hmac.new(
            self.secret_key.encode(),
            f"{session_id}:{random_part}".encode(),
            "sha256"
        ).hexdigest()
        return f"{random_part}.{signature}"

    def verify_token(self, token: str, session_id: str) -> bool:
        """Verify CSRF token."""
        try:
            random_part, signature = token.split(".")
            expected_signature = hmac.new(
                self.secret_key.encode(),
                f"{session_id}:{random_part}".encode(),
                "sha256"
            ).hexdigest()
            return hmac.compare_digest(signature, expected_signature)
        except:
            return False

@app.middleware("http")
async def csrf_middleware(request: Request, call_next):
    # Skip CSRF for safe methods
    if request.method in ["GET", "HEAD", "OPTIONS"]:
        return await call_next(request)

    # Verify CSRF token
    token = request.headers.get("X-CSRF-Token")
    session_id = request.cookies.get("session_id")

    csrf = CSRFProtection(os.getenv("SECRET_KEY"))
    if not csrf.verify_token(token, session_id):
        raise HTTPException(status_code=403, detail="CSRF token invalid")

    return await call_next(request)
```

---

## 6. Infrastructure Security

### 6.1 Docker Security

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim-bookworm

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set working directory
WORKDIR /app

# Install dependencies as root
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY --chown=appuser:appuser . .

# Switch to non-root user
USER appuser

# Run with reduced privileges
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```yaml
# docker-compose.yml (security hardening)
version: '3.8'

services:
  backend:
    image: fairpact-backend:latest
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    read_only: true
    tmpfs:
      - /tmp
    environment:
      - POSTGRES_PASSWORD_FILE=/run/secrets/db_password
    secrets:
      - db_password

secrets:
  db_password:
    external: true
```

### 6.2 Database Security

```sql
-- Create restricted database user
CREATE USER fairpact_app WITH PASSWORD 'strong_password';

-- Grant minimal necessary permissions
GRANT CONNECT ON DATABASE fairpact TO fairpact_app;
GRANT USAGE ON SCHEMA public TO fairpact_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO fairpact_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO fairpact_app;

-- Revoke dangerous permissions
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM fairpact_app;

-- Enable row-level security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY documents_isolation ON documents
    FOR ALL
    TO fairpact_app
    USING (user_id = current_setting('app.current_user_id')::uuid);
```

### 6.3 Secrets Management

```python
# backend/config.py
from pydantic import BaseSettings, SecretStr
from functools import lru_cache

class Settings(BaseSettings):
    # Database
    database_url: SecretStr
    database_pool_size: int = 20

    # Authentication
    google_client_id: str
    google_client_secret: SecretStr
    jwt_secret_key: SecretStr

    # Encryption
    master_key: SecretStr
    encryption_salt: SecretStr

    # External APIs
    gemini_api_key: SecretStr

    # Security
    allowed_origins: list[str] = ["https://fairpact.com"]

    class Config:
        env_file = ".env"
        case_sensitive = False

    def get_database_url(self) -> str:
        """Get database URL as plain string."""
        return self.database_url.get_secret_value()

@lru_cache()
def get_settings() -> Settings:
    return Settings()
```

**Environment Variables (`.env.example`):**
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/fairpact

# Authentication
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
JWT_SECRET_KEY=generate_with_openssl_rand_base64_32

# Encryption
MASTER_KEY=generate_with_openssl_rand_base64_32
ENCRYPTION_SALT=generate_with_openssl_rand_base64_16

# External APIs
GEMINI_API_KEY=your_gemini_key

# Security
ALLOWED_ORIGINS=https://fairpact.com,https://www.fairpact.com
```

---

## 7. GDPR Compliance

### 7.1 Data Subject Rights

#### Right to Access

```python
# backend/api/gdpr.py
from fastapi import APIRouter, Depends
from services.gdpr_service import GDPRService

router = APIRouter(prefix="/api/v1/gdpr", tags=["GDPR"])

@router.get("/data-export")
async def export_user_data(user: User = Depends(get_current_user)):
    """Export all user data (GDPR Article 15)."""
    gdpr_service = GDPRService()

    user_data = await gdpr_service.export_user_data(user.id)

    return {
        "personal_info": user_data["profile"],
        "documents": user_data["documents"],
        "analyses": user_data["analyses"],
        "custom_clauses": user_data["clauses"],
        "activity_log": user_data["activity"],
    }
```

#### Right to Erasure

```python
@router.delete("/delete-account")
async def delete_account(
    confirmation: str,
    user: User = Depends(get_current_user)
):
    """Delete user account and data (GDPR Article 17)."""
    if confirmation != "DELETE":
        raise HTTPException(400, "Confirmation required")

    gdpr_service = GDPRService()

    # Schedule deletion (7-day grace period)
    await gdpr_service.schedule_deletion(
        user_id=user.id,
        deletion_date=datetime.utcnow() + timedelta(days=7)
    )

    # Revoke all sessions
    await revoke_all_sessions(user.id)

    return {
        "message": "Account scheduled for deletion",
        "deletion_date": (datetime.utcnow() + timedelta(days=7)).isoformat()
    }
```

#### Right to Rectification

```python
@router.patch("/update-data")
async def update_user_data(
    updates: UserDataUpdate,
    user: User = Depends(get_current_user)
):
    """Update personal data (GDPR Article 16)."""
    await db.users.update_one(
        {"id": user.id},
        {"$set": {
            "name": updates.name,
            "email": updates.email,
            "updated_at": datetime.utcnow()
        }}
    )

    return {"message": "Data updated successfully"}
```

### 7.2 Data Processing Records

```python
# backend/models/data_processing.py
class DataProcessingRecord(BaseModel):
    """Record of data processing activities (GDPR Article 30)."""
    activity_id: UUID
    purpose: str  # e.g., "Contract analysis", "User authentication"
    legal_basis: str  # e.g., "Consent", "Legitimate interest"
    data_categories: List[str]  # e.g., ["Personal identifiers", "Document content"]
    recipients: List[str]  # e.g., ["Google Drive", "Gemini API"]
    retention_period: str  # e.g., "24 hours (guest)", "Until account deletion (user)"
    security_measures: List[str]
    timestamp: datetime
```

### 7.3 Consent Management

```typescript
// frontend/components/ConsentBanner.tsx
export function ConsentBanner() {
  const [consents, setConsents] = useState({
    necessary: true,      // Always required
    functional: false,    // Enhanced features
    analytics: false,     // Usage tracking
    marketing: false,     // Promotional communications
  });

  const handleAccept = async () => {
    await fetch("/api/v1/consent", {
      method: "POST",
      body: JSON.stringify({
        consents,
        timestamp: new Date().toISOString(),
        ip_address: await getUserIP(),
      }),
    });
  };

  return (
    <div className="consent-banner">
      <h3>Cookie Preferences</h3>
      <label>
        <input type="checkbox" checked={consents.necessary} disabled />
        Necessary (required for basic functionality)
      </label>
      <label>
        <input
          type="checkbox"
          checked={consents.functional}
          onChange={(e) => setConsents({...consents, functional: e.target.checked})}
        />
        Functional (enhanced features)
      </label>
      {/* ... other consent options */}
      <button onClick={handleAccept}>Save Preferences</button>
    </div>
  );
}
```

### 7.4 Data Retention Policy

| Data Type | Retention Period | Deletion Method |
|-----------|------------------|-----------------|
| Guest uploads | 24 hours | Automatic deletion |
| User documents | Until account deletion | Soft delete, then hard delete after 30 days |
| Analysis results | Until account deletion | Cascade delete with documents |
| Activity logs | 90 days | Automatic rotation |
| Audit logs | 1 year | Encrypted archive, then deletion |
| Backups | 30 days | Encrypted, automatic deletion |

---

## 8. Data Privacy

### 8.1 Privacy Policy (Key Points)

**Must Include:**
- Data controller identity and contact information
- Data protection officer (DPO) contact (if applicable)
- Purposes of data processing
- Legal basis for processing
- Data retention periods
- User rights (access, rectification, erasure, portability)
- Right to lodge complaint with supervisory authority
- Data transfers (Google, Gemini API)

### 8.2 Data Minimization

```python
# Collect only necessary data
class UserRegistration(BaseModel):
    email: EmailStr              # Required
    name: str                    # Required

    # NOT collected:
    # - Date of birth
    # - Phone number
    # - Physical address
    # - Government ID

# Document analysis metadata
class AnalysisMetadata(BaseModel):
    document_id: UUID
    risk_score: int
    flagged_count: int

    # Document content NOT stored permanently for guests
    # Only hash for deduplication
```

### 8.3 Anonymization for Analytics

```python
# backend/analytics/anonymize.py
import hashlib

def anonymize_user_id(user_id: str, salt: str) -> str:
    """Create anonymous identifier for analytics."""
    return hashlib.sha256(f"{user_id}{salt}".encode()).hexdigest()[:16]

def aggregate_usage_stats():
    """Collect anonymized usage statistics."""
    return {
        "total_analyses": await db.analyses.count(),
        "risk_distribution": {
            "high": await db.flagged_clauses.count({"risk_level": "high"}),
            "medium": await db.flagged_clauses.count({"risk_level": "medium"}),
            "low": await db.flagged_clauses.count({"risk_level": "low"}),
        },
        # No user-identifiable information
    }
```

---

## 9. Incident Response

### 9.1 Incident Response Plan

#### Phase 1: Detection & Analysis
1. **Alert triggered** (security monitoring, user report, automated scan)
2. **Initial assessment** (severity, scope, affected users)
3. **Incident classification** (data breach, service disruption, security vulnerability)

#### Phase 2: Containment
1. **Immediate actions**
   - Isolate affected systems
   - Revoke compromised credentials
   - Block malicious IP addresses
2. **Evidence preservation**
   - Capture logs
   - Take system snapshots
   - Document all actions

#### Phase 3: Eradication
1. **Remove threat** (patch vulnerabilities, remove malware)
2. **Verify integrity** (scan for backdoors, check for data exfiltration)

#### Phase 4: Recovery
1. **Restore services** (from clean backups if necessary)
2. **Verify functionality**
3. **Monitor for recurrence**

#### Phase 5: Post-Incident
1. **Root cause analysis**
2. **Update security measures**
3. **Notify affected users** (if data breach)
4. **Report to authorities** (GDPR requires within 72 hours)

### 9.2 Data Breach Notification

```python
# backend/security/breach_notification.py
from datetime import datetime, timedelta

async def notify_data_breach(
    breach_type: str,
    affected_users: List[str],
    data_categories: List[str],
    breach_date: datetime
):
    """Notify authorities and affected users of data breach (GDPR Article 33-34)."""

    # 1. Notify supervisory authority (within 72 hours)
    if datetime.utcnow() - breach_date < timedelta(hours=72):
        await notify_supervisory_authority({
            "controller": "FairPact Sp. z o.o.",
            "breach_type": breach_type,
            "affected_count": len(affected_users),
            "data_categories": data_categories,
            "breach_date": breach_date,
            "mitigation_measures": "...",
        })

    # 2. Notify affected users (if high risk)
    if is_high_risk_breach(breach_type, data_categories):
        for user_id in affected_users:
            await send_breach_notification_email(
                user_id,
                template="data_breach_notification",
                context={
                    "breach_type": breach_type,
                    "affected_data": data_categories,
                    "mitigation_steps": "...",
                    "contact_email": "security@fairpact.com",
                }
            )
```

---

## 10. Security Checklist

### 10.1 Pre-Launch Security Audit

- [ ] **Authentication**
  - [ ] HTTPS enforced on all endpoints
  - [ ] Session cookies are HTTP-only and Secure
  - [ ] CSRF protection enabled
  - [ ] OAuth flows validated

- [ ] **Authorization**
  - [ ] All endpoints have authorization checks
  - [ ] Resource ownership verified
  - [ ] Admin endpoints restricted

- [ ] **Data Protection**
  - [ ] Sensitive data encrypted at rest
  - [ ] TLS 1.3 configured
  - [ ] Database credentials in secrets manager
  - [ ] API keys rotated regularly

- [ ] **Input Validation**
  - [ ] All user inputs validated
  - [ ] SQL injection prevented (parameterized queries)
  - [ ] XSS prevented (output escaping)
  - [ ] File upload validation (type, size, content)

- [ ] **API Security**
  - [ ] Rate limiting implemented
  - [ ] CORS configured correctly
  - [ ] Request size limits set

- [ ] **Infrastructure**
  - [ ] Docker containers run as non-root
  - [ ] Unnecessary services disabled
  - [ ] Firewall rules configured
  - [ ] Security headers set

- [ ] **GDPR Compliance**
  - [ ] Privacy policy published
  - [ ] Consent mechanism implemented
  - [ ] Data export functionality
  - [ ] Account deletion functionality
  - [ ] Data retention policy enforced

- [ ] **Monitoring**
  - [ ] Sentry error tracking enabled
  - [ ] Failed login attempts logged
  - [ ] Suspicious activity alerts configured
  - [ ] Backup verification automated

- [ ] **Testing**
  - [ ] Security tests passing
  - [ ] Penetration testing completed
  - [ ] Dependency vulnerabilities resolved
  - [ ] OWASP ZAP scan passed

---

**Document End**
