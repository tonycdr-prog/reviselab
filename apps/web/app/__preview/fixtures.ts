import {
  createSampleReview,
  type DashboardReviewRow,
  type ReviewSnapshot,
  type SubmissionContext,
} from "@reviselab/core";

export const PREVIEW_TIMESTAMP = "2026-04-23T08:01:00.000Z";

export function createPreviewReview(overrides?: Partial<SubmissionContext>) {
  const review = createSampleReview(overrides);
  const abstractSuggestion = review.suggestions.find(
    (suggestion) => suggestion.filePath === "abstract.md",
  );
  const comments =
    review.comments.length > 0 || !abstractSuggestion
      ? review.comments
      : [
          {
            id: "comment_preview_abstract_context",
            ruleId: "preview-linked-comment",
            ruleVersion: "preview",
            target: "Abstract",
            filePath: "abstract.md" as const,
            anchorId: abstractSuggestion.anchor.id,
            severity: "info" as const,
            body: "Use the linked diff to review the abstract suggestion in context.",
            sourceUrl: "https://info.arxiv.org/help/moderation/index.html",
            linkedSuggestionIds: [abstractSuggestion.id],
          },
        ];

  return {
    ...review,
    generatedAt: PREVIEW_TIMESTAMP,
    suggestions: review.suggestions.map((suggestion) =>
      suggestion.explainability
        ? {
            ...suggestion,
            explainability: {
              ...suggestion.explainability,
              generatedAt: PREVIEW_TIMESTAMP,
            },
          }
        : suggestion,
    ),
    comments,
    history: review.history.map((event) => ({
      ...event,
      createdAt: PREVIEW_TIMESTAMP,
    })),
    ...(review.aiPresenceSummary
      ? {
          aiPresenceSummary: {
            ...review.aiPresenceSummary,
            generatedAt: PREVIEW_TIMESTAMP,
          },
        }
      : {}),
  } satisfies ReviewSnapshot;
}

export function getPreviewDashboardReviews() {
  return [
    createPreviewReview(),
    createPreviewReview({
      title: "A moderation-fit check for review articles in computer science",
      paperType: "review",
      firstTimeSubmitter: false,
    }),
  ];
}

export function getPreviewDashboardRows(): DashboardReviewRow[] {
  return getPreviewDashboardReviews().map((review) => ({
    id: review.id,
    paperId: review.paperId,
    title: review.context.title,
    intendedCategory: review.context.intendedCategory,
    paperType: review.context.paperType,
    stage: review.progress.stage,
    status: review.status,
    readiness: review.readiness,
    parseStatus: review.progress.parseStatus,
    updatedAt: review.generatedAt,
    suggestionCount: review.suggestions.length,
    checkCount: review.checks.length,
    commentCount: review.comments.length,
    failedReason: null,
    progressLabel: review.progress.label,
  }));
}
