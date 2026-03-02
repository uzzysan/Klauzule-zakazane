"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskScore, RiskCounts } from "@/components/ui/risk-badge";
import { ClauseReviewCard } from "@/components/admin/clause-review-card";
import type { AnalysisDetail } from "@/types/api";
import {
  ArrowLeft,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
} from "lucide-react";

export default function ReviewPage() {
  const params = useParams();
  const analysisId = params.analysisId as string;

  const { user, isLoading: authLoading, isAuthenticated, checkAuth } = useAuthStore();
  const [analysis, setAnalysis] = useState<AnalysisDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedClauses, setExpandedClauses] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low" | "reviewed" | "pending">(
    "all"
  );
  const [feedbackMap, setFeedbackMap] = useState<Map<string, "correct" | "incorrect">>(new Map());

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Fetch analysis data
  useEffect(() => {
    async function fetchAnalysis() {
      if (!analysisId || !isAuthenticated) return;

      try {
        setLoading(true);
        const data = await api.getAnalysis(analysisId);
        setAnalysis(data);

        // Auto-expand all clauses for review
        const allIds = data.flagged_clauses.map((c) => c.id);
        setExpandedClauses(new Set(allIds));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nie udało się pobrać analizy");
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated) {
      fetchAnalysis();
    }
  }, [analysisId, isAuthenticated]);

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

  const handleFeedbackSubmitted = (clauseId: string, isCorrect: boolean) => {
    setFeedbackMap((prev) => {
      const next = new Map(prev);
      next.set(clauseId, isCorrect ? "correct" : "incorrect");
      return next;
    });
  };

  // Filter clauses
  const filteredClauses =
    analysis?.flagged_clauses.filter((c) => {
      if (filter === "all") return true;
      if (filter === "reviewed") return feedbackMap.has(c.id);
      if (filter === "pending") return !feedbackMap.has(c.id);
      return c.risk_level === filter;
    }) || [];

  // Calculate stats
  const reviewedCount = feedbackMap.size;
  const totalCount = analysis?.flagged_clauses.length || 0;
  const correctCount = Array.from(feedbackMap.values()).filter((v) => v === "correct").length;
  const incorrectCount = reviewedCount - correctCount;

  // Auth loading state
  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Sprawdzanie autoryzacji...</div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="container mx-auto max-w-md py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-destructive" />
            <h2 className="mb-2 text-lg font-semibold">Brak dostępu</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Musisz być zalogowany, aby przeglądać tę stronę.
            </p>
            <Link href="/admin">
              <Button>Zaloguj się</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check permissions
  if (!user.is_admin && !user.is_reviewer) {
    return (
      <div className="container mx-auto max-w-md py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-destructive" />
            <h2 className="mb-2 text-lg font-semibold">Brak uprawnień</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Nie masz uprawnień do recenzowania analiz.
            </p>
            <Link href="/admin">
              <Button variant="outline">Wróć do panelu</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading analysis
  if (loading) {
    return (
      <div className="container max-w-6xl py-12">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent" />
            <p className="text-muted-foreground">Ładowanie analizy...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !analysis) {
    return (
      <div className="container max-w-6xl py-12">
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertTriangle className="h-12 w-12 text-destructive" />
              <h2 className="text-xl font-semibold">Wystąpił błąd</h2>
              <p className="text-muted-foreground">{error || "Nie znaleziono analizy"}</p>
              <Link href="/admin">
                <Button>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Wróć do panelu
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Wróć do panelu
          </Button>
        </Link>

        <h1 className="mb-2 text-3xl font-bold">Recenzja analizy</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {analysis.duration_seconds ? `${analysis.duration_seconds}s` : "—"}
          </span>
          <span className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            {analysis.language === "pl" ? "Polski" : "Angielski"}
          </span>
          <span className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" />
            ID: {analysis.id.slice(0, 8)}...
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <RiskScore score={analysis.risk_score || 0} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold">{analysis.total_clauses_found}</div>
              <div className="text-sm text-muted-foreground">
                {analysis.total_clauses_found === 1
                  ? "znaleziona klauzula"
                  : analysis.total_clauses_found < 5
                    ? "znalezione klauzule"
                    : "znalezionych klauzul"}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-center pt-6">
            <RiskCounts
              high={analysis.high_risk_count}
              medium={analysis.medium_risk_count}
              low={analysis.low_risk_count}
              className="flex-col gap-2"
            />
          </CardContent>
        </Card>

        {/* Review Progress */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                Postęp recenzji
              </div>
              <div className="text-4xl font-bold">
                {reviewedCount}
                <span className="text-lg font-normal text-muted-foreground">/{totalCount}</span>
              </div>
              <div className="mt-2 flex justify-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  {correctCount}
                </span>
                <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                  <XCircle className="h-4 w-4" />
                  {incorrectCount}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flagged Clauses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Klauzule do oceny</CardTitle>
              <CardDescription>
                Oceń każdą wykrytą klauzulę jako poprawną (TP) lub błędną (FP)
              </CardDescription>
            </div>

            {/* Filter */}
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { key: "all", label: "Wszystkie" },
                  { key: "pending", label: "Do oceny" },
                  { key: "reviewed", label: "Ocenione" },
                  { key: "high", label: "Wysokie" },
                  { key: "medium", label: "Średnie" },
                  { key: "low", label: "Niskie" },
                ] as const
              ).map(({ key, label }) => (
                <Button
                  key={key}
                  variant={filter === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(key)}
                >
                  {label}
                  {key === "pending" && (
                    <span className="ml-1 text-xs">({totalCount - reviewedCount})</span>
                  )}
                  {key === "reviewed" && <span className="ml-1 text-xs">({reviewedCount})</span>}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredClauses.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {filter === "all"
                ? "Brak klauzul do oceny"
                : filter === "pending"
                  ? "Wszystkie klauzule zostały ocenione!"
                  : filter === "reviewed"
                    ? "Brak ocenionych klauzul"
                    : "Brak klauzul o wybranym poziomie ryzyka"}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClauses.map((clause) => (
                <ClauseReviewCard
                  key={clause.id}
                  clause={clause}
                  isExpanded={expandedClauses.has(clause.id)}
                  onToggle={() => toggleClause(clause.id)}
                  feedbackStatus={feedbackMap.get(clause.id) ?? null}
                  onFeedbackSubmitted={handleFeedbackSubmitted}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary when all reviewed */}
      {reviewedCount === totalCount && totalCount > 0 && (
        <Card className="mt-6 border-green-500/50 bg-green-500/5">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                <div>
                  <h3 className="font-semibold">Recenzja zakończona!</h3>
                  <p className="text-sm text-muted-foreground">
                    Oceniono wszystkie {totalCount} klauzul ({correctCount} poprawnych,{" "}
                    {incorrectCount} błędnych)
                  </p>
                </div>
              </div>
              <Link href="/admin">
                <Button>
                  Wróć do panelu
                  <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
