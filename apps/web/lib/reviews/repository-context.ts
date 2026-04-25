import {
  isPaperSourceKind,
  isPaperType,
  type SubmissionContext,
} from "@reviselab/core";

import { getStoredReviewFallbackContext } from "./repository-contracts";

function parseStoredContext(context: unknown): Record<string, unknown> | null {
  if (typeof context === "string") {
    try {
      const parsed = JSON.parse(context) as unknown;
      return parseStoredContext(parsed);
    } catch {
      return null;
    }
  }

  if (!context || typeof context !== "object" || Array.isArray(context)) {
    return null;
  }

  return context as Record<string, unknown>;
}

function getString(
  context: Record<string, unknown>,
  key: keyof SubmissionContext,
  fallback: string,
) {
  const value = context[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function getOptionalString(
  context: Record<string, unknown>,
  key: keyof SubmissionContext,
) {
  const value = context[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function getOptionalBoolean(
  context: Record<string, unknown>,
  key: keyof SubmissionContext,
) {
  const value = context[key];
  return typeof value === "boolean" ? value : undefined;
}

export function getStoredReviewContext(context: unknown): SubmissionContext {
  const fallback = getStoredReviewFallbackContext();
  const storedContext = parseStoredContext(context);

  if (!storedContext) {
    return fallback;
  }

  const rawPaperType = storedContext.paperType;
  const rawSourceKind = storedContext.sourceKind;
  const normalized: SubmissionContext = {
    targetServer: "arxiv",
    title: getString(storedContext, "title", fallback.title),
    abstract:
      typeof storedContext.abstract === "string"
        ? storedContext.abstract
        : fallback.abstract,
    intendedCategory: getString(
      storedContext,
      "intendedCategory",
      fallback.intendedCategory,
    ),
    paperType:
      typeof rawPaperType === "string" && isPaperType(rawPaperType)
        ? rawPaperType
        : fallback.paperType,
    firstTimeSubmitter:
      typeof storedContext.firstTimeSubmitter === "boolean"
        ? storedContext.firstTimeSubmitter
        : fallback.firstTimeSubmitter,
  };

  if (typeof rawSourceKind === "string" && isPaperSourceKind(rawSourceKind)) {
    normalized.sourceKind = rawSourceKind;
  }

  for (const key of [
    "priorArxivAuthorship",
    "hasInstitutionalEmail",
    "hasPersonalEndorser",
    "aiAssistanceUsed",
  ] as const) {
    const value = getOptionalBoolean(storedContext, key);
    if (typeof value === "boolean") {
      normalized[key] = value;
    }
  }

  for (const key of [
    "peerReviewedVenue",
    "journalRef",
    "doi",
    "aiDisclosureText",
    "comments",
  ] as const) {
    const value = getOptionalString(storedContext, key);
    if (value) {
      normalized[key] = value;
    }
  }

  return normalized;
}
