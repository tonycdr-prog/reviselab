import type { ReviewRule } from "./rules-shared";
import {
  CATEGORY_SOURCE,
  CONTENT_TYPE_SOURCE,
  createRuleVersion,
} from "./rules-shared";

export const CONTENT_RULES: ReviewRule[] = [
  {
    id: "content-type-fit",
    version: createRuleVersion("1"),
    run(context) {
      if (
        ["review", "survey", "position"].includes(context.input.paperType) &&
        context.input.intendedCategory.startsWith("cs.")
      ) {
        return {
          checks: [
            {
              id: `check_${context.titleSuggestionId}_content`,
              ruleId: "content-type-fit",
              ruleVersion: createRuleVersion("1"),
              name: "Content type fit",
              state: "fail",
              severity: "blocker",
              summary: "Likely review or position paper in CS",
              detail:
                "Computer science review, survey, and position papers are likely to be rejected unless they already have successful peer review.",
              sourceUrl: CONTENT_TYPE_SOURCE,
              reviewFilePath: "submission_notes.md",
              anchorId: context.submissionNotesAnchorId,
              linkedSuggestionIds: [context.summarySuggestionId],
            },
          ],
        };
      }

      return {
        checks: [
          {
            id: `check_${context.titleSuggestionId}_content`,
            ruleId: "content-type-fit",
            ruleVersion: createRuleVersion("1"),
            name: "Content type fit",
            state: "pass",
            severity: "info",
            summary: "Paper type aligns with a research-style submission",
            detail:
              "The selected paper type does not trigger an immediate category policy concern.",
            sourceUrl:
              "https://info.arxiv.org/help/policies/content-types.html",
            reviewFilePath: "submission_notes.md",
            anchorId: context.submissionNotesAnchorId,
            linkedSuggestionIds: [context.summarySuggestionId],
          },
        ],
      };
    },
  },
  {
    id: "category-fit",
    version: createRuleVersion("2"),
    run(context) {
      if (
        context.bestCategory !== context.input.intendedCategory &&
        context.categoryScore > 0 &&
        context.metadataSuggestionId &&
        context.metadataAnchorId
      ) {
        return {
          checks: [
            {
              id: `check_${context.metadataSuggestionId}_category`,
              ruleId: "category-fit",
              ruleVersion: createRuleVersion("2"),
              name: "Category fit",
              state: "warn",
              severity: "warning",
              summary: `A closer category match may be ${context.bestCategory}`,
              detail:
                "The manuscript vocabulary suggests that a different category may fit better than the currently selected one.",
              sourceUrl: CATEGORY_SOURCE,
              reviewFilePath: "metadata.yml",
              anchorId: context.metadataAnchorId,
              linkedSuggestionIds: [context.metadataSuggestionId],
            },
          ],
          comments: [
            {
              id: `comment_${context.metadataSuggestionId}_category`,
              ruleId: "category-fit",
              ruleVersion: createRuleVersion("2"),
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
          {
            id: `check_${context.titleSuggestionId}_category`,
            ruleId: "category-fit",
            ruleVersion: createRuleVersion("2"),
            name: "Category fit",
            state: "pass",
            severity: "info",
            summary: "Chosen category looks plausible",
            detail:
              "The title and abstract language aligns with the selected category.",
            sourceUrl: CATEGORY_SOURCE,
            reviewFilePath: "metadata.yml",
            linkedSuggestionIds: context.metadataSuggestionId
              ? [context.metadataSuggestionId]
              : [],
            ...(context.metadataAnchorId
              ? { anchorId: context.metadataAnchorId }
              : {}),
          },
        ],
      };
    },
  },
];
