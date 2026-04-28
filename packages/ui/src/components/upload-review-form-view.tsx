"use client";

import { Button, InlineNotification, Tile } from "../carbon";
import { UploadReviewFormSections } from "./upload-review-form-sections";
import type { UploadReviewFormViewProps } from "./upload-review-form-types";

function getStatusMessage(status: UploadReviewFormViewProps["status"]) {
  switch (status) {
    case "uploading":
      return {
        title: "Uploading manuscript",
        description: "Uploading the source file and submission context.",
      };
    case "creating-review":
      return {
        title: "Creating review",
        description: "The paper is uploaded. Creating the review workspace.",
      };
    case "redirecting":
      return {
        title: "Opening workspace",
        description: "The review is queued. Opening the live workspace.",
      };
    default:
      return null;
  }
}

export function UploadReviewFormView({
  title,
  abstract,
  intendedCategory,
  paperType,
  firstTimeSubmitter,
  priorArxivAuthorship,
  hasInstitutionalEmail,
  hasPersonalEndorser,
  peerReviewedVenue,
  journalRef,
  doi,
  aiAssistanceUsed,
  aiDisclosureText,
  comments,
  selectedFileName,
  selectedFileSize,
  status = "idle",
  isSubmitting,
  error,
  isFormReady,
  validationMessages = {},
  onTitleChange,
  onAbstractChange,
  onIntendedCategoryChange,
  onPaperTypeChange,
  onFirstTimeSubmitterChange,
  onPriorArxivAuthorshipChange,
  onHasInstitutionalEmailChange,
  onHasPersonalEndorserChange,
  onPeerReviewedVenueChange,
  onJournalRefChange,
  onDoiChange,
  onAiAssistanceUsedChange,
  onAiDisclosureTextChange,
  onCommentsChange,
  onFileChange,
  onRemoveFile,
  onSubmit,
}: UploadReviewFormViewProps) {
  const statusMessage = getStatusMessage(status);

  return (
    <Tile className="rl-section rl-upload-form-card">
      <div>
        <h2>Start a review</h2>
        <p className="rl-muted">
          Upload a manuscript, confirm the submission context, and generate a
          review workspace.
        </p>
      </div>

      {error ? (
        <InlineNotification
          kind="error"
          lowContrast
          subtitle={error}
          title="Review creation failed"
        />
      ) : null}

      {statusMessage ? (
        <InlineNotification
          kind="info"
          lowContrast
          hideCloseButton
          title={statusMessage.title}
          subtitle={statusMessage.description}
        />
      ) : null}

      <UploadReviewFormSections
        title={title}
        abstract={abstract}
        intendedCategory={intendedCategory}
        paperType={paperType}
        firstTimeSubmitter={firstTimeSubmitter}
        priorArxivAuthorship={priorArxivAuthorship}
        hasInstitutionalEmail={hasInstitutionalEmail}
        hasPersonalEndorser={hasPersonalEndorser}
        peerReviewedVenue={peerReviewedVenue}
        journalRef={journalRef}
        doi={doi}
        aiAssistanceUsed={aiAssistanceUsed}
        aiDisclosureText={aiDisclosureText}
        comments={comments}
        isSubmitting={isSubmitting}
        validationMessages={validationMessages}
        onTitleChange={onTitleChange}
        onAbstractChange={onAbstractChange}
        onIntendedCategoryChange={onIntendedCategoryChange}
        onPaperTypeChange={onPaperTypeChange}
        onFirstTimeSubmitterChange={onFirstTimeSubmitterChange}
        onPriorArxivAuthorshipChange={onPriorArxivAuthorshipChange}
        onHasInstitutionalEmailChange={onHasInstitutionalEmailChange}
        onHasPersonalEndorserChange={onHasPersonalEndorserChange}
        onPeerReviewedVenueChange={onPeerReviewedVenueChange}
        onJournalRefChange={onJournalRefChange}
        onDoiChange={onDoiChange}
        onAiAssistanceUsedChange={onAiAssistanceUsedChange}
        onAiDisclosureTextChange={onAiDisclosureTextChange}
        onCommentsChange={onCommentsChange}
        onFileChange={onFileChange}
        {...(onRemoveFile ? { onRemoveFile } : {})}
        {...(selectedFileName ? { selectedFileName } : {})}
        {...(typeof selectedFileSize === "number" ? { selectedFileSize } : {})}
      />

      <div className="rl-upload-actions">
        <Button onClick={onSubmit} disabled={isSubmitting || !isFormReady}>
          {isSubmitting ? "Generating review…" : "Generate review"}
        </Button>
        <span className="rl-muted" aria-live="polite">
          {statusMessage?.description ??
            (isFormReady
              ? "Ready to generate a review workspace."
              : "Add a title, abstract, and source file to continue.")}
        </span>
      </div>
    </Tile>
  );
}
