import { Column, Grid, Tile } from "@reviselab/ui/carbon";

import { UploadReviewForm } from "@/components/upload-review-form";

export default function NewReviewPage() {
  return (
    <Grid fullWidth className="rl-page-grid">
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
    </Grid>
  );
}
