import {
  buildReviewProgress,
  createReviewEvent,
  describeOverview,
  type Database,
  type ParseStatus,
  type ReviewCheck,
  type ReviewComment,
  type ReviewDiffStats,
  type ReviewEvent,
  type ReviewFile,
  type ReviewReadiness,
  type ReviewSnapshot,
  type ReviewSuggestion,
  type ReviewStage,
  type SubmissionContext,
} from "@reviselab/core";

import { getStoredReviewFallbackContext } from "./repository-contracts";

export type StoredPaperVersionRow =
  Database["public"]["Tables"]["paper_versions"]["Row"];
export type StoredReviewRow = Database["public"]["Tables"]["reviews"]["Row"];
export type StoredReviewFileRow =
  Database["public"]["Tables"]["review_files"]["Row"];
export type StoredReviewCheckRow =
  Database["public"]["Tables"]["review_checks"]["Row"];
export type StoredReviewSuggestionRow =
  Database["public"]["Tables"]["review_suggestions"]["Row"];
export type StoredReviewCommentRow =
  Database["public"]["Tables"]["review_comments"]["Row"];
export type StoredReviewEventRow =
  Database["public"]["Tables"]["review_events"]["Row"];

export function getStoredReviewContext(
  context: StoredReviewRow["context_json"],
): SubmissionContext {
  return (
    (context as SubmissionContext | null) ?? getStoredReviewFallbackContext()
  );
}

export function mapReviewDiffStats(value: unknown): ReviewDiffStats {
  const stats = value as Partial<ReviewDiffStats> | null;

  return {
    additions: typeof stats?.additions === "number" ? stats.additions : 0,
    deletions: typeof stats?.deletions === "number" ? stats.deletions : 0,
    changedLines:
      typeof stats?.changedLines === "number" ? stats.changedLines : 0,
  };
}

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

export function mapStoredSuggestion(
  suggestion: StoredReviewSuggestionRow,
): ReviewSuggestion {
  const anchor = suggestion.anchor_json as
    | ReviewSuggestion["anchor"]
    | null
    | undefined;

  return {
    id: suggestion.id,
    ...(suggestion.review_file_id
      ? { reviewFileId: suggestion.review_file_id }
      : {}),
    filePath: suggestion.file_path as ReviewSuggestion["filePath"],
    title: suggestion.title,
    severity: suggestion.severity as ReviewSuggestion["severity"],
    rationale: suggestion.rationale,
    originalText: suggestion.original_text,
    suggestedText: suggestion.suggested_text,
    ...(suggestion.edited_text ? { editedText: suggestion.edited_text } : {}),
    origin: suggestion.origin as ReviewSuggestion["origin"],
    status: suggestion.status as ReviewSuggestion["status"],
    anchor:
      anchor ??
      ({
        id: suggestion.id,
        filePath: suggestion.file_path,
        hunkHeader: `@@ ${suggestion.file_path}`,
        startLine: 1,
        endLine: 1,
        oldStartLine: 1,
        oldEndLine: 1,
        label: suggestion.title,
      } as ReviewSuggestion["anchor"]),
    diffStats: mapReviewDiffStats(suggestion.diff_stats_json),
    linkedCheckIds:
      (suggestion.linked_check_ids_json as string[] | null | undefined) ?? [],
    linkedCommentIds:
      (suggestion.linked_comment_ids_json as string[] | null | undefined) ?? [],
    ...(suggestion.explainability_json
      ? {
          explainability: suggestion.explainability_json as NonNullable<
            ReviewSuggestion["explainability"]
          >,
        }
      : {}),
  };
}

export function mapStoredCheck(
  check: StoredReviewCheckRow,
  filePathById: Map<string, ReviewFile["path"]>,
): ReviewCheck {
  const reviewFilePath = check.review_file_id
    ? filePathById.get(check.review_file_id)
    : undefined;

  return {
    id: check.id,
    ruleId: check.rule_id,
    ruleVersion: check.rule_version,
    name: check.name,
    state: check.state as ReviewCheck["state"],
    severity: check.severity as ReviewCheck["severity"],
    summary: check.summary,
    detail: check.detail,
    sourceUrl: check.source_url,
    ...(reviewFilePath ? { reviewFilePath } : {}),
    ...(check.anchor_id ? { anchorId: check.anchor_id } : {}),
    linkedSuggestionIds:
      (check.linked_suggestion_ids_json as string[] | null | undefined) ?? [],
  };
}

export function mapStoredComment(
  comment: StoredReviewCommentRow,
): ReviewComment {
  return {
    id: comment.id,
    ruleId: comment.rule_id,
    ruleVersion: comment.rule_version,
    target: comment.target,
    filePath: comment.file_path as ReviewComment["filePath"],
    anchorId: comment.anchor_id,
    severity: comment.severity as ReviewComment["severity"],
    body: comment.body,
    ...(comment.source_url ? { sourceUrl: comment.source_url } : {}),
    linkedSuggestionIds:
      (comment.linked_suggestion_ids_json as string[] | null | undefined) ?? [],
  };
}

export function mapStoredFile(file: StoredReviewFileRow): ReviewFile {
  return {
    id: file.id,
    path: file.path as ReviewFile["path"],
    title: file.title,
    severity: file.severity as ReviewFile["severity"],
    status: file.status as ReviewFile["status"],
    changeCount: file.change_count,
    diffStats: mapReviewDiffStats(file.diff_stats_json),
    baseText: file.base_text,
    currentText: file.current_text,
    suggestionIds:
      (file.suggestion_ids_json as string[] | null | undefined) ?? [],
  };
}

export function mapStoredEvent(event: StoredReviewEventRow): ReviewEvent {
  return {
    id: event.id,
    kind: event.event_kind as ReviewEvent["kind"],
    label: event.label,
    createdAt: event.created_at,
    ...(event.detail ? { detail: event.detail } : {}),
    ...(event.file_path
      ? { filePath: event.file_path as ReviewFile["path"] }
      : {}),
    ...(event.suggestion_id ? { suggestionId: event.suggestion_id } : {}),
  };
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
