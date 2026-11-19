"use client";

import * as React from "react";
import { AlertCircle, FileText, UploadCloud, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "./button";

const ALLOWED_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  selectedFile?: File | null;
  isUploading?: boolean;
  uploadProgress?: number;
  error?: string | null;
  disabled?: boolean;
}

const fade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
} as const;

export function FileUpload({
  onFileSelect,
  onFileRemove,
  selectedFile,
  isUploading,
  uploadProgress = 0,
  error,
  disabled,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const inactive = disabled || isUploading;

  const validateFile = (file: File): string | null => {
    if (!Object.keys(ALLOWED_TYPES).includes(file.type)) {
      return "Nieobsługiwany format pliku. Dozwolone: PDF, DOCX, JPG, PNG";
    }
    if (file.size > MAX_FILE_SIZE) {
      return `Plik jest zbyt duży. Maksymalny rozmiar: ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }
    return null;
  };

  const handleFile = (file: File) => {
    const err = validateFile(file);
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(null);
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (inactive) return;
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!inactive) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const openPicker = () => {
    if (!inactive) inputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPicker();
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setValidationError(null);
    onFileRemove?.();
    if (inputRef.current) inputRef.current.value = "";
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const displayError = error || validationError;

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={inactive ? -1 : 0}
        aria-disabled={inactive || undefined}
        aria-label="Wybierz plik umowy do analizy"
        onClick={openPicker}
        onKeyDown={handleKeyDown}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors duration-base ease-calm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
          isDragOver
            ? "border-primary bg-primary/[0.06]"
            : displayError
              ? "border-destructive/70 bg-destructive/[0.04]"
              : "border-input/50 bg-background/60 hover:border-input hover:bg-accent/50",
          inactive && "cursor-not-allowed opacity-70"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={Object.values(ALLOWED_TYPES).flat().join(",")}
          onChange={handleInputChange}
          className="hidden"
          disabled={inactive}
        />

        <AnimatePresence mode="wait" initial={false}>
          {selectedFile ? (
            <motion.div key="file" {...fade} className="flex w-full flex-col items-center gap-4">
              <div className="flex w-full max-w-md items-center gap-3 rounded-lg border bg-card p-3 text-left shadow-xs">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/[0.08] text-primary">
                  <FileText className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                {!isUploading && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRemove}
                    aria-label="Usuń wybrany plik"
                    className="h-9 w-9"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </Button>
                )}
              </div>

              {isUploading && (
                <div className="w-full max-w-md">
                  <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                    <span>Przesyłanie…</span>
                    <span className="tabular-nums">{uploadProgress}%</span>
                  </div>
                  <div
                    className="h-1.5 overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-valuenow={uploadProgress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-slow ease-calm"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="prompt" {...fade} className="flex flex-col items-center">
              <span
                className={cn(
                  "mb-4 flex h-12 w-12 items-center justify-center rounded-full border bg-card transition-colors duration-base",
                  isDragOver ? "border-primary text-primary" : "text-muted-foreground"
                )}
              >
                <UploadCloud className="h-6 w-6" strokeWidth={1.75} aria-hidden />
              </span>
              <p className="text-base font-medium">
                {isDragOver ? "Upuść plik tutaj" : "Przeciągnij i upuść plik umowy"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                lub{" "}
                <span className="font-medium text-primary underline-offset-4">wybierz z dysku</span>
              </p>
              <p className="mt-4 text-xs text-muted-foreground">
                PDF, DOCX, JPG lub PNG · do 50 MB
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {displayError && (
          <motion.div
            {...fade}
            role="alert"
            className="mt-3 flex items-start gap-2 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p>{displayError}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
