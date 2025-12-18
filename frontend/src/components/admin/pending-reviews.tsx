"use client";

import Link from "next/link";
import type { PendingReviewItem } from "@/types/api";
import { Button } from "@/components/ui/button";
import {
    FileText,
    Clock,
    CheckCircle,
    ChevronRight,
} from "lucide-react";

interface PendingReviewsListProps {
    reviews: PendingReviewItem[];
    isLoading: boolean;
    onReviewComplete?: () => void;
}

export function PendingReviewsList({
    reviews,
    isLoading,
    onReviewComplete,
}: PendingReviewsListProps) {
    if (isLoading) {
        return (
            <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                    <div
                        key={i}
                        className="h-20 animate-pulse rounded-lg bg-muted"
                    />
                ))}
            </div>
        );
    }

    if (reviews.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle className="mb-4 h-12 w-12 text-green-500" />
                <h3 className="text-lg font-medium">Wszystko przejrzane!</h3>
                <p className="text-sm text-muted-foreground">
                    Brak analiz oczekujących na recenzję
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {reviews.map((review) => (
                <ReviewItem
                    key={review.analysis_id}
                    review={review}
                    onReviewComplete={onReviewComplete}
                />
            ))}
        </div>
    );
}

interface ReviewItemProps {
    review: PendingReviewItem;
    onReviewComplete?: () => void;
}

function ReviewItem({ review, onReviewComplete: _onReviewComplete }: ReviewItemProps) {
    const completedAt = new Date(review.completed_at);
    const timeAgo = getTimeAgo(completedAt);

    return (
        <div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50">
            <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h4 className="font-medium">{review.filename}</h4>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {timeAgo}
                        </span>
                        <span>
                            {review.total_clauses} klauzul
                        </span>
                        {review.high_risk_count > 0 && (
                            <span className="flex items-center gap-1 text-red-500">
                                {review.high_risk_count} wysokiego ryzyka
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {review.has_feedback && (
                    <span className="rounded bg-green-500/10 px-2 py-1 text-xs text-green-600 dark:text-green-400">
                        Ma feedback
                    </span>
                )}
                <Link href={`/admin/review/${review.analysis_id}`}>
                    <Button variant="ghost" size="sm">
                        Przejrzyj
                        <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                </Link>
            </div>
        </div>
    );
}

function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "przed chwilą";
    if (diffMins < 60) return `${diffMins} min temu`;
    if (diffHours < 24) return `${diffHours} godz. temu`;
    if (diffDays === 1) return "wczoraj";
    if (diffDays < 7) return `${diffDays} dni temu`;
    return date.toLocaleDateString("pl-PL");
}
