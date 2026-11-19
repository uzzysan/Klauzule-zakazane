"use client";

import { Button, FileUpload } from "@/components/ui";
import { AnimatedButton, StepIndicator } from "@/components/ui/animated-button";
import { FadeIn, IconContainer } from "@/components/icons";
import api from "@/lib/api";
import { useUploadStore } from "@/lib/store";
import { ArrowRight, Clock, FileText, Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const features = [
  {
    icon: FileText,
    title: "Czytelny podgląd",
    desc: "Podział na sekcje i podgląd oryginalnego tekstu z zaznaczonymi fragmentami.",
  },
  {
    icon: ShieldCheck,
    title: "Rejestr UOKiK i SOKiK",
    desc: "Dopasowanie do tysięcy klauzul uznanych przez sądy za niedozwolone.",
  },
  {
    icon: Clock,
    title: "Zwykle 10–30 sekund",
    desc: "Czas analizy zależy od długości dokumentu i jakości skanu.",
  },
];

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

  const busy = isUploading || isProcessing;

  return (
    <div className="container max-w-3xl py-12 md:py-20">
      <FadeIn className="mb-10 text-center">
        <p className="eyebrow mb-3">Nowa analiza</p>
        <h1 className="text-display-sm md:text-display-md">Analizuj swoją umowę</h1>
        <p className="mx-auto mt-4 max-w-prose text-base text-muted-foreground md:text-lg">
          Prześlij plik, a wskażemy zapisy podobne do klauzul uznanych przez sądy za niedozwolone.
        </p>
      </FadeIn>

      {/* Steps */}
      <ol
        aria-label="Etapy analizy"
        className="mx-auto mb-8 flex max-w-lg items-center justify-center gap-3"
      >
        <li>
          <StepIndicator
            step={1}
            label="Wybierz plik"
            isActive={activeStep === 1}
            isCompleted={activeStep > 1}
          />
        </li>
        <li aria-hidden className="h-px w-8 bg-border sm:w-10" />
        <li>
          <StepIndicator
            step={2}
            label="Prześlij"
            isActive={activeStep === 2}
            isCompleted={activeStep > 2}
          />
        </li>
        <li aria-hidden className="h-px w-8 bg-border sm:w-10" />
        <li>
          <StepIndicator step={3} label="Raport" isActive={activeStep === 3} />
        </li>
      </ol>

      <div className="rounded-xl border bg-card p-5 shadow-sm sm:p-8">
        <FileUpload
          onFileSelect={handleFileSelect}
          onFileRemove={handleFileRemove}
          selectedFile={selectedFile}
          isUploading={busy}
          uploadProgress={isProcessing ? 100 : uploadProgress}
          error={uploadError}
          disabled={busy}
        />

        <AnimatePresence>
          {statusMessage && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              role="status"
              aria-live="polite"
              className="mt-5 flex items-center gap-3 rounded-lg border bg-muted/60 px-4 py-3 text-sm"
            >
              <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
              <span>{statusMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {(selectedFile || uploadError) && !busy && (
            <Button variant="ghost" onClick={reset} className="sm:w-auto">
              Anuluj
            </Button>
          )}
          <AnimatedButton
            onClick={handleUpload}
            disabled={!selectedFile || busy}
            isLoading={busy}
            loadingText="Przetwarzanie…"
            icon={ArrowRight}
            size="lg"
            className="w-full sm:w-auto"
          >
            Rozpocznij analizę
          </AnimatedButton>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Pliki są przetwarzane wyłącznie na potrzeby analizy i usuwane po 8 godzinach.
      </p>

      <ul className="mt-14 grid gap-6 sm:grid-cols-3">
        {features.map((f) => (
          <li key={f.title} className="flex gap-3 sm:flex-col">
            <IconContainer icon={f.icon} size={18} className="h-9 w-9" />
            <div>
              <h2 className="font-sans text-sm font-semibold">{f.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
