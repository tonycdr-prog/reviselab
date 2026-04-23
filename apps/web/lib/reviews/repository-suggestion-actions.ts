import "server-only";

import {
  nowIso,
  type Database,
  type DiffStatus,
  type ReviewFile,
  type ReviewSuggestion,
  type SuggestionAction,
} from "@reviselab/core";

import {
  applySuggestionStatus,
  buildFileSeverity,
  deriveFileStateFromSuggestions,
} from "./repository-helpers";
import { appendReviewEvent, getSuggestionEventKind } from "./repository-events";
import { getReviewById } from "./repository-review-read";
import {
  recordTelemetry,
  requireAuthenticatedContext,
} from "./repository-runtime";

type ReviewFileRow = Database["public"]["Tables"]["review_files"]["Row"];
type ReviewSuggestionRow =
  Database["public"]["Tables"]["review_suggestions"]["Row"];

function getCurrentTextForSuggestion(suggestion: ReviewSuggestion) {
  if (suggestion.status === "edited") {
    return suggestion.editedText ?? suggestion.suggestedText;
  }

  if (suggestion.status === "accepted") {
    return suggestion.editedText ?? suggestion.suggestedText;
  }

  if (suggestion.status === "suggested") {
    return suggestion.suggestedText;
  }

  return suggestion.originalText;
}

function mapSuggestionRowToSnapshotSuggestion(
  suggestionRow: ReviewSuggestionRow,
): ReviewSuggestion {
  return {
    id: suggestionRow.id,
    ...(suggestionRow.review_file_id
      ? { reviewFileId: suggestionRow.review_file_id }
      : {}),
    filePath: suggestionRow.file_path as ReviewSuggestion["filePath"],
    title: suggestionRow.title,
    severity: suggestionRow.severity as ReviewSuggestion["severity"],
    rationale: suggestionRow.rationale,
    originalText: suggestionRow.original_text,
    suggestedText: suggestionRow.suggested_text,
    ...(suggestionRow.edited_text
      ? { editedText: suggestionRow.edited_text }
      : {}),
    origin: suggestionRow.origin as ReviewSuggestion["origin"],
    status: suggestionRow.status as ReviewSuggestion["status"],
    anchor: suggestionRow.anchor_json as ReviewSuggestion["anchor"],
    diffStats:
      (suggestionRow.diff_stats_json as ReviewSuggestion["diffStats"]) ?? {
        additions: 0,
        deletions: 0,
        changedLines: 0,
      },
    linkedCheckIds:
      (suggestionRow.linked_check_ids_json as string[] | null | undefined) ??
      [],
    linkedCommentIds:
      (suggestionRow.linked_comment_ids_json as string[] | null | undefined) ??
      [],
    ...(suggestionRow.explainability_json
      ? {
          explainability: suggestionRow.explainability_json as NonNullable<
            ReviewSuggestion["explainability"]
          >,
        }
      : {}),
  };
}

function deriveNextFileStatus(
  file: ReviewFileRow,
  suggestions: ReviewSuggestion[],
): {
  status: DiffStatus;
  currentText: string;
  diffStats: ReviewFileRow["diff_stats_json"];
  suggestionIdsJson: string[];
} {
  const nextState = deriveFileStateFromSuggestions(
    {
      id: file.id,
      path: file.path as ReviewSuggestion["filePath"],
      title: file.title,
      severity: file.severity as ReviewFile["severity"],
      status: file.status as DiffStatus,
      changeCount: file.change_count,
      diffStats: (file.diff_stats_json as ReviewSuggestion["diffStats"]) ?? {
        additions: 0,
        deletions: 0,
        changedLines: 0,
      },
      baseText: file.base_text,
      currentText: file.current_text,
      suggestionIds:
        (file.suggestion_ids_json as string[] | null | undefined) ?? [],
    },
    suggestions,
  );

  const activeSuggestion = suggestions.find(
    (suggestion) => suggestion.status === nextState.status,
  );

  return {
    status: nextState.status,
    currentText: activeSuggestion
      ? getCurrentTextForSuggestion(activeSuggestion)
      : file.base_text,
    diffStats: nextState.diffStats,
    suggestionIdsJson: nextState.suggestionIds,
  };
}

export async function applySuggestionAction(
  reviewId: string,
  suggestionId: string,
  action: SuggestionAction,
  editedText?: string,
) {
  const auth = await requireAuthenticatedContext();

  if (!auth) {
    throw new Error("Sign in to update review suggestions.");
  }

  const { data: suggestionRow, error: suggestionError } = await auth.supabase
    .from("review_suggestions")
    .select("*")
    .eq("id", suggestionId)
    .eq("review_id", reviewId)
    .maybeSingle();

  if (suggestionError || !suggestionRow) {
    throw new Error(suggestionError?.message ?? "Suggestion not found.");
  }

  const nextSuggestion = applySuggestionStatus(
    mapSuggestionRowToSnapshotSuggestion(suggestionRow),
    action,
    editedText,
  );

  const timestamp = nowIso();

  const { error: updateSuggestionError } = await auth.supabase
    .from("review_suggestions")
    .update({
      status: nextSuggestion.status,
      edited_text: nextSuggestion.editedText ?? null,
      suggested_text: nextSuggestion.suggestedText,
      applied_at: action === "apply" ? timestamp : suggestionRow.applied_at,
      resolved_at: action === "resolve" ? timestamp : null,
      updated_at: timestamp,
    })
    .eq("id", suggestionId)
    .eq("review_id", reviewId);

  if (updateSuggestionError) {
    throw new Error(updateSuggestionError.message);
  }

  if (suggestionRow.review_file_id) {
    const { data: fileRow, error: fileError } = await auth.supabase
      .from("review_files")
      .select("*")
      .eq("id", suggestionRow.review_file_id)
      .maybeSingle();

    if (fileError || !fileRow) {
      throw new Error(fileError?.message ?? "Review file not found.");
    }

    const { data: suggestionRowsForFile, error: fileSuggestionsError } =
      await auth.supabase
        .from("review_suggestions")
        .select("*")
        .eq("review_id", reviewId)
        .eq("review_file_id", suggestionRow.review_file_id);

    if (fileSuggestionsError) {
      throw new Error(fileSuggestionsError.message);
    }

    const mappedSuggestions = (suggestionRowsForFile ?? []).map(
      mapSuggestionRowToSnapshotSuggestion,
    );
    const derivedState = deriveNextFileStatus(fileRow, mappedSuggestions);

    const { error: updateFileError } = await auth.supabase
      .from("review_files")
      .update({
        status: derivedState.status,
        severity: buildFileSeverity(mappedSuggestions),
        current_text: derivedState.currentText,
        diff_stats_json: derivedState.diffStats,
        suggestion_ids_json: derivedState.suggestionIdsJson,
        updated_at: timestamp,
      })
      .eq("id", fileRow.id);

    if (updateFileError) {
      throw new Error(updateFileError.message);
    }
  }

  const { error: reviewUpdateError } = await auth.supabase
    .from("reviews")
    .update({
      updated_at: timestamp,
    })
    .eq("id", reviewId);

  if (reviewUpdateError) {
    throw new Error(reviewUpdateError.message);
  }

  await appendReviewEvent(auth.supabase, {
    reviewId,
    kind: getSuggestionEventKind(action),
    detail: `${nextSuggestion.title} in ${nextSuggestion.filePath}.`,
    filePath: nextSuggestion.filePath,
    suggestionId: nextSuggestion.id,
    createdAt: timestamp,
  });

  await recordTelemetry(auth.viewer.workspaceId, "diff_action_performed", {
    reviewId,
    suggestionId,
    action,
  });

  return getReviewById(reviewId);
}
