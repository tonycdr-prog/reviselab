import type { ReviewRule } from "./rules-shared";
import {
  METADATA_SOURCE,
  createEvidence,
  createRuleCheck,
  createRuleVersion,
  hasPeerReviewEvidence,
  hasValue,
} from "./rules-shared";

const OPAQUE_LATEX_PATTERN = /\\[a-zA-Z]+\{[^}]*\}/;

function hasAsciiOnly(value: string) {
  return /^[\x00-\x7F]*$/.test(value);
}

function isAllCapsTitle(value: string) {
  const letters = value.replace(/[^a-zA-Z]/g, "");
  return letters.length >= 8 && letters === letters.toUpperCase();
}

export const METADATA_RULE: ReviewRule = {
  id: "missing-metadata",
  version: createRuleVersion("readiness.2"),
  run(context) {
    const abstractLength = context.manuscript.abstract.trim().length;
    const blockerIssues: string[] = [];
    const warningIssues: string[] = [];

    if (!hasValue(context.manuscript.title)) blockerIssues.push("title");
    if (!hasValue(context.manuscript.abstract)) blockerIssues.push("abstract");
    if (!hasValue(context.input.intendedCategory)) {
      blockerIssues.push("primary category");
    }
    if (abstractLength > 1920)
      blockerIssues.push("abstract over 1920 characters");
    if (
      !hasAsciiOnly(context.input.title) ||
      !hasAsciiOnly(context.input.abstract)
    ) {
      warningIssues.push("metadata contains non-ASCII characters");
    }
    if (isAllCapsTitle(context.input.title))
      warningIssues.push("title is all caps");
    if (OPAQUE_LATEX_PATTERN.test(context.input.title)) {
      warningIssues.push("title contains opaque LaTeX macros");
    }
    if (
      ["review", "survey", "position"].includes(context.input.paperType) &&
      !hasPeerReviewEvidence(context.input)
    ) {
      warningIssues.push("journal-ref or DOI metadata is missing");
    }

    const hasBlockers = blockerIssues.length > 0;
    const hasWarnings = warningIssues.length > 0;

    return {
      checks: [
        createRuleCheck({
          id: `check_${context.titleSuggestionId}_metadata`,
          ruleId: "missing-metadata",
          ruleVersion: createRuleVersion("readiness.2"),
          name: "Metadata completeness",
          state: hasBlockers ? "fail" : hasWarnings ? "warn" : "pass",
          severity: hasBlockers ? "blocker" : hasWarnings ? "warning" : "info",
          summary: hasBlockers
            ? "Required submission metadata is missing"
            : hasWarnings
              ? "Metadata needs a final readiness pass"
              : "Required metadata is present",
          detail:
            [...blockerIssues, ...warningIssues].join("; ") ||
            "Title, abstract, category, paper type, and submission metadata are present enough for the current review pass.",
          sourceUrl: METADATA_SOURCE,
          reviewFilePath: context.metadataAnchorId
            ? "metadata.yml"
            : "submission_notes.md",
          anchorId: context.metadataAnchorId ?? context.submissionNotesAnchorId,
          linkedSuggestionIds: context.metadataSuggestionId
            ? [context.metadataSuggestionId]
            : [context.summarySuggestionId],
          evidence: [
            createEvidence(
              "Abstract length",
              abstractLength,
              METADATA_SOURCE,
              abstractLength > 1920 ? "blocker" : "info",
            ),
            createEvidence(
              "Authors extracted",
              context.manuscript.authors.length > 0,
              METADATA_SOURCE,
              "info",
            ),
            createEvidence(
              "Comments field",
              context.input.comments,
              METADATA_SOURCE,
              hasValue(context.input.comments) ? "info" : "warning",
            ),
          ],
        }),
      ],
    };
  },
};
