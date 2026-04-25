import type {
  ReviewFile,
  ReviewSnapshot,
  SuggestionAction,
} from "@reviselab/core";

import type { ReviewWorkspaceTab } from "./review-workspace-tabs";

export type ReviewWorkspaceRecipeProps = {
  review: ReviewSnapshot;
  selectedTab?: ReviewWorkspaceTab;
  selectedFilePath?: ReviewFile["path"];
  selectedAnchorId?: string | null;
  selectedContext?:
    | {
        type: "check";
        id: string;
      }
    | {
        type: "comment";
        id: string;
      }
    | null;
  isMutatingSuggestion?: boolean;
  isRetryingReview?: boolean;
  actionError?: string | null;
  onRetryReview?: () => void;
  onSelectTab?: (tab: ReviewWorkspaceTab) => void;
  onSelectFile?: (path: ReviewFile["path"]) => void;
  onSelectAnchor?: (anchorId: string) => void;
  onSelectCheck?: (check: ReviewSnapshot["checks"][number]) => void;
  onSelectComment?: (comment: ReviewSnapshot["comments"][number]) => void;
  onSuggestionAction?: (
    suggestionId: string,
    action: SuggestionAction,
    editedText?: string,
  ) => void;
};

export type SelectedReviewContext = Exclude<
  ReviewWorkspaceRecipeProps["selectedContext"],
  undefined
>;
