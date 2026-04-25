import { CATEGORY_HINTS } from "./engine-constants";
import type { NormalizedManuscript, ReviewInput } from "./types";

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
      sourceKind: input.sourceKind ?? "selection",
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
