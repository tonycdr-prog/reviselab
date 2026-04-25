import {
  getReviewEventLabel,
  type ReviewCheck,
  type ReviewComment,
  type ReviewDiffStats,
  type ReviewEvent,
  type ReviewFile,
  type ReviewSuggestion,
} from "@reviselab/core";

import type {
  StoredReviewCheckRow,
  StoredReviewCommentRow,
  StoredReviewEventRow,
  StoredReviewFileRow,
  StoredReviewSuggestionRow,
} from "./repository-mapping-row-types";

export function mapReviewDiffStats(value: unknown): ReviewDiffStats {
  const stats = value as Partial<ReviewDiffStats> | null;

  return {
    additions: typeof stats?.additions === "number" ? stats.additions : 0,
    deletions: typeof stats?.deletions === "number" ? stats.deletions : 0,
    changedLines:
      typeof stats?.changedLines === "number" ? stats.changedLines : 0,
  };
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
    sourceCheckedAt: check.source_checked_at ?? check.created_at,
    evidence:
      (check.evidence_json as ReviewCheck["evidence"] | null | undefined) ?? [],
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
  const eventKind = event.event_kind as ReviewEvent["kind"];

  return {
    id: event.id,
    kind: eventKind,
    label: getReviewEventLabel(eventKind),
    createdAt: event.created_at,
    ...(event.detail ? { detail: event.detail } : {}),
    ...(event.file_path
      ? { filePath: event.file_path as ReviewFile["path"] }
      : {}),
    ...(event.suggestion_id ? { suggestionId: event.suggestion_id } : {}),
  };
}
