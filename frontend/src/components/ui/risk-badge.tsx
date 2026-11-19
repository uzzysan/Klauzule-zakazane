import * as React from "react";
import { AlertOctagon, AlertTriangle, Info, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type RiskLevel = "high" | "medium" | "low";

/**
 * Risk is never communicated by colour alone (WCAG 1.4.1, colour-vision deficiency):
 * each level has its own icon shape and a text label as well as a colour.
 */
export const riskMeta: Record<
  RiskLevel,
  {
    label: string;
    long: string;
    icon: LucideIcon;
    text: string;
    dot: string;
    /** Literal class names so Tailwind keeps them (never build them with template strings). */
    badge: string;
    highlight: string;
  }
> = {
  high: {
    label: "Wysokie",
    long: "Wysokie ryzyko",
    icon: AlertOctagon,
    text: "text-risk-high",
    dot: "bg-risk-high",
    badge: "risk-high",
    highlight: "highlight-high",
  },
  medium: {
    label: "Średnie",
    long: "Średnie ryzyko",
    icon: AlertTriangle,
    text: "text-risk-medium",
    dot: "bg-risk-medium",
    badge: "risk-medium",
    highlight: "highlight-medium",
  },
  low: {
    label: "Niskie",
    long: "Niskie ryzyko",
    icon: Info,
    text: "text-risk-low",
    dot: "bg-risk-low",
    badge: "risk-low",
    highlight: "highlight-low",
  },
};

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
  showLabel?: boolean;
}

export function RiskBadge({ level, className, showLabel = true }: RiskBadgeProps) {
  const meta = riskMeta[level];
  const Icon = meta.icon;
  return (
    <span className={cn("risk-badge", meta.badge, className)}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {showLabel ? meta.label : <span className="sr-only">{meta.long}</span>}
    </span>
  );
}

interface RiskScoreProps {
  score: number;
  className?: string;
}

export function scoreToLevel(score: number): RiskLevel {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

export function RiskScore({ score, className }: RiskScoreProps) {
  const level = scoreToLevel(score);
  const meta = riskMeta[level];
  const Icon = meta.icon;

  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      <div className="eyebrow mb-2">Wynik ryzyka</div>
      <div className={cn("font-serif text-5xl font-semibold tabular-nums leading-none", meta.text)}>
        {score}
        <span className="ml-0.5 font-sans text-base font-normal text-muted-foreground">/100</span>
      </div>
      <div className={cn("mt-3 inline-flex items-center gap-1.5 text-sm font-medium", meta.text)}>
        <Icon className="h-4 w-4" aria-hidden />
        {meta.long}
      </div>
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
  const rows: { level: RiskLevel; count: number; word: string }[] = [
    { level: "high", count: high, word: "wysokie" },
    { level: "medium", count: medium, word: "średnie" },
    { level: "low", count: low, word: "niskie" },
  ];
  return (
    <ul className={cn("flex gap-4", className)}>
      {rows.map(({ level, count, word }) => {
        const Icon = riskMeta[level].icon;
        return (
          <li key={level} className="flex items-center gap-2 text-sm">
            <Icon className={cn("h-4 w-4", riskMeta[level].text)} aria-hidden />
            <span className="font-semibold tabular-nums">{count}</span>
            <span className="text-muted-foreground">{word}</span>
          </li>
        );
      })}
    </ul>
  );
}
