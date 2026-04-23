import { diffLines } from "diff";

import type {
  DiffStatus,
  ReviewDiffStats,
  ReviewReadiness,
  ReviewSeverity,
  ReviewSuggestion,
} from "./types";

export const CANONICAL_REVIEW_FILES = [
  "title.md",
  "abstract.md",
  "metadata.yml",
  "submission_notes.md",
] as const;

export const REVIEW_ENGINE_VERSION = "2026.04.23.1";

export function nowIso() {
  return new Date().toISOString();
}

let fallbackIdCounter = 0;

function randomIdFragment() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID().replaceAll("-", "").slice(0, 12);
  }

  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const bytes = new Uint8Array(8);
    globalThis.crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(36).padStart(2, "0")).join(
      "",
    );
  }

  fallbackIdCounter = (fallbackIdCounter + 1) % Number.MAX_SAFE_INTEGER;
  return `${Date.now().toString(36)}${fallbackIdCounter.toString(36)}`;
}

export function slugId(prefix: string) {
  return `${prefix}_${randomIdFragment()}`;
}

export function computeDiffStats(
  originalText: string,
  nextText: string,
): ReviewDiffStats {
  const changes = diffLines(originalText, nextText);
  let additions = 0;
  let deletions = 0;
  let changedLines = 0;

  for (const change of changes) {
    const lineCount = change.value
      .split(/\r?\n/)
      .filter((line) => line.length > 0).length;

    if (change.added) {
      additions += lineCount;
      changedLines += lineCount;
      continue;
    }

    if (change.removed) {
      deletions += lineCount;
      changedLines += lineCount;
    }
  }

  return {
    additions,
    deletions,
    changedLines,
  };
}

export function buildReadiness(
  checks: Array<{ state: "pass" | "warn" | "fail" }>,
): ReviewReadiness {
  if (checks.some((check) => check.state === "fail")) {
    return "High submission risk";
  }

  if (checks.some((check) => check.state === "warn")) {
    return "Ready with revisions";
  }

  return "Ready";
}

export function getSeverityWeight(severity: ReviewSeverity) {
  switch (severity) {
    case "blocker":
      return 3;
    case "warning":
      return 2;
    case "info":
      return 1;
  }
}

export function getStatusWeight(status: DiffStatus) {
  switch (status) {
    case "suggested":
      return 6;
    case "edited":
      return 5;
    case "accepted":
      return 4;
    case "rejected":
      return 3;
    case "resolved":
      return 2;
    case "unchanged":
      return 1;
  }
}

export function compareSuggestionPriority(
  left: ReviewSuggestion,
  right: ReviewSuggestion,
) {
  return (
    getSeverityWeight(right.severity) - getSeverityWeight(left.severity) ||
    getStatusWeight(right.status) - getStatusWeight(left.status) ||
    left.anchor.id.localeCompare(right.anchor.id)
  );
}
