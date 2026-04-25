import "server-only";

import { nowIso, type SuggestionAction } from "@reviselab/core";

import { applySuggestionStatus, buildFileSeverity } from "./repository-helpers";
import { appendReviewEvent, getSuggestionEventKind } from "./repository-events";
import { getReviewById } from "./repository-review-read";
import {
  recordTelemetry,
  requireAuthenticatedContext,
} from "./repository-runtime";
import {
  deriveNextFileStatus,
  mapSuggestionRowToSnapshotSuggestion,
} from "./repository-suggestion-action-state";

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
