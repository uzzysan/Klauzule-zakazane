"use client";

import { useEffect, useState } from "react";
import type { User, MetricsResponse, PendingReviewItem } from "@/types/api";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricsOverview } from "./metrics-overview";
import { PendingReviewsList } from "./pending-reviews";
import {
    LogOut,
    RefreshCw,
    Database,
    BarChart3,
    ClipboardList,
    User as UserIcon,
    AlertCircle,
} from "lucide-react";

interface AdminDashboardProps {
    user: User;
}

export function AdminDashboard({ user }: AdminDashboardProps) {
    const { logout } = useAuthStore();
    const [metrics, setMetrics] = useState<MetricsResponse[]>([]);
    const [pendingReviews, setPendingReviews] = useState<PendingReviewItem[]>([]);
    const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
    const [isLoadingReviews, setIsLoadingReviews] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadData = async () => {
        setError(null);

        // Load metrics
        setIsLoadingMetrics(true);
        try {
            const metricsData = await api.getMetrics(30);
            setMetrics(metricsData);
        } catch (err) {
            console.error("Failed to load metrics:", err);
        } finally {
            setIsLoadingMetrics(false);
        }

        // Load pending reviews
        setIsLoadingReviews(true);
        try {
            const reviewsData = await api.getPendingReviews(20);
            setPendingReviews(reviewsData);
        } catch (err) {
            console.error("Failed to load pending reviews:", err);
        } finally {
            setIsLoadingReviews(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSync = async () => {
        if (!user.is_admin) {
            setError("Tylko administratorzy mogą synchronizować klauzule");
            return;
        }

        setIsSyncing(true);
        setSyncMessage(null);
        setError(null);

        try {
            const response = await api.triggerClauseSync();
            setSyncMessage(`${response.message} (Task ID: ${response.task_id})`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Błąd synchronizacji");
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="container mx-auto py-8">
            {/* Header */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Panel Administracyjny</h1>
                    <p className="text-sm text-muted-foreground">
                        Zarządzaj systemem analizy klauzul niedozwolonych
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <UserIcon className="h-4 w-4" />
                        <span>{user.email}</span>
                        {user.is_admin && (
                            <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                                Admin
                            </span>
                        )}
                        {user.is_reviewer && !user.is_admin && (
                            <span className="rounded bg-secondary px-2 py-0.5 text-xs">
                                Recenzent
                            </span>
                        )}
                    </div>
                    <Button variant="outline" size="sm" onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Wyloguj
                    </Button>
                </div>
            </div>

            {/* Error message */}
            {error && (
                <div className="mb-6 flex items-center gap-2 rounded-md bg-destructive/10 p-4 text-destructive">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    {error}
                </div>
            )}

            {/* Sync message */}
            {syncMessage && (
                <div className="mb-6 rounded-md bg-green-500/10 p-4 text-green-700 dark:text-green-400">
                    {syncMessage}
                </div>
            )}

            {/* Quick Actions */}
            <div className="mb-8 flex flex-wrap gap-4">
                <Button variant="outline" onClick={loadData}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Odśwież dane
                </Button>
                {user.is_admin && (
                    <Button variant="outline" onClick={handleSync} disabled={isSyncing}>
                        <Database className="mr-2 h-4 w-4" />
                        {isSyncing ? "Synchronizacja..." : "Synchronizuj klauzule"}
                    </Button>
                )}
            </div>

            {/* Stats Grid */}
            <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Oczekujące recenzje</CardTitle>
                        <ClipboardList className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoadingReviews ? "..." : pendingReviews.length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            analiz do przejrzenia
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Dzisiejsze recenzje</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoadingMetrics
                                ? "..."
                                : metrics.length > 0
                                  ? metrics[0]?.total_reviews || 0
                                  : 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            przesłanych dzisiaj
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Precyzja modelu</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoadingMetrics
                                ? "..."
                                : metrics.length > 0 && metrics[0]?.precision != null
                                  ? `${(metrics[0].precision * 100).toFixed(1)}%`
                                  : "N/A"}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            ostatnie dane
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">F1 Score</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoadingMetrics
                                ? "..."
                                : metrics.length > 0 && metrics[0]?.f1_score != null
                                  ? `${(metrics[0].f1_score * 100).toFixed(1)}%`
                                  : "N/A"}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            ostatnie dane
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <div className="grid gap-8 lg:grid-cols-2">
                {/* Metrics Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Metryki modelu (ostatnie 30 dni)</CardTitle>
                        <CardDescription>
                            Wydajność systemu wykrywania klauzul niedozwolonych
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <MetricsOverview metrics={metrics} isLoading={isLoadingMetrics} />
                    </CardContent>
                </Card>

                {/* Pending Reviews */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Analizy do przejrzenia</CardTitle>
                        <CardDescription>
                            Ostatnio zakończone analizy wymagające weryfikacji
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PendingReviewsList
                            reviews={pendingReviews}
                            isLoading={isLoadingReviews}
                            onReviewComplete={loadData}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
