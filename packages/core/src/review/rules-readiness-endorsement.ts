import type { ReviewRule } from "./rules-shared";
import {
  ENDORSEMENT_SOURCE,
  createEvidence,
  createRuleCheck,
  createRuleVersion,
} from "./rules-shared";

function endorsementEvidence(context: Parameters<ReviewRule["run"]>[0]) {
  return [
    createEvidence(
      "Institutional email",
      context.input.hasInstitutionalEmail,
      ENDORSEMENT_SOURCE,
      context.input.hasInstitutionalEmail ? "info" : "warning",
    ),
    createEvidence(
      "Prior authorship in domain",
      context.input.priorArxivAuthorship,
      ENDORSEMENT_SOURCE,
      context.input.priorArxivAuthorship ? "info" : "warning",
    ),
    createEvidence(
      "Personal endorser plan",
      context.input.hasPersonalEndorser,
      ENDORSEMENT_SOURCE,
      context.input.hasPersonalEndorser ? "info" : "warning",
    ),
  ];
}

export const ENDORSEMENT_RULE: ReviewRule = {
  id: "endorsement-guidance",
  version: createRuleVersion("readiness.1"),
  run(context) {
    if (!context.input.firstTimeSubmitter) {
      return {
        checks: [
          createRuleCheck({
            id: `check_${context.summarySuggestionId}_endorsement`,
            ruleId: "endorsement-guidance",
            ruleVersion: createRuleVersion("readiness.1"),
            name: "Endorsement guidance",
            state: "pass",
            severity: "info",
            summary: "No first-time submitter signal provided",
            detail:
              "The current submission context does not indicate a new-author endorsement blocker.",
            sourceUrl: ENDORSEMENT_SOURCE,
            reviewFilePath: "submission_notes.md",
            anchorId: context.submissionNotesAnchorId,
            linkedSuggestionIds: [context.summarySuggestionId],
            evidence: [
              createEvidence(
                "First-time submitter",
                false,
                ENDORSEMENT_SOURCE,
                "info",
              ),
            ],
          }),
        ],
      };
    }

    const hasAutomaticPath =
      context.input.hasInstitutionalEmail === true &&
      context.input.priorArxivAuthorship === true;
    const hasPath =
      hasAutomaticPath || context.input.hasPersonalEndorser === true;

    return {
      checks: [
        createRuleCheck({
          id: `check_${context.summarySuggestionId}_endorsement`,
          ruleId: "endorsement-guidance",
          ruleVersion: createRuleVersion("readiness.1"),
          name: "Endorsement guidance",
          state: hasPath ? "pass" : "warn",
          severity: hasPath ? "info" : "warning",
          summary: hasPath
            ? "Endorsement path is documented"
            : "First-time submitter endorsement path is incomplete",
          detail: hasPath
            ? "The submitter has either institutional-email plus prior authorship context, or a personal endorser plan."
            : "New category submitters generally need both institutional email plus prior authorship in the endorsement domain, or a personal endorsement from an established arXiv author.",
          sourceUrl: ENDORSEMENT_SOURCE,
          reviewFilePath: "submission_notes.md",
          anchorId: context.submissionNotesAnchorId,
          linkedSuggestionIds: [context.summarySuggestionId],
          evidence: endorsementEvidence(context),
        }),
      ],
    };
  },
};
