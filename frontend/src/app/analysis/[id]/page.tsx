"use client";

import { Button, Card, CardContent, RiskBadge, RiskCounts, RiskScore } from "@/components/ui";
import { buttonVariants } from "@/components/ui/button";
import { riskMeta } from "@/components/ui/risk-badge";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import type { AnalysisDetail, FlaggedClause } from "@/types/api";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  ChevronDown,
  Clock,
  Heart,
  Languages,
  ListChecks,
  Loader2,
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

function DetailBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="eyebrow mb-2 font-sans">{label}</h4>
      {children}
    </div>
  );
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
  const meta = riskMeta[clause.risk_level];

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
        "relative cursor-pointer overflow-hidden rounded-lg border bg-card p-4 pl-5 transition-[border-color,box-shadow] duration-base ease-calm hover:border-input/60",
        isSelected && "border-primary/60 shadow-md ring-1 ring-primary/40"
      )}
    >
      {/* Level stripe — colour reinforced by badge icon + label */}
      <span aria-hidden className={cn("absolute inset-y-0 left-0 w-1", meta.dot)} />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            <RiskBadge level={clause.risk_level} />
            <span className="text-xs tabular-nums text-muted-foreground">
              {(clause.confidence * 100).toFixed(0)}% dopasowania
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{clause.match_type}</span>
          </div>
          <p
            className={cn(
              "font-serif text-[0.9375rem] leading-relaxed text-foreground",
              !isExpanded && "line-clamp-2"
            )}
          >
            {clause.matched_text}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-md text-muted-foreground"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "Zwiń szczegóły" : "Rozwiń szczegóły"}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-base ease-calm",
              isExpanded && "rotate-180"
            )}
            aria-hidden
          />
        </Button>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-5 border-t pt-4 text-sm">
              {clause.explanation?.clause_text && (
                <DetailBlock label="Wzorzec klauzuli niedozwolonej">
                  <blockquote className="border-l-2 border-input/50 pl-3 font-serif leading-relaxed text-foreground">
                    {clause.explanation.clause_text}
                  </blockquote>
                </DetailBlock>
              )}

              {clause.explanation?.legal_references &&
                clause.explanation.legal_references.length > 0 && (
                  <DetailBlock label="Orzecznictwo i podstawa prawna">
                    <ul className="space-y-2">
                      {clause.explanation.legal_references.map((ref, idx) => (
                        <li key={idx} className="rounded-md border bg-muted/40 px-3 py-2.5">
                          {ref.article_code && (
                            <div className="font-medium tabular-nums text-primary">
                              {ref.article_code}
                            </div>
                          )}
                          {ref.law_name && (
                            <div className="mt-0.5 text-muted-foreground">{ref.law_name}</div>
                          )}
                          {ref.description && (
                            <p className="mt-1.5 leading-relaxed text-muted-foreground">
                              {ref.description}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </DetailBlock>
                )}

              {clause.explanation?.notes && (
                <DetailBlock label="Komentarz">
                  <p className="leading-relaxed text-muted-foreground">
                    {clause.explanation.notes}
                  </p>
                </DetailBlock>
              )}

              {clause.explanation?.tags && clause.explanation.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {clause.explanation.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="rounded-full border bg-muted/50 px-2.5 py-0.5 text-xs text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
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
      return b.end - b.start - (a.end - a.start);
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
        <div
          className="flex min-h-[420px] flex-col items-center justify-center gap-4"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
          <p className="text-sm text-muted-foreground">Wczytywanie raportu…</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="container max-w-xl py-24">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center sm:py-12">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-6 w-6" aria-hidden />
            </span>
            <h1 className="text-2xl">Nie udało się wczytać raportu</h1>
            <p className="text-sm text-muted-foreground">
              {error || "Nie znaleziono żądanego raportu"}
            </p>
            <Button onClick={() => router.push("/upload")} className="mt-2">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Prześlij nową umowę
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const documentSegments = getDocumentSegments();
  const filterLabels = {
    all: "Wszystkie",
    high: "Wysokie",
    medium: "Średnie",
    low: "Niskie",
  } as const;
  const paneHeight = "h-[70dvh] md:h-[calc(100dvh-11rem)] min-h-[460px] max-h-[900px]";

  return (
    <div className="container max-w-7xl py-8 md:py-10">
      {/* Page header */}
      <div className="mb-8 flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Button
            variant="link"
            size="sm"
            onClick={() => router.push("/upload")}
            className="mb-3 gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Prześlij kolejny plik
          </Button>
          <p className="eyebrow mb-2">Raport analizy</p>
          <h1 className="text-2xl md:text-display-sm">
            {analysis.summary || "Wyniki analizy umowy"}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" aria-hidden />
              {analysis.duration_seconds ? `${analysis.duration_seconds} s` : "—"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Languages className="h-4 w-4" aria-hidden />
              {analysis.language === "pl" ? "Polski" : "Angielski"}
            </span>
          </div>
        </div>

        <a
          href="https://suppi.pl/rafcio"
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline", size: "sm", className: "self-start" })}
        >
          <Heart className="h-4 w-4 text-primary" aria-hidden />
          Wesprzyj projekt
        </a>
      </div>

      {/* Summary */}
      <section
        aria-label="Podsumowanie"
        className="mb-8 grid divide-y rounded-xl border bg-card shadow-xs sm:grid-cols-3 sm:divide-x sm:divide-y-0"
      >
        <div className="flex items-center justify-center p-6">
          <RiskScore score={analysis.risk_score || 0} />
        </div>
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <div className="eyebrow mb-2">Wykryte zapisy</div>
          <div className="font-serif text-5xl font-semibold tabular-nums leading-none">
            {analysis.total_clauses_found}
          </div>
          <div className="mt-3 text-sm text-muted-foreground">potencjalnie niedozwolone</div>
        </div>
        <div className="flex items-center justify-center p-6">
          <RiskCounts
            high={analysis.high_risk_count}
            medium={analysis.medium_risk_count}
            low={analysis.low_risk_count}
            className="flex-col gap-2.5"
          />
        </div>
      </section>

      {/* Mobile tabs */}
      <div
        role="tablist"
        aria-label="Widok raportu"
        className="mb-4 grid grid-cols-2 gap-1 rounded-lg border bg-muted/60 p-1 md:hidden"
      >
        {(
          [
            { key: "text", label: "Tekst umowy", icon: BookOpen },
            { key: "inspector", label: `Wykryte (${filteredClauses.length})`, icon: ListChecks },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            role="tab"
            aria-selected={mobileTab === key}
            onClick={() => setMobileTab(key)}
            className={cn(
              "flex h-10 items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors duration-base",
              mobileTab === key
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      {/* Side-by-side */}
      <div className="grid items-start gap-6 md:grid-cols-12">
        {/* Document */}
        <section
          aria-label="Tekst umowy"
          className={cn(
            "flex flex-col overflow-hidden rounded-xl border bg-card shadow-xs md:col-span-7 lg:col-span-8",
            paneHeight,
            mobileTab !== "text" && "hidden md:flex"
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3">
            <h2 className="font-sans text-sm font-semibold">Tekst umowy</h2>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {(["high", "medium", "low"] as const).map((lvl) => (
                <span key={lvl} className="inline-flex items-center gap-1.5">
                  <span className={cn(riskMeta[lvl].highlight, "pointer-events-none px-1")}>
                    Aa
                  </span>
                  {riskMeta[lvl].label}
                </span>
              ))}
            </div>
          </div>

          <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
            {documentText ? (
              <p className="mx-auto max-w-prose select-text whitespace-pre-wrap font-serif text-base leading-[1.75] text-foreground">
                {documentSegments.map((seg, idx) => {
                  if (seg.isHighlight) {
                    const isSelected = selectedClauseId === seg.clauseId;
                    return (
                      <span
                        key={idx}
                        id={`highlight-segment-${seg.clauseId}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSelectHighlight(seg.clauseId!)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleSelectHighlight(seg.clauseId!);
                          }
                        }}
                        className={cn(
                          seg.riskLevel && riskMeta[seg.riskLevel].highlight,
                          isSelected && "highlight-selected"
                        )}
                        title="Pokaż szczegóły"
                      >
                        {seg.text}
                      </span>
                    );
                  }
                  return <span key={idx}>{seg.text}</span>;
                })}
              </p>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Tekst umowy nie jest dostępny lub nie został jeszcze wczytany.
              </div>
            )}
          </div>

          {documentText && (
            <div className="border-t px-5 py-2 text-right text-xs tabular-nums text-muted-foreground">
              {documentText.length.toLocaleString("pl-PL")} znaków
            </div>
          )}
        </section>

        {/* Inspector */}
        <section
          aria-label="Wykryte zapisy"
          className={cn(
            "flex flex-col overflow-hidden rounded-xl border bg-card shadow-xs md:col-span-5 lg:col-span-4",
            paneHeight,
            mobileTab !== "inspector" && "hidden md:flex"
          )}
        >
          <div className="border-b px-5 py-3">
            <div className="mb-3 flex items-center justify-between gap-4">
              <h2 className="font-sans text-sm font-semibold">Wykryte zapisy</h2>
              <span className="text-xs tabular-nums text-muted-foreground">
                {filteredClauses.length} z {analysis.flagged_clauses.length}
              </span>
            </div>

            <div role="group" aria-label="Filtruj według ryzyka" className="flex flex-wrap gap-1.5">
              {(["all", "high", "medium", "low"] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setFilter(level)}
                  aria-pressed={filter === level}
                  className={cn(
                    "h-8 rounded-full border px-3 text-xs font-medium transition-colors duration-base",
                    filter === level
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input/40 bg-card text-muted-foreground hover:border-input hover:text-foreground"
                  )}
                >
                  {filterLabels[level]}
                </button>
              ))}
            </div>
          </div>

          <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto bg-muted/30 p-3 sm:p-4">
            {filteredClauses.length === 0 ? (
              <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
                {filter === "all"
                  ? "Nie znaleziono zapisów podobnych do klauzul niedozwolonych."
                  : "Brak zapisów spełniających wybrane kryteria."}
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
        </section>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Wyniki mają charakter informacyjny i nie stanowią porady prawnej.
      </p>
    </div>
  );
}
