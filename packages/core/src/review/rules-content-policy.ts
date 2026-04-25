import type { PaperType } from "./types";
import { getPaperTypeLabel } from "./paper-metadata";
import type { ReviewRule } from "./rules-shared";
import {
  CATEGORY_SOURCE,
  CONTENT_TYPE_SOURCE,
  CS_REVIEW_SOURCE,
  createEvidence,
  createRuleCheck,
  createRuleVersion,
  hasPeerReviewEvidence,
  hasValue,
  isCsCategory,
} from "./rules-shared";

const REVIEW_LIKE_TYPES: PaperType[] = ["review", "survey", "position"];

const PAPER_TYPE_RISK_RULE: ReviewRule = {
  id: "paper-type-risk",
  version: createRuleVersion("content.1"),
  run(context) {
    const needsContext =
      REVIEW_LIKE_TYPES.includes(context.input.paperType) ||
      context.input.paperType === "technical-report";
    const paperTypeLabel = getPaperTypeLabel(context.input.paperType);

    return {
      checks: [
        createRuleCheck({
          id: `check_${context.summarySuggestionId}_paper_type`,
          ruleId: "paper-type-risk",
          ruleVersion: createRuleVersion("content.1"),
          name: "Paper type risk",
          state: needsContext ? "warn" : "pass",
          severity: needsContext ? "warning" : "info",
          summary: needsContext
            ? `${paperTypeLabel} needs extra submission context`
            : "Research article selected",
          detail: needsContext
            ? "Research articles are the lowest-risk arXiv content type. Review-like papers and technical reports need clearer evidence that they are complete, scholarly, and appropriate for the selected category."
            : "The selected paper type aligns with arXiv's primary submission pattern.",
          sourceUrl: CONTENT_TYPE_SOURCE,
          reviewFilePath: "submission_notes.md",
          anchorId: context.submissionNotesAnchorId,
          linkedSuggestionIds: [context.summarySuggestionId],
          evidence: [
            createEvidence(
              "Selected paper type",
              paperTypeLabel,
              CONTENT_TYPE_SOURCE,
              needsContext ? "warning" : "info",
            ),
          ],
        }),
      ],
    };
  },
};

const CS_REVIEW_POLICY_RULE: ReviewRule = {
  id: "cs-review-survey-position-risk",
  version: createRuleVersion("content.2"),
  run(context) {
    const paperTypeLabel = getPaperTypeLabel(context.input.paperType);
    const applies =
      isCsCategory(context.input.intendedCategory) &&
      REVIEW_LIKE_TYPES.includes(context.input.paperType);

    if (!applies || hasPeerReviewEvidence(context.input)) {
      return {
        checks: [
          createRuleCheck({
            id: `check_${context.summarySuggestionId}_cs_review_policy`,
            ruleId: "cs-review-survey-position-risk",
            ruleVersion: createRuleVersion("content.2"),
            name: "CS review and position policy",
            state: "pass",
            severity: "info",
            summary: applies
              ? "Peer-review evidence is present"
              : "CS review/survey/position blocker does not apply",
            detail: applies
              ? "The selected CS review-like paper includes venue documentation plus journal reference or DOI metadata."
              : "The selected category and paper type do not trigger the current arXiv CS review/survey/position documentation requirement.",
            sourceUrl: CS_REVIEW_SOURCE,
            reviewFilePath: "submission_notes.md",
            anchorId: context.submissionNotesAnchorId,
            linkedSuggestionIds: [context.summarySuggestionId],
            evidence: [
              createEvidence(
                "Selected category",
                context.input.intendedCategory,
                CATEGORY_SOURCE,
                "info",
              ),
              createEvidence(
                "Selected paper type",
                paperTypeLabel,
                CONTENT_TYPE_SOURCE,
                "info",
              ),
              createEvidence(
                "Peer-reviewed venue",
                context.input.peerReviewedVenue,
                CS_REVIEW_SOURCE,
                "info",
              ),
              createEvidence(
                "Journal-ref or DOI",
                hasValue(context.input.journalRef) ||
                  hasValue(context.input.doi),
                CS_REVIEW_SOURCE,
                "info",
              ),
            ],
          }),
        ],
      };
    }

    return {
      checks: [
        createRuleCheck({
          id: `check_${context.summarySuggestionId}_cs_review_policy`,
          ruleId: "cs-review-survey-position-risk",
          ruleVersion: createRuleVersion("content.2"),
          name: "CS review and position policy",
          state: "fail",
          severity: "blocker",
          summary: "CS review-like paper needs peer-review documentation",
          detail:
            "arXiv CS review, survey, and position papers are likely to be rejected unless successful peer review is documented with venue context and journal-ref or DOI metadata.",
          sourceUrl: CS_REVIEW_SOURCE,
          reviewFilePath: "submission_notes.md",
          anchorId: context.submissionNotesAnchorId,
          linkedSuggestionIds: [context.summarySuggestionId],
          evidence: [
            createEvidence(
              "Selected category",
              context.input.intendedCategory,
              CATEGORY_SOURCE,
              "blocker",
            ),
            createEvidence(
              "Selected paper type",
              paperTypeLabel,
              CS_REVIEW_SOURCE,
              "blocker",
            ),
            createEvidence(
              "Peer-reviewed venue",
              hasValue(context.input.peerReviewedVenue)
                ? context.input.peerReviewedVenue
                : "Missing",
              CS_REVIEW_SOURCE,
              "blocker",
            ),
            createEvidence(
              "Journal-ref or DOI",
              hasValue(context.input.journalRef) || hasValue(context.input.doi),
              CS_REVIEW_SOURCE,
              "blocker",
            ),
          ],
        }),
      ],
      comments: [
        {
          id: `comment_${context.summarySuggestionId}_cs_review_policy`,
          ruleId: "cs-review-survey-position-risk",
          ruleVersion: createRuleVersion("content.2"),
          target: "Submission notes",
          filePath: "submission_notes.md",
          anchorId: context.submissionNotesAnchorId,
          severity: "blocker",
          body: "Add the peer-reviewed venue plus journal-ref or DOI before submitting this review-like paper to an arXiv CS category.",
          sourceUrl: CS_REVIEW_SOURCE,
          linkedSuggestionIds: [context.summarySuggestionId],
        },
      ],
    };
  },
};

export const CONTENT_POLICY_RULES: ReviewRule[] = [
  PAPER_TYPE_RISK_RULE,
  CS_REVIEW_POLICY_RULE,
];
