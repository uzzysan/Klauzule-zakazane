"use client";

import { useRouter } from "next/navigation";
import { FileText, Shield, Clock, ArrowRight } from "lucide-react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, FileUpload } from "@/components/ui";
import { useUploadStore } from "@/lib/store";
import api from "@/lib/api";

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
                    await api.pollJobStatus(doc.celery_task_id, {
                        interval: 2000,
                        timeout: 300000,
                        onStatusChange: updateProcessingStatus,
                    });
                }

                // Get analysis result
                const analysisResponse = await api.getDocumentAnalysis(uploadResponse.document_id);

                if (analysisResponse.latest_analysis) {
                    const analysis = await api.getAnalysis(analysisResponse.latest_analysis.id);
                    setProcessingComplete(analysis);

                    // Navigate to results page
                    router.push(`/analysis/${analysis.id}`);
                } else {
                    setProcessingError("Nie znaleziono wyników analizy");
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
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold mb-2">Analizuj umowę</h1>
                <p className="text-muted-foreground">
                    Prześlij dokument, aby sprawdzić go pod kątem klauzul niedozwolonych
                </p>
            </div>

            <Card className="mb-8">
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

                    {statusMessage && (
                        <div className="mt-4 p-4 bg-secondary/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-accent border-t-transparent" />
                                <span className="text-sm font-medium">{statusMessage}</span>
                            </div>
                        </div>
                    )}

                    <div className="mt-6 flex justify-end gap-4">
                        {(selectedFile || uploadError) && !isUploading && !isProcessing && (
                            <Button variant="outline" onClick={reset}>
                                Wyczyść
                            </Button>
                        )}
                        <Button
                            onClick={handleUpload}
                            disabled={!selectedFile || isUploading || isProcessing}
                            isLoading={isUploading || isProcessing}
                        >
                            {isUploading || isProcessing ? (
                                "Przetwarzanie..."
                            ) : (
                                <>
                                    Analizuj dokument
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Features */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <FileText className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">Analiza dokumentów</h3>
                                <p className="text-sm text-muted-foreground">
                                    PDF, Word, obrazy - wszystkie formaty obsługiwane
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Shield className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">7,233 klauzul</h3>
                                <p className="text-sm text-muted-foreground">
                                    Baza orzeczeń sądowych z Polski
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Clock className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">Szybka analiza</h3>
                                <p className="text-sm text-muted-foreground">
                                    Wyniki w kilka sekund
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
