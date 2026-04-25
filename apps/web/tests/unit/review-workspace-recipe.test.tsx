import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { createSampleReview } from "@reviselab/core";
import { ReviewWorkspaceRecipe } from "@reviselab/ui";

describe("ReviewWorkspaceRecipe", () => {
  test("renders the canonical tab order and readiness sidebar", () => {
    const review = createSampleReview();
    render(<ReviewWorkspaceRecipe review={review} />);

    const tabList = screen.getByRole("tablist", {
      name: "Review workspace sections",
    });
    const tabs = within(tabList).getAllByRole("tab");

    expect(tabs.map((tab) => tab.textContent)).toEqual([
      "Overview",
      "Checks",
      "Files changed",
      "Comments",
      "History",
    ]);

    expect(screen.getByText("Submission readiness")).toBeInTheDocument();
    expect(screen.getByText("Recommended updates")).toBeInTheDocument();
    expect(
      screen.getByRole("complementary", { name: "Review summary" }),
    ).toBeInTheDocument();
  });

  test("switches tabs when rendered without route-managed state", () => {
    const review = createSampleReview();
    render(<ReviewWorkspaceRecipe review={review} />);

    fireEvent.click(screen.getByRole("tab", { name: "Checks" }));
    expect(screen.getByText("Policy checks")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "History" }));
    expect(screen.getByText("Review history")).toBeInTheDocument();
  });

  test("keeps file rail keyboard selection aligned with the selected file", () => {
    const review = createSampleReview();
    const onSelectFile = vi.fn();

    render(
      <ReviewWorkspaceRecipe
        review={review}
        selectedTab="files"
        selectedFilePath="title.md"
        onSelectFile={onSelectFile}
      />,
    );

    const fileNav = screen.getByRole("navigation", {
      name: "Review files changed",
    });
    const titleOption = within(fileNav).getByRole("button", {
      name: /title\.md/,
    });
    const abstractOption = within(fileNav).getByRole("button", {
      name: /abstract\.md/,
    });

    expect(titleOption).toHaveAttribute("tabindex", "0");
    expect(titleOption).toHaveAttribute("aria-current", "location");
    expect(abstractOption).toHaveAttribute("tabindex", "-1");

    fireEvent.keyDown(titleOption, { key: "ArrowDown" });
    expect(onSelectFile).toHaveBeenCalledWith("abstract.md");
  });

  test("uses a full-width files workbench without the summary sidebar", () => {
    const review = createSampleReview();

    render(<ReviewWorkspaceRecipe review={review} selectedTab="files" />);

    expect(screen.queryByText("Recommended updates")).not.toBeInTheDocument();
    expect(screen.getByText("Selected file")).toBeInTheDocument();
    expect(
      screen.getByRole("complementary", {
        name: "Review context inspector",
      }),
    ).toBeInTheDocument();
  });

  test("shows source-backed rule evidence in the context inspector", () => {
    const review = createSampleReview();
    const categoryCheck = review.checks.find(
      (check) => check.ruleId === "category-fit",
    );

    if (!categoryCheck?.anchorId || !categoryCheck.reviewFilePath) {
      throw new Error("Category check target not found.");
    }

    render(
      <ReviewWorkspaceRecipe
        review={review}
        selectedTab="files"
        selectedFilePath={categoryCheck.reviewFilePath}
        selectedAnchorId={categoryCheck.anchorId}
        selectedContext={{ type: "check", id: categoryCheck.id }}
      />,
    );

    expect(screen.getByText("Why this was flagged")).toBeInTheDocument();
    expect(screen.getByText("Readiness impact")).toBeInTheDocument();
    expect(screen.getByText("Source checked")).toBeInTheDocument();
    expect(screen.getByText(categoryCheck.sourceCheckedAt)).toBeInTheDocument();
  });

  test("applies the latest draft from the inspector action area", () => {
    const review = createSampleReview();
    const onSuggestionAction = vi.fn();
    const abstractSuggestion = review.suggestions.find(
      (suggestion) => suggestion.filePath === "abstract.md",
    );

    if (!abstractSuggestion) {
      throw new Error("Abstract suggestion not found.");
    }

    render(
      <ReviewWorkspaceRecipe
        review={review}
        selectedTab="files"
        selectedFilePath="abstract.md"
        selectedAnchorId={abstractSuggestion.anchor.id}
        onSuggestionAction={onSuggestionAction}
      />,
    );

    fireEvent.change(screen.getByLabelText("Suggested revision"), {
      target: { value: "Toolbar-applied abstract draft" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Save edited suggestion" }),
    );

    expect(onSuggestionAction).toHaveBeenCalledWith(
      abstractSuggestion.id,
      "edit",
      "Toolbar-applied abstract draft",
    );
  });

  test("keeps the files tab stable when a review loses generated file diffs", () => {
    const review = createSampleReview();
    const { rerender } = render(
      <ReviewWorkspaceRecipe review={review} selectedTab="files" />,
    );

    rerender(
      <ReviewWorkspaceRecipe
        review={{
          ...review,
          files: [],
          suggestions: [],
        }}
        selectedTab="files"
      />,
    );

    expect(
      screen.getByText(
        "No file diffs have been generated for this review yet.",
      ),
    ).toBeInTheDocument();
  });
});
