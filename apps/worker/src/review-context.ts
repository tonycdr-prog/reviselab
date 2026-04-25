import {
  isPaperSourceKind,
  isPaperType,
  type PaperType,
  type SubmissionContext,
} from "@reviselab/core";

import type { PaperRow } from "./types";

type StoredReviewContext = {
  title?: unknown;
  abstract?: unknown;
  intendedCategory?: unknown;
  paperType?: unknown;
  firstTimeSubmitter?: unknown;
  targetServer?: unknown;
  sourceKind?: unknown;
  priorArxivAuthorship?: unknown;
  hasInstitutionalEmail?: unknown;
  hasPersonalEndorser?: unknown;
  peerReviewedVenue?: unknown;
  journalRef?: unknown;
  doi?: unknown;
  aiAssistanceUsed?: unknown;
  aiDisclosureText?: unknown;
  comments?: unknown;
};

function parseStoredContext(value: unknown): StoredReviewContext | null {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    try {
      return parseStoredContext(JSON.parse(value) as unknown);
    } catch {
      return null;
    }
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return value as StoredReviewContext;
  }

  return null;
}

export function getReviewContext(
  value: unknown,
  paperRow: PaperRow,
): SubmissionContext {
  const context = parseStoredContext(value);
  const storedPaperType =
    typeof context?.paperType === "string" && isPaperType(context.paperType)
      ? context.paperType
      : null;
  const rowPaperType = isPaperType(paperRow.paper_type)
    ? (paperRow.paper_type as PaperType)
    : "research";

  return {
    title: typeof context?.title === "string" ? context.title : paperRow.title,
    abstract: typeof context?.abstract === "string" ? context.abstract : "",
    intendedCategory:
      typeof context?.intendedCategory === "string"
        ? context.intendedCategory
        : (paperRow.intended_category ?? "cs.AI"),
    paperType: storedPaperType ?? rowPaperType,
    firstTimeSubmitter:
      typeof context?.firstTimeSubmitter === "boolean"
        ? context.firstTimeSubmitter
        : paperRow.first_time_submitter,
    targetServer: "arxiv",
    ...(typeof context?.sourceKind === "string" &&
    isPaperSourceKind(context.sourceKind)
      ? {
          sourceKind: context.sourceKind,
        }
      : {}),
    priorArxivAuthorship:
      typeof context?.priorArxivAuthorship === "boolean"
        ? context.priorArxivAuthorship
        : false,
    hasInstitutionalEmail:
      typeof context?.hasInstitutionalEmail === "boolean"
        ? context.hasInstitutionalEmail
        : false,
    hasPersonalEndorser:
      typeof context?.hasPersonalEndorser === "boolean"
        ? context.hasPersonalEndorser
        : false,
    peerReviewedVenue:
      typeof context?.peerReviewedVenue === "string"
        ? context.peerReviewedVenue
        : "",
    journalRef:
      typeof context?.journalRef === "string" ? context.journalRef : "",
    doi: typeof context?.doi === "string" ? context.doi : "",
    aiAssistanceUsed:
      typeof context?.aiAssistanceUsed === "boolean"
        ? context.aiAssistanceUsed
        : false,
    aiDisclosureText:
      typeof context?.aiDisclosureText === "string"
        ? context.aiDisclosureText
        : "",
    comments: typeof context?.comments === "string" ? context.comments : "",
  };
}
