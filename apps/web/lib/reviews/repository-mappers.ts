import { type DashboardReviewRow, type ReviewSnapshot } from "@reviselab/core";

import {
  buildHistory,
  buildReviewOverview,
  getStoredProgress,
  getStoredReadiness,
  getStoredReviewContext,
  mapStoredCheck,
  mapStoredComment,
  mapStoredEvent,
  mapStoredFile,
  mapStoredSuggestion,
  resolveStoredCollection,
  type StoredPaperVersionRow,
  type StoredReviewCheckRow,
  type StoredReviewCommentRow,
  type StoredReviewEventRow,
  type StoredReviewFileRow,
  type StoredReviewRow,
  type StoredReviewSuggestionRow,
} from "./repository-mapping-helpers";

export function mapStoredReviewSnapshot(
  reviewRow: StoredReviewRow,
  versionRow: StoredPaperVersionRow | null,
  files: StoredReviewFileRow[],
  checks: StoredReviewCheckRow[],
  suggestions: StoredReviewSuggestionRow[],
  comments: StoredReviewCommentRow[],
  events: StoredReviewEventRow[],
): ReviewSnapshot {
  const context = getStoredReviewContext(reviewRow.context_json);
  const summary = reviewRow.summary_json as Partial<ReviewSnapshot> | null;
  const readiness = getStoredReadiness(reviewRow, summary);
  const progress = getStoredProgress(reviewRow, versionRow, summary, readiness);
  const mappedFiles = files.map(mapStoredFile);
  const filePathById = new Map(mappedFiles.map((file) => [file.id, file.path]));
  const mappedSuggestions = suggestions.map(mapStoredSuggestion);
  const mappedChecks = checks.map((check) =>
    mapStoredCheck(check, filePathById),
  );
  const mappedComments = comments.map(mapStoredComment);
  const mappedEvents = events
    .map(mapStoredEvent)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  const shouldHydrateReviewArtifacts = reviewRow.status === "ready";
  const resolvedFiles = shouldHydrateReviewArtifacts
    ? resolveStoredCollection(mappedFiles, summary?.files)
    : [];
  const resolvedChecks = shouldHydrateReviewArtifacts
    ? resolveStoredCollection(mappedChecks, summary?.checks)
    : [];
  const resolvedSuggestions = shouldHydrateReviewArtifacts
    ? resolveStoredCollection(mappedSuggestions, summary?.suggestions)
    : [];
  const resolvedComments = shouldHydrateReviewArtifacts
    ? resolveStoredCollection(mappedComments, summary?.comments)
    : [];
  const resolvedHistory = resolveStoredCollection(
    mappedEvents,
    summary?.history,
  );

  return {
    id: reviewRow.id,
    paperId: reviewRow.paper_id,
    versionId: reviewRow.paper_version_id,
    status: reviewRow.status as ReviewSnapshot["status"],
    readiness,
    progress,
    generatedAt:
      summary?.generatedAt ?? reviewRow.updated_at ?? reviewRow.created_at,
    context,
    overview: buildReviewOverview(reviewRow, summary, readiness, progress),
    ...(summary?.manuscript ? { manuscript: summary.manuscript } : {}),
    files: resolvedFiles,
    checks: resolvedChecks,
    suggestions: resolvedSuggestions,
    comments: resolvedComments,
    history:
      resolvedHistory.length > 0
        ? resolvedHistory
        : buildHistory(reviewRow, summary?.history, progress),
    ...(reviewRow.ai_presence_summary_json
      ? {
          aiPresenceSummary: reviewRow.ai_presence_summary_json as NonNullable<
            ReviewSnapshot["aiPresenceSummary"]
          >,
        }
      : {}),
  };
}

export function mapDashboardReview(
  reviewRow: StoredReviewRow,
  versionRow: StoredPaperVersionRow | null,
  summary: Partial<ReviewSnapshot> | null,
): DashboardReviewRow {
  const context = getStoredReviewContext(reviewRow.context_json);
  const readiness = getStoredReadiness(reviewRow, summary);
  const progress = getStoredProgress(reviewRow, versionRow, summary, readiness);

  return {
    id: reviewRow.id,
    paperId: reviewRow.paper_id,
    title: context.title,
    intendedCategory: context.intendedCategory,
    paperType: context.paperType,
    stage: progress.stage,
    status: reviewRow.status as ReviewSnapshot["status"],
    readiness,
    parseStatus: progress.parseStatus,
    updatedAt: reviewRow.updated_at ?? reviewRow.created_at,
    suggestionCount: summary?.suggestions?.length ?? 0,
    checkCount: summary?.checks?.length ?? 0,
    commentCount: summary?.comments?.length ?? 0,
    failedReason: reviewRow.failed_reason ?? versionRow?.parse_error ?? null,
    progressLabel: progress.label,
  };
}
