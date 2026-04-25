import type { ReviewRule } from "./rules-shared";
import {
  OVERCLAIMING_SOURCE,
  createEvidence,
  createRuleCheck,
  createRuleVersion,
} from "./rules-shared";

export const OVERCLAIMING_RULE: ReviewRule = {
  id: "overclaiming",
  version: createRuleVersion("readiness.3"),
  run(context) {
    if (!context.hasOverclaiming) {
      return {
        checks: [
          createRuleCheck({
            id: `check_${context.abstractSuggestionId}_tone`,
            ruleId: "overclaiming",
            ruleVersion: createRuleVersion("readiness.3"),
            name: "Overclaiming",
            state: "pass",
            severity: "info",
            summary: "Language is reasonably neutral",
            detail:
              "The current draft avoids the most common absolute or promotional claim patterns.",
            sourceUrl: OVERCLAIMING_SOURCE,
            reviewFilePath: "abstract.md",
            anchorId: context.abstractAnchorId,
            linkedSuggestionIds: [context.abstractSuggestionId],
          }),
        ],
      };
    }

    return {
      checks: [
        createRuleCheck({
          id: `check_${context.abstractSuggestionId}_tone`,
          ruleId: "overclaiming",
          ruleVersion: createRuleVersion("readiness.3"),
          name: "Overclaiming",
          state: "warn",
          severity: "warning",
          summary: "Title or abstract may read as overclaiming",
          detail:
            "Neutral, evidence-specific language reduces moderation and category-fit risk without editing the paper like a grammar tool.",
          sourceUrl: OVERCLAIMING_SOURCE,
          reviewFilePath: "abstract.md",
          anchorId: context.abstractAnchorId,
          linkedSuggestionIds: [context.abstractSuggestionId],
          evidence: [
            createEvidence(
              "Evidence window",
              "Title, abstract, and parsed manuscript text",
              OVERCLAIMING_SOURCE,
              "warning",
            ),
          ],
        }),
      ],
      comments: [
        {
          id: `comment_${context.abstractSuggestionId}_tone`,
          ruleId: "overclaiming",
          ruleVersion: createRuleVersion("readiness.3"),
          target: "Abstract",
          filePath: "abstract.md",
          anchorId: context.abstractAnchorId,
          severity: "warning",
          body: "Swap absolute or promotional language for specific evidence about the method, evaluation, or findings.",
          sourceUrl: OVERCLAIMING_SOURCE,
          linkedSuggestionIds: [context.abstractSuggestionId],
        },
      ],
    };
  },
};
