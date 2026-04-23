import type { ReviewRule } from "./rules-shared";
import {
  ENDORSEMENT_SOURCE,
  OVERCLAIMING_SOURCE,
  createRuleVersion,
} from "./rules-shared";

export const READINESS_RULES: ReviewRule[] = [
  {
    id: "endorsement-readiness",
    version: createRuleVersion("3"),
    run(context) {
      if (!context.input.firstTimeSubmitter) {
        return {
          checks: [
            {
              id: `check_${context.summarySuggestionId}_endorsement`,
              ruleId: "endorsement-readiness",
              ruleVersion: createRuleVersion("3"),
              name: "Endorsement readiness",
              state: "pass",
              severity: "info",
              summary: "No first-time submitter signal provided",
              detail:
                "The current submission context does not indicate a new-author endorsement blocker.",
              sourceUrl: "https://info.arxiv.org/help/endorsement.html",
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
            id: `check_${context.summarySuggestionId}_endorsement`,
            ruleId: "endorsement-readiness",
            ruleVersion: createRuleVersion("3"),
            name: "Endorsement readiness",
            state: "warn",
            severity: "warning",
            summary: "First-time submitters may need an endorsement",
            detail:
              "New authors without prior authorship in the endorsement domain may need a personal endorsement even when using an institutional email address.",
            sourceUrl: ENDORSEMENT_SOURCE,
            reviewFilePath: "submission_notes.md",
            anchorId: context.submissionNotesAnchorId,
            linkedSuggestionIds: [context.summarySuggestionId],
          },
        ],
      };
    },
  },
  {
    id: "tone-and-claims",
    version: createRuleVersion("4"),
    run(context) {
      if (!context.hasOverclaiming) {
        return {
          checks: [
            {
              id: `check_${context.abstractSuggestionId}_tone`,
              ruleId: "tone-and-claims",
              ruleVersion: createRuleVersion("4"),
              name: "Tone and claims",
              state: "pass",
              severity: "info",
              summary: "Language is reasonably neutral",
              detail:
                "The current draft avoids the most common overclaiming patterns.",
              sourceUrl: OVERCLAIMING_SOURCE,
              reviewFilePath: "abstract.md",
              anchorId: context.abstractAnchorId,
              linkedSuggestionIds: [context.abstractSuggestionId],
            },
          ],
        };
      }

      return {
        checks: [
          {
            id: `check_${context.abstractSuggestionId}_tone`,
            ruleId: "tone-and-claims",
            ruleVersion: createRuleVersion("4"),
            name: "Tone and claims",
            state: "warn",
            severity: "warning",
            summary: "Title or abstract may read as overclaiming",
            detail:
              "Neutral tone helps moderation and category fit. Consider reducing absolute or promotional language.",
            sourceUrl: OVERCLAIMING_SOURCE,
            reviewFilePath: "abstract.md",
            anchorId: context.abstractAnchorId,
            linkedSuggestionIds: [context.abstractSuggestionId],
          },
        ],
        comments: [
          {
            id: `comment_${context.abstractSuggestionId}_tone`,
            ruleId: "tone-and-claims",
            ruleVersion: createRuleVersion("4"),
            target: "Abstract",
            filePath: "abstract.md",
            anchorId: context.abstractAnchorId,
            severity: "warning",
            body: "Swap promotional adjectives for specific evidence about the method, evaluation, or findings.",
            sourceUrl: OVERCLAIMING_SOURCE,
            linkedSuggestionIds: [context.abstractSuggestionId],
          },
        ],
      };
    },
  },
  {
    id: "abstract-completeness",
    version: createRuleVersion("5"),
    run(context) {
      const abstractLength = context.manuscript.abstract.trim().length;
      if (abstractLength >= 120) {
        return {
          checks: [
            {
              id: `check_${context.abstractSuggestionId}_abstract`,
              ruleId: "abstract-completeness",
              ruleVersion: createRuleVersion("5"),
              name: "Abstract completeness",
              state: "pass",
              severity: "info",
              summary: "Abstract contains enough surface detail for review",
              detail:
                "The abstract provides enough context to run category and tone checks.",
              sourceUrl: OVERCLAIMING_SOURCE,
              reviewFilePath: "abstract.md",
              anchorId: context.abstractAnchorId,
              linkedSuggestionIds: [context.abstractSuggestionId],
            },
          ],
        };
      }

      return {
        checks: [
          {
            id: `check_${context.abstractSuggestionId}_abstract`,
            ruleId: "abstract-completeness",
            ruleVersion: createRuleVersion("5"),
            name: "Abstract completeness",
            state: "warn",
            severity: "warning",
            summary: "Abstract may be too thin for a confident moderation read",
            detail:
              "Include the problem, method, evidence, and the main result to reduce ambiguity and improve category placement.",
            sourceUrl: OVERCLAIMING_SOURCE,
            reviewFilePath: "abstract.md",
            anchorId: context.abstractAnchorId,
            linkedSuggestionIds: [context.abstractSuggestionId],
          },
        ],
      };
    },
  },
];
