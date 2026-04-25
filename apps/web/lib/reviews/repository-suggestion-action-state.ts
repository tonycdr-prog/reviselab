import type {
  Database,
  DiffStatus,
  ReviewFile,
  ReviewSuggestion,
} from "@reviselab/core";

import { deriveFileStateFromSuggestions } from "./repository-helpers";

export type ReviewFileRow = Database["public"]["Tables"]["review_files"]["Row"];
export type ReviewSuggestionRow =
  Database["public"]["Tables"]["review_suggestions"]["Row"];

export function getCurrentTextForSuggestion(suggestion: ReviewSuggestion) {
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

export function mapSuggestionRowToSnapshotSuggestion(
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

export function deriveNextFileStatus(
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
