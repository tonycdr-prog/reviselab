import type { ReviewRule } from "./rules-shared";
import {
  OVERLEAF_SOURCE,
  PDF_SOURCE,
  TEX_SOURCE,
  createEvidence,
  createRuleCheck,
  createRuleVersion,
} from "./rules-shared";

export const SOURCE_PARSE_RULE: ReviewRule = {
  id: "source-pdf-parse-readiness",
  version: createRuleVersion("readiness.5"),
  run(context) {
    const diagnostics = context.manuscript.parseDiagnostics;
    const diagnosticText = diagnostics.join("\n").toLowerCase();
    const hasWarnings =
      /\b(missing|not at the zip root|eps|hyperref|not extracted|fallback|warning)\b/.test(
        diagnosticText,
      );
    const shouldRequireParsedBody =
      context.manuscript.sourceKind !== "selection";
    const hasLittleBodyText =
      shouldRequireParsedBody && context.manuscript.rawText.trim().length < 200;
    const sourceUrl =
      context.manuscript.sourceKind === "pdf"
        ? PDF_SOURCE
        : context.manuscript.sourceKind === "latex-zip"
          ? TEX_SOURCE
          : OVERLEAF_SOURCE;

    return {
      checks: [
        createRuleCheck({
          id: `check_${context.summarySuggestionId}_source_parse`,
          ruleId: "source-pdf-parse-readiness",
          ruleVersion: createRuleVersion("readiness.5"),
          name: "Source and PDF parse readiness",
          state: hasLittleBodyText ? "fail" : hasWarnings ? "warn" : "pass",
          severity: hasLittleBodyText
            ? "blocker"
            : hasWarnings
              ? "warning"
              : "info",
          summary: hasLittleBodyText
            ? "Parsed manuscript text is too thin"
            : hasWarnings
              ? "Source package has arXiv-readiness warnings"
              : "Source parsed successfully",
          detail:
            diagnostics.join(" ") ||
            (hasLittleBodyText
              ? "The parser did not extract enough body text for a reliable submission readiness review."
              : "The source package parsed without deterministic readiness warnings."),
          sourceUrl,
          reviewFilePath: "submission_notes.md",
          anchorId: context.submissionNotesAnchorId,
          linkedSuggestionIds: [context.summarySuggestionId],
          evidence: [
            createEvidence(
              "Source kind",
              context.manuscript.sourceKind,
              sourceUrl,
              hasLittleBodyText ? "blocker" : hasWarnings ? "warning" : "info",
            ),
            createEvidence(
              "Diagnostics",
              diagnostics.join(" | ") || "No diagnostics",
              OVERLEAF_SOURCE,
              hasLittleBodyText ? "blocker" : hasWarnings ? "warning" : "info",
            ),
          ],
        }),
      ],
    };
  },
};
