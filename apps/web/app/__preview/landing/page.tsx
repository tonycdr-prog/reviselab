import { brandConfig } from "@reviselab/core";
import { ReviewStatusTag } from "@reviselab/ui";
import { Button, Column, Grid, Tag, Tile } from "@reviselab/ui/carbon";

import { createPreviewReview } from "../fixtures";

export default function PreviewLandingPage() {
  const sampleReview = createPreviewReview();

  return (
    <Grid fullWidth className="rl-page-grid">
      <Column sm={4} md={8} lg={10}>
        <Tile className="rl-section">
          <Tag type="blue">{brandConfig.categoryLabel}</Tag>
          <h1>{brandConfig.tagline}</h1>
          <p className="rl-muted">{brandConfig.shortDescription}</p>
          <div className="rl-hero-actions">
            <Button href="/preview/dashboard">Go to dashboard</Button>
            <Button kind="ghost" href="/preview/review-workspace">
              View sample review
            </Button>
          </div>
        </Tile>
      </Column>
      <Column sm={4} md={8} lg={6} className="rl-hero-cards">
        <Tile className="rl-tile rl-section">
          <div className="rl-section-header">
            <h2>Review snapshot</h2>
            <ReviewStatusTag readiness={sampleReview.readiness} />
          </div>
          <p className="rl-muted">{sampleReview.overview}</p>
          <ul className="rl-summary-list">
            {sampleReview.checks.slice(0, 3).map((check) => (
              <li key={check.id}>
                <strong>{check.name}:</strong> {check.summary}
              </li>
            ))}
          </ul>
        </Tile>
      </Column>
      <Column sm={4} md={8} lg={5}>
        <Tile className="rl-tile rl-section">
          <h3>Checks</h3>
          <p className="rl-muted">
            Category fit, content type, endorsement readiness, tone, and
            abstract completeness.
          </p>
        </Tile>
      </Column>
      <Column sm={4} md={8} lg={5}>
        <Tile className="rl-tile rl-section">
          <h3>Files changed</h3>
          <p className="rl-muted">
            Conservative revisions for the title, abstract, metadata, and
            submission notes.
          </p>
        </Tile>
      </Column>
      <Column sm={4} md={8} lg={6}>
        <Tile className="rl-tile rl-section">
          <h3>Comments</h3>
          <p className="rl-muted">
            Review comments explain what looks risky, what to clarify, and which
            source informed the guidance.
          </p>
        </Tile>
      </Column>
    </Grid>
  );
}
