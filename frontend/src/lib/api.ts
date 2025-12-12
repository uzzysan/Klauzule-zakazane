import type {
    DocumentUploadResponse,
    DocumentResponse,
    DocumentAnalysisResponse,
    AnalysisDetail,
    FlaggedClause,
    JobStatus,
    ApiError,
} from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                ...options?.headers,
            },
        });

        if (!response.ok) {
            const error: ApiError = await response.json().catch(() => ({
                error: { code: "UNKNOWN", message: "An unknown error occurred" },
            }));
            throw new Error(error.error?.message || `HTTP ${response.status}`);
        }

        return response.json();
    }

    // Document endpoints
    async uploadDocument(
        file: File,
        options: {
            language?: "pl" | "en";
            analysisMode?: "offline" | "ai";
            onProgress?: (progress: number) => void;
        } = {}
    ): Promise<DocumentUploadResponse> {
        const { language = "pl", analysisMode = "offline", onProgress } = options;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("language", language);
        formData.append("analysis_mode", analysisMode);

        // Use XMLHttpRequest for progress tracking
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener("progress", (event) => {
                if (event.lengthComputable && onProgress) {
                    const progress = Math.round((event.loaded / event.total) * 100);
                    onProgress(progress);
                }
            });

            xhr.addEventListener("load", () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    try {
                        const error = JSON.parse(xhr.responseText);
                        reject(new Error(error.error?.message || `HTTP ${xhr.status}`));
                    } catch {
                        reject(new Error(`HTTP ${xhr.status}`));
                    }
                }
            });

            xhr.addEventListener("error", () => {
                reject(new Error("Network error"));
            });

            xhr.open("POST", `${this.baseUrl}/api/v1/documents/upload`);
            xhr.send(formData);
        });
    }

    async getDocument(documentId: string): Promise<DocumentResponse> {
        return this.request<DocumentResponse>(`/api/v1/documents/${documentId}`);
    }

    // Analysis endpoints
    async getDocumentAnalysis(documentId: string): Promise<DocumentAnalysisResponse> {
        return this.request<DocumentAnalysisResponse>(`/api/v1/analysis/document/${documentId}`);
    }

    async getAnalysis(analysisId: string): Promise<AnalysisDetail> {
        return this.request<AnalysisDetail>(`/api/v1/analysis/${analysisId}`);
    }

    async getFlaggedClauses(
        analysisId: string,
        options?: {
            riskLevel?: "high" | "medium" | "low";
            minConfidence?: number;
        }
    ): Promise<FlaggedClause[]> {
        const params = new URLSearchParams();
        if (options?.riskLevel) params.set("risk_level", options.riskLevel);
        if (options?.minConfidence) params.set("min_confidence", options.minConfidence.toString());

        const query = params.toString() ? `?${params.toString()}` : "";
        return this.request<FlaggedClause[]>(`/api/v1/analysis/${analysisId}/clauses${query}`);
    }

    // Job status
    async getJobStatus(jobId: string): Promise<JobStatus> {
        return this.request<JobStatus>(`/api/v1/jobs/${jobId}`);
    }

    // Poll for job completion
    async pollJobStatus(
        jobId: string,
        options: {
            interval?: number;
            timeout?: number;
            onStatusChange?: (status: JobStatus) => void;
        } = {}
    ): Promise<JobStatus> {
        const { interval = 2000, timeout = 300000, onStatusChange } = options;
        const startTime = Date.now();

        return new Promise((resolve, reject) => {
            const poll = async () => {
                try {
                    const status = await this.getJobStatus(jobId);
                    onStatusChange?.(status);

                    if (status.status === "completed") {
                        resolve(status);
                        return;
                    }

                    if (status.status === "failed") {
                        reject(new Error(status.error || "Job failed"));
                        return;
                    }

                    if (Date.now() - startTime > timeout) {
                        reject(new Error("Polling timeout"));
                        return;
                    }

                    setTimeout(poll, interval);
                } catch (error) {
                    reject(error);
                }
            };

            poll();
        });
    }
}

export const api = new ApiClient();
export default api;
