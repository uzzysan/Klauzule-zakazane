export type Stats = {
  /** Clause records in the registry (table klauzule_niedozwolone). */
  clauses: number;
  /** Distinct case signatures (sygnatura) in the registry. */
  rulings: number;
};

export const STATS_ENDPOINT = "/api/v1/stats";

/** How long server-rendered metadata may reuse fetched counts (seconds). */
export const STATS_REVALIDATE_SECONDS = 300;

/**
 * Last verified production values. Used only when the stats API cannot be
 * reached (build time, offline) so the UI never renders an empty counter.
 * The live values come from the database on every page view.
 */
export const FALLBACK_STATS: Stats = { clauses: 7879, rulings: 5251 };

const isCount = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

export function parseStats(payload: unknown): Stats | null {
  if (!payload || typeof payload !== "object") return null;
  const { clauses, rulings } = payload as Record<string, unknown>;
  if (!isCount(clauses) || !isCount(rulings)) return null;
  return { clauses, rulings };
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat("pl-PL").format(value);
}

/** Client-side read; always resolves to usable numbers. */
export async function fetchStats(): Promise<Stats> {
  try {
    const response = await fetch(STATS_ENDPOINT, { cache: "no-store" });
    if (!response.ok) return FALLBACK_STATS;
    return parseStats(await response.json()) ?? FALLBACK_STATS;
  } catch {
    return FALLBACK_STATS;
  }
}

/** Server-side read for SEO metadata; cached and refreshed in the background. */
export async function fetchStatsServer(): Promise<Stats> {
  const baseUrl = process.env.STATS_API_URL ?? "http://fairpact-backend:8000";
  try {
    const response = await fetch(`${baseUrl}${STATS_ENDPOINT}`, {
      next: { revalidate: STATS_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return FALLBACK_STATS;
    return parseStats(await response.json()) ?? FALLBACK_STATS;
  } catch {
    return FALLBACK_STATS;
  }
}
