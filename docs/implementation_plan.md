# Contract Analysis Application Plan - "FairPact" (Working Title)

## 1. Project Overview
A web application (Desktop & Mobile) to analyze contracts, identify prohibited clauses using OCR and NLP, and highlight risks. Supports offline/rule-based analysis and optional AI enhancements.

## 2. Branding (Proposed)
**Name Options:**
1.  **FairPact** - Emphasizes fairness and agreement.
2.  **LexLens** - "Lens" for clarity in "Lex" (law).
3.  **Klauzula.ok** - Simple, Polish, domain-friendly.

**Logo Concept:**
-   **Symbol:** A stylized magnifying glass focusing on a paragraph line that turns from jagged (risk) to straight (safe), or a shield formed by two document pages.
-   **Style:** Minimalist, line-art.

## 3. Technology Stack

### Frontend
-   **Framework:** Next.js (React) - Great for SEO, performance, and hybrid rendering.
-   **UI Library:** TailwindCSS - For rapid, custom styling.
-   **State Management:** Zustand or React Context.
-   **Icons:** Lucide React (clean, sans-serif style).
-   **Font:** 'Inter' or 'Manrope' (Google Fonts) - Multi-language support, clean sans-serif.

### Backend (Analysis Engine)
-   **Language:** Python (Strongest ecosystem for NLP/OCR).
-   **Framework:** FastAPI - Fast, async, auto-docs.
-   **OCR:** Tesseract (open source) or EasyOCR.
-   **Document Parsing:** `pdfplumber` (PDF), `python-docx` (Word).
-   **NLP/Search:**
    -   **Non-AI Mode:** Fuzzy matching (Levenshtein distance), TF-IDF, or SentenceTransformers (local embeddings) + FAISS/pgvector for semantic search without external API.
    -   **AI Mode:** Gemini API integration for advanced context understanding.

### Database & Storage
-   **Database:** PostgreSQL.
    -   Stores User metadata, Clause Database (vectors), Feedback/Ratings.
    -   Extension: `pgvector` for semantic search.
-   **Storage:**
    -   **Guest:** Local filesystem (temp) or MinIO/S3 (with 24h retention policy).
    -   **User:** Google Drive API (files stay in user's Drive).
-   **Caching:** Redis (optional, for session management if high load).

### Authentication
-   **Library:** NextAuth.js (Auth.js).
-   **Providers:** Google (primary), Guest (anonymous session cookie).

## 4. Architecture Diagram
```mermaid
graph TD
    User[User (Mobile/Desktop)] -->|Upload/Photo| FE[Next.js Frontend]
    FE -->|Auth| Google[Google Auth / Drive]
    FE -->|API Request| BE[FastAPI Backend]
    
    subgraph "Backend Services"
        BE -->|Process| OCR[OCR Engine]
        BE -->|Parse| Parser[Doc Parser]
        BE -->|Search| SearchEng[Analysis Engine]
    end
    
    subgraph "Data Layer"
        SearchEng -->|Query| DB[(Postgres + pgvector)]
        SearchEng <-->|Optional| AI[External AI (Gemini)]
        BE -->|Temp Storage| FS[File System / S3]
    end
```

## 5. Implementation Phases

### Phase 1: Foundation & Design
1.  **Setup Repo:** Monorepo or separate Frontend/Backend.
2.  **Design System:** Configure Tailwind with Ecru/Brown (Light) and Dark Brown/Orange (Dark) themes.
3.  **Database Schema:** Define tables for Clauses, Users, Feedback.

### Phase 2: Core Analysis Engine (Python)
1.  **OCR Pipeline:** Implement image pre-processing and text extraction.
2.  **Clause DB:** Create API to CRUD prohibited clauses.
3.  **Matching Algorithm:** Implement hybrid search (Keyword + Vector similarity) using local models (e.g., `all-MiniLM-L6-v2`) to ensuring "Non-AI agent" requirement is met (local inference).

### Phase 3: Frontend Development
1.  **Upload Interface:** Drag & drop, Camera capture handling.
2.  **Result View:** Side-by-side view (Original doc vs Identified risks).
3.  **Clause Management Panel:** Admin-like interface for users to add custom clauses.

### Phase 4: Integrations & Polish
1.  **Google Integration:** Auth and Drive scopes.
2.  **Feedback Loop:** "Was this helpful?" buttons saving data for model tuning.
3.  **Guest Cleanup:** Cron job to delete temp files.

## 6. Hosting & Deployment
-   **Frontend:** Vercel (easiest) or Dockerized on VPS.
-   **Backend:** Dockerized container on a VPS (Hetzner/DigitalOcean) or Railway/Render.
-   **Database:** Managed Postgres (Supabase/Neon) or self-hosted via Docker.
-   **CI/CD:** GitHub Actions for automated testing and build.

## 7. Color Palette Strategy
-   **Light Mode (Ecru/Brown):**
    -   Background: `#F5F5DC` (Beige/Ecru)
    -   Primary Text: `#3E2723` (Dark Brown)
    -   Accents: `#8D6E63` (Earth tone)
-   **Dark Mode (Dark Brown/Orange):**
    -   Background: `#1A120B` (Very Dark Brown)
    -   Primary Text: `#E0E0E0` (Off-white)
    -   Accents: `#E65100` (Burnt Orange) for highlights/warnings.

## 8. Visual Design Concept
Below is a high-fidelity concept of the "FairPact" analysis interface, featuring the split-screen layout and Écru/Brown color scheme.

![FairPact UI Concept](/home/uzzy/.gemini/antigravity/brain/f2299791-b9d3-4c49-9b89-ad45ba37770c/fairpact_ui_mockup_1765196461005.png)


