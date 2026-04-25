import type { SubmissionContext, UploadedPaperRecord } from "./types";

export function createUploadedPaperRecord(
  input: SubmissionContext & { file?: File | null },
  ids: { paperId: string; versionId: string },
  createdAt: string,
): UploadedPaperRecord {
  return {
    paperId: ids.paperId,
    versionId: ids.versionId,
    createdAt,
    context: {
      targetServer: input.targetServer ?? "arxiv",
      title: input.title,
      abstract: input.abstract,
      intendedCategory: input.intendedCategory,
      paperType: input.paperType,
      firstTimeSubmitter: input.firstTimeSubmitter,
      ...(input.sourceKind ? { sourceKind: input.sourceKind } : {}),
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
    },
    ...(input.file?.name ? { fileName: input.file.name } : {}),
  };
}
