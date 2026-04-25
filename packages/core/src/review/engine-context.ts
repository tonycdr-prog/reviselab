import type {
  NormalizedManuscript,
  ReviewInput,
  SubmissionContext,
} from "./types";

export function buildSnapshotContext(
  input: ReviewInput,
  manuscript: NormalizedManuscript,
): SubmissionContext {
  return {
    targetServer: input.targetServer ?? "arxiv",
    title: input.title,
    abstract: input.abstract,
    intendedCategory: input.intendedCategory,
    paperType: input.paperType,
    firstTimeSubmitter: input.firstTimeSubmitter,
    sourceKind: manuscript.sourceKind ?? input.sourceKind ?? "selection",
    ...(typeof input.priorArxivAuthorship === "boolean"
      ? { priorArxivAuthorship: input.priorArxivAuthorship }
      : {}),
    ...(typeof input.hasInstitutionalEmail === "boolean"
      ? { hasInstitutionalEmail: input.hasInstitutionalEmail }
      : {}),
    ...(typeof input.hasPersonalEndorser === "boolean"
      ? { hasPersonalEndorser: input.hasPersonalEndorser }
      : {}),
    ...(input.peerReviewedVenue
      ? { peerReviewedVenue: input.peerReviewedVenue }
      : {}),
    ...(input.journalRef ? { journalRef: input.journalRef } : {}),
    ...(input.doi ? { doi: input.doi } : {}),
    ...(typeof input.aiAssistanceUsed === "boolean"
      ? { aiAssistanceUsed: input.aiAssistanceUsed }
      : {}),
    ...(input.aiDisclosureText
      ? { aiDisclosureText: input.aiDisclosureText }
      : {}),
    ...(input.comments ? { comments: input.comments } : {}),
  };
}
