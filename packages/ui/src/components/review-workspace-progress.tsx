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
          ) : review.progress.stage === "failed-parse" ||
            review.progress.stage === "failed-review" ? (
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
                Retry review
              </Button>
            </div>
          ) : null}
        </Tile>
      </Column>
    </Grid>
  );
}
