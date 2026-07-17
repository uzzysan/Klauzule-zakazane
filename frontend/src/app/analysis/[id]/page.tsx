"use client";

import {
  Button,
  Card,
  CardContent,
  RiskBadge,
  RiskCounts,
  RiskScore,
} from "@/components/ui";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import type { AnalysisDetail, FlaggedClause } from "@/types/api";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Heart,
  BookOpen,
  SlidersHorizontal,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TextSegment {
  text: string;
  isHighlight: boolean;
  clauseId?: string;
  riskLevel?: "high" | "medium" | "low";
}

function FlaggedClauseCard({
  clause,
  isExpanded,
  onToggle,
  isSelected,
  onSelect,
}: {
  clause: FlaggedClause;
  isExpanded: boolean;
  onToggle: () => void;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSelected && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isSelected]);

  return (
    <div
      ref={cardRef}
      id={`clause-card-${clause.id}`}
      onClick={onSelect}
      className={cn(
        "cursor-pointer rounded-xl border border-slate-200 bg-white p-4 transition-all duration-300 dark:border-slate-800 dark:bg-slate-900/60 hover:shadow-md",
        isSelected && "ring-2 ring-primary border-transparent dark:ring-primary shadow-lg bg-primary/[0.02] dark:bg-primary/[0.04]"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            <RiskBadge level={clause.risk_level} />
            <span className="text-xs font-semibold text-muted-foreground bg-slate-100 px-2 py-0.5 rounded dark:bg-slate-800">
              {(clause.confidence * 100).toFixed(0)}% dopasowania
            </span>
            <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">
              {clause.match_type}
            </span>
          </div>
          <p className={cn("text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed", !isExpanded && "line-clamp-2")}>
            {clause.matched_text}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4 text-xs overflow-hidden"
          >
            {/* Matched text details */}
            <div>
              <h5 className="mb-1.5 font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Wykryty zapis
              </h5>
              <div className="rounded-lg border-l-4 border-destructive bg-destructive/5 p-3 font-mono leading-relaxed text-slate-800 dark:text-slate-200">
                {clause.matched_text}
              </div>
            </div>

            {/* Similar prohibited clause */}
            {clause.explanation?.clause_text && (
              <div>
                <h5 className="mb-1.5 font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Wzorzec klauzuli niedozwolonej (UOKiK)
                </h5>
                <div className="rounded-lg bg-secondary/80 p-3 leading-relaxed text-slate-800 dark:text-slate-200">
                  {clause.explanation.clause_text}
                </div>
              </div>
            )}

            {/* Legal references */}
            {clause.explanation?.legal_references &&
              clause.explanation.legal_references.length > 0 && (
                <div>
                  <h5 className="mb-1.5 font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Orzecznictwo i podstawa prawna
                  </h5>
                  <div className="space-y-2">
                    {clause.explanation.legal_references.map((ref, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 dark:border-slate-800 dark:bg-slate-900/40">
                        {ref.article_code && (
                          <div className="font-bold text-primary">{ref.article_code}</div>
                        )}
                        {ref.law_name && (
                          <div className="font-medium text-slate-500 mt-0.5">{ref.law_name}</div>
                        )}
                        {ref.description && (
                          <p className="mt-1.5 leading-relaxed text-muted-foreground">{ref.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Notes */}
            {clause.explanation?.notes && (
              <div>
                <h5 className="mb-1 font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Komentarz prawny
                </h5>
                <p className="leading-relaxed text-slate-600 dark:text-slate-300 bg-primary/[0.01] p-2.5 rounded-lg border border-dashed dark:border-slate-800">{clause.explanation.notes}</p>
              </div>
            )}

            {/* Tags */}
            {clause.explanation?.tags && clause.explanation.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {clause.explanation.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="rounded-md bg-indigo-50/60 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const analysisId = params.id as string;

  const [analysis, setAnalysis] = useState<AnalysisDetail | null>(null);
  const [documentText, setDocumentText] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedClauses, setExpandedClauses] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all");
  
  // Selection/Highlight coordination
  const [selectedClauseId, setSelectedClauseId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"text" | "inspector">("inspector");

  useEffect(() => {
    async function fetchAnalysisAndText() {
      try {
        setLoading(true);
        const analysisData = await api.getAnalysis(analysisId);
        setAnalysis(analysisData);

        // Auto-expand high risk clauses initially
        const highRisk = analysisData.flagged_clauses
          .filter((c) => c.risk_level === "high")
          .map((c) => c.id);
        setExpandedClauses(new Set(highRisk));

        try {
          const textData = await api.getDocumentText(analysisData.document_id);
          setDocumentText(textData.full_text || "");
        } catch (textErr) {
          console.error("Could not fetch document full text:", textErr);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nie udało się pobrać wyników analizy");
      } finally {
        setLoading(false);
      }
    }

    if (analysisId) {
      fetchAnalysisAndText();
    }
  }, [analysisId]);

  const toggleClause = (id: string) => {
    setExpandedClauses((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectClause = (id: string) => {
    setSelectedClauseId(id);
    setExpandedClauses((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    // Scroll corresponding text highlight into view on desktop
    setTimeout(() => {
      const segmentEl = document.getElementById(`highlight-segment-${id}`);
      if (segmentEl) {
        segmentEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  const handleSelectHighlight = (id: string) => {
    setSelectedClauseId(id);
    setExpandedClauses((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    
    // In mobile view, trigger the modal sheet/tabs
    if (window.innerWidth < 768) {
      setMobileTab("inspector");
    }

    setTimeout(() => {
      const cardEl = document.getElementById(`clause-card-${id}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 100);
  };

  const filteredClauses =
    analysis?.flagged_clauses.filter((c) => {
      if (filter === "all") return true;
      return c.risk_level === filter;
    }) || [];

  // Helper to segment the full text of document
  const getDocumentSegments = (): TextSegment[] => {
    if (!documentText) return [{ text: "Trwa ładowanie tekstu umowy...", isHighlight: false }];
    if (!analysis || analysis.flagged_clauses.length === 0) {
      return [{ text: documentText, isHighlight: false }];
    }

    interface HighlightRange {
      start: number;
      end: number;
      clause: FlaggedClause;
    }

    const ranges: HighlightRange[] = [];
    analysis.flagged_clauses.forEach((c) => {
      let start = c.start_position;
      let end = c.end_position;

      // Fallback matching if offsets are not returned
      if (start === null || end === null || start === -1) {
        const index = documentText.indexOf(c.matched_text);
        if (index !== -1) {
          start = index;
          end = index + c.matched_text.length;
        }
      }

      if (start !== null && end !== null && start !== -1) {
        ranges.push({ start, end, clause: c });
      }
    });

    // Sort by start position
    ranges.sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      return (b.end - b.start) - (a.end - a.start);
    });

    // Filter overlapping ranges (keep first)
    const filteredRanges: HighlightRange[] = [];
    let lastEnd = -1;
    ranges.forEach((r) => {
      if (r.start >= lastEnd) {
        filteredRanges.push(r);
        lastEnd = r.end;
      }
    });

    // Generate final text segments
    const segments: TextSegment[] = [];
    let currentIdx = 0;

    filteredRanges.forEach((r) => {
      if (r.start > currentIdx) {
        segments.push({
          text: documentText.substring(currentIdx, r.start),
          isHighlight: false,
        });
      }

      segments.push({
        text: documentText.substring(r.start, r.end),
        isHighlight: true,
        clauseId: r.clause.id,
        riskLevel: r.clause.risk_level,
      });

      currentIdx = r.end;
    });

    if (currentIdx < documentText.length) {
      segments.push({
        text: documentText.substring(currentIdx),
        isHighlight: false,
      });
    }

    return segments;
  };

  if (loading) {
    return (
      <div className="container max-w-6xl py-24">
        <div className="flex min-h-[450px] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm font-semibold text-muted-foreground animate-pulse">Analizowanie dokumentu przez algorytm...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="container max-w-xl py-24">
        <Card className="border border-red-100 bg-red-50/20 dark:border-red-950/30">
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="rounded-full bg-red-100 p-3 text-red-600 dark:bg-red-950/40">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold">Wystąpił błąd analizy</h2>
              <p className="text-sm text-muted-foreground">{error || "Nie znaleziono żądanego raportu"}</p>
              <Button onClick={() => router.push("/upload")} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Wgraj nową umowę
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const documentSegments = getDocumentSegments();

  return (
    <div className="container max-w-7xl py-10">
      {/* Page Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push("/upload")} className="h-9 px-3">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Wgraj nowy plik
            </Button>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mt-2 text-slate-900 dark:text-white">
            Analiza umowy: {analysis.summary || "Wyniki skanowania"}
          </h1>
          <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground mt-2 bg-slate-100 px-3 py-1.5 rounded-lg w-fit dark:bg-slate-800">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Czas trwania: {analysis.duration_seconds ? `${analysis.duration_seconds}s` : "—"}
            </span>
            <span className="h-3 w-px bg-slate-300 dark:bg-slate-700" />
            <span className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              Język: {analysis.language === "pl" ? "Polski" : "Angielski"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a href="https://suppi.pl/rafcio" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-2 border-rose-200 text-rose-600 hover:bg-rose-50/50 hover:text-rose-700 dark:border-rose-900 dark:hover:bg-rose-950/20">
              <Heart className="h-4 w-4 fill-rose-500/10" />
              Wspieram projekt
            </Button>
          </a>
        </div>
      </div>

      {/* Top metrics summary cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card className="border border-slate-200/60 bg-white/70 shadow-sm backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/50">
          <CardContent className="pt-6">
            <RiskScore score={analysis.risk_score || 0} />
          </CardContent>
        </Card>

        <Card className="border border-slate-200/60 bg-white/70 shadow-sm backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/50">
          <CardContent className="flex flex-col items-center justify-center pt-6 text-center">
            <div className="text-4xl font-extrabold text-slate-900 dark:text-white">
              {analysis.total_clauses_found}
            </div>
            <div className="text-xs font-semibold text-muted-foreground mt-2 uppercase tracking-wider">
              Niedozwolone klauzule
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/60 bg-white/70 shadow-sm backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/50">
          <CardContent className="flex items-center justify-center pt-6">
            <RiskCounts
              high={analysis.high_risk_count}
              medium={analysis.medium_risk_count}
              low={analysis.low_risk_count}
              className="flex-col gap-2 w-full max-w-xs"
            />
          </CardContent>
        </Card>
      </div>

      {/* Mobile Tab navigation */}
      <div className="flex md:hidden mb-6 border rounded-lg overflow-hidden bg-slate-100/50 p-1 dark:bg-slate-900/40">
        <button
          onClick={() => setMobileTab("text")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-md transition-all",
            mobileTab === "text" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white" : "text-muted-foreground"
          )}
        >
          <BookOpen className="h-4 w-4" />
          Tekst umowy
        </button>
        <button
          onClick={() => setMobileTab("inspector")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-md transition-all",
            mobileTab === "inspector" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white" : "text-muted-foreground"
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Wykryte ryzyka ({filteredClauses.length})
        </button>
      </div>

      {/* Main Side-by-Side Area */}
      <div className="grid gap-6 md:grid-cols-12 items-start">
        
        {/* Left Pane - Document Text Viewer */}
        <div className={cn(
          "md:col-span-7 lg:col-span-8 flex flex-col h-[650px] rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/30 overflow-hidden",
          mobileTab !== "text" && "hidden md:flex"
        )}>
          <div className="flex items-center justify-between border-b px-6 py-4 bg-slate-50/50 dark:bg-slate-900/60 dark:border-slate-800">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Podgląd analizowanego tekstu
            </span>
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              {documentText ? `${documentText.length} znaków` : ""}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
            {documentText ? (
              <p className="text-sm font-serif leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap select-text">
                {documentSegments.map((seg, idx) => {
                  if (seg.isHighlight) {
                    const isSelected = selectedClauseId === seg.clauseId;
                    return (
                      <span
                        key={idx}
                        id={`highlight-segment-${seg.clauseId}`}
                        onClick={() => handleSelectHighlight(seg.clauseId!)}
                        className={cn(
                          seg.riskLevel === "high" && "highlight-high",
                          seg.riskLevel === "medium" && "highlight-medium",
                          seg.riskLevel === "low" && "highlight-low",
                          isSelected && "highlight-selected"
                        )}
                        title="Kliknij, aby zobaczyć szczegóły"
                      >
                        {seg.text}
                      </span>
                    );
                  }
                  return <span key={idx}>{seg.text}</span>;
                })}
              </p>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Tekst umowy nie jest dostępny lub nie został jeszcze wczytany.
              </div>
            )}
          </div>
        </div>

        {/* Right Pane - Inspector Panel */}
        <div className={cn(
          "md:col-span-5 lg:col-span-4 flex flex-col h-[650px] rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/30 overflow-hidden",
          mobileTab !== "inspector" && "hidden md:flex"
        )}>
          
          {/* Filters in Header */}
          <div className="border-b px-6 py-4 bg-slate-50/50 dark:bg-slate-900/60 dark:border-slate-800">
            <div className="flex items-center justify-between gap-4 mb-3">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Lista ryzyka
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {filteredClauses.length} z {analysis.flagged_clauses.length}
              </span>
            </div>

            {/* Filter buttons */}
            <div className="flex gap-1.5 flex-wrap">
              {(["all", "high", "medium", "low"] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setFilter(level)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold rounded-md border transition-all",
                    filter === level
                      ? "bg-primary border-transparent text-primary-foreground shadow-sm"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400"
                  )}
                >
                  {level === "all"
                    ? "Wszystkie"
                    : level === "high"
                      ? "Wysokie"
                      : level === "medium"
                        ? "Średnie"
                        : "Niskie"}
                </button>
              ))}
            </div>
          </div>

          {/* Cards container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin bg-slate-50/30 dark:bg-slate-950/10">
            {filteredClauses.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center text-muted-foreground text-sm p-6">
                {filter === "all"
                  ? "Nie znaleziono żadnych klauzul niedozwolonych"
                  : "Brak klauzul spełniających wybrane kryteria"}
              </div>
            ) : (
              filteredClauses.map((clause) => (
                <FlaggedClauseCard
                  key={clause.id}
                  clause={clause}
                  isExpanded={expandedClauses.has(clause.id)}
                  onToggle={() => toggleClause(clause.id)}
                  isSelected={selectedClauseId === clause.id}
                  onSelect={() => handleSelectClause(clause.id)}
                />
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
