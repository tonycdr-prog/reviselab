import type { PaperSourceKind, PaperType } from "./types";

export const PAPER_TYPES = [
  "research",
  "review",
  "survey",
  "position",
  "technical-report",
] as const satisfies readonly PaperType[];

export const PAPER_SOURCE_KINDS = [
  "pdf",
  "latex-zip",
  "selection",
] as const satisfies readonly PaperSourceKind[];

export const PAPER_TYPE_LABELS: Record<PaperType, string> = {
  research: "Research article",
  review: "Review article",
  survey: "Survey",
  position: "Position paper",
  "technical-report": "Technical report",
};

export function getPaperTypeLabel(paperType: PaperType) {
  return PAPER_TYPE_LABELS[paperType];
}

export function isPaperType(value: string): value is PaperType {
  return PAPER_TYPES.includes(value as PaperType);
}

export function isPaperSourceKind(value: string): value is PaperSourceKind {
  return PAPER_SOURCE_KINDS.includes(value as PaperSourceKind);
}
