"use client";

import type { PaperType } from "@reviselab/core";

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

const PAPER_TYPES: Array<{ label: string; value: PaperType }> = [
  { label: "Research article", value: "research" },
  { label: "Review article", value: "review" },
  { label: "Survey", value: "survey" },
  { label: "Position paper", value: "position" },
  { label: "Technical report", value: "technical-report" },
];

export type UploadReviewFormViewProps = {
  title: string;
  abstract: string;
  intendedCategory: string;
  paperType: PaperType;
  firstTimeSubmitter: boolean;
  selectedFileName?: string;
  isSubmitting: boolean;
  error?: string | null;
  isFormReady: boolean;
  onTitleChange: (value: string) => void;
  onAbstractChange: (value: string) => void;
  onIntendedCategoryChange: (value: string) => void;
  onPaperTypeChange: (value: PaperType) => void;
  onFirstTimeSubmitterChange: (value: boolean) => void;
  onFileChange: (file: File | null) => void;
  onSubmit: () => void;
};

export function UploadReviewFormView({
  title,
  abstract,
  intendedCategory,
  paperType,
  firstTimeSubmitter,
  selectedFileName,
  isSubmitting,
  error,
  isFormReady,
  onTitleChange,
  onAbstractChange,
  onIntendedCategoryChange,
  onPaperTypeChange,
  onFirstTimeSubmitterChange,
  onFileChange,
  onSubmit,
}: UploadReviewFormViewProps) {
  return (
    <Tile className="rl-section">
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
        rows={8}
        value={abstract}
        onChange={(event) => onAbstractChange(event.currentTarget.value)}
      />
      <TextInput
        id="category"
        labelText="Intended category"
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
        {PAPER_TYPES.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            text={option.label}
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
        onChange={(_, data) =>
          onFileChange(data?.currentFiles[0]?.file ?? null)
        }
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
