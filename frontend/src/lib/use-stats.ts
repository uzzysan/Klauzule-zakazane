"use client";

import { useEffect, useState } from "react";
import { FALLBACK_STATS, fetchStats, type Stats } from "./stats";

let cached: Stats | null = null;
let pending: Promise<Stats> | null = null;

function loadStats(): Promise<Stats> {
  if (!pending) {
    pending = fetchStats().then((stats) => {
      cached = stats;
      return stats;
    });
  }
  return pending;
}

/**
 * Live clause/ruling counters shared by every client component on the page:
 * one request per page view, refreshed on each navigation.
 */
export function useStats(): Stats {
  const [stats, setStats] = useState<Stats>(cached ?? FALLBACK_STATS);

  useEffect(() => {
    if (cached) return;
    let active = true;
    loadStats().then((next) => {
      if (active) setStats(next);
    });
    return () => {
      active = false;
    };
  }, []);

  return stats;
}
