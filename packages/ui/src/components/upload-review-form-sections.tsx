"use client";

import {
  PAPER_TYPES,
  getPaperTypeLabel,
  type PaperType,
} from "@reviselab/core";

import {
  Button,
  Checkbox,
  FileUploader,
  Select,
  SelectItem,
  TextArea,
  TextInput,
} from "../carbon";
import type { UploadReviewFormViewProps } from "./upload-review-form-types";

function formatFileSize(bytes?: number) {
  if (!bytes) {
    return null;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.max(Math.round(bytes / 1024), 1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadReviewFormSections({
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
  isSubmitting,
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
}: Omit<
  UploadReviewFormViewProps,
  "error" | "isFormReady" | "onSubmit" | "status"
>) {
  const selectedFileSizeLabel = formatFileSize(selectedFileSize);

  return (
    <>
      <section
        className="rl-upload-form-section"
        aria-labelledby="manuscript-basics-heading"
      >
        <div>
          <h3 id="manuscript-basics-heading">Manuscript basics</h3>
          <p className="rl-muted">
            These fields anchor the deterministic checks and the four virtual
            review files.
          </p>
        </div>
        <TextInput
          id="title"
          labelText="Title"
          invalid={Boolean(validationMessages.title)}
          invalidText={validationMessages.title}
          placeholder="A concise, category-appropriate title"
          value={title}
          disabled={isSubmitting}
          onChange={(event) => onTitleChange(event.currentTarget.value)}
        />
        <TextArea
          id="abstract"
          labelText="Abstract"
          invalid={Boolean(validationMessages.abstract)}
          invalidText={validationMessages.abstract}
          placeholder="Paste the abstract you plan to submit for review."
          rows={6}
          value={abstract}
          disabled={isSubmitting}
          onChange={(event) => onAbstractChange(event.currentTarget.value)}
        />
      </section>

      <section
        className="rl-upload-form-section"
        aria-labelledby="arxiv-context-heading"
      >
        <div>
          <h3 id="arxiv-context-heading">arXiv context</h3>
          <p className="rl-muted">
            ReviseLab v1 focuses on CS/AI preprint submission readiness.
          </p>
        </div>
        <TextInput
          id="category"
          labelText="Intended category"
          helperText="Start with a CS/AI category such as cs.AI, cs.LG, cs.CL, cs.CV, cs.RO, cs.MA, or cs.CY."
          value={intendedCategory}
          disabled={isSubmitting}
          onChange={(event) =>
            onIntendedCategoryChange(event.currentTarget.value)
          }
        />
        <Select
          id="paperType"
          labelText="Paper type"
          value={paperType}
          disabled={isSubmitting}
          onChange={(event) =>
            onPaperTypeChange(event.currentTarget.value as PaperType)
          }
        >
          {PAPER_TYPES.map((value) => (
            <SelectItem
              key={value}
              value={value}
              text={getPaperTypeLabel(value)}
            />
          ))}
        </Select>
      </section>

      <section
        className="rl-upload-form-section"
        aria-labelledby="policy-context-heading"
      >
        <div>
          <h3 id="policy-context-heading">Endorsement and policy context</h3>
          <p className="rl-muted">
            These answers help separate blockers from guidance.
          </p>
        </div>
        <Checkbox
          id="firstTimeSubmitter"
          labelText="I’m a first-time submitter in this category"
          checked={firstTimeSubmitter}
          disabled={isSubmitting}
          onChange={(_, { checked }) =>
            onFirstTimeSubmitterChange(Boolean(checked))
          }
        />
        <Checkbox
          id="hasInstitutionalEmail"
          labelText="My arXiv account uses an institutional email"
          checked={hasInstitutionalEmail}
          disabled={isSubmitting}
          onChange={(_, { checked }) =>
            onHasInstitutionalEmailChange(Boolean(checked))
          }
        />
        <Checkbox
          id="priorArxivAuthorship"
          labelText="I have prior arXiv authorship in this endorsement domain"
          checked={priorArxivAuthorship}
          disabled={isSubmitting}
          onChange={(_, { checked }) =>
            onPriorArxivAuthorshipChange(Boolean(checked))
          }
        />
        <Checkbox
          id="hasPersonalEndorser"
          labelText="I have a personal endorser plan if automatic endorsement does not apply"
          checked={hasPersonalEndorser}
          disabled={isSubmitting}
          onChange={(_, { checked }) =>
            onHasPersonalEndorserChange(Boolean(checked))
          }
        />
        <TextInput
          id="peerReviewedVenue"
          labelText="Peer-reviewed venue"
          helperText="Required for CS review, survey, or position papers."
          placeholder="Journal or conference name"
          value={peerReviewedVenue}
          disabled={isSubmitting}
          onChange={(event) =>
            onPeerReviewedVenueChange(event.currentTarget.value)
          }
        />
        <TextInput
          id="journalRef"
          labelText="Journal reference"
          placeholder="Proceedings or journal citation"
          value={journalRef}
          disabled={isSubmitting}
          onChange={(event) => onJournalRefChange(event.currentTarget.value)}
        />
        <TextInput
          id="doi"
          labelText="DOI"
          placeholder="10.xxxx/example"
          value={doi}
          disabled={isSubmitting}
          onChange={(event) => onDoiChange(event.currentTarget.value)}
        />
      </section>

      <section
        className="rl-upload-form-section"
        aria-labelledby="ai-context-heading"
      >
        <div>
          <h3 id="ai-context-heading">AI disclosure and submission notes</h3>
          <p className="rl-muted">
            This does not judge scientific correctness; it checks submission
            readiness risk.
          </p>
        </div>
        <Checkbox
          id="aiAssistanceUsed"
          labelText="Significant generative AI language-tool assistance was used"
          checked={aiAssistanceUsed}
          disabled={isSubmitting}
          onChange={(_, { checked }) =>
            onAiAssistanceUsedChange(Boolean(checked))
          }
        />
        <TextArea
          id="aiDisclosureText"
          labelText="AI disclosure text"
          helperText="Use this for significant text-to-text generative AI assistance. Do not list AI tools as authors."
          rows={3}
          value={aiDisclosureText}
          disabled={isSubmitting}
          onChange={(event) =>
            onAiDisclosureTextChange(event.currentTarget.value)
          }
        />
        <TextArea
          id="comments"
          labelText="Submission comments"
          helperText="For arXiv metadata, include page/figure counts and publication context where relevant."
          rows={3}
          value={comments}
          disabled={isSubmitting}
          onChange={(event) => onCommentsChange(event.currentTarget.value)}
        />
      </section>

      <section
        className="rl-upload-form-section"
        aria-labelledby="source-upload-heading"
      >
        <div>
          <h3 id="source-upload-heading">Manuscript source</h3>
          <p className="rl-muted">
            Upload a PDF or LaTeX ZIP. Title and abstract are required for the
            first review pass.
          </p>
        </div>
        <FileUploader
          key={selectedFileName ?? "empty-source-file"}
          accept={[".pdf", ".zip"]}
          buttonKind="tertiary"
          buttonLabel={
            selectedFileName ? "Choose different file" : "Upload manuscript"
          }
          filenameStatus="edit"
          labelTitle="Source file"
          labelDescription="Drag a PDF or LaTeX ZIP here, or choose a file."
          multiple={false}
          size="md"
          disabled={isSubmitting}
          onChange={(event, data) => {
            const fileInput = event.currentTarget as HTMLInputElement;
            onFileChange(
              fileInput.files?.[0] ?? data?.currentFiles[0]?.file ?? null,
            );
          }}
        />
        {validationMessages.file ? (
          <p className="rl-inline-error">{validationMessages.file}</p>
        ) : null}
        {selectedFileName ? (
          <div className="rl-selected-file" role="status">
            <div>
              <strong>{selectedFileName}</strong>
              <p className="rl-muted">
                {selectedFileSizeLabel
                  ? `${selectedFileSizeLabel} selected.`
                  : "Manuscript selected."}
              </p>
            </div>
            {onRemoveFile ? (
              <Button
                kind="ghost"
                size="sm"
                type="button"
                disabled={isSubmitting}
                onClick={onRemoveFile}
              >
                Remove file
              </Button>
            ) : null}
          </div>
        ) : null}
      </section>
    </>
  );
}
