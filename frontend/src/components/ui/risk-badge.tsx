import * as React from "react";
import { cn } from "@/lib/utils";

type RiskLevel = "high" | "medium" | "low";

interface RiskBadgeProps {
    level: RiskLevel;
    className?: string;
    showLabel?: boolean;
}

const riskLabels: Record<RiskLevel, string> = {
    high: "Wysokie",
    medium: "Średnie",
    low: "Niskie",
};

export function RiskBadge({ level, className, showLabel = true }: RiskBadgeProps) {
    return (
        <span
            className={cn(
                "risk-badge",
                {
                    "risk-high": level === "high",
                    "risk-medium": level === "medium",
                    "risk-low": level === "low",
                },
                className
            )}
        >
            {showLabel ? riskLabels[level] : level.toUpperCase()}
        </span>
    );
}

interface RiskScoreProps {
    score: number;
    className?: string;
}

export function RiskScore({ score, className }: RiskScoreProps) {
    const getColor = () => {
        if (score >= 70) return "text-risk-high";
        if (score >= 40) return "text-risk-medium";
        return "text-risk-low";
    };

    const getLabel = () => {
        if (score >= 70) return "Wysokie ryzyko";
        if (score >= 40) return "Średnie ryzyko";
        return "Niskie ryzyko";
    };

    return (
        <div className={cn("flex flex-col items-center", className)}>
            <div className={cn("text-4xl font-bold", getColor())}>{score}</div>
            <div className="text-sm text-muted-foreground">{getLabel()}</div>
        </div>
    );
}

interface RiskCountsProps {
    high: number;
    medium: number;
    low: number;
    className?: string;
}

export function RiskCounts({ high, medium, low, className }: RiskCountsProps) {
    return (
        <div className={cn("flex gap-4", className)}>
            <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-risk-high" />
                <span className="text-sm">
                    <span className="font-semibold">{high}</span> wysokie
                </span>
            </div>
            <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-risk-medium" />
                <span className="text-sm">
                    <span className="font-semibold">{medium}</span> średnie
                </span>
            </div>
            <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-risk-low" />
                <span className="text-sm">
                    <span className="font-semibold">{low}</span> niskie
                </span>
            </div>
        </div>
    );
}
