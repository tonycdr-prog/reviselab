import type { PaperType } from "@reviselab/core";

export function createSelectionReviewContext(
  selection: {
    title: string;
    abstract: string;
    intendedCategory: string;
    paperType: PaperType;
    firstTimeSubmitter?: boolean;
  },
  ids: { paperId: string; versionId: string },
) {
  return {
    paperId: ids.paperId,
    versionId: ids.versionId,
    targetServer: "arxiv" as const,
    title: selection.title,
    abstract: selection.abstract,
    intendedCategory: selection.intendedCategory,
    paperType: selection.paperType,
    firstTimeSubmitter: selection.firstTimeSubmitter ?? false,
    sourceKind: "selection" as const,
    priorArxivAuthorship: false,
    hasInstitutionalEmail: false,
    hasPersonalEndorser: false,
    peerReviewedVenue: "",
    journalRef: "",
    doi: "",
    aiAssistanceUsed: false,
    aiDisclosureText: "",
    comments: "Created from an Overleaf selection.",
  };
}
