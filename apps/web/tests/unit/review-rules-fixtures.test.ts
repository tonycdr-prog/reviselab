import { describe, expect, test } from "vitest";

import {
  baseRuleFixtureInput,
  expectTraceableRule,
  reviewRuleFixture,
} from "./review-rules-fixtures-helpers";

describe("deterministic readiness rule fixtures", () => {
  test("CS/AI research fixture keeps blocking rules clear", () => {
    const snapshot = reviewRuleFixture({
      firstTimeSubmitter: true,
      hasInstitutionalEmail: true,
      priorArxivAuthorship: true,
      abstract:
        "We evaluate agent reasoning and planning support for scientific writing review. The system compares knowledge-based category fit, policy-aware revision suggestions, and reviewer-facing evidence across realistic abstract editing tasks.",
      comments: "12 pages, 3 figures. No significant generative AI use.",
    });

    expect(snapshot.readiness).not.toBe("High submission risk");
    expect(expectTraceableRule(snapshot, "category-fit").state).toBe("pass");
    expect(expectTraceableRule(snapshot, "paper-type-risk").state).toBe("pass");
    expect(expectTraceableRule(snapshot, "endorsement-guidance").state).toBe(
      "pass",
    );
  });

  test("category-fit writes category warnings to metadata.yml", () => {
    const snapshot = reviewRuleFixture({
      intendedCategory: "cs.AI",
      abstract:
        "We study machine learning training, optimization, supervised learning, unsupervised learning, generalization, and benchmark design for model evaluation.",
    });
    const check = expectTraceableRule(snapshot, "category-fit");

    expect(check.state).toBe("warn");
    expect(check.reviewFilePath).toBe("metadata.yml");
    expect(check.summary).toContain("cs.LG");
    expect(
      snapshot.suggestions.some(
        (suggestion) =>
          suggestion.filePath === "metadata.yml" &&
          suggestion.suggestedText.includes("cs.LG"),
      ),
    ).toBe(true);
  });

  test("review-like CS papers block without peer-review evidence", () => {
    const snapshot = reviewRuleFixture({
      title: "A Survey of Retrieval-Augmented Review Assistants",
      paperType: "survey",
      abstract:
        "This survey reviews retrieval augmented review assistants and summarizes artificial intelligence systems for manuscript preparation.",
    });
    const check = expectTraceableRule(
      snapshot,
      "cs-review-survey-position-risk",
    );

    expect(snapshot.readiness).toBe("High submission risk");
    expect(check.state).toBe("fail");
    expect(check.severity).toBe("blocker");
    expect(check.reviewFilePath).toBe("submission_notes.md");
  });

  test("review-like CS papers pass when DOI and venue evidence are present", () => {
    const snapshot = reviewRuleFixture({
      paperType: "review",
      peerReviewedVenue: "Proceedings of Example AI",
      journalRef: "Example AI 2026",
      doi: "10.0000/example",
      comments: "Accepted at Proceedings of Example AI.",
    });

    expect(
      expectTraceableRule(snapshot, "cs-review-survey-position-risk").state,
    ).toBe("pass");
  });

  test("first-time submitters warn without endorsement path evidence", () => {
    const snapshot = reviewRuleFixture({
      firstTimeSubmitter: true,
      hasInstitutionalEmail: false,
      priorArxivAuthorship: false,
      hasPersonalEndorser: false,
    });
    const check = expectTraceableRule(snapshot, "endorsement-guidance");

    expect(check.state).toBe("warn");
    expect(check.detail).toContain("institutional email");
  });

  test("metadata blockers carry source-backed evidence", () => {
    const snapshot = reviewRuleFixture({
      title: "",
      abstract: "",
      intendedCategory: "",
    });
    const check = expectTraceableRule(snapshot, "missing-metadata");

    expect(check.state).toBe("fail");
    expect(check.severity).toBe("blocker");
    expect(check.detail).toContain("title");
    expect(check.detail).toContain("abstract");
    expect(check.detail).toContain("primary category");
  });

  test("AI disclosure warnings stay in submission notes", () => {
    const snapshot = reviewRuleFixture({
      aiAssistanceUsed: true,
      comments: "12 pages.",
    });
    const check = expectTraceableRule(snapshot, "ai-disclosure-risk");

    expect(check.state).toBe("warn");
    expect(check.reviewFilePath).toBe("submission_notes.md");
    expect(check.detail).toContain("AI tools must not be listed as authors");
  });

  test("overclaiming warnings link to an abstract anchor", () => {
    const snapshot = reviewRuleFixture({
      title: "The Best Guaranteed Benchmark for Review Assistants",
      abstract:
        "We prove this groundbreaking system is the best and guarantees state-of-the-art outcomes for every scientific writing task.",
    });
    const check = expectTraceableRule(snapshot, "overclaiming");

    expect(check.state).toBe("warn");
    expect(check.reviewFilePath).toBe("abstract.md");
    expect(
      snapshot.comments.some((comment) => comment.ruleId === "overclaiming"),
    ).toBe(true);
  });

  test("LaTeX source package issues warn with source-readiness evidence", () => {
    const rawText = [
      "The paper studies a submission readiness pipeline for CS preprints.",
      "The source package contains enough body text for deterministic review.",
      "The parser found structure, metadata, and references while preserving diagnostics.",
      "The review should proceed but keep arXiv source-package warnings visible.",
    ].join(" ");
    const snapshot = reviewRuleFixture({
      manuscript: {
        sourceKind: "latex-zip",
        title: baseRuleFixtureInput.title,
        abstract: baseRuleFixtureInput.abstract,
        authors: [{ name: "A. Researcher" }],
        sections: [{ title: "Introduction", level: 1, text: rawText }],
        references: ["Example reference"],
        rawText,
        parseDiagnostics: ["missing main.tex at the zip root"],
      },
    });
    const check = expectTraceableRule(snapshot, "source-pdf-parse-readiness");

    expect(check.state).toBe("warn");
    expect(check.sourceUrl).toContain("submit_tex");
  });
});
