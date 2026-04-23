import type {
  ParseStatus,
  ReviewEvent,
  ReviewEventKind,
  ReviewReadiness,
  ReviewStage,
  ReviewStatus,
} from "./types";
import { nowIso, slugId } from "./utils";

export function describeOverview(readiness: ReviewReadiness) {
  if (readiness === "High submission risk") {
    return "The draft triggers at least one blocker tied to content type or moderation policy and should be revised before submission.";
  }

  if (readiness === "Ready with revisions") {
    return "The draft is close, but a few changes to category fit, tone, or submission framing would reduce avoidable friction.";
  }

  return "The draft looks submission-ready from a moderation-fit perspective, with only minor optional refinements.";
}

export function getReviewStageLabel(stage: ReviewStage) {
  switch (stage) {
    case "parse-queued":
      return "Queued";
    case "parsing":
      return "Parsing";
    case "review-queued":
      return "Review queued";
    case "reviewing":
      return "Reviewing";
    case "failed-parse":
      return "Parsing failed";
    case "failed-review":
      return "Review failed";
    case "ready":
      return "Ready";
  }
}

export function buildReviewProgress(input: {
  parseStatus: ParseStatus;
  reviewStatus: ReviewStatus;
  parseError?: string | null;
  reviewError?: string | null;
  readiness?: ReviewReadiness | null;
}) {
  const { parseStatus, reviewStatus, parseError, reviewError, readiness } =
    input;

  if (parseStatus === "failed") {
    return {
      stage: "failed-parse" as const,
      parseStatus,
      reviewStatus,
      label: getReviewStageLabel("failed-parse"),
      description:
        parseError ??
        "ReviseLab could not parse this manuscript. Fix the source file or retry parsing.",
      canRetry: true,
      ...(parseError ? { error: parseError } : {}),
    };
  }

  if (reviewStatus === "failed") {
    return {
      stage: "failed-review" as const,
      parseStatus,
      reviewStatus,
      label: getReviewStageLabel("failed-review"),
      description:
        reviewError ??
        "ReviseLab parsed the manuscript, but review generation did not complete.",
      canRetry: true,
      ...(reviewError ? { error: reviewError } : {}),
    };
  }

  if (parseStatus === "uploaded" || parseStatus === "queued") {
    return {
      stage: "parse-queued" as const,
      parseStatus,
      reviewStatus,
      label: getReviewStageLabel("parse-queued"),
      description:
        "ReviseLab has accepted the manuscript and is waiting to start parsing.",
      canRetry: false,
    };
  }

  if (parseStatus === "processing") {
    return {
      stage: "parsing" as const,
      parseStatus,
      reviewStatus,
      label: getReviewStageLabel("parsing"),
      description:
        "ReviseLab is extracting the manuscript structure and preparing files changed.",
      canRetry: false,
    };
  }

  if (reviewStatus === "processing") {
    return {
      stage: "reviewing" as const,
      parseStatus,
      reviewStatus,
      label: getReviewStageLabel("reviewing"),
      description:
        "ReviseLab is running policy checks, generating suggestions, and materializing diff blocks.",
      canRetry: false,
    };
  }

  if (reviewStatus === "ready") {
    return {
      stage: "ready" as const,
      parseStatus,
      reviewStatus,
      label: getReviewStageLabel("ready"),
      description: readiness
        ? `Review complete. ${describeOverview(readiness)}`
        : "Review complete. Open the workspace to inspect checks, comments, and files changed.",
      canRetry: false,
    };
  }

  return {
    stage: "review-queued" as const,
    parseStatus,
    reviewStatus,
    label: getReviewStageLabel("review-queued"),
    description:
      "Parsing has finished. ReviseLab is waiting for the review worker to begin policy analysis.",
    canRetry: false,
  };
}

export function getReviewEventLabel(kind: ReviewEventKind) {
  switch (kind) {
    case "review_queued":
      return "Review queued";
    case "parse_started":
      return "Parsing started";
    case "parse_completed":
      return "Parsing completed";
    case "parse_failed":
      return "Parsing failed";
    case "review_started":
      return "Review started";
    case "review_completed":
      return "Review completed";
    case "review_failed":
      return "Review failed";
    case "suggestion_applied":
      return "Applied suggestion";
    case "suggestion_rejected":
      return "Rejected suggestion";
    case "suggestion_resolved":
      return "Marked suggestion as resolved";
    case "suggestion_restored":
      return "Restored AI suggestion";
    case "suggestion_edited":
      return "Edited suggestion";
  }
}

export function createReviewEvent(input: {
  kind: ReviewEventKind;
  createdAt?: string;
  detail?: string;
  filePath?: ReviewEvent["filePath"];
  suggestionId?: string;
}) {
  return {
    id: slugId("event"),
    kind: input.kind,
    label: getReviewEventLabel(input.kind),
    createdAt: input.createdAt ?? nowIso(),
    ...(input.detail ? { detail: input.detail } : {}),
    ...(input.filePath ? { filePath: input.filePath } : {}),
    ...(input.suggestionId ? { suggestionId: input.suggestionId } : {}),
  } satisfies ReviewEvent;
}
