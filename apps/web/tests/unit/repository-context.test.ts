import { describe, expect, test } from "vitest";

import { getStoredReviewContext } from "../../lib/reviews/repository-context";

describe("getStoredReviewContext", () => {
  test("accepts JSONB values returned as strings by direct SQL clients", () => {
    expect(
      getStoredReviewContext(
        JSON.stringify({
          title: "Live SQL context",
          abstract: "A direct SQL inserted review context.",
          intendedCategory: "cs.AI",
          paperType: "research",
          firstTimeSubmitter: true,
        }),
      ),
    ).toMatchObject({
      title: "Live SQL context",
      intendedCategory: "cs.AI",
      paperType: "research",
    });
  });

  test("normalizes corrupt stored context values before they reach UI rows", () => {
    expect(
      getStoredReviewContext({
        title: "",
        abstract: "Recovered abstract",
        intendedCategory: "",
        paperType: "press-release",
        firstTimeSubmitter: "yes",
        sourceKind: "unknown-source",
        aiAssistanceUsed: true,
        doi: "10.1234/example",
      }),
    ).toMatchObject({
      title: "Queued review",
      abstract: "Recovered abstract",
      intendedCategory: "cs.AI",
      paperType: "research",
      firstTimeSubmitter: false,
      aiAssistanceUsed: true,
      doi: "10.1234/example",
    });
  });
});
