// Document types
export interface DocumentUploadResponse {
    document_id: string;
    filename: string;
    size_bytes: number;
    pages: number | null;
    upload_url: string;
    created_at: string;
}

export interface DocumentResponse {
    document_id: string;
    filename: string;
    size_bytes: number;
    pages: number | null;
    language: string;
    status: "uploaded" | "processing" | "completed" | "failed" | "expired";
    ocr_required: boolean;
    ocr_completed: boolean;
    ocr_confidence: number | null;
    created_at: string;
    upload_url: string;
    celery_task_id: string | null;
}

// Analysis types
export type RiskLevel = "high" | "medium" | "low";
export type MatchType = "keyword" | "vector" | "hybrid" | "ai";
export type AnalysisStatus = "queued" | "processing" | "completed" | "failed" | "cancelled";

export interface LegalReference {
    article_code: string | null;
    article_title: string | null;
    law_name: string | null;
    description: string | null;
}

export interface FlaggedClauseExplanation {
    clause_text: string;
    legal_references: LegalReference[];
    notes: string | null;
    tags: string[] | null;
}

export interface FlaggedClause {
    id: string;
    clause_id: string | null;
    matched_text: string;
    start_position: number | null;
    end_position: number | null;
    confidence: number;
    risk_level: RiskLevel;
    match_type: MatchType;
    explanation: FlaggedClauseExplanation | null;
    ai_explanation: string | null;
    created_at: string;
}

export interface AnalysisSummary {
    id: string;
    document_id: string;
    mode: "offline" | "ai";
    language: string;
    status: AnalysisStatus;
    total_clauses_found: number;
    high_risk_count: number;
    medium_risk_count: number;
    low_risk_count: number;
    risk_score: number | null;
    started_at: string | null;
    completed_at: string | null;
    duration_seconds: number | null;
    created_at: string;
}

export interface AnalysisDetail extends AnalysisSummary {
    flagged_clauses: FlaggedClause[];
    summary: string | null;
    error_code: string | null;
    error_message: string | null;
}

export interface DocumentAnalysisResponse {
    document_id: string;
    filename: string;
    status: string;
    language: string;
    pages: number | null;
    created_at: string;
    latest_analysis: AnalysisSummary | null;
}

// Job status types
export interface JobStatus {
    job_id: string;
    status: "queued" | "processing" | "completed" | "failed";
    result: {
        document_id?: string;
        status?: string;
        analysis?: {
            analysis_id: string;
            total_clauses_found?: number;
            high_risk_count?: number;
            medium_risk_count?: number;
            low_risk_count?: number;
            risk_score?: number;
        };
        [key: string]: unknown;
    } | null;
    error: string | null;
    meta: {
        stage?: string;
        error?: string;
        document_id?: string;
    } | null;
}

// API Error
export interface ApiError {
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
}
