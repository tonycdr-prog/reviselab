import {
  REVIEW_ENGINE_VERSION,
  buildReadiness,
  compareSuggestionPriority,
  nowIso,
  slugId,
} from "./utils";
import {
  buildReviewProgress,
  createReviewEvent,
  describeOverview,
} from "./lifecycle";
import { OVERCLAIMING_PATTERNS } from "./engine-constants";
import {
  buildFileBaseTexts,
  buildFiles,
  createSuggestion,
} from "./engine-helpers";
import { buildSnapshotContext } from "./engine-context";
import {
  buildNormalizedManuscript,
  rankCategories,
  tightenAbstract,
} from "./engine-text";
import { RULE_REGISTRY } from "./rules";
import type { ReviewInput, ReviewSnapshot } from "./types";

export function generateReviewSnapshot(input: ReviewInput): ReviewSnapshot {
  const manuscript = buildNormalizedManuscript(input);
  const combinedText = `${manuscript.title} ${manuscript.abstract} ${manuscript.rawText}`;
  const rankedCategories = rankCategories(combinedText);
  const bestCategory = rankedCategories[0]?.category ?? input.intendedCategory;
  const categoryScore = rankedCategories[0]?.score ?? 0;
  const selectedCategoryScore =
    rankedCategories.find(
      (category) => category.category === input.intendedCategory,
    )?.score ?? 0;
  const categoryScoreMargin = categoryScore - selectedCategoryScore;
  const highRiskClaimText = `${manuscript.title}\n${manuscript.abstract}`;
  const hasOverclaiming = OVERCLAIMING_PATTERNS.some((pattern) =>
    pattern.test(highRiskClaimText),
  );
  const generatedAt = nowIso();

  const summarySuggestion = createSuggestion({
    filePath: "submission_notes.md",
    title: "Document submission framing",
    severity: "info",
    rationale:
      "Capture category rationale, peer-review context, and endorsement context in one place.",
    originalText: "",
    suggestedText: buildFileBaseTexts(input, bestCategory)[
      "submission_notes.md"
    ],
    origin: "rules",
  });

  const titleSuggestion = createSuggestion({
    filePath: "title.md",
    title: "Tighten title wording",
    severity: "info",
    rationale:
      "Reduce ambiguity and align the title more closely with the manuscript scope.",
    originalText: manuscript.title,
    suggestedText: manuscript.title.replace(/\s{2,}/g, " ").trim(),
    origin: "rules",
  });

  const abstractSuggestion = createSuggestion({
    filePath: "abstract.md",
    title: "Conservative abstract revision",
    severity: "warning",
    rationale:
      "Clarify the problem, method, and evidence structure while keeping claims bounded.",
    originalText: manuscript.abstract,
    suggestedText: tightenAbstract(manuscript.abstract),
    origin: "ai",
    explainability: {
      summary:
        "Generated from the title, abstract, selected category, paper type, and parsed manuscript structure to improve clarity and moderation-fit.",
      model: "ReviseLab Assistant",
      provider: "Local review engine",
      generatedAt,
      inputScope: [
        "title",
        "abstract",
        "intendedCategory",
        "paperType",
        "sections",
      ],
    },
  });

  const metadataSuggestion =
    bestCategory !== input.intendedCategory &&
    categoryScore >= 2 &&
    categoryScoreMargin >= 4
      ? createSuggestion({
          filePath: "metadata.yml",
          title: "Adjust intended category",
          severity: "warning",
          rationale: `The manuscript vocabulary aligns more closely with ${bestCategory}.`,
          originalText: `intended_category: ${input.intendedCategory}`,
          suggestedText: `intended_category: ${bestCategory}`,
          origin: "rules",
        })
      : undefined;

  const suggestions = [
    summarySuggestion,
    titleSuggestion,
    abstractSuggestion,
    ...(metadataSuggestion ? [metadataSuggestion] : []),
  ];

  const checks = [];
  const comments = [];

  for (const rule of RULE_REGISTRY) {
    const result = rule.run({
      input,
      manuscript,
      bestCategory,
      categoryScore,
      selectedCategoryScore,
      categoryScoreMargin,
      hasOverclaiming,
      summarySuggestionId: summarySuggestion.id,
      abstractSuggestionId: abstractSuggestion.id,
      titleSuggestionId: titleSuggestion.id,
      abstractAnchorId: abstractSuggestion.anchor.id,
      submissionNotesAnchorId: summarySuggestion.anchor.id,
      ...(metadataSuggestion
        ? {
            metadataSuggestionId: metadataSuggestion.id,
            metadataAnchorId: metadataSuggestion.anchor.id,
          }
        : {}),
    });
    checks.push(...(result.checks ?? []));
    comments.push(...(result.comments ?? []));
  }

  const checksBySuggestionId = new Map<string, string[]>();
  for (const check of checks) {
    for (const suggestionId of check.linkedSuggestionIds) {
      const nextIds = checksBySuggestionId.get(suggestionId) ?? [];
      nextIds.push(check.id);
      checksBySuggestionId.set(suggestionId, nextIds);
    }
  }

  const commentsBySuggestionId = new Map<string, string[]>();
  for (const comment of comments) {
    for (const suggestionId of comment.linkedSuggestionIds) {
      const nextIds = commentsBySuggestionId.get(suggestionId) ?? [];
      nextIds.push(comment.id);
      commentsBySuggestionId.set(suggestionId, nextIds);
    }
  }

  const hydratedSuggestions = suggestions
    .map((suggestion) => ({
      ...suggestion,
      linkedCheckIds: checksBySuggestionId.get(suggestion.id) ?? [],
      linkedCommentIds: commentsBySuggestionId.get(suggestion.id) ?? [],
    }))
    .sort(compareSuggestionPriority);

  const files = buildFiles(input, bestCategory, hydratedSuggestions);
  const readiness = buildReadiness(checks);
  const completedEvent = createReviewEvent({
    kind: "review_completed",
    createdAt: generatedAt,
    detail: `${readiness}. ${describeOverview(readiness)}`,
  });

  return {
    id: input.reviewId ?? slugId("review"),
    paperId: input.paperId,
    versionId: input.versionId,
    status: "ready",
    readiness,
    progress: buildReviewProgress({
      parseStatus: "parsed",
      reviewStatus: "ready",
      readiness,
    }),
    generatedAt,
    context: buildSnapshotContext(input, manuscript),
    overview: describeOverview(readiness),
    manuscript,
    files,
    checks,
    suggestions: hydratedSuggestions,
    comments,
    history: [completedEvent],
    aiPresenceSummary: {
      hasAiSuggestions: hydratedSuggestions.some(
        (suggestion) => suggestion.origin === "ai",
      ),
      aiSuggestionCount: hydratedSuggestions.filter(
        (suggestion) => suggestion.origin === "ai",
      ).length,
      generatedAt,
    },
  };
}
