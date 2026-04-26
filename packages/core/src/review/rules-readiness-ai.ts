import type { ReviewRule } from "./rules-shared";
import {
  MODERATION_SOURCE,
  createEvidence,
  createRuleCheck,
  createRuleVersion,
} from "./rules-shared";

const AI_DISCLOSURE_PATTERN =
  /\b(chatgpt|gpt-4|gpt4|generative ai|ai-assisted|ai assisted|text-to-text generative|llm-generated|language-tool assistance)\b/i;

function disclosureText(context: {
  aiDisclosureText?: string;
  comments?: string;
}) {
  return [context.aiDisclosureText, context.comments]
    .filter(Boolean)
    .join("\n")
    .trim();
}

export const AI_DISCLOSURE_RULE: ReviewRule = {
  id: "ai-disclosure-risk",
  version: createRuleVersion("readiness.4"),
  run(context) {
    const submissionDisclosureText = disclosureText(context.input);
    const mentionsAi = AI_DISCLOSURE_PATTERN.test(submissionDisclosureText);
    const declaredAiUse = context.input.aiAssistanceUsed === true;
    const hasDisclosure = AI_DISCLOSURE_PATTERN.test(submissionDisclosureText);
    const needsDisclosure = (mentionsAi || declaredAiUse) && !hasDisclosure;

    return {
      checks: [
        createRuleCheck({
          id: `check_${context.summarySuggestionId}_ai_disclosure`,
          ruleId: "ai-disclosure-risk",
          ruleVersion: createRuleVersion("readiness.4"),
          name: "AI disclosure risk",
          state: needsDisclosure ? "warn" : "pass",
          severity: needsDisclosure ? "warning" : "info",
          summary: needsDisclosure
            ? "AI assistance needs an explicit disclosure"
            : "No unresolved AI-disclosure signal",
          detail: needsDisclosure
            ? "If significant text-to-text generative AI was used, arXiv expects that use to be reported according to subject standards, and AI tools must not be listed as authors."
            : "The submission context does not indicate undisclosed significant generative AI language-tool use.",
          sourceUrl: MODERATION_SOURCE,
          reviewFilePath: "submission_notes.md",
          anchorId: context.submissionNotesAnchorId,
          linkedSuggestionIds: [context.summarySuggestionId],
          evidence: [
            createEvidence(
              "AI assistance declared",
              declaredAiUse,
              MODERATION_SOURCE,
              needsDisclosure ? "warning" : "info",
            ),
            createEvidence(
              "Disclosure text",
              submissionDisclosureText || "Missing",
              MODERATION_SOURCE,
              needsDisclosure ? "warning" : "info",
            ),
          ],
        }),
      ],
    };
  },
};
