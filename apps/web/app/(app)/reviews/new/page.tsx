import { Column, Grid, Tile } from "@reviselab/ui/carbon";

import { UploadReviewForm } from "@/components/upload-review-form";

export default function NewReviewPage() {
  return (
    <Grid fullWidth className="rl-page-grid rl-new-review-layout">
      <Column sm={4} md={8} lg={16}>
        <Tile className="rl-section">
          <h1>New review</h1>
          <p className="rl-muted">
            Upload a manuscript, confirm the submission context, and send it
            into the live review pipeline.
          </p>
        </Tile>
      </Column>
      <Column sm={4} md={8} lg={10}>
        <UploadReviewForm />
      </Column>
      <Column sm={4} md={8} lg={6}>
        <Tile className="rl-section rl-new-review-support">
          <div>
            <h2>What this review needs</h2>
            <p className="rl-muted">
              Start with a real source file and the submission context the
              deterministic checks need.
            </p>
          </div>
          <ul className="rl-new-review-support-list">
            <li>PDF or LaTeX ZIP with title and abstract present.</li>
            <li>
              Primary arXiv category, paper type, and endorsement context.
            </li>
            <li>
              Venue, journal reference, or DOI for CS review/survey papers.
            </li>
            <li>
              AI disclosure text when language-tool assistance was material.
            </li>
          </ul>
        </Tile>
      </Column>
    </Grid>
  );
}
