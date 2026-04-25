import { expect } from "vitest";

import {
  generateReviewSnapshot,
  type ReviewInput,
  type ReviewSnapshot,
} from "@reviselab/core";

export const baseRuleFixtureInput: ReviewInput = {
  paperId: "paper_rule_fixture",
  versionId: "version_rule_fixture",
  title: "A Benchmark for Retrieval-Augmented Review Assistants",
  abstract:
    "We evaluate retrieval-augmented review assistants for scientific writing review. The benchmark compares category fit, tone calibration, policy-aware revision suggestions, and reviewer-facing evidence across realistic abstract editing tasks.",
  intendedCategory: "cs.AI",
  paperType: "research",
  firstTimeSubmitter: false,
  sourceKind: "latex-zip",
  comments: "12 pages, 3 figures.",
};

export function reviewRuleFixture(overrides: Partial<ReviewInput> = {}) {
  return generateReviewSnapshot({
    ...baseRuleFixtureInput,
    ...overrides,
  });
}

function checkFor(snapshot: ReviewSnapshot, ruleId: string) {
  const check = snapshot.checks.find((item) => item.ruleId === ruleId);

  expect(check, `Expected ${ruleId} to produce a check`).toBeDefined();
  return check!;
}

export function expectTraceableRule(snapshot: ReviewSnapshot, ruleId: string) {
  const check = checkFor(snapshot, ruleId);

  expect(check.ruleVersion).toMatch(/^\d{4}\.\d{2}\.\d{2}\.\d+\./);
  expect(check.sourceUrl).toMatch(/^https:\/\//);
  expect(check.sourceCheckedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(check.evidence.length).toBeGreaterThan(0);
  expect(check.reviewFilePath).toBeTruthy();
  expect(check.anchorId).toBeTruthy();

  return check;
}
