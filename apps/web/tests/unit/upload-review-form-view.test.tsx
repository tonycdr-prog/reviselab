import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { UploadReviewFormView } from "@reviselab/ui";
import type { UploadReviewFormViewProps } from "@reviselab/ui";

const baseProps: UploadReviewFormViewProps = {
  title: "A sample title",
  abstract: "A sample abstract",
  intendedCategory: "cs.AI",
  paperType: "research",
  firstTimeSubmitter: true,
  priorArxivAuthorship: false,
  hasInstitutionalEmail: true,
  hasPersonalEndorser: false,
  peerReviewedVenue: "",
  journalRef: "",
  doi: "",
  aiAssistanceUsed: false,
  aiDisclosureText: "",
  comments: "",
  selectedFileName: "manuscript.zip",
  selectedFileSize: 842_112,
  status: "idle",
  isSubmitting: false,
  error: null,
  isFormReady: true,
  onTitleChange: vi.fn(),
  onAbstractChange: vi.fn(),
  onIntendedCategoryChange: vi.fn(),
  onPaperTypeChange: vi.fn(),
  onFirstTimeSubmitterChange: vi.fn(),
  onPriorArxivAuthorshipChange: vi.fn(),
  onHasInstitutionalEmailChange: vi.fn(),
  onHasPersonalEndorserChange: vi.fn(),
  onPeerReviewedVenueChange: vi.fn(),
  onJournalRefChange: vi.fn(),
  onDoiChange: vi.fn(),
  onAiAssistanceUsedChange: vi.fn(),
  onAiDisclosureTextChange: vi.fn(),
  onCommentsChange: vi.fn(),
  onFileChange: vi.fn(),
  onRemoveFile: vi.fn(),
  onSubmit: vi.fn(),
};

describe("UploadReviewFormView", () => {
  test("renders sectioned Carbon form groups", () => {
    render(<UploadReviewFormView {...baseProps} />);

    expect(
      screen.getByRole("heading", { name: "Manuscript basics" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "arXiv context" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Endorsement and policy context",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "AI disclosure and submission notes",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Manuscript source" }),
    ).toBeInTheDocument();
  });

  test("shows one selected-file summary with remove recovery", () => {
    const onRemoveFile = vi.fn();
    render(<UploadReviewFormView {...baseProps} onRemoveFile={onRemoveFile} />);

    const selectedFile = screen.getByRole("status");
    expect(
      within(selectedFile).getByText("manuscript.zip"),
    ).toBeInTheDocument();
    expect(
      within(selectedFile).getByText("822 KB selected."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Attached: manuscript.zip")).toBe(null);
    expect(screen.queryByRole("button", { name: "Replace manuscript" })).toBe(
      null,
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove file" }));
    expect(onRemoveFile).toHaveBeenCalledTimes(1);
  });

  test("shows immediate async feedback and disables submit while creating", () => {
    render(
      <UploadReviewFormView
        {...baseProps}
        status="creating-review"
        isSubmitting
      />,
    );

    expect(screen.getByText("Creating review")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Generating review…" }),
    ).toBeDisabled();
    expect(screen.getByLabelText("Title")).toBeDisabled();
  });

  test("does not show invalid required fields before validation messages are provided", () => {
    const propsWithoutFile: UploadReviewFormViewProps = { ...baseProps };
    delete propsWithoutFile.selectedFileName;
    delete propsWithoutFile.selectedFileSize;

    render(
      <UploadReviewFormView
        {...propsWithoutFile}
        title=""
        abstract=""
        isFormReady={false}
      />,
    );

    expect(screen.queryByText("Add the manuscript title.")).toBe(null);
    expect(screen.queryByText("Add the manuscript abstract.")).toBe(null);
    expect(screen.queryByText("Upload a PDF or LaTeX ZIP.")).toBe(null);
  });

  test("shows validation messages near missing required inputs", () => {
    const propsWithoutFile: UploadReviewFormViewProps = { ...baseProps };
    delete propsWithoutFile.selectedFileName;
    delete propsWithoutFile.selectedFileSize;

    render(
      <UploadReviewFormView
        {...propsWithoutFile}
        title=""
        abstract=""
        isFormReady={false}
        validationMessages={{
          title: "Add the manuscript title.",
          abstract: "Add the manuscript abstract.",
          file: "Upload a PDF or LaTeX ZIP.",
        }}
      />,
    );

    expect(screen.getByText("Add the manuscript title.")).toBeInTheDocument();
    expect(
      screen.getByText("Add the manuscript abstract."),
    ).toBeInTheDocument();
    expect(screen.getByText("Upload a PDF or LaTeX ZIP.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Generate review" }),
    ).toBeDisabled();
  });
});
