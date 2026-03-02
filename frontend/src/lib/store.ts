import { create } from "zustand";
import type { DocumentUploadResponse, AnalysisDetail, JobStatus } from "@/types/api";

interface UploadState {
  // File state
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;

  // Upload state
  isUploading: boolean;
  uploadProgress: number;
  uploadError: string | null;
  uploadResponse: DocumentUploadResponse | null;

  // Processing state
  isProcessing: boolean;
  processingStatus: JobStatus | null;

  // Analysis state
  analysisResult: AnalysisDetail | null;

  // Actions
  startUpload: () => void;
  updateUploadProgress: (progress: number) => void;
  setUploadSuccess: (response: DocumentUploadResponse) => void;
  setUploadError: (error: string) => void;

  startProcessing: () => void;
  updateProcessingStatus: (status: JobStatus) => void;
  setProcessingComplete: (analysis: AnalysisDetail) => void;
  setProcessingError: (error: string) => void;

  reset: () => void;
}

const initialState = {
  selectedFile: null,
  isUploading: false,
  uploadProgress: 0,
  uploadError: null,
  uploadResponse: null,
  isProcessing: false,
  processingStatus: null,
  analysisResult: null,
};

export const useUploadStore = create<UploadState>((set) => ({
  ...initialState,

  setSelectedFile: (file) => set({ selectedFile: file, uploadError: null }),

  startUpload: () =>
    set({
      isUploading: true,
      uploadProgress: 0,
      uploadError: null,
      uploadResponse: null,
    }),

  updateUploadProgress: (progress) => set({ uploadProgress: progress }),

  setUploadSuccess: (response) =>
    set({
      isUploading: false,
      uploadProgress: 100,
      uploadResponse: response,
    }),

  setUploadError: (error) =>
    set({
      isUploading: false,
      uploadProgress: 0,
      uploadError: error,
    }),

  startProcessing: () =>
    set({
      isProcessing: true,
      processingStatus: null,
    }),

  updateProcessingStatus: (status) => set({ processingStatus: status }),

  setProcessingComplete: (analysis) =>
    set({
      isProcessing: false,
      analysisResult: analysis,
    }),

  setProcessingError: (error) =>
    set({
      isProcessing: false,
      uploadError: error,
    }),

  reset: () => set(initialState),
}));
