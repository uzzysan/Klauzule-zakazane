"use client";

import * as React from "react";
import { Upload, File, X, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { AnimatedIcon } from "@/components/icons";

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
    const error = validateFile(file);
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError(null);
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || isUploading) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleClick = () => {
    if (!disabled && !isUploading) {
      inputRef.current?.click();
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setValidationError(null);
    onFileRemove?.();
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const displayError = error || validationError;

  return (
    <div className="w-full">
      <motion.div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        animate={{
          scale: isDragOver ? 1.02 : 1,
          borderColor: isDragOver
            ? "hsl(var(--accent))"
            : displayError
              ? "hsl(var(--destructive))"
              : "hsl(var(--border))",
          backgroundColor: isDragOver
            ? "hsl(var(--accent) / 0.1)"
            : displayError
              ? "hsl(var(--destructive) / 0.05)"
              : "transparent",
        }}
        transition={{ duration: 0.2 }}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
          (disabled || isUploading) && "cursor-not-allowed opacity-60"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={Object.values(ALLOWED_TYPES).flat().join(",")}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled || isUploading}
        />

        <AnimatePresence mode="wait">
          {selectedFile ? (
            <motion.div
              key="file-selected"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex w-full flex-col items-center gap-3"
            >
              <motion.div
                className="flex w-full max-w-md items-center gap-3 rounded-lg bg-secondary/50 p-3"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  initial={{ rotate: -10, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <File className="h-8 w-8 flex-shrink-0 text-primary" />
                </motion.div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                {!isUploading && (
                  <motion.div whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRemove}
                      className="flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                )}
              </motion.div>

              {isUploading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-md"
                >
                  <div className="mb-1 flex justify-between text-sm">
                    <span>Przesyłanie...</span>
                    <motion.span
                      key={uploadProgress}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                    >
                      {uploadProgress}%
                    </motion.span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <motion.div
                      className="h-full bg-accent"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="upload-prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              <motion.div
                animate={isDragOver ? { y: [0, -8, 0], scale: 1.1 } : { y: 0, scale: 1 }}
                transition={{
                  duration: 0.6,
                  repeat: isDragOver ? Infinity : 0,
                }}
              >
                <AnimatedIcon
                  icon={Upload}
                  size={48}
                  className={cn("mb-4", isDragOver ? "text-accent" : "text-muted-foreground")}
                  hoverScale={1.2}
                />
              </motion.div>
              <motion.p
                className="mb-1 text-lg font-medium"
                animate={{ scale: isDragOver ? 1.05 : 1 }}
              >
                {isDragOver ? "Upuść plik tutaj" : "Przeciągnij i upuść plik"}
              </motion.p>
              <p className="mb-4 text-sm text-muted-foreground">lub kliknij, aby wybrać</p>
              <p className="text-xs text-muted-foreground">PDF, DOCX, JPG, PNG (max 50MB)</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {displayError && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="mt-3 flex items-center gap-2 text-destructive"
          >
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">{displayError}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
