"use client";

import {
  brandConfig,
  getPaperTypeLabel,
  type ReviewSnapshot,
} from "@reviselab/core";

import { Tag, Tile } from "../carbon";
import { formatUiDateTime } from "../format";
import { ReviewStatusTag } from "./review-status-tag";

type ReviewSectionProps = {
  review: ReviewSnapshot;
};

export function ReviewHeader({ review }: ReviewSectionProps) {
  return (
    <Tile className="rl-section rl-review-header">
      <div className="rl-review-header-copy">
        <h1>{review.context.title}</h1>
        <p className="rl-muted">{review.overview}</p>
      </div>

      <div className="rl-toolbar rl-review-header-meta">
        <Tag type="blue">{review.context.intendedCategory}</Tag>
        <Tag type="cool-gray">
          {getPaperTypeLabel(review.context.paperType)}
        </Tag>
        <span className="rl-muted">
          Generated {formatUiDateTime(review.generatedAt)}
        </span>
      </div>
    </Tile>
  );
}

export function OverviewPanel({ review }: ReviewSectionProps) {
  return (
    <Tile className="rl-section">
      <h3>Submission summary</h3>
      <p>{review.context.abstract}</p>
      <ul className="rl-summary-list">
        <li>Intended category: {review.context.intendedCategory}</li>
        <li>Paper type: {getPaperTypeLabel(review.context.paperType)}</li>
        <li>
          First-time submitter:{" "}
          {review.context.firstTimeSubmitter ? "Yes" : "No"}
        </li>
      </ul>
    </Tile>
  );
}

export function ReviewSidebar({ review }: ReviewSectionProps) {
  return (
    <aside className="rl-sidebar" aria-label="Review summary">
      <Tile className="rl-section">
        <h3>Submission readiness</h3>
        <div className="rl-status-chip-row">
          <ReviewStatusTag readiness={review.readiness} />
        </div>
        <p className="rl-muted">
          {brandConfig.name} only scores moderation-fit and
          submission-readiness, not scientific correctness or novelty.
        </p>
      </Tile>

      <Tile className="rl-section">
        <h3>Recommended updates</h3>
        {review.files.length === 0 ? (
          <p className="rl-muted">
            No recommended updates were generated for this pass.
          </p>
        ) : (
          <ul className="rl-summary-list">
            {review.files.map((file) => (
              <li key={file.id}>
                {file.path}: {file.changeCount} change
                {file.changeCount === 1 ? "" : "s"}
              </li>
            ))}
          </ul>
        )}
      </Tile>
    </aside>
  );
}
