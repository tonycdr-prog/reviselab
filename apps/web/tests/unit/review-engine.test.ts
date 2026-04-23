import { describe, expect, test } from "vitest";

import { generateReviewSnapshot } from "@reviselab/core";

describe("generateReviewSnapshot", () => {
  test("flags CS review articles as high submission risk", () => {
    const snapshot = generateReviewSnapshot({
      paperId: "paper_1",
      versionId: "version_1",
      title: "A Survey of Agentic Language Models",
      abstract:
        "This survey reviews the rapid growth of agentic language models and summarizes the current landscape.",
      intendedCategory: "cs.AI",
      paperType: "review",
      firstTimeSubmitter: false,
    });

    expect(snapshot.readiness).toBe("High submission risk");
    expect(snapshot.checks.some((check) => check.state === "fail")).toBe(true);
  });
});
