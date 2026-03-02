"use client";

import { useState } from "react";
import type { FlaggedClause, FeedbackCreate } from "@/types/api";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RiskBadge } from "@/components/ui/risk-badge";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  Check,
  X,
  MessageSquare,
  Loader2,
  CheckCircle,
} from "lucide-react";

interface ClauseReviewCardProps {
  clause: FlaggedClause;
  isExpanded: boolean;
  onToggle: () => void;
  feedbackStatus?: "correct" | "incorrect" | null;
  onFeedbackSubmitted?: (clauseId: string, isCorrect: boolean) => void;
}

export function ClauseReviewCard({
  clause,
  isExpanded,
  onToggle,
  feedbackStatus,
  onFeedbackSubmitted,
}: ClauseReviewCardProps) {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localFeedback, setLocalFeedback] = useState<"correct" | "incorrect" | null>(
    feedbackStatus ?? null
  );

  const handleSubmitFeedback = async (isCorrect: boolean) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const feedback: FeedbackCreate = {
        flagged_clause_id: clause.id,
        is_correct: isCorrect,
        notes: notes.trim() || undefined,
      };

      await api.submitFeedback(feedback);
      setLocalFeedback(isCorrect ? "correct" : "incorrect");
      setShowNotes(false);
      setNotes("");
      onFeedbackSubmitted?.(clause.id, isCorrect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd przesyłania feedbacku");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasFeedback = localFeedback !== null;

  return (
    <Card
      className={cn(
        "transition-all",
        isExpanded && "ring-2 ring-accent",
        hasFeedback && localFeedback === "correct" && "border-green-500/50 bg-green-500/5",
        hasFeedback && localFeedback === "incorrect" && "border-red-500/50 bg-red-500/5"
      )}
    >
      <CardHeader className="cursor-pointer" onClick={onToggle}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <RiskBadge level={clause.risk_level} />
              <span className="text-sm text-muted-foreground">
                {(clause.confidence * 100).toFixed(0)}% pewności
              </span>
              <span className="rounded bg-secondary px-2 py-0.5 text-xs">{clause.match_type}</span>
              {hasFeedback && (
                <span
                  className={cn(
                    "flex items-center gap-1 rounded px-2 py-0.5 text-xs",
                    localFeedback === "correct"
                      ? "bg-green-500/20 text-green-700 dark:text-green-400"
                      : "bg-red-500/20 text-red-700 dark:text-red-400"
                  )}
                >
                  <CheckCircle className="h-3 w-3" />
                  {localFeedback === "correct" ? "Poprawne" : "Błędne"}
                </span>
              )}
            </div>
            <p className="line-clamp-2 text-sm">{clause.matched_text}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Matched text */}
            <div>
              <h4 className="mb-2 text-sm font-semibold">Znaleziony fragment</h4>
              <div className="rounded border-l-4 border-destructive bg-destructive/10 p-3 text-sm">
                {clause.matched_text}
              </div>
            </div>

            {/* Similar prohibited clause */}
            {clause.explanation?.clause_text && (
              <div>
                <h4 className="mb-2 text-sm font-semibold">Podobna klauzula niedozwolona</h4>
                <div className="rounded bg-secondary p-3 text-sm">
                  {clause.explanation.clause_text}
                </div>
              </div>
            )}

            {/* Legal references */}
            {clause.explanation?.legal_references &&
              clause.explanation.legal_references.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold">Podstawa prawna</h4>
                  <div className="space-y-2">
                    {clause.explanation.legal_references.map((ref, idx) => (
                      <div key={idx} className="rounded bg-secondary/50 p-2 text-sm">
                        {ref.article_code && (
                          <span className="font-medium">{ref.article_code}</span>
                        )}
                        {ref.law_name && (
                          <span className="text-muted-foreground"> - {ref.law_name}</span>
                        )}
                        {ref.description && (
                          <p className="mt-1 text-muted-foreground">{ref.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Notes */}
            {clause.explanation?.notes && (
              <div>
                <h4 className="mb-2 text-sm font-semibold">Uwagi</h4>
                <p className="text-sm text-muted-foreground">{clause.explanation.notes}</p>
              </div>
            )}

            {/* Tags */}
            {clause.explanation?.tags && clause.explanation.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {clause.explanation.tags.map((tag, idx) => (
                  <span key={idx} className="rounded-full bg-secondary px-2 py-1 text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Feedback Section */}
            {!hasFeedback && (
              <div className="border-t pt-4">
                <h4 className="mb-3 text-sm font-semibold">Oceń wykrycie</h4>

                {error && (
                  <div className="mb-3 rounded bg-destructive/10 p-2 text-sm text-destructive">
                    {error}
                  </div>
                )}

                {/* Notes input */}
                {showNotes && (
                  <div className="mb-3">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Dodaj opcjonalne uwagi..."
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                      rows={2}
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSubmitFeedback(true)}
                    disabled={isSubmitting}
                    className="border-green-500/50 text-green-700 hover:bg-green-500/10 dark:text-green-400"
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    Poprawne (TP)
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSubmitFeedback(false)}
                    disabled={isSubmitting}
                    className="border-red-500/50 text-red-700 hover:bg-red-500/10 dark:text-red-400"
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <X className="mr-2 h-4 w-4" />
                    )}
                    Błędne (FP)
                  </Button>

                  <Button variant="ghost" size="sm" onClick={() => setShowNotes(!showNotes)}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    {showNotes ? "Ukryj uwagi" : "Dodaj uwagi"}
                  </Button>
                </div>
              </div>
            )}

            {/* Feedback already submitted */}
            {hasFeedback && (
              <div className="border-t pt-4">
                <div
                  className={cn(
                    "flex items-center gap-2 rounded p-3",
                    localFeedback === "correct"
                      ? "bg-green-500/10 text-green-700 dark:text-green-400"
                      : "bg-red-500/10 text-red-700 dark:text-red-400"
                  )}
                >
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">
                    Oceniono jako:{" "}
                    {localFeedback === "correct"
                      ? "Poprawne wykrycie (True Positive)"
                      : "Błędne wykrycie (False Positive)"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
