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

    const options = screen.getAllByRole("option");
    const titleOption = options.find((option) =>
      option.textContent?.includes("title.md"),
    );
    const abstractOption = options.find((option) =>
      option.textContent?.includes("abstract.md"),
    );

    expect(titleOption).toHaveAttribute("tabindex", "0");
    expect(abstractOption).toHaveAttribute("tabindex", "-1");

    if (!titleOption) {
      throw new Error("Title option not found.");
    }

    fireEvent.keyDown(titleOption, { key: "ArrowDown" });
    expect(onSelectFile).toHaveBeenCalledWith("abstract.md");
  });

  test("applies the latest draft when the toolbar action is used", () => {
    const review = createSampleReview();
    const onSuggestionAction = vi.fn();
    const abstractSuggestion = review.suggestions.find(
      (suggestion) => suggestion.filePath === "abstract.md",
    );

    if (!abstractSuggestion) {
      throw new Error("Abstract suggestion not found.");
    }

    const { container } = render(
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

    const toolbarApplyButton = container.querySelector(
      ".rl-diff-toolbar .cds--btn",
    );

    if (!(toolbarApplyButton instanceof HTMLButtonElement)) {
      throw new Error("Toolbar apply button not found.");
    }

    fireEvent.click(toolbarApplyButton);

    expect(onSuggestionAction).toHaveBeenCalledWith(
      abstractSuggestion.id,
      "apply",
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
