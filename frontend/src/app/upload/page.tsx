"use client";

import {
  Button,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FileUpload,
} from "@/components/ui";
import { AnimatedButton, AnimatedCard, StepIndicator } from "@/components/ui/animated-button";
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
          return "Przetwarzanie dokumentu (strukturyzacja tekstu)...";
        case "analyzing":
          return "Analizowanie klauzul (wyszukiwanie semantyczne)...";
        default:
          return "Przetwarzanie dokumentu...";
      }
    }
    return null;
  };

  const statusMessage = getStatusMessage();

  // Active step computation
  const activeStep = isProcessing ? 3 : selectedFile ? 2 : 1;

  return (
    <div className="container max-w-4xl py-16 md:py-24">
      {/* Background elements */}
      <div className="pointer-events-none absolute left-[20%] top-[-5%] h-[350px] w-[350px] rounded-full bg-indigo-500/5 blur-[90px]" />

      <FadeIn className="mb-12 text-center">
        <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Analizuj swoją umowę
        </h1>
        <p className="mx-auto max-w-xl text-lg text-muted-foreground">
          Prześlij plik, aby sprawdzić go pod kątem potencjalnie niebezpiecznych klauzul abuzywnych.
        </p>
      </FadeIn>

      {/* Step Indicators */}
      <div className="mx-auto mb-10 flex max-w-md items-center justify-center gap-4">
        <StepIndicator step={1} isActive={activeStep === 1} isCompleted={activeStep > 1} />
        <div className="h-0.5 w-16 bg-slate-200 dark:bg-slate-800" />
        <StepIndicator step={2} isActive={activeStep === 2} isCompleted={activeStep > 2} />
        <div className="h-0.5 w-16 bg-slate-200 dark:bg-slate-800" />
        <StepIndicator step={3} isActive={activeStep === 3} isCompleted={false} />
      </div>

      <AnimatedCard
        className="mb-12 border border-slate-200/80 bg-white/70 shadow-lg backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/70"
        hoverScale={1}
      >
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold">Wybierz plik z dysku</CardTitle>
          <CardDescription className="text-sm">
            Wspierane są pliki PDF, DOCX oraz formaty graficzne (JPG, PNG) do 50MB.
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
                className="mt-6 rounded-xl border bg-slate-100/50 p-4 dark:bg-slate-800/50"
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent"
                  />
                  <span className="text-sm font-semibold">{statusMessage}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 flex justify-end gap-4">
            {(selectedFile || uploadError) && !isUploading && !isProcessing && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button variant="outline" onClick={reset} className="px-6 py-5">
                  Anuluj
                </Button>
              </motion.div>
            )}
            <AnimatedButton
              onClick={handleUpload}
              disabled={!selectedFile || isUploading || isProcessing}
              isLoading={isUploading || isProcessing}
              icon={ArrowRight}
              className="px-8 py-5"
              glowOnHover
            >
              {isUploading || isProcessing ? "Przetwarzanie..." : "Rozpocznij analizę"}
            </AnimatedButton>
          </div>
        </CardContent>
      </AnimatedCard>

      {/* Trust & Features Footer */}
      <StaggerContainer className="grid gap-6 md:grid-cols-3" staggerDelay={0.08}>
        <StaggerItem>
          <AnimatedCard
            className="group border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900"
            hoverScale={1.02}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <IconContainer
                  icon={FileText}
                  size={20}
                  animation="float"
                  className="rounded-xl bg-primary/10 p-3 text-primary group-hover:bg-primary/20"
                />
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Wygodny podgląd
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Precyzyjny podział na sekcje oraz czytelny podgląd oryginalnego tekstu umowy.
                  </p>
                </div>
              </div>
            </CardContent>
          </AnimatedCard>
        </StaggerItem>

        <StaggerItem>
          <AnimatedCard
            className="group border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900"
            hoverScale={1.02}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <IconContainer
                  icon={Shield}
                  size={20}
                  animation="pulse"
                  className="rounded-xl bg-primary/10 p-3 text-primary group-hover:bg-primary/20"
                />
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    7 233 klauzul UOKiK
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Automatyczne dopasowanie do pełnego rejestru orzeczeń polskich sądów
                    powszechnych.
                  </p>
                </div>
              </div>
            </CardContent>
          </AnimatedCard>
        </StaggerItem>

        <StaggerItem>
          <AnimatedCard
            className="group border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900"
            hoverScale={1.02}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <IconContainer
                  icon={Clock}
                  size={20}
                  animation="bounce"
                  className="rounded-xl bg-primary/10 p-3 text-primary group-hover:bg-primary/20"
                />
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Błyskawiczny audyt
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Analiza semantyczna trwa zazwyczaj od 10 do 30 sekund w zależności od długości
                    pliku.
                  </p>
                </div>
              </div>
            </CardContent>
          </AnimatedCard>
        </StaggerItem>
      </StaggerContainer>
    </div>
  );
}
