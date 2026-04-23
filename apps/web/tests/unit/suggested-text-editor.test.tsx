import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import type { ReviewSuggestion } from "@reviselab/core";
import { SuggestedTextEditor } from "@reviselab/ui";

const suggestion: ReviewSuggestion = {
  id: "suggestion_1",
  filePath: "abstract.md",
  title: "Conservative abstract revision",
  severity: "warning",
  rationale: "Clarify the abstract.",
  originalText: "Old abstract",
  suggestedText: "Suggested abstract",
  origin: "ai",
  status: "suggested",
  anchor: {
    id: "anchor_1",
    filePath: "abstract.md",
    hunkHeader: "@@ -1 +1 @@",
    startLine: 1,
    endLine: 1,
    oldStartLine: 1,
    oldEndLine: 1,
    label: "Abstract",
  },
  diffStats: {
    additions: 1,
    deletions: 1,
    changedLines: 2,
  },
  linkedCheckIds: [],
  linkedCommentIds: [],
  explainability: {
    summary: "Generated from the title and abstract.",
    model: "ReviseLab Assistant",
    provider: "local scaffold",
    generatedAt: "2026-04-22T12:00:00.000Z",
    inputScope: ["title", "abstract"],
  },
};

describe("SuggestedTextEditor", () => {
  test("restores a manually edited draft back to the generated suggestion", async () => {
    const user = userEvent.setup();
    render(<SuggestedTextEditor suggestion={suggestion} />);

    const textarea = screen.getByLabelText("Suggested revision");
    await user.clear(textarea);
    await user.type(textarea, "Edited abstract");

    await user.click(
      screen.getByRole("button", { name: "Restore AI suggestion" }),
    );

    expect(textarea).toHaveValue("Suggested abstract");
  });

  test("shows the AI label for explainable suggestions", () => {
    render(<SuggestedTextEditor suggestion={suggestion} />);

    expect(screen.getAllByText("AI")[0]).toBeInTheDocument();
    expect(
      screen.getByText("Generated from the title and abstract."),
    ).toBeInTheDocument();
    expect(screen.getByText(/Generated 22 Apr 2026/i)).toBeInTheDocument();
  });

  test("keeps AI restore available for a saved custom draft", async () => {
    const user = userEvent.setup();
    const onRestore = vi.fn();

    render(
      <SuggestedTextEditor
        suggestion={{
          ...suggestion,
          status: "edited",
          editedText: "Saved custom abstract",
        }}
        onRestore={onRestore}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Restore AI suggestion" }),
    );

    expect(onRestore).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Suggested revision")).toHaveValue(
      "Suggested abstract",
    );
  });

  test("resets the draft when the selected suggestion changes", async () => {
    const user = userEvent.setup();
    const nextSuggestion: ReviewSuggestion = {
      ...suggestion,
      id: "suggestion_2",
      title: "Metadata revision",
      filePath: "metadata.yml",
      suggestedText: "Suggested metadata",
      anchor: {
        ...suggestion.anchor,
        id: "anchor_2",
        filePath: "metadata.yml",
      },
    };

    const { rerender } = render(
      <SuggestedTextEditor suggestion={suggestion} />,
    );
    const textarea = screen.getByLabelText("Suggested revision");

    await user.clear(textarea);
    await user.type(textarea, "Local edited draft");

    rerender(<SuggestedTextEditor suggestion={nextSuggestion} />);

    expect(screen.getByLabelText("Suggested revision")).toHaveValue(
      "Suggested metadata",
    );
  });
});
