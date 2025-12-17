"use client";

import type { MetricsResponse } from "@/types/api";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricsOverviewProps {
    metrics: MetricsResponse[];
    isLoading: boolean;
}

export function MetricsOverview({ metrics, isLoading }: MetricsOverviewProps) {
    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="h-32 animate-pulse rounded-lg bg-muted" />
                <div className="h-64 animate-pulse rounded-lg bg-muted" />
            </div>
        );
    }

    if (metrics.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">
                    Brak danych metrycznych. Metryki będą dostępne po zebraniu feedbacku.
                </p>
            </div>
        );
    }

    // Calculate summary stats from all metrics
    const latestMetrics = metrics[0];
    const previousMetrics = metrics[1];

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    label="Precision"
                    value={latestMetrics?.precision}
                    previousValue={previousMetrics?.precision}
                    format="percent"
                    description="Dokładność pozytywnych predykcji"
                />
                <MetricCard
                    label="Recall"
                    value={latestMetrics?.recall}
                    previousValue={previousMetrics?.recall}
                    format="percent"
                    description="Pokrycie rzeczywistych klauzul"
                />
                <MetricCard
                    label="F1 Score"
                    value={latestMetrics?.f1_score}
                    previousValue={previousMetrics?.f1_score}
                    format="percent"
                    description="Harmonic mean precision i recall"
                />
                <MetricCard
                    label="Accuracy"
                    value={latestMetrics?.accuracy}
                    previousValue={previousMetrics?.accuracy}
                    format="percent"
                    description="Ogólna dokładność modelu"
                />
            </div>

            {/* Confusion Matrix */}
            {latestMetrics && (
                <div className="rounded-lg border p-4">
                    <h4 className="mb-4 font-medium">Macierz pomyłek (ostatnie dane)</h4>
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div></div>
                        <div className="font-medium text-muted-foreground">Pred: Pozytywna</div>
                        <div className="font-medium text-muted-foreground">Pred: Negatywna</div>

                        <div className="py-2 font-medium text-muted-foreground">Real: Pozytywna</div>
                        <div className="rounded bg-green-500/10 py-2 text-green-600 dark:text-green-400">
                            TP: {latestMetrics.true_positives}
                        </div>
                        <div className="rounded bg-red-500/10 py-2 text-red-600 dark:text-red-400">
                            FN: {latestMetrics.false_negatives}
                        </div>

                        <div className="py-2 font-medium text-muted-foreground">Real: Negatywna</div>
                        <div className="rounded bg-red-500/10 py-2 text-red-600 dark:text-red-400">
                            FP: {latestMetrics.false_positives}
                        </div>
                        <div className="rounded bg-green-500/10 py-2 text-green-600 dark:text-green-400">
                            TN: {latestMetrics.true_negatives}
                        </div>
                    </div>
                </div>
            )}

            {/* Historical Data Table */}
            <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                    <thead className="border-b bg-muted/50">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium">Data</th>
                            <th className="px-4 py-3 text-right font-medium">Recenzje</th>
                            <th className="px-4 py-3 text-right font-medium">TP</th>
                            <th className="px-4 py-3 text-right font-medium">FP</th>
                            <th className="px-4 py-3 text-right font-medium">Precision</th>
                            <th className="px-4 py-3 text-right font-medium">Recall</th>
                            <th className="px-4 py-3 text-right font-medium">F1</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {metrics.slice(0, 10).map((m) => (
                            <tr key={m.id} className="hover:bg-muted/30">
                                <td className="px-4 py-3">
                                    {new Date(m.date).toLocaleDateString("pl-PL")}
                                </td>
                                <td className="px-4 py-3 text-right">{m.total_reviews}</td>
                                <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">
                                    {m.true_positives}
                                </td>
                                <td className="px-4 py-3 text-right text-red-600 dark:text-red-400">
                                    {m.false_positives}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {m.precision != null ? `${(m.precision * 100).toFixed(1)}%` : "-"}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {m.recall != null ? `${(m.recall * 100).toFixed(1)}%` : "-"}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {m.f1_score != null ? `${(m.f1_score * 100).toFixed(1)}%` : "-"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

interface MetricCardProps {
    label: string;
    value: number | null | undefined;
    previousValue?: number | null;
    format?: "percent" | "number";
    description?: string;
}

function MetricCard({ label, value, previousValue, format = "number", description }: MetricCardProps) {
    const displayValue =
        value != null
            ? format === "percent"
                ? `${(value * 100).toFixed(1)}%`
                : value.toFixed(2)
            : "N/A";

    const trend = getTrend(value, previousValue);

    return (
        <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{label}</span>
                {trend && (
                    <span
                        className={`flex items-center text-xs ${
                            trend === "up"
                                ? "text-green-600 dark:text-green-400"
                                : trend === "down"
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-muted-foreground"
                        }`}
                    >
                        {trend === "up" && <TrendingUp className="h-3 w-3" />}
                        {trend === "down" && <TrendingDown className="h-3 w-3" />}
                        {trend === "same" && <Minus className="h-3 w-3" />}
                    </span>
                )}
            </div>
            <div className="mt-2 text-2xl font-bold">{displayValue}</div>
            {description && (
                <p className="mt-1 text-xs text-muted-foreground">{description}</p>
            )}
        </div>
    );
}

function getTrend(
    current: number | null | undefined,
    previous: number | null | undefined
): "up" | "down" | "same" | null {
    if (current == null || previous == null) return null;
    if (current > previous) return "up";
    if (current < previous) return "down";
    return "same";
}
