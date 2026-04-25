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
  InlineNotification,
  Select,
  SelectItem,
  TextArea,
  TextInput,
  Tile,
} from "../carbon";
import type { UploadReviewFormViewProps } from "./upload-review-form-types";

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
  isSubmitting,
  error,
  isFormReady,
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
  onSubmit,
}: UploadReviewFormViewProps) {
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

      <TextInput
        id="title"
        labelText="Title"
        placeholder="A concise, category-appropriate title"
        value={title}
        onChange={(event) => onTitleChange(event.currentTarget.value)}
      />
      <TextArea
        id="abstract"
        labelText="Abstract"
        placeholder="Paste the abstract you plan to submit for review."
        rows={6}
        value={abstract}
        onChange={(event) => onAbstractChange(event.currentTarget.value)}
      />
      <TextInput
        id="category"
        labelText="Intended category"
        helperText="ReviseLab v1 is arXiv-first. Start with a CS/AI category such as cs.AI, cs.LG, cs.CL, cs.CV, cs.RO, cs.MA, or cs.CY."
        value={intendedCategory}
        onChange={(event) =>
          onIntendedCategoryChange(event.currentTarget.value)
        }
      />
      <Select
        id="paperType"
        labelText="Paper type"
        value={paperType}
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

      <Checkbox
        id="firstTimeSubmitter"
        labelText="I’m a first-time submitter in this category"
        checked={firstTimeSubmitter}
        onChange={(_, { checked }) =>
          onFirstTimeSubmitterChange(Boolean(checked))
        }
      />
      <Checkbox
        id="hasInstitutionalEmail"
        labelText="My arXiv account uses an institutional email"
        checked={hasInstitutionalEmail}
        onChange={(_, { checked }) =>
          onHasInstitutionalEmailChange(Boolean(checked))
        }
      />
      <Checkbox
        id="priorArxivAuthorship"
        labelText="I have prior arXiv authorship in this endorsement domain"
        checked={priorArxivAuthorship}
        onChange={(_, { checked }) =>
          onPriorArxivAuthorshipChange(Boolean(checked))
        }
      />
      <Checkbox
        id="hasPersonalEndorser"
        labelText="I have a personal endorser plan if automatic endorsement does not apply"
        checked={hasPersonalEndorser}
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
        onChange={(event) =>
          onPeerReviewedVenueChange(event.currentTarget.value)
        }
      />
      <TextInput
        id="journalRef"
        labelText="Journal reference"
        placeholder="Proceedings or journal citation"
        value={journalRef}
        onChange={(event) => onJournalRefChange(event.currentTarget.value)}
      />
      <TextInput
        id="doi"
        labelText="DOI"
        placeholder="10.xxxx/example"
        value={doi}
        onChange={(event) => onDoiChange(event.currentTarget.value)}
      />

      <Checkbox
        id="aiAssistanceUsed"
        labelText="Significant generative AI language-tool assistance was used"
        checked={aiAssistanceUsed}
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
        onChange={(event) => onCommentsChange(event.currentTarget.value)}
      />

      <FileUploader
        accept={[".pdf", ".zip"]}
        buttonKind="tertiary"
        buttonLabel={
          selectedFileName ? "Replace manuscript" : "Upload manuscript"
        }
        filenameStatus="edit"
        labelTitle="Manuscript source"
        labelDescription="Upload a PDF or LaTeX ZIP. Title and abstract are required for the first review pass."
        multiple={false}
        size="md"
        onChange={(event, data) => {
          const fileInput = event.currentTarget as HTMLInputElement;
          onFileChange(
            fileInput.files?.[0] ?? data?.currentFiles[0]?.file ?? null,
          );
        }}
      />

      <div className="rl-upload-actions">
        <Button onClick={onSubmit} disabled={isSubmitting || !isFormReady}>
          {isSubmitting ? "Generating review…" : "Generate review"}
        </Button>
        {selectedFileName ? (
          <span className="rl-muted">Attached: {selectedFileName}</span>
        ) : null}
      </div>
    </Tile>
  );
}
