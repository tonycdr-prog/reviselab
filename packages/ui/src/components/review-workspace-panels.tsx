"use client";

import {
  type ReviewCheck,
  type ReviewComment,
  type ReviewFile,
  type ReviewSnapshot,
  type SuggestionAction,
} from "@reviselab/core";

import {
  Button,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  Tag,
  Tile,
} from "../carbon";
import { formatUiDateTime } from "../format";
import { ReviewDiffSurface } from "./review-diff-surface";
export {
  OverviewPanel,
  ReviewHeader,
  ReviewSidebar,
} from "./review-workspace-layout";

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

export type ReviewWorkspaceTab =
  | "overview"
  | "checks"
  | "files"
  | "comments"
  | "history";

function getCheckStateTagType(
  state: ReviewSnapshot["checks"][number]["state"],
) {
  return state === "fail" ? "red" : state === "warn" ? "warm-gray" : "green";
}

function getCommentSeverityTagType(
  severity: ReviewSnapshot["comments"][number]["severity"],
) {
  return severity === "blocker"
    ? "red"
    : severity === "warning"
      ? "warm-gray"
      : "cool-gray";
}

export function ChecksPanel({
  review,
  onSelectCheck,
}: ReviewSectionProps & Pick<ReviewInteractionProps, "onSelectCheck">) {
  if (review.checks.length === 0) {
    return (
      <Tile className="rl-empty-state">
        <p className="rl-muted">
          No policy checks were generated for this review.
        </p>
      </Tile>
    );
  }

  return (
    <TableContainer
      title="Policy checks"
      description="Each flagged item can jump directly to the linked diff block."
    >
      <div className="rl-table-scroll">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Check</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Summary</TableHeader>
              <TableHeader>Source</TableHeader>
              <TableHeader>Jump</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {review.checks.map((check) => (
              <TableRow key={check.id}>
                <TableCell>{check.name}</TableCell>
                <TableCell>
                  <Tag type={getCheckStateTagType(check.state)}>
                    {check.state}
                  </Tag>
                </TableCell>
                <TableCell>
                  <strong>{check.summary}</strong>
                  <p className="rl-muted">{check.detail}</p>
                </TableCell>
                <TableCell>
                  <Link href={check.sourceUrl} target="_blank">
                    Open policy source
                  </Link>
                </TableCell>
                <TableCell>
                  <Button
                    kind="ghost"
                    size="sm"
                    type="button"
                    onClick={() => onSelectCheck(check)}
                  >
                    Open diff
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TableContainer>
  );
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
              <Link href={comment.sourceUrl} target="_blank">
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

export function HistoryPanel({ review }: ReviewSectionProps) {
  if (review.history.length === 0) {
    return (
      <Tile className="rl-empty-state">
        <p className="rl-muted">No earlier review history is available yet.</p>
      </Tile>
    );
  }

  return (
    <TableContainer title="Review history">
      <div className="rl-table-scroll">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Event</TableHeader>
              <TableHeader>Detail</TableHeader>
              <TableHeader>File</TableHeader>
              <TableHeader>Created</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {review.history.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.label}</TableCell>
                <TableCell>
                  {item.detail ?? (
                    <span className="rl-muted">No detail recorded.</span>
                  )}
                </TableCell>
                <TableCell>{item.filePath ?? "Review-wide"}</TableCell>
                <TableCell>{formatUiDateTime(item.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TableContainer>
  );
}
