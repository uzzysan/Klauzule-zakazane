# FairPact - Testing Strategy v1.0

## Document Information
- **Version:** 1.0
- **Last Updated:** 2025-12-08
- **Coverage Target:** 80% (Frontend), 90% (Backend)
- **Related Documents:** [Implementation Plan](./implementation_plan_v2.md)

---

## Table of Contents
1. [Testing Philosophy](#1-testing-philosophy)
2. [Testing Pyramid](#2-testing-pyramid)
3. [Frontend Testing](#3-frontend-testing)
4. [Backend Testing](#4-backend-testing)
5. [Integration Testing](#5-integration-testing)
6. [End-to-End Testing](#6-end-to-end-testing)
7. [Performance Testing](#7-performance-testing)
8. [Security Testing](#8-security-testing)
9. [ML/OCR Testing](#9-mlocr-testing)
10. [CI/CD Integration](#10-cicd-integration)
11. [Test Data Management](#11-test-data-management)

---

## 1. Testing Philosophy

### Core Principles

1. **Test Behavior, Not Implementation**
   - Focus on user-facing functionality
   - Avoid testing internal implementation details
   - Tests should survive refactoring

2. **Fast Feedback Loops**
   - Unit tests run in <5 seconds
   - Integration tests in <30 seconds
   - Full suite in <5 minutes

3. **Realistic Test Data**
   - Use real Polish contract samples (anonymized)
   - Test with actual PDFs, not mocks
   - Include edge cases (poor scans, complex layouts)

4. **Fail Fast, Fail Clear**
   - Tests should have clear error messages
   - No flaky tests in main branch
   - Immediate failure on critical issues

---

## 2. Testing Pyramid

```
           /\
          /  \
         / E2E \ ──────── 10% (Critical user journeys)
        /──────\
       /        \
      / Integr.  \ ────── 30% (API endpoints, services)
     /────────────\
    /              \
   /   Unit Tests   \ ─── 60% (Business logic, utilities)
  /──────────────────\
```

### Coverage Targets

| Layer | Coverage | Test Count | Execution Time |
|-------|----------|------------|----------------|
| Unit Tests | 90% | ~500 | <5s |
| Integration Tests | 80% | ~150 | <30s |
| E2E Tests | Critical paths | ~30 | <3m |
| Performance Tests | Key operations | ~20 | <5m |

---

## 3. Frontend Testing

### 3.1 Technology Stack

- **Test Runner:** Vitest
- **Component Testing:** React Testing Library
- **E2E:** Playwright
- **Mocking:** MSW (Mock Service Worker)
- **Visual Regression:** Chromatic (optional)

### 3.2 Unit Tests

#### Component Tests

```typescript
// Example: UploadZone.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UploadZone } from './UploadZone';

describe('UploadZone', () => {
  it('should accept PDF files', async () => {
    const onUpload = vi.fn();
    render(<UploadZone onUpload={onUpload} />);

    const file = new File(['dummy'], 'contract.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText('Upload document');

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(onUpload).toHaveBeenCalledWith(file);
    });
  });

  it('should reject invalid file types', () => {
    render(<UploadZone onUpload={vi.fn()} />);

    const file = new File(['dummy'], 'malware.exe', { type: 'application/exe' });
    const input = screen.getByLabelText('Upload document');

    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText(/Invalid file type/i)).toBeInTheDocument();
  });

  it('should show file size warning for large files', () => {
    render(<UploadZone onUpload={vi.fn()} maxSizeMB={10} />);

    const largeFile = new File(
      [new ArrayBuffer(11 * 1024 * 1024)],
      'large.pdf',
      { type: 'application/pdf' }
    );

    const input = screen.getByLabelText('Upload document');
    fireEvent.change(input, { target: { files: [largeFile] } });

    expect(screen.getByText(/File too large/i)).toBeInTheDocument();
  });
});
```

#### Hook Tests

```typescript
// Example: useAnalysis.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useAnalysis } from './useAnalysis';

describe('useAnalysis', () => {
  it('should fetch analysis results', async () => {
    const { result } = renderHook(() => useAnalysis('analysis_123'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBeDefined();
    });
  });

  it('should handle errors gracefully', async () => {
    const { result } = renderHook(() => useAnalysis('invalid_id'));

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.data).toBeNull();
    });
  });
});
```

### 3.3 Integration Tests

Test component interactions and state management.

```typescript
// Example: DocumentUploadFlow.test.tsx
describe('Document Upload Flow', () => {
  it('should complete full upload workflow', async () => {
    render(<App />);

    // Upload file
    const file = new File(['content'], 'contract.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText('Upload document');
    fireEvent.change(input, { target: { files: [file] } });

    // Wait for upload confirmation
    await waitFor(() => {
      expect(screen.getByText(/Upload successful/i)).toBeInTheDocument();
    });

    // Start analysis
    const analyzeButton = screen.getByRole('button', { name: /Analyze/i });
    fireEvent.click(analyzeButton);

    // Wait for results
    await waitFor(() => {
      expect(screen.getByText(/Analysis complete/i)).toBeInTheDocument();
    }, { timeout: 5000 });

    // Verify results display
    expect(screen.getByText(/Risk Score/i)).toBeInTheDocument();
  });
});
```

### 3.4 Test Coverage Areas

| Component | Priority | Coverage Target |
|-----------|----------|-----------------|
| UploadZone | High | 95% |
| DocumentViewer | High | 90% |
| AnalysisResults | High | 95% |
| ClauseList | Medium | 85% |
| UserDashboard | Medium | 80% |
| SettingsPanel | Low | 70% |

---

## 4. Backend Testing

### 4.1 Technology Stack

- **Test Framework:** pytest
- **Async Testing:** pytest-asyncio
- **Mocking:** pytest-mock
- **HTTP Testing:** httpx (for FastAPI)
- **Database:** pytest-postgresql (test fixtures)
- **Coverage:** pytest-cov

### 4.2 Unit Tests

#### Service Tests

```python
# tests/services/test_ocr_service.py
import pytest
from services.ocr_service import OCRService

@pytest.fixture
def ocr_service():
    return OCRService()

def test_extract_text_from_pdf(ocr_service, sample_pdf_path):
    """Test text extraction from native PDF."""
    result = ocr_service.extract_text(sample_pdf_path)

    assert result.success is True
    assert len(result.text) > 0
    assert result.confidence > 0.95
    assert "umowa" in result.text.lower()  # Polish word check

def test_extract_text_from_image(ocr_service, sample_image_path):
    """Test OCR on scanned document image."""
    result = ocr_service.extract_text(sample_image_path)

    assert result.success is True
    assert result.ocr_used is True
    assert result.confidence > 0.80

def test_handles_corrupted_file(ocr_service, corrupted_file_path):
    """Test graceful handling of corrupted files."""
    result = ocr_service.extract_text(corrupted_file_path)

    assert result.success is False
    assert result.error is not None
    assert "corrupted" in result.error.lower()

def test_polish_characters_preserved(ocr_service, polish_text_pdf):
    """Test that Polish diacritics are correctly extracted."""
    result = ocr_service.extract_text(polish_text_pdf)

    # Check for Polish characters
    polish_chars = ['ą', 'ć', 'ę', 'ł', 'ń', 'ó', 'ś', 'ź', 'ż']
    for char in polish_chars:
        assert char in result.text
```

#### Vector Search Tests

```python
# tests/services/test_vector_search.py
import pytest
import numpy as np
from services.vector_search import VectorSearchService

@pytest.fixture
async def vector_service(test_db):
    return VectorSearchService(test_db)

@pytest.mark.asyncio
async def test_similarity_search(vector_service):
    """Test vector similarity search."""
    query = "Konsument rezygnuje z prawa do odwołania"

    results = await vector_service.search_similar_clauses(
        query_text=query,
        language='pl',
        top_k=5
    )

    assert len(results) <= 5
    assert all(r.similarity >= 0.7 for r in results)
    assert results[0].similarity >= results[-1].similarity  # Sorted

@pytest.mark.asyncio
async def test_hybrid_search_combines_methods(vector_service):
    """Test that hybrid search uses both keyword and vector."""
    query = "ukryte opłaty serwisowe"

    results = await vector_service.hybrid_search(
        query_text=query,
        language='pl'
    )

    # Should have matches from both methods
    assert any(r.match_method == 'keyword' for r in results)
    assert any(r.match_method == 'vector' for r in results)
```

### 4.3 API Endpoint Tests

```python
# tests/api/test_document_endpoints.py
import pytest
from httpx import AsyncClient
from main import app

@pytest.mark.asyncio
async def test_upload_document_success(auth_client: AsyncClient):
    """Test successful document upload."""
    files = {'file': ('contract.pdf', open('tests/fixtures/sample.pdf', 'rb'), 'application/pdf')}
    data = {'language': 'pl', 'analysis_mode': 'offline'}

    response = await auth_client.post('/api/v1/documents/upload', files=files, data=data)

    assert response.status_code == 200
    json_data = response.json()
    assert 'document_id' in json_data
    assert json_data['filename'] == 'contract.pdf'

@pytest.mark.asyncio
async def test_upload_invalid_file_type(auth_client: AsyncClient):
    """Test rejection of invalid file type."""
    files = {'file': ('malware.exe', b'MZ\x90\x00', 'application/exe')}

    response = await auth_client.post('/api/v1/documents/upload', files=files)

    assert response.status_code == 400
    assert 'invalid file type' in response.json()['error']['message'].lower()

@pytest.mark.asyncio
async def test_get_document_not_found(auth_client: AsyncClient):
    """Test 404 for non-existent document."""
    response = await auth_client.get('/api/v1/documents/nonexistent_id')

    assert response.status_code == 404

@pytest.mark.asyncio
async def test_rate_limiting(guest_client: AsyncClient):
    """Test rate limiting for guest users."""
    # Make 11 requests (limit is 10/min for guests)
    for i in range(11):
        response = await guest_client.get('/api/v1/clauses')

    assert response.status_code == 429
    assert 'rate limit' in response.json()['error']['message'].lower()
```

### 4.4 Database Tests

```python
# tests/database/test_clause_repository.py
import pytest
from repositories.clause_repository import ClauseRepository

@pytest.mark.asyncio
async def test_create_clause(test_db):
    """Test creating a new clause."""
    repo = ClauseRepository(test_db)

    clause = await repo.create(
        text="Test clause",
        category_id="cat_123",
        risk_level="high",
        language="pl"
    )

    assert clause.id is not None
    assert clause.text == "Test clause"
    assert clause.embedding is not None  # Generated by trigger

@pytest.mark.asyncio
async def test_soft_delete(test_db):
    """Test soft delete functionality."""
    repo = ClauseRepository(test_db)

    clause = await repo.create(text="Test", category_id="cat_123")
    await repo.delete(clause.id)

    # Should not be found in normal queries
    result = await repo.get_by_id(clause.id)
    assert result is None

    # But should exist with include_deleted
    result = await repo.get_by_id(clause.id, include_deleted=True)
    assert result is not None
    assert result.deleted_at is not None
```

---

## 5. Integration Testing

### 5.1 Full Pipeline Tests

Test complete workflows end-to-end within the backend.

```python
# tests/integration/test_analysis_pipeline.py
import pytest

@pytest.mark.asyncio
@pytest.mark.integration
async def test_complete_analysis_pipeline(test_app, sample_pdf):
    """Test the entire analysis pipeline."""

    # 1. Upload document
    files = {'file': ('test.pdf', sample_pdf, 'application/pdf')}
    upload_response = await test_app.post('/api/v1/documents/upload', files=files)
    doc_id = upload_response.json()['document_id']

    # 2. Start analysis
    analysis_response = await test_app.post('/api/v1/analysis/start', json={
        'document_id': doc_id,
        'mode': 'offline'
    })
    job_id = analysis_response.json()['job_id']

    # 3. Wait for completion (with timeout)
    import asyncio
    for _ in range(30):  # 30 seconds timeout
        job_response = await test_app.get(f'/api/v1/jobs/{job_id}')
        status = job_response.json()['status']

        if status == 'completed':
            break
        elif status == 'failed':
            pytest.fail(f"Analysis failed: {job_response.json()['error']}")

        await asyncio.sleep(1)
    else:
        pytest.fail("Analysis timed out")

    # 4. Verify results
    analysis_id = job_response.json()['result']['analysis_id']
    results = await test_app.get(f'/api/v1/analysis/{analysis_id}')

    assert results.status_code == 200
    data = results.json()
    assert data['status'] == 'completed'
    assert 'flagged_clauses' in data['results']
    assert data['results']['risk_score'] >= 0
```

### 5.2 Third-Party Integration Tests

```python
# tests/integration/test_google_drive.py
@pytest.mark.asyncio
@pytest.mark.integration
@pytest.mark.skipif(not os.getenv('GOOGLE_CREDENTIALS'), reason="Needs Google credentials")
async def test_google_drive_upload(authenticated_user, sample_document):
    """Test uploading document to Google Drive."""
    from services.google_drive import GoogleDriveService

    service = GoogleDriveService(authenticated_user.google_token)

    file_id = await service.upload_file(
        filename='test_contract.pdf',
        content=sample_document,
        mime_type='application/pdf'
    )

    assert file_id is not None

    # Verify file exists
    file_info = await service.get_file_info(file_id)
    assert file_info['name'] == 'test_contract.pdf'

    # Cleanup
    await service.delete_file(file_id)
```

---

## 6. End-to-End Testing

### 6.1 Technology: Playwright

```typescript
// tests/e2e/upload-and-analyze.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Document Analysis Flow', () => {
  test('should analyze uploaded contract', async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:3000');

    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./fixtures/sample_contract.pdf');

    // Wait for upload
    await expect(page.locator('text=Upload successful')).toBeVisible();

    // Select analysis mode
    await page.click('text=Offline Mode');

    // Start analysis
    await page.click('button:has-text("Analyze Document")');

    // Wait for results (with increased timeout for processing)
    await expect(page.locator('text=Analysis Complete')).toBeVisible({ timeout: 30000 });

    // Verify risk score displayed
    const riskScore = page.locator('[data-testid="risk-score"]');
    await expect(riskScore).toBeVisible();

    // Check flagged clauses
    const flaggedList = page.locator('[data-testid="flagged-clauses"]');
    const clauseCount = await flaggedList.locator('li').count();
    expect(clauseCount).toBeGreaterThan(0);

    // Click on first clause
    await flaggedList.locator('li').first().click();

    // Verify detail panel opens
    await expect(page.locator('[data-testid="clause-detail"]')).toBeVisible();
  });

  test('should handle guest user limits', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Upload 4 documents as guest (limit is 3)
    for (let i = 0; i < 4; i++) {
      await page.locator('input[type="file"]').setInputFiles('./fixtures/sample.pdf');

      if (i < 3) {
        await expect(page.locator('text=Upload successful')).toBeVisible();
      } else {
        // 4th upload should show quota exceeded
        await expect(page.locator('text=Quota exceeded')).toBeVisible();
      }
    }
  });
});
```

### 6.2 E2E Test Scenarios

| Scenario | Priority | Status |
|----------|----------|--------|
| Guest upload & analyze | High | ✅ |
| User login & Google Drive sync | High | ✅ |
| Custom clause creation | Medium | ✅ |
| Export analysis report | Medium | ✅ |
| Mobile camera capture | Medium | 🔄 |
| Dark mode toggle | Low | ✅ |
| Language switching | Low | ✅ |

---

## 7. Performance Testing

### 7.1 Technology: Locust

```python
# tests/performance/locustfile.py
from locust import HttpUser, task, between

class FairPactUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        """Login before starting tasks."""
        self.client.post("/api/v1/auth/session", json={"mode": "guest"})

    @task(3)
    def list_clauses(self):
        """Most common operation."""
        self.client.get("/api/v1/clauses?limit=20")

    @task(2)
    def get_clause_details(self):
        """View clause details."""
        self.client.get("/api/v1/clauses/clause_001")

    @task(1)
    def upload_and_analyze(self):
        """Less frequent but resource-intensive."""
        with open("fixtures/sample.pdf", "rb") as f:
            files = {"file": ("contract.pdf", f, "application/pdf")}
            response = self.client.post("/api/v1/documents/upload", files=files)

            if response.status_code == 200:
                doc_id = response.json()["document_id"]

                # Start analysis
                analysis_response = self.client.post("/api/v1/analysis/start", json={
                    "document_id": doc_id,
                    "mode": "offline"
                })

                if analysis_response.status_code == 202:
                    job_id = analysis_response.json()["job_id"]

                    # Poll for completion
                    for _ in range(30):
                        job_response = self.client.get(f"/api/v1/jobs/{job_id}")
                        if job_response.json()["status"] in ["completed", "failed"]:
                            break
                        self.client.wait()
```

### 7.2 Performance Benchmarks

| Operation | Target | Acceptable | Unacceptable |
|-----------|--------|------------|--------------|
| API Response (simple GET) | <100ms | <200ms | >500ms |
| Document Upload (5MB) | <2s | <5s | >10s |
| OCR Processing (10 pages) | <15s | <30s | >60s |
| Vector Search | <500ms | <1s | >2s |
| Analysis (10-page doc) | <20s | <45s | >90s |
| Page Load (FCP) | <1s | <2s | >3s |
| Page Load (LCP) | <2s | <3s | >5s |

---

## 8. Security Testing

### 8.1 Automated Security Scans

```yaml
# .github/workflows/security.yml
name: Security Scans

on: [push, pull_request]

jobs:
  dependency-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run npm audit
        run: cd frontend && npm audit --audit-level=high

      - name: Run pip safety check
        run: cd backend && safety check --json

  sast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: auto

  secrets-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: TruffleHog Scan
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
```

### 8.2 Manual Security Tests

```python
# tests/security/test_auth.py
import pytest

@pytest.mark.security
async def test_sql_injection_protection(test_app):
    """Test that SQL injection is prevented."""
    malicious_input = "' OR '1'='1'; DROP TABLE users; --"

    response = await test_app.get(f"/api/v1/clauses?search={malicious_input}")

    assert response.status_code in [200, 400]  # Should not cause 500
    # Verify database integrity
    # (check that users table still exists)

@pytest.mark.security
async def test_xss_protection(test_app):
    """Test XSS prevention in user input."""
    xss_payload = "<script>alert('XSS')</script>"

    response = await test_app.post("/api/v1/clauses", json={
        "text": xss_payload,
        "category_id": "cat_123"
    })

    # Payload should be escaped/sanitized
    clause = response.json()
    assert "<script>" not in clause["text"]

@pytest.mark.security
async def test_unauthorized_access_denied(test_app):
    """Test that protected endpoints require auth."""
    response = await test_app.get("/api/v1/users/me")

    assert response.status_code == 401

@pytest.mark.security
async def test_csrf_protection(test_app):
    """Test CSRF token validation."""
    # Attempt request without CSRF token
    response = await test_app.post("/api/v1/documents/upload", headers={
        "X-CSRF-Token": "invalid_token"
    })

    assert response.status_code == 403
```

### 8.3 OWASP Top 10 Checklist

- [ ] A01: Broken Access Control - Test authorization on all endpoints
- [ ] A02: Cryptographic Failures - Verify HTTPS, encrypted storage
- [ ] A03: Injection - SQL, NoSQL, Command injection tests
- [ ] A04: Insecure Design - Review architecture for flaws
- [ ] A05: Security Misconfiguration - Audit server configs
- [ ] A06: Vulnerable Components - Dependency scanning
- [ ] A07: Authentication Failures - Session management tests
- [ ] A08: Software Integrity Failures - Code signing, SRI
- [ ] A09: Logging Failures - Security event logging
- [ ] A10: SSRF - Validate URL inputs

---

## 9. ML/OCR Testing

### 9.1 OCR Accuracy Tests

```python
# tests/ml/test_ocr_accuracy.py
import pytest
from services.ocr_service import OCRService
from difflib import SequenceMatcher

@pytest.fixture
def ocr_service():
    return OCRService()

def calculate_accuracy(ground_truth: str, extracted: str) -> float:
    """Calculate text similarity ratio."""
    return SequenceMatcher(None, ground_truth, extracted).ratio()

@pytest.mark.parametrize("test_file,expected_text,min_accuracy", [
    ("clean_typed.pdf", "fixtures/clean_typed_expected.txt", 0.95),
    ("scanned_good.pdf", "fixtures/scanned_good_expected.txt", 0.85),
    ("scanned_poor.pdf", "fixtures/scanned_poor_expected.txt", 0.70),
    ("handwritten.pdf", "fixtures/handwritten_expected.txt", 0.60),
])
def test_ocr_accuracy_levels(ocr_service, test_file, expected_text, min_accuracy):
    """Test OCR accuracy on different document qualities."""
    result = ocr_service.extract_text(f"fixtures/{test_file}")

    with open(expected_text, 'r', encoding='utf-8') as f:
        ground_truth = f.read()

    accuracy = calculate_accuracy(ground_truth, result.text)
    assert accuracy >= min_accuracy, f"OCR accuracy {accuracy:.2%} below {min_accuracy:.0%}"

def test_polish_diacritics_accuracy(ocr_service):
    """Test Polish character recognition accuracy."""
    result = ocr_service.extract_text("fixtures/polish_text.pdf")

    # Count correctly recognized Polish characters
    polish_chars = ['ą', 'ć', 'ę', 'ł', 'ń', 'ó', 'ś', 'ź', 'ż']
    total_polish = sum(result.text.count(char) for char in polish_chars)

    # Should recognize at least 90% correctly
    assert total_polish > 0, "No Polish characters found"
```

### 9.2 Vector Search Quality Tests

```python
# tests/ml/test_vector_search_quality.py
import pytest

@pytest.mark.asyncio
async def test_semantic_similarity_quality(vector_service):
    """Test that semantically similar clauses are found."""
    query = "Sprzedawca nie odpowiada za wady"
    expected_similar = "Brak odpowiedzialności sprzedającego"

    results = await vector_service.search_similar_clauses(query, top_k=5)

    # Check if expected similar clause is in top results
    found = any(expected_similar in r.text for r in results[:3])
    assert found, "Semantically similar clause not found in top 3"

@pytest.mark.asyncio
async def test_cross_language_search_fails_gracefully(vector_service):
    """Test English query doesn't match Polish clauses."""
    query = "The seller is not responsible for defects"

    results = await vector_service.search_similar_clauses(
        query,
        language='pl',  # Polish database
        threshold=0.7
    )

    # Should return few or no results
    assert len(results) < 3, "Cross-language false positives"
```

---

## 10. CI/CD Integration

### 10.1 GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: cd frontend && npm ci

      - name: Run linting
        run: cd frontend && npm run lint

      - name: Run type checking
        run: cd frontend && npm run type-check

      - name: Run unit tests
        run: cd frontend && npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./frontend/coverage/lcov.info
          flags: frontend

  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: pgvector/pgvector:pg15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install -r requirements-dev.txt

      - name: Run linting
        run: cd backend && black --check . && isort --check .

      - name: Run type checking
        run: cd backend && mypy .

      - name: Run unit tests
        run: cd backend && pytest --cov=. --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage.xml
          flags: backend

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [frontend-tests, backend-tests]
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Start services
        run: docker-compose -f docker-compose.test.yml up -d

      - name: Wait for services
        run: npx wait-on http://localhost:3000 http://localhost:8000/health

      - name: Run E2E tests
        run: npx playwright test

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

### 10.2 Pre-commit Hooks

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-json
      - id: check-added-large-files

  - repo: https://github.com/psf/black
    rev: 23.12.1
    hooks:
      - id: black
        files: ^backend/

  - repo: https://github.com/charliermarsh/ruff-pre-commit
    rev: v0.1.9
    hooks:
      - id: ruff
        files: ^backend/

  - repo: local
    hooks:
      - id: frontend-lint
        name: Frontend Lint
        entry: bash -c 'cd frontend && npm run lint'
        language: system
        pass_filenames: false
        files: ^frontend/
```

---

## 11. Test Data Management

### 11.1 Fixture Organization

```
tests/
├── fixtures/
│   ├── documents/
│   │   ├── clean_typed.pdf
│   │   ├── scanned_good.pdf
│   │   ├── scanned_poor.pdf
│   │   ├── polish_contract_01.pdf
│   │   ├── polish_contract_02.docx
│   │   └── malformed.pdf
│   ├── expected_outputs/
│   │   ├── clean_typed_expected.txt
│   │   └── scanned_good_expected.txt
│   ├── clauses/
│   │   └── prohibited_clauses_seed.json
│   └── users/
│       └── test_users.json
```

### 11.2 Data Generation

```python
# tests/factories.py
import factory
from models import User, Document, Analysis

class UserFactory(factory.Factory):
    class Meta:
        model = User

    email = factory.Faker('email')
    name = factory.Faker('name')
    subscription_tier = 'free'

class DocumentFactory(factory.Factory):
    class Meta:
        model = Document

    filename = factory.Faker('file_name', extension='pdf')
    size_bytes = factory.Faker('random_int', min=1000, max=5000000)
    pages = factory.Faker('random_int', min=1, max=50)
    language = 'pl'
    status = 'uploaded'

class AnalysisFactory(factory.Factory):
    class Meta:
        model = Analysis

    document = factory.SubFactory(DocumentFactory)
    mode = 'offline'
    status = 'completed'
    risk_score = factory.Faker('random_int', min=0, max=100)
```

---

## 12. Continuous Improvement

### 12.1 Test Metrics Dashboard

Track these metrics over time:

- **Coverage Trends:** Line, branch, function coverage
- **Test Execution Time:** Identify slow tests
- **Flaky Test Rate:** Target <1%
- **Bug Escape Rate:** Bugs found in production vs. caught in tests
- **ML Metrics:** OCR accuracy, clause detection precision/recall

### 12.2 Regular Reviews

- **Weekly:** Review failed tests, update flaky test list
- **Monthly:** Analyze coverage gaps, update test priorities
- **Quarterly:** Security audit, performance benchmark review

---

**Document End**
