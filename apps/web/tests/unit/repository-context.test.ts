import { describe, expect, test } from "vitest";

import { getStoredReviewContext } from "../../lib/reviews/repository-mapping-helpers";

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
});
