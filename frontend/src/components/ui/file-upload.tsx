"use client";

import * as React from "react";
import { Upload, File, X, AlertCircle } from "lucide-react";
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
            <div
                onClick={handleClick}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                    "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer",
                    isDragOver && "border-accent bg-accent/10",
                    displayError && "border-destructive bg-destructive/5",
                    !isDragOver && !displayError && "border-border hover:border-accent hover:bg-accent/5",
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

                {selectedFile ? (
                    <div className="flex flex-col items-center gap-3 w-full">
                        <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg w-full max-w-md">
                            <File className="h-8 w-8 text-primary flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{selectedFile.name}</p>
                                <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                            </div>
                            {!isUploading && (
                                <Button variant="ghost" size="icon" onClick={handleRemove} className="flex-shrink-0">
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        {isUploading && (
                            <div className="w-full max-w-md">
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Przesyłanie...</span>
                                    <span>{uploadProgress}%</span>
                                </div>
                                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-accent transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <Upload className={cn("h-12 w-12 mb-4", isDragOver ? "text-accent" : "text-muted-foreground")} />
                        <p className="text-lg font-medium mb-1">
                            {isDragOver ? "Upuść plik tutaj" : "Przeciągnij i upuść plik"}
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">lub kliknij, aby wybrać</p>
                        <p className="text-xs text-muted-foreground">PDF, DOCX, JPG, PNG (max 50MB)</p>
                    </>
                )}
            </div>

            {displayError && (
                <div className="flex items-center gap-2 mt-3 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <p className="text-sm">{displayError}</p>
                </div>
            )}
        </div>
    );
}
