"use client";

import {
  Button,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FileUpload,
} from "@/components/ui";
import { AnimatedButton, AnimatedCard } from "@/components/ui/animated-button";
import { IconContainer, FadeIn, StaggerContainer, StaggerItem } from "@/components/icons";
import api from "@/lib/api";
import { useUploadStore } from "@/lib/store";
import { ArrowRight, Clock, FileText, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function UploadPage() {
  const router = useRouter();
  const {
    selectedFile,
    setSelectedFile,
    isUploading,
    uploadProgress,
    uploadError,
    isProcessing,
    processingStatus,
    startUpload,
    updateUploadProgress,
    setUploadSuccess,
    setUploadError,
    startProcessing,
    updateProcessingStatus,
    setProcessingComplete,
    setProcessingError,
    reset,
  } = useUploadStore();

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      startUpload();

      // Upload document
      const uploadResponse = await api.uploadDocument(selectedFile, {
        language: "pl",
        analysisMode: "offline",
        onProgress: updateUploadProgress,
      });

      setUploadSuccess(uploadResponse);
      startProcessing();

      // Poll for processing completion
      if (uploadResponse.document_id) {
        // Wait a moment for task to be created
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Get document to check celery task ID
        const doc = await api.getDocument(uploadResponse.document_id);

        if (doc.celery_task_id) {
          const jobResult = await api.pollJobStatus(doc.celery_task_id, {
            interval: 2000,
            timeout: 300000,
            onStatusChange: updateProcessingStatus,
          });

          // Extract analysis_id from job result
          const analysisId = jobResult.result?.analysis?.analysis_id;

          if (analysisId) {
            // Get full analysis details
            const analysis = await api.getAnalysis(analysisId);
            setProcessingComplete(analysis);

            // Navigate to results page
            router.push(`/analysis/${analysisId}`);
          } else {
            setProcessingError("Nie znaleziono ID analizy w wyniku zadania");
          }
        } else {
          setProcessingError("Brak ID zadania Celery");
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Wystąpił błąd podczas przesyłania";
      if (isProcessing) {
        setProcessingError(message);
      } else {
        setUploadError(message);
      }
    }
  };

  const getStatusMessage = () => {
    if (isUploading) {
      return `Przesyłanie pliku... ${uploadProgress}%`;
    }
    if (isProcessing) {
      const stage = processingStatus?.meta?.stage;
      switch (stage) {
        case "downloading":
          return "Pobieranie pliku...";
        case "parsing":
          return "Przetwarzanie dokumentu...";
        case "analyzing":
          return "Analizowanie klauzul...";
        default:
          return "Przetwarzanie...";
      }
    }
    return null;
  };

  const statusMessage = getStatusMessage();

  return (
    <div className="container max-w-4xl py-12">
      <FadeIn className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold">Analizuj umowę</h1>
        <p className="text-muted-foreground">
          Prześlij dokument, aby sprawdzić go pod kątem klauzul niedozwolonych
        </p>
      </FadeIn>

      <AnimatedCard className="mb-8" hoverScale={1.01}>
        <CardHeader>
          <CardTitle>Prześlij dokument</CardTitle>
          <CardDescription>
            Obsługiwane formaty: PDF, DOCX, JPG, PNG. Maksymalny rozmiar: 50MB.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUpload
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            selectedFile={selectedFile}
            isUploading={isUploading || isProcessing}
            uploadProgress={isProcessing ? 100 : uploadProgress}
            error={uploadError}
            disabled={isUploading || isProcessing}
          />

          <AnimatePresence>
            {statusMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="mt-4 rounded-lg bg-secondary/50 p-4"
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-5 w-5 rounded-full border-2 border-accent border-t-transparent"
                  />
                  <span className="text-sm font-medium">{statusMessage}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 flex justify-end gap-4">
            {(selectedFile || uploadError) && !isUploading && !isProcessing && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button variant="outline" onClick={reset}>
                  Wyczyść
                </Button>
              </motion.div>
            )}
            <AnimatedButton
              onClick={handleUpload}
              disabled={!selectedFile || isUploading || isProcessing}
              isLoading={isUploading || isProcessing}
              icon={ArrowRight}
              glowOnHover
            >
              {isUploading || isProcessing ? "Przetwarzanie..." : "Analizuj dokument"}
            </AnimatedButton>
          </div>
        </CardContent>
      </AnimatedCard>

      {/* Features */}
      <StaggerContainer className="grid gap-6 md:grid-cols-3" staggerDelay={0.1}>
        <StaggerItem>
          <AnimatedCard className="group" hoverScale={1.03}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <IconContainer
                  icon={FileText}
                  size={24}
                  animation="float"
                  className="rounded-lg bg-primary/10 p-2 group-hover:bg-accent/10"
                  iconClassName="text-primary group-hover:text-accent"
                />
                <div>
                  <h3 className="mb-1 font-semibold">Analiza dokumentów</h3>
                  <p className="text-sm text-muted-foreground">
                    PDF, Word, obrazy - wszystkie formaty obsługiwane
                  </p>
                </div>
              </div>
            </CardContent>
          </AnimatedCard>
        </StaggerItem>

        <StaggerItem>
          <AnimatedCard className="group" hoverScale={1.03}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <IconContainer
                  icon={Shield}
                  size={24}
                  animation="pulse"
                  className="rounded-lg bg-primary/10 p-2 group-hover:bg-accent/10"
                  iconClassName="text-primary group-hover:text-accent"
                />
                <div>
                  <h3 className="mb-1 font-semibold">7,233 klauzul</h3>
                  <p className="text-sm text-muted-foreground">Baza orzeczeń sądowych z Polski</p>
                </div>
              </div>
            </CardContent>
          </AnimatedCard>
        </StaggerItem>

        <StaggerItem>
          <AnimatedCard className="group" hoverScale={1.03}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <IconContainer
                  icon={Clock}
                  size={24}
                  animation="bounce"
                  className="rounded-lg bg-primary/10 p-2 group-hover:bg-accent/10"
                  iconClassName="text-primary group-hover:text-accent"
                />
                <div>
                  <h3 className="mb-1 font-semibold">Szybka analiza</h3>
                  <p className="text-sm text-muted-foreground">Wyniki w kilka sekund</p>
                </div>
              </div>
            </CardContent>
          </AnimatedCard>
        </StaggerItem>
      </StaggerContainer>
    </div>
  );
}
