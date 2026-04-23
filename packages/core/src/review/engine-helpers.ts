import {
  CANONICAL_REVIEW_FILES,
  compareSuggestionPriority,
  computeDiffStats,
  slugId,
} from "./utils";
import { CATEGORY_HINTS, FILE_TITLES } from "./engine-constants";
import type {
  DiffStatus,
  NormalizedManuscript,
  ReviewAnchor,
  ReviewFile,
  ReviewInput,
  ReviewSeverity,
  ReviewSuggestion,
  SubmissionContext,
} from "./types";

export function rankCategories(text: string) {
  const lower = text.toLowerCase();
  return Object.entries(CATEGORY_HINTS)
    .map(([category, keywords]) => ({
      category,
      score: keywords.reduce(
        (total, keyword) => total + (lower.includes(keyword) ? 1 : 0),
        0,
      ),
    }))
    .sort((left, right) => right.score - left.score);
}

export function tightenAbstract(text: string) {
  const cleaned = text.replace(/\s+/g, " ").trim();

  if (!cleaned) {
    return "Add a concise abstract that states the problem, method, evidence, and primary result in neutral language.";
  }

  const firstSentence = cleaned.split(/(?<=[.!?])\s+/)[0] ?? cleaned;
  if (firstSentence.length < 140) {
    return `${firstSentence} We then outline the method, evaluation setting, and the evidence supporting the claim.`;
  }

  return cleaned
    .replace(/In this paper[,]?/gi, "We")
    .replace(/This paper/gi, "This work")
    .replace(/we propose/gi, "we present")
    .replace(/!/g, ".");
}

export function buildNormalizedManuscript(
  input: ReviewInput,
): NormalizedManuscript {
  return (
    input.manuscript ?? {
      sourceKind: "selection",
      title: input.title,
      abstract: input.abstract,
      authors: [],
      sections: [],
      references: [],
      rawText: `${input.title}\n\n${input.abstract}`,
      parseDiagnostics: [],
    }
  );
}

export function createAnchor(
  filePath: ReviewSuggestion["filePath"],
  label: string,
  originalText: string,
  suggestedText: string,
): ReviewAnchor {
  const oldLineCount = Math.max(1, originalText.split(/\r?\n/).length);
  const newLineCount = Math.max(1, suggestedText.split(/\r?\n/).length);

  return {
    id: slugId("anchor"),
    filePath,
    hunkHeader: `@@ -1,${oldLineCount} +1,${newLineCount} @@`,
    startLine: 1,
    endLine: newLineCount,
    oldStartLine: 1,
    oldEndLine: oldLineCount,
    label,
  };
}

export function buildFileBaseTexts(
  context: SubmissionContext,
  bestCategory: string,
): Record<(typeof CANONICAL_REVIEW_FILES)[number], string> {
  return {
    "title.md": context.title,
    "abstract.md": context.abstract,
    "metadata.yml": `title: ${context.title}\nintended_category: ${context.intendedCategory}\npaper_type: ${context.paperType}\nfirst_time_submitter: ${context.firstTimeSubmitter}`,
    "submission_notes.md": `Category rationale: ${bestCategory} is the best fit for the methods and vocabulary used in the abstract.\nPeer review status: ${
      context.paperType === "research"
        ? "Not yet peer reviewed."
        : "Add conference or journal review context before submission."
    }`,
  };
}

export function createSuggestion(input: {
  filePath: ReviewSuggestion["filePath"];
  title: string;
  severity: ReviewSuggestion["severity"];
  rationale: string;
  originalText: string;
  suggestedText: string;
  origin: ReviewSuggestion["origin"];
  explainability?: ReviewSuggestion["explainability"];
}): ReviewSuggestion {
  const anchor = createAnchor(
    input.filePath,
    input.title,
    input.originalText,
    input.suggestedText,
  );

  return {
    id: slugId("suggestion"),
    filePath: input.filePath,
    title: input.title,
    severity: input.severity,
    rationale: input.rationale,
    originalText: input.originalText,
    suggestedText: input.suggestedText,
    origin: input.origin,
    status: "suggested",
    anchor,
    diffStats: computeDiffStats(input.originalText, input.suggestedText),
    linkedCheckIds: [],
    linkedCommentIds: [],
    ...(input.explainability ? { explainability: input.explainability } : {}),
  };
}

function deriveFileStatus(suggestions: ReviewSuggestion[]): DiffStatus {
  if (suggestions.length === 0) {
    return "unchanged";
  }

  return (
    suggestions
      .map((suggestion) => suggestion.status)
      .sort((left, right) => {
        const order: Record<DiffStatus, number> = {
          suggested: 6,
          edited: 5,
          accepted: 4,
          rejected: 3,
          resolved: 2,
          unchanged: 1,
        };
        return order[right] - order[left];
      })[0] ?? "unchanged"
  );
}

function deriveFileSeverity(
  suggestions: ReviewSuggestion[],
): ReviewSuggestion["severity"] {
  const severityOrder: Record<ReviewSeverity, number> = {
    blocker: 3,
    warning: 2,
    info: 1,
  };

  return (
    suggestions
      .map((suggestion) => suggestion.severity)
      .sort((left, right) => severityOrder[right] - severityOrder[left])[0] ??
    "info"
  );
}

export function buildFiles(
  context: SubmissionContext,
  bestCategory: string,
  suggestions: ReviewSuggestion[],
): ReviewFile[] {
  const baseTexts = buildFileBaseTexts(context, bestCategory);

  return CANONICAL_REVIEW_FILES.map((path) => {
    const fileSuggestions = suggestions
      .filter((suggestion) => suggestion.filePath === path)
      .sort(compareSuggestionPriority);

    const currentText =
      fileSuggestions.find((suggestion) => suggestion.status === "accepted")
        ?.editedText ??
      fileSuggestions.find((suggestion) => suggestion.status === "accepted")
        ?.suggestedText ??
      baseTexts[path];

    const diffStats = fileSuggestions.reduce(
      (totals, suggestion) => ({
        additions: totals.additions + suggestion.diffStats.additions,
        deletions: totals.deletions + suggestion.diffStats.deletions,
        changedLines: totals.changedLines + suggestion.diffStats.changedLines,
      }),
      { additions: 0, deletions: 0, changedLines: 0 },
    );

    return {
      id: slugId("file"),
      path,
      title: FILE_TITLES[path],
      severity: deriveFileSeverity(fileSuggestions),
      status: deriveFileStatus(fileSuggestions),
      changeCount: fileSuggestions.length,
      diffStats,
      baseText: baseTexts[path],
      currentText,
      suggestionIds: fileSuggestions.map((suggestion) => suggestion.id),
    };
  });
}
