import type { ReviewRule } from "./rules-shared";
import {
  MODERATION_SOURCE,
  createEvidence,
  createRuleCheck,
  createRuleVersion,
} from "./rules-shared";

const GENERATIVE_AI_PATTERN =
  /\b(chatgpt|gpt-4|gpt4|large language model|llm|generative ai|ai-assisted|ai assisted|text-to-text generative)\b/i;

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
    const combinedText = [
      context.input.title,
      context.input.abstract,
      context.manuscript.rawText,
      context.input.comments,
    ].join("\n");
    const mentionsAi = GENERATIVE_AI_PATTERN.test(combinedText);
    const declaredAiUse = context.input.aiAssistanceUsed === true;
    const disclosure = disclosureText(context.input);
    const hasDisclosure = GENERATIVE_AI_PATTERN.test(disclosure);
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
              disclosure || "Missing",
              MODERATION_SOURCE,
              needsDisclosure ? "warning" : "info",
            ),
          ],
        }),
      ],
    };
  },
};
