import {
  CATEGORY_SOURCE,
  CONTENT_TYPE_SOURCE,
  CS_REVIEW_SOURCE,
  ENDORSEMENT_SOURCE,
  METADATA_SOURCE,
  MODERATION_SOURCE,
  OVERCLAIMING_SOURCE,
  PDF_SOURCE,
  SOURCE_CHECKED_AT,
} from "./rules-shared";
import type { ReviewFilePath } from "./types";

export type RuleReadinessImpact =
  | "blocks-readiness"
  | "requires-revisions"
  | "informational";

export type RuleCatalogEntry = {
  id: string;
  title: string;
  sourceUrl: string;
  sourceCheckedAt: string;
  defaultTargetFile: ReviewFilePath;
  readinessImpact: RuleReadinessImpact;
};

export const RULE_CATALOG: RuleCatalogEntry[] = [
  {
    id: "category-fit",
    title: "Category fit",
    sourceUrl: CATEGORY_SOURCE,
    sourceCheckedAt: SOURCE_CHECKED_AT,
    defaultTargetFile: "metadata.yml",
    readinessImpact: "requires-revisions",
  },
  {
    id: "paper-type-risk",
    title: "Paper type risk",
    sourceUrl: CONTENT_TYPE_SOURCE,
    sourceCheckedAt: SOURCE_CHECKED_AT,
    defaultTargetFile: "submission_notes.md",
    readinessImpact: "requires-revisions",
  },
  {
    id: "cs-review-survey-position-risk",
    title: "CS review and position policy",
    sourceUrl: CS_REVIEW_SOURCE,
    sourceCheckedAt: SOURCE_CHECKED_AT,
    defaultTargetFile: "submission_notes.md",
    readinessImpact: "blocks-readiness",
  },
  {
    id: "endorsement-guidance",
    title: "Endorsement guidance",
    sourceUrl: ENDORSEMENT_SOURCE,
    sourceCheckedAt: SOURCE_CHECKED_AT,
    defaultTargetFile: "submission_notes.md",
    readinessImpact: "requires-revisions",
  },
  {
    id: "missing-metadata",
    title: "Metadata completeness",
    sourceUrl: METADATA_SOURCE,
    sourceCheckedAt: SOURCE_CHECKED_AT,
    defaultTargetFile: "metadata.yml",
    readinessImpact: "blocks-readiness",
  },
  {
    id: "overclaiming",
    title: "Overclaiming",
    sourceUrl: OVERCLAIMING_SOURCE,
    sourceCheckedAt: SOURCE_CHECKED_AT,
    defaultTargetFile: "abstract.md",
    readinessImpact: "requires-revisions",
  },
  {
    id: "ai-disclosure-risk",
    title: "AI disclosure risk",
    sourceUrl: MODERATION_SOURCE,
    sourceCheckedAt: SOURCE_CHECKED_AT,
    defaultTargetFile: "submission_notes.md",
    readinessImpact: "requires-revisions",
  },
  {
    id: "source-pdf-parse-readiness",
    title: "Source and PDF parse readiness",
    sourceUrl: PDF_SOURCE,
    sourceCheckedAt: SOURCE_CHECKED_AT,
    defaultTargetFile: "submission_notes.md",
    readinessImpact: "blocks-readiness",
  },
];

export function findRuleCatalogEntry(ruleId: string) {
  return RULE_CATALOG.find((entry) => entry.id === ruleId) ?? null;
}
