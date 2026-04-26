import type {
  NormalizedManuscript,
  ReviewCheck,
  ReviewCheckEvidence,
  ReviewComment,
  ReviewInput,
  ReviewSuggestion,
} from "./types";
import { REVIEW_ENGINE_VERSION } from "./utils";

export type RuleResult = {
  checks?: ReviewCheck[];
  suggestions?: ReviewSuggestion[];
  comments?: ReviewComment[];
};

export type RuleContext = {
  input: ReviewInput;
  manuscript: NormalizedManuscript;
  bestCategory: string;
  categoryScore: number;
  selectedCategoryScore: number;
  categoryScoreMargin: number;
  hasOverclaiming: boolean;
  summarySuggestionId: string;
  abstractSuggestionId: string;
  metadataSuggestionId?: string;
  titleSuggestionId: string;
  abstractAnchorId: string;
  metadataAnchorId?: string;
  submissionNotesAnchorId: string;
};

export type ReviewRule = {
  id: string;
  version: string;
  run: (context: RuleContext) => RuleResult;
};

export const SOURCE_CHECKED_AT = "2026-04-23";
export const MODERATION_SOURCE =
  "https://info.arxiv.org/help/moderation/index.html";
export const OVERCLAIMING_SOURCE = MODERATION_SOURCE;
export const CATEGORY_SOURCE = "https://arxiv.org/category_taxonomy";
export const CONTENT_TYPE_SOURCE =
  "https://info.arxiv.org/help/policies/content-types.html";
export const CS_REVIEW_SOURCE =
  "https://blog.arxiv.org/2025/10/31/attention-authors-updated-practice-for-review-articles-and-position-papers-in-arxiv-cs-category/";
export const ENDORSEMENT_SOURCE =
  "https://blog.arxiv.org/2026/01/21/attention-authors-updated-endorsement-policy/";
export const METADATA_SOURCE = "https://info.arxiv.org/help/prep.html";
export const TEX_SOURCE = "https://info.arxiv.org/help/submit_tex.html";
export const PDF_SOURCE = "https://info.arxiv.org/help/submit_pdf.html";
export const OVERLEAF_SOURCE =
  "https://docs.overleaf.com/troubleshooting-and-support/checklist-for-arxiv-submissions";

export function createRuleVersion(suffix: string) {
  return `${REVIEW_ENGINE_VERSION}.${suffix}`;
}

export function isCsCategory(category: string) {
  return category.toLowerCase().startsWith("cs.");
}

export function hasValue(value: string | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

export function hasPeerReviewEvidence(context: ReviewInput) {
  return (
    hasValue(context.peerReviewedVenue) &&
    (hasValue(context.journalRef) || hasValue(context.doi))
  );
}

export function createEvidence(
  label: string,
  value: string | boolean | number | undefined | null,
  sourceUrl?: string,
  severity?: ReviewCheckEvidence["severity"],
): ReviewCheckEvidence {
  return {
    label,
    value:
      typeof value === "boolean"
        ? value
          ? "Yes"
          : "No"
        : String(value ?? "Not provided"),
    ...(sourceUrl ? { sourceUrl } : {}),
    ...(severity ? { severity } : {}),
  };
}

export function createRuleCheck(
  check: Omit<ReviewCheck, "sourceCheckedAt" | "evidence"> & {
    sourceCheckedAt?: string;
    evidence?: ReviewCheckEvidence[];
  },
): ReviewCheck {
  return {
    ...check,
    sourceCheckedAt: check.sourceCheckedAt ?? SOURCE_CHECKED_AT,
    evidence: check.evidence ?? [],
  };
}
