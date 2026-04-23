import { describe, expect, test } from "vitest";

import type { ReviewSuggestion } from "@reviselab/core";

import {
  applySuggestionStatus,
  deriveFileStateFromSuggestions,
} from "../../lib/reviews/repository-helpers";

const baseSuggestion: ReviewSuggestion = {
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

describe("repository suggestion state helpers", () => {
  test("restoring an edited AI suggestion clears the persisted edited draft", () => {
    const editedSuggestion = applySuggestionStatus(
      baseSuggestion,
      "edit",
      "Manually edited abstract",
    );

    const restoredSuggestion = applySuggestionStatus(
      editedSuggestion,
      "restore",
    );

    expect(restoredSuggestion.status).toBe("suggested");
    expect(restoredSuggestion.editedText).toBeUndefined();
    expect(restoredSuggestion.suggestedText).toBe("Suggested abstract");
  });

  test("accepted suggestions preserve the original suggestion and use edited text for current file state", () => {
    const acceptedSuggestion = applySuggestionStatus(
      baseSuggestion,
      "apply",
      "Accepted custom abstract",
    );

    expect(acceptedSuggestion.suggestedText).toBe("Suggested abstract");
    expect(acceptedSuggestion.editedText).toBe("Accepted custom abstract");

    const fileState = deriveFileStateFromSuggestions(
      {
        id: "file_1",
        path: "abstract.md",
        title: "Abstract",
        severity: "warning",
        status: "unchanged",
        changeCount: 1,
        diffStats: {
          additions: 0,
          deletions: 0,
          changedLines: 0,
        },
        baseText: "Old abstract",
        currentText: "Old abstract",
        suggestionIds: [],
      },
      [acceptedSuggestion],
    );

    expect(fileState.status).toBe("accepted");
    expect(fileState.currentText).toBe("Accepted custom abstract");
  });

  test("applying the generated suggestion clears any stale edited draft", () => {
    const editedSuggestion = applySuggestionStatus(
      baseSuggestion,
      "edit",
      "Earlier custom abstract",
    );

    const acceptedSuggestion = applySuggestionStatus(
      editedSuggestion,
      "apply",
      baseSuggestion.suggestedText,
    );

    expect(acceptedSuggestion.status).toBe("accepted");
    expect(acceptedSuggestion.editedText).toBeUndefined();
  });
});
