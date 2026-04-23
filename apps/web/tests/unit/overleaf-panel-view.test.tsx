import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { buildReviewProgress } from "@reviselab/core";
import { OverleafPanelView } from "@reviselab/ui";

describe("OverleafPanelView", () => {
  test("shows the latest review action even before a new review is created", () => {
    const onOpenLatestReview = vi.fn();

    render(
      <OverleafPanelView
        brandName="ReviseLab"
        categoryLabel="preprint review workspace"
        extensionDisplayName="ReviseLab for Overleaf"
        apiBaseUrl="http://localhost:3000"
        title="Draft title"
        abstract=""
        intendedCategory="cs.AI"
        paperType="research"
        firstTimeSubmitter={false}
        review={null}
        latestReviewHref="http://localhost:3000/papers/paper_1/reviews/review_1"
        isLoading={false}
        error={null}
        onTitleChange={() => undefined}
        onAbstractChange={() => undefined}
        onIntendedCategoryChange={() => undefined}
        onPaperTypeChange={() => undefined}
        onFirstTimeSubmitterChange={() => undefined}
        onCaptureSelection={() => undefined}
        onRunReview={() => undefined}
        onOpenLatestReview={onOpenLatestReview}
      />,
    );

    const openButton = screen.getByRole("button", {
      name: "Open latest review",
    });
    fireEvent.click(openButton);

    expect(onOpenLatestReview).toHaveBeenCalledTimes(1);
  });

  test("disables review actions while a selection review is being created", () => {
    render(
      <OverleafPanelView
        brandName="ReviseLab"
        categoryLabel="preprint review workspace"
        extensionDisplayName="ReviseLab for Overleaf"
        apiBaseUrl="http://localhost:3000"
        title="Draft title"
        abstract="Selected text"
        intendedCategory="cs.AI"
        paperType="research"
        firstTimeSubmitter={false}
        review={null}
        latestReviewHref={null}
        isLoading
        error={null}
        onTitleChange={() => undefined}
        onAbstractChange={() => undefined}
        onIntendedCategoryChange={() => undefined}
        onPaperTypeChange={() => undefined}
        onFirstTimeSubmitterChange={() => undefined}
        onCaptureSelection={() => undefined}
        onRunReview={() => undefined}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Capture selection" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Send to ReviseLab" }),
    ).toBeDisabled();
  });

  test("prevents sending a review with no captured or pasted text", () => {
    render(
      <OverleafPanelView
        brandName="ReviseLab"
        categoryLabel="preprint review workspace"
        extensionDisplayName="ReviseLab for Overleaf"
        apiBaseUrl="http://localhost:3000"
        title="Draft title"
        abstract="   "
        intendedCategory="cs.AI"
        paperType="research"
        firstTimeSubmitter={false}
        review={null}
        latestReviewHref={null}
        isLoading={false}
        error={null}
        onTitleChange={() => undefined}
        onAbstractChange={() => undefined}
        onIntendedCategoryChange={() => undefined}
        onPaperTypeChange={() => undefined}
        onFirstTimeSubmitterChange={() => undefined}
        onCaptureSelection={() => undefined}
        onRunReview={() => undefined}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Send to ReviseLab" }),
    ).toBeDisabled();
  });

  test("disables review submission while extension settings are loading", () => {
    render(
      <OverleafPanelView
        brandName="ReviseLab"
        categoryLabel="preprint review workspace"
        extensionDisplayName="ReviseLab for Overleaf"
        apiBaseUrl="http://localhost:3000"
        title="Draft title"
        abstract="Selected text"
        intendedCategory="cs.AI"
        paperType="research"
        firstTimeSubmitter={false}
        review={null}
        latestReviewHref={null}
        isBootstrapping
        isLoading={false}
        error={null}
        onTitleChange={() => undefined}
        onAbstractChange={() => undefined}
        onIntendedCategoryChange={() => undefined}
        onPaperTypeChange={() => undefined}
        onFirstTimeSubmitterChange={() => undefined}
        onCaptureSelection={() => undefined}
        onRunReview={() => undefined}
      />,
    );

    expect(screen.getByText("Loading extension settings")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send to ReviseLab" }),
    ).toBeDisabled();
  });

  test("shows unavailable settings state when the panel cannot load extension settings", () => {
    render(
      <OverleafPanelView
        brandName="ReviseLab"
        categoryLabel="preprint review workspace"
        extensionDisplayName="ReviseLab for Overleaf"
        apiBaseUrl="http://localhost:3000"
        isSettingsReady={false}
        title="Draft title"
        abstract="Selected text"
        intendedCategory="cs.AI"
        paperType="research"
        firstTimeSubmitter={false}
        review={null}
        latestReviewHref={null}
        isLoading={false}
        error="Unable to load extension settings."
        onTitleChange={() => undefined}
        onAbstractChange={() => undefined}
        onIntendedCategoryChange={() => undefined}
        onPaperTypeChange={() => undefined}
        onFirstTimeSubmitterChange={() => undefined}
        onCaptureSelection={() => undefined}
        onRunReview={() => undefined}
      />,
    );

    expect(
      screen.getByText("Extension settings are unavailable."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send to ReviseLab" }),
    ).toBeDisabled();
  });

  test("hides stale review details while a new selection review is loading", () => {
    render(
      <OverleafPanelView
        brandName="ReviseLab"
        categoryLabel="preprint review workspace"
        extensionDisplayName="ReviseLab for Overleaf"
        apiBaseUrl="http://localhost:3000"
        title="Draft title"
        abstract="Selected text"
        intendedCategory="cs.AI"
        paperType="research"
        firstTimeSubmitter={false}
        review={{
          id: "review_1",
          paperId: "paper_1",
          versionId: "version_1",
          status: "ready",
          readiness: "Ready with revisions",
          progress: buildReviewProgress({
            parseStatus: "parsed",
            reviewStatus: "ready",
            readiness: "Ready with revisions",
          }),
          generatedAt: "2026-04-23T00:00:00.000Z",
          context: {
            title: "Draft title",
            abstract: "Selected text",
            intendedCategory: "cs.AI",
            paperType: "research",
            firstTimeSubmitter: false,
          },
          overview: "Earlier review overview",
          files: [],
          checks: [],
          suggestions: [],
          comments: [],
          history: [],
        }}
        latestReviewHref="http://localhost:3000/papers/paper_1/reviews/review_1"
        isLoading
        error={null}
        onTitleChange={() => undefined}
        onAbstractChange={() => undefined}
        onIntendedCategoryChange={() => undefined}
        onPaperTypeChange={() => undefined}
        onFirstTimeSubmitterChange={() => undefined}
        onCaptureSelection={() => undefined}
        onRunReview={() => undefined}
        onOpenLatestReview={() => undefined}
      />,
    );

    expect(screen.getByText("Creating selection review")).toBeInTheDocument();
    expect(
      screen.queryByText("Earlier review overview"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Open latest review" }),
    ).not.toBeInTheDocument();
  });
});
