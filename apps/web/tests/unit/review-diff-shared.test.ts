import { describe, expect, test } from "vitest";

import type { ReviewSuggestion } from "@reviselab/core";
import { getSuggestionSaveAction } from "@reviselab/ui";

const baseSuggestion: ReviewSuggestion = {
  id: "suggestion_1",
  filePath: "abstract.md",
  title: "Refine abstract",
  severity: "warning",
  rationale: "Clarify the manuscript summary.",
  originalText: "Original abstract",
  suggestedText: "Suggested abstract",
  origin: "rules",
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
};

describe("getSuggestionSaveAction", () => {
  test("restores a saved draft when the edited text returns to the original suggestion", () => {
    expect(
      getSuggestionSaveAction(
        {
          ...baseSuggestion,
          origin: "ai",
          status: "edited",
          editedText: "Custom abstract",
        },
        "Suggested abstract",
      ),
    ).toBe("restore");
  });

  test("applies the current edited draft when the user keeps the saved custom text", () => {
    expect(
      getSuggestionSaveAction(
        {
          ...baseSuggestion,
          status: "edited",
          editedText: "Custom abstract",
        },
        "Custom abstract",
      ),
    ).toBe("apply");
  });

  test("saves a new edited draft when the text changes again", () => {
    expect(
      getSuggestionSaveAction(
        {
          ...baseSuggestion,
          status: "edited",
          editedText: "Custom abstract",
        },
        "Updated custom abstract",
      ),
    ).toBe("edit");
  });
});
