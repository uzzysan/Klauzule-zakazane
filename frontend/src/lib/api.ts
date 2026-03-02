import type {
  DocumentUploadResponse,
  DocumentResponse,
  DocumentAnalysisResponse,
  AnalysisDetail,
  FlaggedClause,
  JobStatus,
  ApiError,
  User,
  UserWithToken,
  LoginCredentials,
  RegisterData,
  MetricsResponse,
  PendingReviewItem,
  FeedbackCreate,
  FeedbackResponse,
  SyncResponse,
} from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    // Load token from localStorage if available
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token");
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("auth_token", token);
      } else {
        localStorage.removeItem("auth_token");
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private getAuthHeaders(): HeadersInit {
    if (this.token) {
      return { Authorization: `Bearer ${this.token}` };
    }
    return {};
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
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
      xhr.withCredentials = true;
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

  // =====================
  // Authentication endpoints
  // =====================

  async login(credentials: LoginCredentials): Promise<UserWithToken> {
    const response = await this.request<UserWithToken>("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    this.setToken(response.token.access_token);
    return response;
  }

  async register(data: RegisterData): Promise<UserWithToken> {
    const response = await this.request<UserWithToken>("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    this.setToken(response.token.access_token);
    return response;
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>("/api/v1/auth/me");
  }

  async refreshToken(): Promise<{ access_token: string; token_type: string; expires_in: number }> {
    const response = await this.request<{
      access_token: string;
      token_type: string;
      expires_in: number;
    }>("/api/v1/auth/refresh", { method: "POST" });
    this.setToken(response.access_token);
    return response;
  }

  logout() {
    this.setToken(null);
  }

  // =====================
  // Admin endpoints
  // =====================

  async getMetrics(days: number = 30): Promise<MetricsResponse[]> {
    return this.request<MetricsResponse[]>(`/api/v1/admin/metrics?days=${days}`);
  }

  async getPendingReviews(limit: number = 20): Promise<PendingReviewItem[]> {
    return this.request<PendingReviewItem[]>(`/api/v1/admin/pending-reviews?limit=${limit}`);
  }

  async submitFeedback(feedback: FeedbackCreate): Promise<FeedbackResponse> {
    return this.request<FeedbackResponse>("/api/v1/admin/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(feedback),
    });
  }

  async triggerClauseSync(): Promise<SyncResponse> {
    return this.request<SyncResponse>("/api/v1/admin/sync-clauses", {
      method: "POST",
    });
  }
}

export const api = new ApiClient();
export default api;
