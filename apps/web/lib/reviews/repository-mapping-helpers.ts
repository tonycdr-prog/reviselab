import {
  buildReviewProgress,
  createReviewEvent,
  describeOverview,
  type ReviewEvent,
  type ReviewReadiness,
  type ReviewSnapshot,
  type ReviewStage,
  type ParseStatus,
} from "@reviselab/core";

export {
  mapReviewDiffStats,
  mapStoredCheck,
  mapStoredComment,
  mapStoredEvent,
  mapStoredFile,
  mapStoredSuggestion,
} from "./repository-mapping-items";
export type {
  StoredPaperVersionRow,
  StoredReviewCheckRow,
  StoredReviewCommentRow,
  StoredReviewEventRow,
  StoredReviewFileRow,
  StoredReviewRow,
  StoredReviewSuggestionRow,
} from "./repository-mapping-row-types";

import type {
  StoredPaperVersionRow,
  StoredReviewRow,
} from "./repository-mapping-row-types";

export function getStoredReadiness(
  reviewRow: StoredReviewRow,
  summary: Partial<ReviewSnapshot> | null,
) {
  return (reviewRow.readiness ??
    summary?.readiness ??
    null) as ReviewReadiness | null;
}

function getStoredParseStatus(
  versionRow: StoredPaperVersionRow | null,
  summary: Partial<ReviewSnapshot> | null,
) {
  return (versionRow?.parse_status ??
    summary?.progress?.parseStatus ??
    "uploaded") as ParseStatus;
}

function getProgressStageEventKind(stage: ReviewStage): ReviewEvent["kind"] {
  switch (stage) {
    case "parse-queued":
    case "review-queued":
      return "review_queued";
    case "parsing":
      return "parse_started";
    case "reviewing":
      return "review_started";
    case "failed-parse":
      return "parse_failed";
    case "failed-review":
      return "review_failed";
    case "ready":
      return "review_completed";
  }
}

export function buildReviewOverview(
  reviewRow: StoredReviewRow,
  summary: Partial<ReviewSnapshot> | null,
  readiness: ReviewReadiness | null,
  progress: ReviewSnapshot["progress"],
) {
  if (reviewRow.status === "ready") {
    if (summary?.overview) {
      return summary.overview;
    }

    return readiness ? describeOverview(readiness) : progress.description;
  }

  if (reviewRow.status === "failed") {
    return progress.error ?? progress.description;
  }

  return progress.description;
}

export function buildHistory(
  reviewRow: StoredReviewRow,
  summaryHistory: ReviewEvent[] | undefined,
  progress: ReviewSnapshot["progress"],
): ReviewEvent[] {
  if (summaryHistory?.length) {
    return summaryHistory;
  }

  return [
    createReviewEvent({
      kind: getProgressStageEventKind(progress.stage),
      createdAt: reviewRow.updated_at ?? reviewRow.created_at,
      detail: progress.description,
    }),
  ];
}

export function resolveStoredCollection<T>(
  liveItems: T[],
  summaryItems: T[] | undefined,
) {
  if (liveItems.length > 0) {
    return liveItems;
  }

  return summaryItems ?? liveItems;
}

export function getStoredProgress(
  reviewRow: StoredReviewRow,
  versionRow: StoredPaperVersionRow | null,
  summary: Partial<ReviewSnapshot> | null,
  readiness: ReviewReadiness | null,
) {
  const parseStatus = getStoredParseStatus(versionRow, summary);

  return buildReviewProgress({
    parseStatus,
    reviewStatus: reviewRow.status as ReviewSnapshot["status"],
    parseError: versionRow?.parse_error ?? null,
    reviewError: reviewRow.failed_reason ?? null,
    readiness,
  });
}
