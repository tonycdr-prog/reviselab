import {
  buildReviewProgress,
  createReviewEvent,
  getPaperTypeLabel,
  nowIso,
  type PaperType,
  type ParseStatus,
  type ReviewSnapshot,
  type SubmissionContext,
  type UploadedPaperRecord,
} from "@reviselab/core";

export type UploadInput = SubmissionContext & {
  file: File;
};

export type ReviewCreateInput = SubmissionContext & {
  paperId: string;
  versionId: string;
};

export function createUploadedPaperRecord(
  input: UploadInput,
  ids: { paperId: string; versionId: string },
  createdAt: string,
): UploadedPaperRecord {
  return {
    paperId: ids.paperId,
    versionId: ids.versionId,
    createdAt,
    context: {
      title: input.title,
      abstract: input.abstract,
      intendedCategory: input.intendedCategory,
      paperType: input.paperType,
      firstTimeSubmitter: input.firstTimeSubmitter,
    },
    fileName: input.file.name,
  };
}

export function createQueuedReviewSnapshot(
  reviewId: string,
  input: ReviewCreateInput,
  parseStatus: ParseStatus,
  status: ReviewSnapshot["status"] = "queued",
): ReviewSnapshot {
  const generatedAt = nowIso();
  const progress = buildReviewProgress({
    parseStatus,
    reviewStatus: status,
  });

  return {
    id: reviewId,
    paperId: input.paperId,
    versionId: input.versionId,
    status,
    readiness: null,
    progress,
    generatedAt,
    context: input,
    overview: progress.description,
    files: [],
    checks: [],
    suggestions: [],
    comments: [],
    history: [
      createReviewEvent({
        kind: "review_queued",
        createdAt: generatedAt,
        detail: `Review created for ${input.title}.`,
      }),
    ],
  };
}

export function getReviewStatusForParseStatus(
  parseStatus: ParseStatus,
): ReviewSnapshot["status"] {
  return parseStatus === "failed" ? "failed" : "queued";
}

export function getProcessingSummary(context: SubmissionContext) {
  return `Queued review for ${context.title} (${getPaperTypeLabel(context.paperType)} in ${context.intendedCategory}).`;
}

export function getStoredReviewFallbackContext(): SubmissionContext {
  return {
    title: "Queued review",
    abstract: "",
    intendedCategory: "cs.AI",
    paperType: "research" as PaperType,
    firstTimeSubmitter: false,
  };
}
