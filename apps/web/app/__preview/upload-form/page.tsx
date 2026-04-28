"use client";

import { UploadReviewFormView } from "@reviselab/ui";
import { Column, Grid, Tile } from "@reviselab/ui/carbon";

export default function PreviewUploadFormPage() {
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
        <UploadReviewFormView
          title="A sample title for preview mode"
          abstract="We evaluate a policy-aware manuscript review workflow and compare category-fit guidance against static submission checklists."
          intendedCategory="cs.AI"
          paperType="research"
          firstTimeSubmitter
          priorArxivAuthorship={false}
          hasInstitutionalEmail
          hasPersonalEndorser={false}
          peerReviewedVenue=""
          journalRef=""
          doi=""
          aiAssistanceUsed={false}
          aiDisclosureText=""
          comments="12 pages, 3 figures."
          selectedFileName="manuscript.zip"
          selectedFileSize={842_112}
          status="idle"
          isSubmitting={false}
          error={null}
          isFormReady
          onTitleChange={() => undefined}
          onAbstractChange={() => undefined}
          onIntendedCategoryChange={() => undefined}
          onPaperTypeChange={() => undefined}
          onFirstTimeSubmitterChange={() => undefined}
          onPriorArxivAuthorshipChange={() => undefined}
          onHasInstitutionalEmailChange={() => undefined}
          onHasPersonalEndorserChange={() => undefined}
          onPeerReviewedVenueChange={() => undefined}
          onJournalRefChange={() => undefined}
          onDoiChange={() => undefined}
          onAiAssistanceUsedChange={() => undefined}
          onAiDisclosureTextChange={() => undefined}
          onCommentsChange={() => undefined}
          onFileChange={() => undefined}
          onRemoveFile={() => undefined}
          onSubmit={() => undefined}
        />
      </Column>
      <Column sm={4} md={8} lg={6}>
        <Tile className="rl-section rl-new-review-support">
          <div>
            <h2>What this review needs</h2>
            <p className="rl-muted">
              Preview mode mirrors the live upload flow without creating
              workspace records.
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
