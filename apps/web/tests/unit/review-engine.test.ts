import { describe, expect, test } from "vitest";

import {
  generateReviewSnapshot,
  type ReviewInput,
  type ReviewSnapshot,
} from "@reviselab/core";

const baseInput: ReviewInput = {
  paperId: "paper_rules",
  versionId: "version_rules",
  title: "A Benchmark for Retrieval-Augmented Review Assistants",
  abstract:
    "We evaluate retrieval-augmented review assistants for scientific writing review. The benchmark compares category fit, tone calibration, policy-aware revision suggestions, and reviewer-facing evidence across realistic abstract editing and submission-readiness tasks.",
  intendedCategory: "cs.AI",
  paperType: "research",
  firstTimeSubmitter: false,
  sourceKind: "latex-zip",
  comments: "12 pages, 3 figures.",
};

function snapshot(overrides: Partial<ReviewInput> = {}) {
  return generateReviewSnapshot({
    ...baseInput,
    ...overrides,
  });
}

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

describe("generateReviewSnapshot", () => {
  test("keeps CS/AI research papers below high-risk when core context passes", () => {
    const review = snapshot({
      firstTimeSubmitter: true,
      hasInstitutionalEmail: true,
      priorArxivAuthorship: true,
      abstract:
        "We evaluate retrieval-augmented review assistants for scientific writing review. The benchmark compares category fit, tone calibration, policy-aware revision suggestions, and reviewer-facing evidence across realistic abstract editing and submission-readiness tasks with bounded claims.",
    });

    expect(review.readiness).not.toBe("High submission risk");
    expect(findRule(review, "paper-type-risk").state).toBe("pass");
    expect(findRule(review, "endorsement-guidance").state).toBe("pass");
  });

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
    expect(
      snapshot.checks.some(
        (check) => check.ruleId === "cs-review-survey-position-risk",
      ),
    ).toBe(true);
  });

  test("anchors CS survey blockers to submission notes with source evidence", () => {
    const review = snapshot({
      title: "A Survey of Agentic Language Models",
      abstract:
        "This survey reviews agentic language models and summarizes the current landscape for researchers working in artificial intelligence.",
      paperType: "survey",
    });
    const check = findRule(review, "cs-review-survey-position-risk");

    expect(check.state).toBe("fail");
    expect(check.severity).toBe("blocker");
    expect(check.reviewFilePath).toBe("submission_notes.md");
    expectSourceBacked(check);
  });

  test("keeps CS review articles ready when peer-review evidence is present", () => {
    const snapshot = generateReviewSnapshot({
      paperId: "paper_peer_reviewed",
      versionId: "version_peer_reviewed",
      title: "A Survey of Agentic Language Models",
      abstract:
        "This survey reviews agentic language models across planning, reasoning, and evaluation settings. It summarizes peer-reviewed findings, compares benchmark evidence, and identifies submission-relevant limitations for researchers working in artificial intelligence.",
      intendedCategory: "cs.AI",
      paperType: "survey",
      firstTimeSubmitter: false,
      sourceKind: "latex-zip",
      peerReviewedVenue: "Proceedings of Example AI",
      journalRef: "Example AI 2026",
      doi: "10.0000/example",
      comments: "Accepted at Proceedings of Example AI.",
    });

    const csPolicyCheck = snapshot.checks.find(
      (check) => check.ruleId === "cs-review-survey-position-risk",
    );

    expect(csPolicyCheck?.state).toBe("pass");
    expect(snapshot.readiness).not.toBe("High submission risk");
  });

  test("flags missing required metadata as a blocker", () => {
    const review = snapshot({
      intendedCategory: "",
    });
    const check = findRule(review, "missing-metadata");

    expect(check.state).toBe("fail");
    expect(check.severity).toBe("blocker");
    expect(check.detail).toContain("primary category");
    expectSourceBacked(check);
  });

  test("captures deterministic evidence for checks", () => {
    const snapshot = generateReviewSnapshot({
      paperId: "paper_evidence",
      versionId: "version_evidence",
      title: "A Benchmark for Retrieval-Augmented Review Assistants",
      abstract:
        "We evaluate retrieval-augmented review assistants for scientific writing review. The benchmark compares category fit, tone calibration, policy-aware revision suggestions, and reviewer-facing evidence across realistic abstract editing and submission-readiness tasks.",
      intendedCategory: "cs.AI",
      paperType: "research",
      firstTimeSubmitter: true,
      sourceKind: "latex-zip",
      hasInstitutionalEmail: false,
      priorArxivAuthorship: false,
      comments: "12 pages, 3 figures.",
    });

    expect(snapshot.checks.every((check) => check.sourceCheckedAt)).toBe(true);
    expect(snapshot.checks.some((check) => check.evidence.length > 0)).toBe(
      true,
    );
  });

  test("flags declared AI assistance without disclosure", () => {
    const snapshot = generateReviewSnapshot({
      paperId: "paper_ai",
      versionId: "version_ai",
      title: "A Benchmark for AI-Assisted Review Workflows",
      abstract:
        "We evaluate scientific writing review workflows where authors use large language model assistance. The study compares category-fit guidance, deterministic policy checks, and submission-readiness outcomes across realistic manuscript preparation tasks.",
      intendedCategory: "cs.AI",
      paperType: "research",
      firstTimeSubmitter: false,
      sourceKind: "latex-zip",
      aiAssistanceUsed: true,
      comments: "12 pages, 3 figures.",
    });

    expect(
      snapshot.checks.find((check) => check.ruleId === "ai-disclosure-risk")
        ?.state,
    ).toBe("warn");
  });

  test("anchors overclaiming warnings to the abstract diff", () => {
    const review = snapshot({
      title: "The Best Guaranteed Benchmark for Scientific Review",
      abstract:
        "We prove this groundbreaking system is the best and guarantees state-of-the-art review outcomes for every scientific writing task.",
    });
    const check = findRule(review, "overclaiming");

    expect(check.state).toBe("warn");
    expect(check.reviewFilePath).toBe("abstract.md");
    expect(check.anchorId).toBeTruthy();
    expect(
      review.comments.some((comment) => comment.ruleId === "overclaiming"),
    ).toBe(true);
  });
});
