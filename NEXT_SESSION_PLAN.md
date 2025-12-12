# Next Session Plan - FairPact Improvements

## Issues Identified (2025-12-12)

### 1. Frontend Navigation Issue
**Problem**: After document analysis completes, the frontend stays on "Analyzing" screen instead of automatically redirecting to the results page.

**Root Cause**: The upload page polls `/api/v1/jobs/{jobId}` but when status becomes "SUCCESS", it needs to redirect to `/analysis/{analysisId}`. The job response contains the analysis ID in `result.analysis.analysis_id`.

**Files to Check**:
- `frontend/src/app/upload/page.tsx` - Upload flow and polling logic
- `frontend/src/lib/api.ts` - `pollJobStatus` method

**Fix**: After job completion, extract `analysis_id` from result and redirect to `/analysis/{analysis_id}`.

---

### 2. Algorithm Sensitivity - Too Many False Positives
**Problem**: Algorithm identified 64 clauses as suspicious in a 5-page document (essentially flagging everything) because vector similarity matches common legal language.

**Current Behavior**:
- Similarity threshold is likely too low
- Located in `backend/services/analysis.py`

**Solution**:
- Add configurable `MIN_SIMILARITY_THRESHOLD` (start with 0.80 = 80%)
- Only flag clauses above this threshold
- Add this as a configuration option in `.env`

**Files to Modify**:
- `backend/services/analysis.py` - Add threshold filtering
- `backend/config.py` - Add `ANALYSIS_MIN_SIMILARITY_THRESHOLD` setting
- `backend/.env` - Add default value

---

### 3. Admin Panel with Feedback Loop (Future Feature)
**Goal**: Allow administrators to review analysis results and provide feedback to improve algorithm accuracy.

**Proposed Architecture**:

#### Database Changes
```sql
-- Feedback table for clause matches
CREATE TABLE analysis_feedback (
    id UUID PRIMARY KEY,
    flagged_clause_id UUID REFERENCES flagged_clauses(id),
    is_correct BOOLEAN NOT NULL,  -- Was this a true positive?
    reviewer_id UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Track model performance over time
CREATE TABLE model_metrics (
    id UUID PRIMARY KEY,
    date DATE,
    true_positives INT,
    false_positives INT,
    precision FLOAT,
    recall FLOAT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Backend Components
1. **Admin API endpoints** (`backend/api/admin.py`):
   - `POST /api/v1/admin/feedback` - Submit feedback for a flagged clause
   - `GET /api/v1/admin/pending-reviews` - Get analyses awaiting review
   - `GET /api/v1/admin/metrics` - Get model performance metrics

2. **Feedback service** (`backend/services/feedback.py`):
   - Process feedback submissions
   - Calculate model metrics
   - Export training data for model retraining

3. **Model retraining pipeline** (future):
   - Use feedback to create training dataset
   - Fine-tune embedding model or adjust similarity thresholds per category
   - A/B test new thresholds

#### Frontend Components
1. **Admin Dashboard** (`frontend/src/app/admin/`):
   - List of recent analyses for review
   - Interface to mark flagged clauses as correct/incorrect
   - Performance metrics visualization

2. **Review Interface**:
   - Show document text with highlighted flagged clauses
   - One-click approve/reject for each clause
   - Batch operations for efficiency

#### Authentication
- Add admin role to user model
- Protect admin routes with role-based middleware
- Consider separate admin authentication

---

## Priority Order

### Session 1 (Immediate Fixes)
1. [ ] Fix frontend redirect after analysis completion
2. [ ] Add similarity threshold configuration (80% default)
3. [ ] Test with sample document

### Session 2 (Admin Foundation)
4. [ ] Create database migrations for feedback tables
5. [ ] Implement feedback API endpoints
6. [ ] Add admin authentication middleware

### Session 3 (Admin UI)
7. [ ] Build admin dashboard page
8. [ ] Create review interface component
9. [ ] Add metrics visualization

### Session 4 (ML Improvements)
10. [ ] Implement feedback-based threshold adjustment
11. [ ] Add category-specific thresholds
12. [ ] Create model performance monitoring

---

## Quick Commands for Next Session

```bash
# Start all services
cd /home/uzzy/Kodzenie/Klauzule\ zakazane
podman-compose -f docker-compose.dev.yml up -d

# Start backend
cd backend && source .venv/bin/activate
uvicorn main:app --reload &
celery -A celery_app worker --loglevel=info -Q documents &

# Start frontend
cd ../frontend && npm run dev &
```

## Test Document
- File: `enea-1.pdf` (1MB ENEA energy contract)
- Document ID: `c68c5f30-9bee-4c0f-8332-b6bde950aa87`
- Analysis ID: `1e8cad4e-7906-4a48-aae7-da662fea02c4`
- Result: 64 clauses flagged (all high risk) - needs threshold adjustment
