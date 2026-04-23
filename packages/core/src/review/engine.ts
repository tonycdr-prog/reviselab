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
  buildNormalizedManuscript,
  createSuggestion,
  rankCategories,
  tightenAbstract,
} from "./engine-helpers";
import { RULE_REGISTRY } from "./rules";
import type {
  ReviewInput,
  ReviewSnapshot,
  SubmissionContext,
  UploadedPaperRecord,
} from "./types";

export function createUploadedPaperRecord(
  input: SubmissionContext & { file?: File | null },
  ids: { paperId: string; versionId: string },
  createdAt: string,
): UploadedPaperRecord {
  return {
    paperId: ids.paperId,
    versionId: ids.versionId,
    createdAt,
    context: {
      title: input.title,
      abstract: input.abstract,
      intendedCategory: input.intendedCategory,
      paperType: input.paperType,
      firstTimeSubmitter: input.firstTimeSubmitter,
    },
    ...(input.file?.name ? { fileName: input.file.name } : {}),
  };
}

export function generateReviewSnapshot(input: ReviewInput): ReviewSnapshot {
  const manuscript = buildNormalizedManuscript(input);
  const combinedText = `${manuscript.title} ${manuscript.abstract} ${manuscript.rawText}`;
  const rankedCategories = rankCategories(combinedText);
  const bestCategory = rankedCategories[0]?.category ?? input.intendedCategory;
  const categoryScore = rankedCategories[0]?.score ?? 0;
  const lowerText = combinedText.toLowerCase();
  const hasOverclaiming = OVERCLAIMING_PATTERNS.some((pattern) =>
    lowerText.includes(pattern),
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
    bestCategory !== input.intendedCategory && categoryScore > 0
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
    context: {
      title: input.title,
      abstract: input.abstract,
      intendedCategory: input.intendedCategory,
      paperType: input.paperType,
      firstTimeSubmitter: input.firstTimeSubmitter,
    },
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

export function createSampleReview(overrides?: Partial<SubmissionContext>) {
  return generateReviewSnapshot({
    paperId: "paper_demo",
    versionId: "version_demo",
    title:
      overrides?.title ??
      "A Benchmark for Retrieval-Augmented Review Assistants in Scientific Writing",
    abstract:
      overrides?.abstract ??
      "We study retrieval-augmented assistants for scientific writing review. Our benchmark compares category fit, tone calibration, and policy-aware revision suggestions across realistic abstract editing tasks. Results show that targeted review signals improve clarity and reduce moderation-risk language without changing the paper's core claims.",
    intendedCategory: overrides?.intendedCategory ?? "cs.AI",
    paperType: overrides?.paperType ?? "research",
    firstTimeSubmitter: overrides?.firstTimeSubmitter ?? true,
  });
}
