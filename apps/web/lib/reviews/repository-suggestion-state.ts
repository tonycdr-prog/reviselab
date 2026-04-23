import {
  nowIso,
  slugId,
  type DiffStatus,
  type ReviewDiffStats,
  type ReviewFile,
  type ReviewSeverity,
  type ReviewSuggestion,
  type SuggestionAction,
} from "@reviselab/core";

const FILE_STATUS_ORDER: Record<DiffStatus, number> = {
  suggested: 6,
  edited: 5,
  accepted: 4,
  rejected: 3,
  resolved: 2,
  unchanged: 1,
};

const FILE_SEVERITY_ORDER: Record<ReviewSeverity, number> = {
  blocker: 3,
  warning: 2,
  info: 1,
};

export function deriveFileStateFromSuggestions(
  file: ReviewFile,
  suggestions: ReviewSuggestion[],
): Pick<ReviewFile, "status" | "currentText" | "suggestionIds" | "diffStats"> {
  const sortedSuggestions = [...suggestions].sort(
    (left, right) =>
      FILE_STATUS_ORDER[right.status] - FILE_STATUS_ORDER[left.status],
  );
  const nextSuggestion = sortedSuggestions[0];
  const nextStatus = nextSuggestion?.status ?? "unchanged";
  const nextText =
    nextSuggestion?.status === "edited"
      ? (nextSuggestion.editedText ?? nextSuggestion.suggestedText)
      : nextSuggestion?.status === "accepted"
        ? (nextSuggestion.editedText ?? nextSuggestion.suggestedText)
        : nextSuggestion?.status === "suggested"
          ? nextSuggestion.suggestedText
          : file.baseText;

  return {
    status: nextStatus,
    currentText: nextText,
    suggestionIds: suggestions.map((suggestion) => suggestion.id),
    diffStats: suggestions.reduce<ReviewDiffStats>(
      (totals, suggestion) => ({
        additions: totals.additions + suggestion.diffStats.additions,
        deletions: totals.deletions + suggestion.diffStats.deletions,
        changedLines: totals.changedLines + suggestion.diffStats.changedLines,
      }),
      {
        additions: 0,
        deletions: 0,
        changedLines: 0,
      },
    ),
  };
}

export function applySuggestionStatus(
  suggestion: ReviewSuggestion,
  action: SuggestionAction,
  editedText?: string,
): ReviewSuggestion {
  const updatedAt = nowIso();

  switch (action) {
    case "apply": {
      const acceptedText =
        editedText ?? suggestion.editedText ?? suggestion.suggestedText;
      const acceptedSuggestion: ReviewSuggestion = {
        ...suggestion,
        status: "accepted",
      };

      if (acceptedText !== suggestion.suggestedText) {
        acceptedSuggestion.editedText = acceptedText;
      } else {
        delete acceptedSuggestion.editedText;
      }

      return acceptedSuggestion;
    }
    case "reject":
      return {
        ...suggestion,
        status: "rejected",
      };
    case "resolve":
      return {
        ...suggestion,
        status: "resolved",
      };
    case "restore": {
      const restoredSuggestion: ReviewSuggestion = {
        ...suggestion,
        status: "suggested",
        ...(suggestion.explainability
          ? {
              explainability: {
                ...suggestion.explainability,
                generatedAt: updatedAt,
              },
            }
          : {}),
      };
      delete restoredSuggestion.editedText;
      return restoredSuggestion;
    }
    case "edit":
      return {
        ...suggestion,
        status: "edited",
        editedText:
          editedText ?? suggestion.editedText ?? suggestion.suggestedText,
      };
    default:
      return suggestion;
  }
}

export function buildFileSeverity(suggestions: ReviewSuggestion[]) {
  return (
    [...suggestions]
      .map((suggestion) => suggestion.severity)
      .sort(
        (left, right) => FILE_SEVERITY_ORDER[right] - FILE_SEVERITY_ORDER[left],
      )[0] ?? "info"
  );
}

export function buildTelemetryEventId(prefix: string) {
  return slugId(prefix);
}

export function describeFileAction(action: SuggestionAction) {
  switch (action) {
    case "apply":
      return "Applied suggested revision";
    case "reject":
      return "Rejected suggested revision";
    case "resolve":
      return "Marked suggestion as resolved";
    case "restore":
      return "Restored the original AI suggestion";
    case "edit":
      return "Edited suggested revision";
    default:
      return "Updated suggestion";
  }
}

export function getSuggestedFileLabel(file: ReviewFile) {
  if (file.path === "metadata.yml") {
    return "Metadata";
  }

  if (file.path === "submission_notes.md") {
    return "Submission notes";
  }

  if (file.path === "title.md") {
    return "Title";
  }

  return "Abstract";
}
