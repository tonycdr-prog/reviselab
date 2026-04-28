"use client";

import type { ReviewSnapshot } from "@reviselab/core";

import {
  Button,
  Column,
  DataTableSkeleton,
  Grid,
  InlineLoading,
  InlineNotification,
  Tile,
} from "../carbon";
import { ReviewStageTag } from "./review-stage-tag";

const PROGRESS_STEPS = [
  { stage: "parse-queued", label: "Parse queued" },
  { stage: "parsing", label: "Parsing manuscript" },
  { stage: "review-queued", label: "Review queued" },
  { stage: "reviewing", label: "Running checks" },
  { stage: "ready", label: "Ready" },
] as const;

type ReviewWorkspaceProgressProps = {
  review: ReviewSnapshot;
  isRetryingReview: boolean;
  actionError?: string | null;
  onRetryReview: () => void;
};

export function ReviewWorkspaceProgress({
  review,
  isRetryingReview,
  actionError = null,
  onRetryReview,
}: ReviewWorkspaceProgressProps) {
  const isFailure =
    review.progress.stage === "failed-parse" ||
    review.progress.stage === "failed-review";
  const retryLabel =
    review.progress.stage === "failed-parse" ? "Retry parsing" : "Retry review";
  const progressSteps = isFailure
    ? [
        ...PROGRESS_STEPS,
        {
          stage: review.progress.stage,
          label:
            review.progress.stage === "failed-parse"
              ? "Parsing failed"
              : "Review failed",
        },
      ]
    : PROGRESS_STEPS;

  return (
    <Grid fullWidth className="rl-page-grid">
      <Column sm={4} md={8} lg={16}>
        <Tile className="rl-section" data-review-workspace="canonical">
          <div className="rl-section-header">
            <div>
              <h3>{review.progress.label}</h3>
              <p className="rl-muted">{review.progress.description}</p>
            </div>
            <ReviewStageTag progress={review.progress} />
          </div>
          {isRetryingReview ? (
            <InlineLoading description="Retrying this review" status="active" />
          ) : isFailure ? (
            <InlineNotification
              lowContrast
              kind="error"
              title={review.progress.label}
              subtitle={actionError ?? review.progress.error ?? review.overview}
            />
          ) : (
            <InlineLoading
              description={review.progress.description}
              status="active"
            />
          )}
          <ol className="rl-progress-steps" aria-label="Review progress">
            {progressSteps.map((step) => {
              const isCurrent = step.stage === review.progress.stage;
              const isReady = review.progress.stage === "ready";

              return (
                <li
                  key={step.stage}
                  className={
                    isCurrent || isReady
                      ? "rl-progress-step rl-progress-step-current"
                      : "rl-progress-step"
                  }
                >
                  <span>{step.label}</span>
                  {isCurrent ? <strong>Current</strong> : null}
                </li>
              );
            })}
          </ol>
          <DataTableSkeleton
            columnCount={4}
            rowCount={4}
            showHeader={false}
            headers={[
              { key: "event", header: "Event" },
              { key: "detail", header: "Detail" },
              { key: "file", header: "File" },
              { key: "created", header: "Created" },
            ]}
          />
          {review.progress.canRetry ? (
            <div className="rl-toolbar">
              <Button
                type="button"
                kind="secondary"
                disabled={isRetryingReview}
                onClick={onRetryReview}
              >
                {retryLabel}
              </Button>
            </div>
          ) : null}
        </Tile>
      </Column>
    </Grid>
  );
}
