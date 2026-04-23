import type { ReviewSnapshot } from "@reviselab/core";

import type { PaperRow } from "./types";

type StoredReviewContext = {
  title?: unknown;
  abstract?: unknown;
  intendedCategory?: unknown;
  paperType?: unknown;
  firstTimeSubmitter?: unknown;
};

function parseStoredContext(value: unknown): StoredReviewContext | null {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value) as StoredReviewContext;
    } catch {
      return null;
    }
  }

  if (typeof value === "object") {
    return value as StoredReviewContext;
  }

  return null;
}

export function getReviewContext(
  value: unknown,
  paperRow: PaperRow,
): {
  title: string;
  abstract: string;
  intendedCategory: string;
  paperType: ReviewSnapshot["context"]["paperType"];
  firstTimeSubmitter: boolean;
} {
  const context = parseStoredContext(value);

  return {
    title: typeof context?.title === "string" ? context.title : paperRow.title,
    abstract: typeof context?.abstract === "string" ? context.abstract : "",
    intendedCategory:
      typeof context?.intendedCategory === "string"
        ? context.intendedCategory
        : (paperRow.intended_category ?? "cs.AI"),
    paperType:
      typeof context?.paperType === "string"
        ? (context.paperType as ReviewSnapshot["context"]["paperType"])
        : (paperRow.paper_type as ReviewSnapshot["context"]["paperType"]),
    firstTimeSubmitter:
      typeof context?.firstTimeSubmitter === "boolean"
        ? context.firstTimeSubmitter
        : paperRow.first_time_submitter,
  };
}
