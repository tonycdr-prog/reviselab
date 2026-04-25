import { generateReviewSnapshot } from "./engine";
import type { SubmissionContext } from "./types";

export function createSampleReview(overrides?: Partial<SubmissionContext>) {
  const defaultContext: SubmissionContext = {
    targetServer: "arxiv",
    title:
      "A Benchmark for Retrieval-Augmented Review Assistants in Scientific Writing",
    abstract:
      "We study retrieval-augmented assistants for scientific writing review. Our benchmark compares category fit, tone calibration, and policy-aware revision suggestions across realistic abstract editing tasks. Results show that targeted review signals improve clarity and reduce moderation-risk language without changing the paper's core claims.",
    intendedCategory: "cs.AI",
    paperType: "research",
    firstTimeSubmitter: true,
    sourceKind: "latex-zip",
    priorArxivAuthorship: false,
    hasInstitutionalEmail: true,
    hasPersonalEndorser: false,
    aiAssistanceUsed: false,
    comments: "12 pages, 3 figures.",
  };

  return generateReviewSnapshot({
    paperId: "paper_demo",
    versionId: "version_demo",
    ...defaultContext,
    ...overrides,
  });
}
