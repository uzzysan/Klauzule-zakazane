"use client";

import {
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    RiskBadge,
    RiskCounts,
    RiskScore,
} from "@/components/ui";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import type { AnalysisDetail, FlaggedClause } from "@/types/api";
import { AlertTriangle, ArrowLeft, ChevronDown, ChevronUp, Clock, FileText, Heart } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function FlaggedClauseCard({ clause, isExpanded, onToggle }: { clause: FlaggedClause; isExpanded: boolean; onToggle: () => void }) {
    return (
        <Card className={cn("transition-all", isExpanded && "ring-2 ring-accent")}>
            <CardHeader className="cursor-pointer" onClick={onToggle}>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <RiskBadge level={clause.risk_level} />
                            <span className="text-sm text-muted-foreground">
                                {(clause.confidence * 100).toFixed(0)}% pewności
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-secondary rounded">
                                {clause.match_type}
                            </span>
                        </div>
                        <p className="text-sm line-clamp-2">{clause.matched_text}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="flex-shrink-0">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                </div>
            </CardHeader>

            {isExpanded && (
                <CardContent className="pt-0">
                    <div className="space-y-4">
                        {/* Matched text */}
                        <div>
                            <h4 className="text-sm font-semibold mb-2">Znaleziony fragment</h4>
                            <div className="p-3 bg-destructive/10 border-l-4 border-destructive rounded text-sm">
                                {clause.matched_text}
                            </div>
                        </div>

                        {/* Similar prohibited clause */}
                        {clause.explanation?.clause_text && (
                            <div>
                                <h4 className="text-sm font-semibold mb-2">Podobna klauzula niedozwolona</h4>
                                <div className="p-3 bg-secondary rounded text-sm">
                                    {clause.explanation.clause_text}
                                </div>
                            </div>
                        )}

                        {/* Legal references */}
                        {clause.explanation?.legal_references && clause.explanation.legal_references.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold mb-2">Podstawa prawna</h4>
                                <div className="space-y-2">
                                    {clause.explanation.legal_references.map((ref, idx) => (
                                        <div key={idx} className="p-2 bg-secondary/50 rounded text-sm">
                                            {ref.article_code && (
                                                <span className="font-medium">{ref.article_code}</span>
                                            )}
                                            {ref.law_name && <span className="text-muted-foreground"> - {ref.law_name}</span>}
                                            {ref.description && <p className="mt-1 text-muted-foreground">{ref.description}</p>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        {clause.explanation?.notes && (
                            <div>
                                <h4 className="text-sm font-semibold mb-2">Uwagi</h4>
                                <p className="text-sm text-muted-foreground">{clause.explanation.notes}</p>
                            </div>
                        )}

                        {/* Tags */}
                        {clause.explanation?.tags && clause.explanation.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {clause.explanation.tags.map((tag, idx) => (
                                    <span key={idx} className="text-xs px-2 py-1 bg-secondary rounded-full">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            )}
        </Card>
    );
}

export default function AnalysisPage() {
    const params = useParams();
    const router = useRouter();
    const analysisId = params.id as string;

    const [analysis, setAnalysis] = useState<AnalysisDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedClauses, setExpandedClauses] = useState<Set<string>>(new Set());
    const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all");

    useEffect(() => {
        async function fetchAnalysis() {
            try {
                setLoading(true);
                const data = await api.getAnalysis(analysisId);
                setAnalysis(data);

                // Auto-expand high risk clauses
                const highRisk = data.flagged_clauses
                    .filter((c) => c.risk_level === "high")
                    .map((c) => c.id);
                setExpandedClauses(new Set(highRisk));
            } catch (err) {
                setError(err instanceof Error ? err.message : "Nie udało się pobrać wyników analizy");
            } finally {
                setLoading(false);
            }
        }

        if (analysisId) {
            fetchAnalysis();
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

    const filteredClauses = analysis?.flagged_clauses.filter((c) => {
        if (filter === "all") return true;
        return c.risk_level === filter;
    }) || [];

    if (loading) {
        return (
            <div className="container max-w-6xl py-12">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent" />
                        <p className="text-muted-foreground">Ładowanie wyników...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !analysis) {
        return (
            <div className="container max-w-6xl py-12">
                <Card>
                    <CardContent className="py-12">
                        <div className="flex flex-col items-center gap-4 text-center">
                            <AlertTriangle className="h-12 w-12 text-destructive" />
                            <h2 className="text-xl font-semibold">Wystąpił błąd</h2>
                            <p className="text-muted-foreground">{error || "Nie znaleziono analizy"}</p>
                            <Button onClick={() => router.push("/upload")}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Wróć do przesyłania
                            </Button>
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <Button variant="ghost" onClick={() => router.push("/upload")}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Nowa analiza
                    </Button>

                    <a href="https://suppi.pl/rafcio" target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="gap-2 hover:bg-secondary/80">
                            <Heart className="h-4 w-4 text-rose-500 fill-rose-500/10" />
                            Wspieram to co robisz
                        </Button>
                    </a>
                </div>

                <h1 className="text-3xl font-bold mb-2">Wyniki analizy</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {analysis.duration_seconds ? `${analysis.duration_seconds}s` : "—"}
                    </span>
                    <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {analysis.language === "pl" ? "Polski" : "Angielski"}
                    </span>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-6 md:grid-cols-3 mb-8">
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
                    <CardContent className="pt-6 flex items-center justify-center">
                        <RiskCounts
                            high={analysis.high_risk_count}
                            medium={analysis.medium_risk_count}
                            low={analysis.low_risk_count}
                            className="flex-col gap-2"
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Flagged Clauses */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Znalezione klauzule</CardTitle>
                            <CardDescription>
                                Klauzule potencjalnie niedozwolone w dokumencie
                            </CardDescription>
                        </div>

                        {/* Filter */}
                        <div className="flex gap-2">
                            {(["all", "high", "medium", "low"] as const).map((level) => (
                                <Button
                                    key={level}
                                    variant={filter === level ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setFilter(level)}
                                >
                                    {level === "all"
                                        ? "Wszystkie"
                                        : level === "high"
                                          ? "Wysokie"
                                          : level === "medium"
                                            ? "Średnie"
                                            : "Niskie"}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    {filteredClauses.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                            {filter === "all"
                                ? "Nie znaleziono żadnych klauzul niedozwolonych"
                                : "Brak klauzul o wybranym poziomie ryzyka"}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredClauses.map((clause) => (
                                <FlaggedClauseCard
                                    key={clause.id}
                                    clause={clause}
                                    isExpanded={expandedClauses.has(clause.id)}
                                    onToggle={() => toggleClause(clause.id)}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
