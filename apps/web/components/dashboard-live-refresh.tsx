"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import type { DashboardReviewRow } from "@reviselab/core";

const LIVE_STAGES = new Set([
  "parse-queued",
  "parsing",
  "review-queued",
  "reviewing",
]);

export function DashboardLiveRefresh({ rows }: { rows: DashboardReviewRow[] }) {
  const router = useRouter();
  const hasLiveRows = rows.some((row) => LIVE_STAGES.has(row.stage));

  useEffect(() => {
    if (!hasLiveRows) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      router.refresh();
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [hasLiveRows, router]);

  return null;
}
