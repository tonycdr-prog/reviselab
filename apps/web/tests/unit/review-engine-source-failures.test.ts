import { describe, expect, test } from "vitest";

import {
  generateReviewSnapshot,
  type ReviewInput,
  type ReviewSnapshot,
} from "@reviselab/core";

const baseInput: ReviewInput = {
  paperId: "paper_source_failure",
  versionId: "version_source_failure",
  title: "A Benchmark for Retrieval-Augmented Review Assistants",
  abstract:
    "We evaluate retrieval-augmented review assistants for scientific writing review.",
  intendedCategory: "cs.AI",
  paperType: "research",
  firstTimeSubmitter: false,
  sourceKind: "pdf",
};

function findRule(review: ReviewSnapshot, ruleId: string) {
  const check = review.checks.find((item) => item.ruleId === ruleId);
  expect(check, `Expected rule ${ruleId}`).toBeDefined();
  return check!;
}

function expectSourceBacked(check: ReviewSnapshot["checks"][number]) {
  expect(check.ruleVersion).toBeTruthy();
  expect(check.sourceUrl).toMatch(/^https:\/\//);
  expect(check.sourceCheckedAt).toBeTruthy();
  expect(check.evidence.length).toBeGreaterThan(0);
  expect(check.reviewFilePath).toBeTruthy();
  expect(check.anchorId).toBeTruthy();
}

describe("source readiness failures", () => {
  test("blocks thin parser output as a source readiness failure", () => {
    const review = generateReviewSnapshot({
      ...baseInput,
      manuscript: {
        sourceKind: "pdf",
        title: "Unreadable PDF fixture",
        abstract: "Abstract",
        authors: [],
        sections: [],
        references: [],
        rawText: "too short",
        parseDiagnostics: ["fallback text extraction warning"],
      },
    });
    const check = findRule(review, "source-pdf-parse-readiness");

    expect(check.state).toBe("fail");
    expect(check.severity).toBe("blocker");
    expect(check.reviewFilePath).toBe("submission_notes.md");
    expectSourceBacked(check);
  });
});
