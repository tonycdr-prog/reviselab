import type {
  ReviewCheck,
  ReviewComment,
  ReviewEvent,
  ReviewFile,
  ReviewSuggestion,
  SuggestionAction,
} from "@reviselab/core";

export type ReviewContextSelection =
  | {
      type: "check";
      item: ReviewCheck;
    }
  | {
      type: "comment";
      item: ReviewComment;
    }
  | null;

export type ReviewFileRailProps = {
  files: ReviewFile[];
  selectedFilePath: ReviewFile["path"];
  unresolvedCountByPath: Partial<Record<ReviewFile["path"], number>>;
  onSelectFile: (path: ReviewFile["path"]) => void;
};

export type DiffRendererAdapterProps = {
  suggestion: ReviewSuggestion;
  viewType: "split" | "unified";
  isHighlighted: boolean;
  onSelect: (anchorId: string) => void;
};

export type DiffSurfaceAdapterProps = {
  file: ReviewFile;
  suggestions: ReviewSuggestion[];
  selectedAnchorId?: string | null;
  viewType: "split" | "unified";
  onSelectSuggestion: (anchorId: string) => void;
};

export type ReviewContextPanelProps = {
  file: ReviewFile;
  activeSuggestion: ReviewSuggestion | null;
  selectedContext: ReviewContextSelection;
  events: ReviewEvent[];
  isPending: boolean;
  actionError?: string | null;
  onDraftChange?: (editedText: string) => void;
  onApply: (suggestion: ReviewSuggestion, editedText: string) => void;
  onReject: (suggestion: ReviewSuggestion) => void;
  onResolve: (suggestion: ReviewSuggestion) => void;
  onRestore: (suggestion: ReviewSuggestion) => void;
};

export type ReviewDiffSurfaceProps = {
  review: {
    files: ReviewFile[];
    suggestions: ReviewSuggestion[];
    history: ReviewEvent[];
  };
  selectedFilePath: ReviewFile["path"];
  selectedAnchorId?: string | null;
  selectedContext: ReviewContextSelection;
  isPending?: boolean;
  actionError?: string | null;
  onSelectFile: (path: ReviewFile["path"]) => void;
  onSelectSuggestion: (anchorId: string) => void;
  onSuggestionAction: (
    suggestionId: string,
    action: SuggestionAction,
    editedText?: string,
  ) => void;
};

export function getSeverityTagType(
  severity: ReviewSuggestion["severity"] | ReviewFile["severity"],
) {
  return severity === "blocker"
    ? "red"
    : severity === "warning"
      ? "warm-gray"
      : "cool-gray";
}

export function getStatusTagType(status: ReviewSuggestion["status"]) {
  if (status === "suggested" || status === "edited") {
    return "blue";
  }

  if (status === "accepted") {
    return "green";
  }

  if (status === "rejected") {
    return "magenta";
  }

  if (status === "resolved") {
    return "cool-gray";
  }

  return "outline";
}

export function getSuggestionSaveAction(
  suggestion: ReviewSuggestion,
  editedText: string,
): SuggestionAction {
  if (
    typeof suggestion.editedText === "string" &&
    editedText === suggestion.suggestedText
  ) {
    return "restore";
  }

  if (editedText === (suggestion.editedText ?? suggestion.suggestedText)) {
    return "apply";
  }

  return "edit";
}
