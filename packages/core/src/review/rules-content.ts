import type { ReviewRule } from "./rules-shared";
import {
  CATEGORY_SOURCE,
  createEvidence,
  createRuleCheck,
  createRuleVersion,
} from "./rules-shared";
import { CONTENT_POLICY_RULES } from "./rules-content-policy";

const CATEGORY_FIT_RULE: ReviewRule = {
  id: "category-fit",
  version: createRuleVersion("content.3"),
  run(context) {
    if (
      context.bestCategory !== context.input.intendedCategory &&
      context.categoryScore > 0 &&
      context.metadataSuggestionId &&
      context.metadataAnchorId
    ) {
      return {
        checks: [
          createRuleCheck({
            id: `check_${context.metadataSuggestionId}_category`,
            ruleId: "category-fit",
            ruleVersion: createRuleVersion("content.3"),
            name: "Category fit",
            state: "warn",
            severity: "warning",
            summary: `A closer category match may be ${context.bestCategory}`,
            detail:
              "The manuscript vocabulary suggests that a different arXiv category may fit better than the selected one.",
            sourceUrl: CATEGORY_SOURCE,
            reviewFilePath: "metadata.yml",
            anchorId: context.metadataAnchorId,
            linkedSuggestionIds: [context.metadataSuggestionId],
            evidence: [
              createEvidence(
                "Selected category",
                context.input.intendedCategory,
                CATEGORY_SOURCE,
                "warning",
              ),
              createEvidence(
                "Suggested category",
                context.bestCategory,
                CATEGORY_SOURCE,
                "warning",
              ),
              createEvidence(
                "Keyword score",
                context.categoryScore,
                CATEGORY_SOURCE,
                "info",
              ),
            ],
          }),
        ],
        comments: [
          {
            id: `comment_${context.metadataSuggestionId}_category`,
            ruleId: "category-fit",
            ruleVersion: createRuleVersion("content.3"),
            target: "Metadata",
            filePath: "metadata.yml",
            anchorId: context.metadataAnchorId,
            severity: "info",
            body: `The selected category is ${context.input.intendedCategory}. Consider ${context.bestCategory} if that better matches the methods and references.`,
            sourceUrl: CATEGORY_SOURCE,
            linkedSuggestionIds: [context.metadataSuggestionId],
          },
        ],
      };
    }

    return {
      checks: [
        createRuleCheck({
          id: `check_${context.titleSuggestionId}_category`,
          ruleId: "category-fit",
          ruleVersion: createRuleVersion("content.3"),
          name: "Category fit",
          state: "pass",
          severity: "info",
          summary: "Chosen category looks plausible",
          detail:
            "The title, abstract, references, and parsed manuscript text align with the selected category.",
          sourceUrl: CATEGORY_SOURCE,
          reviewFilePath: context.metadataAnchorId
            ? "metadata.yml"
            : "submission_notes.md",
          anchorId: context.metadataAnchorId ?? context.submissionNotesAnchorId,
          linkedSuggestionIds: context.metadataSuggestionId
            ? [context.metadataSuggestionId]
            : [context.summarySuggestionId],
          evidence: [
            createEvidence(
              "Selected category",
              context.input.intendedCategory,
              CATEGORY_SOURCE,
              "info",
            ),
            createEvidence(
              "Best ranked category",
              context.bestCategory,
              CATEGORY_SOURCE,
              "info",
            ),
          ],
        }),
      ],
    };
  },
};

export const CONTENT_RULES: ReviewRule[] = [
  ...CONTENT_POLICY_RULES,
  CATEGORY_FIT_RULE,
];
