import { describe, expect, test } from "vitest";

import { RULE_CATALOG } from "@reviselab/core";

import { reviewRuleFixture } from "./review-rules-fixtures-helpers";

describe("deterministic rule catalog", () => {
  test("covers the deterministic product surface", () => {
    expect(RULE_CATALOG.map((entry) => entry.id)).toEqual([
      "category-fit",
      "paper-type-risk",
      "cs-review-survey-position-risk",
      "endorsement-guidance",
      "missing-metadata",
      "overclaiming",
      "ai-disclosure-risk",
      "source-pdf-parse-readiness",
    ]);

    for (const entry of RULE_CATALOG) {
      expect(entry.sourceUrl).toMatch(/^https:\/\//);
      expect(entry.sourceCheckedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(entry.defaultTargetFile).toMatch(
        /^(title\.md|abstract\.md|metadata\.yml|submission_notes\.md)$/,
      );
    }
  });

  test("generated checks all resolve to cataloged rules", () => {
    const catalogIds = new Set(RULE_CATALOG.map((entry) => entry.id));
    const snapshot = reviewRuleFixture({
      firstTimeSubmitter: true,
      aiAssistanceUsed: true,
      comments: "12 pages.",
      abstract:
        "We prove this groundbreaking system is the best and guarantees state-of-the-art outcomes for every scientific writing task.",
    });

    for (const check of snapshot.checks) {
      expect(catalogIds.has(check.ruleId), check.ruleId).toBe(true);
    }
  });
});
