"use client";

import { UploadReviewFormView } from "@reviselab/ui";
import { Column, Grid, Tile } from "@reviselab/ui/carbon";

export default function PreviewUploadFormPage() {
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
        <UploadReviewFormView
          title="A sample title for preview mode"
          abstract="We evaluate a policy-aware manuscript review workflow and compare category-fit guidance against static submission checklists."
          intendedCategory="cs.AI"
          paperType="research"
          firstTimeSubmitter
          selectedFileName="manuscript.zip"
          isSubmitting={false}
          error={null}
          isFormReady
          onTitleChange={() => undefined}
          onAbstractChange={() => undefined}
          onIntendedCategoryChange={() => undefined}
          onPaperTypeChange={() => undefined}
          onFirstTimeSubmitterChange={() => undefined}
          onFileChange={() => undefined}
          onSubmit={() => undefined}
        />
      </Column>
    </Grid>
  );
}
