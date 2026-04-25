"use client";

import {
  type ReviewCheck,
  type ReviewComment,
  type ReviewFile,
  type ReviewSnapshot,
  type SuggestionAction,
} from "@reviselab/core";

import { Button, Link, Tag, Tile } from "../carbon";
import { ReviewDiffSurface } from "./review-diff-surface";
export { ChecksPanel } from "./review-workspace-checks-panel";
export { HistoryPanel } from "./review-workspace-history-panel";
export {
  OverviewPanel,
  ReviewHeader,
  ReviewSidebar,
} from "./review-workspace-layout";
import type { ReviewWorkspaceTab } from "./review-workspace-tabs";

type ReviewSectionProps = {
  review: ReviewSnapshot;
};

type ReviewInteractionProps = {
  selectedFilePath: ReviewFile["path"];
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
  isMutatingSuggestion: boolean;
  actionError?: string | null;
  onSelectTab: (tab: ReviewWorkspaceTab) => void;
  onSelectFile: (path: ReviewFile["path"]) => void;
  onSelectAnchor: (anchorId: string) => void;
  onSelectCheck: (check: ReviewCheck) => void;
  onSelectComment: (comment: ReviewComment) => void;
  onSuggestionAction: (
    suggestionId: string,
    action: SuggestionAction,
    editedText?: string,
  ) => void;
};

function getCommentSeverityTagType(
  severity: ReviewSnapshot["comments"][number]["severity"],
) {
  return severity === "blocker"
    ? "red"
    : severity === "warning"
      ? "warm-gray"
      : "cool-gray";
}

export function FilesChangedPanel({
  review,
  selectedFilePath,
  selectedAnchorId,
  selectedContext,
  isMutatingSuggestion,
  actionError,
  onSelectFile,
  onSelectAnchor,
  onSuggestionAction,
}: ReviewSectionProps &
  Pick<
    ReviewInteractionProps,
    | "selectedFilePath"
    | "selectedAnchorId"
    | "selectedContext"
    | "isMutatingSuggestion"
    | "actionError"
    | "onSelectFile"
    | "onSelectAnchor"
    | "onSuggestionAction"
  >) {
  let contextSelection: Parameters<
    typeof ReviewDiffSurface
  >[0]["selectedContext"] = null;

  if (selectedContext?.type === "check") {
    const selectedCheck = review.checks.find(
      (check) => check.id === selectedContext.id,
    );
    contextSelection = selectedCheck
      ? {
          type: "check",
          item: selectedCheck,
        }
      : null;
  } else if (selectedContext?.type === "comment") {
    const selectedComment = review.comments.find(
      (comment) => comment.id === selectedContext.id,
    );
    contextSelection = selectedComment
      ? {
          type: "comment",
          item: selectedComment,
        }
      : null;
  }

  return (
    <ReviewDiffSurface
      review={review}
      selectedFilePath={selectedFilePath}
      selectedAnchorId={selectedAnchorId ?? null}
      selectedContext={contextSelection}
      isPending={isMutatingSuggestion}
      actionError={actionError ?? null}
      onSelectFile={onSelectFile}
      onSelectSuggestion={onSelectAnchor}
      onSuggestionAction={onSuggestionAction}
    />
  );
}

export function CommentsPanel({
  review,
  onSelectComment,
}: ReviewSectionProps & Pick<ReviewInteractionProps, "onSelectComment">) {
  return (
    <div className="rl-comment-list">
      {review.comments.length === 0 ? (
        <Tile className="rl-empty-state">
          <p className="rl-muted">
            No section comments were needed for this review.
          </p>
        </Tile>
      ) : null}

      {review.comments.map((comment) => (
        <Tile key={comment.id} className="rl-section">
          <div className="rl-section-header">
            <strong>{comment.target}</strong>
            <Tag type={getCommentSeverityTagType(comment.severity)}>
              {comment.severity}
            </Tag>
          </div>
          <p>{comment.body}</p>
          <div className="rl-toolbar">
            {comment.sourceUrl ? (
              <Link href={comment.sourceUrl} target="_blank" rel="noreferrer">
                Open policy source
              </Link>
            ) : null}
            <Button
              kind="ghost"
              size="sm"
              type="button"
              onClick={() => onSelectComment(comment)}
            >
              Open linked diff
            </Button>
          </div>
        </Tile>
      ))}
    </div>
  );
}
