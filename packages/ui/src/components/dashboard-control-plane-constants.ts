import type {
  DashboardReviewRow,
  PaperType,
  ReviewReadiness,
  ReviewStage,
} from "@reviselab/core";

export const PAGE_SIZES = [10, 25, 50];
export const DEFAULT_PAGE_SIZE = 10;

export const TABLE_HEADERS = [
  { key: "title", header: "Manuscript" },
  { key: "category", header: "Category" },
  { key: "paperType", header: "Paper type" },
  { key: "stage", header: "Stage" },
  { key: "readiness", header: "Readiness" },
  { key: "updatedAt", header: "Updated" },
  { key: "changes", header: "Changes" },
  { key: "actions", header: "Actions" },
] as const;

export const STAGE_OPTIONS: Array<{
  label: string;
  value: ReviewStage | "all";
}> = [
  { label: "All stages", value: "all" },
  { label: "Queued", value: "parse-queued" },
  { label: "Parsing", value: "parsing" },
  { label: "Review queued", value: "review-queued" },
  { label: "Reviewing", value: "reviewing" },
  { label: "Failed parse", value: "failed-parse" },
  { label: "Failed review", value: "failed-review" },
  { label: "Ready", value: "ready" },
];

export const READINESS_OPTIONS: Array<{
  label: string;
  value: ReviewReadiness | "all";
}> = [
  { label: "All readiness", value: "all" },
  { label: "Ready", value: "Ready" },
  { label: "Ready with revisions", value: "Ready with revisions" },
  { label: "High submission risk", value: "High submission risk" },
];

export const PAPER_TYPE_OPTIONS: Array<{
  label: string;
  value: PaperType | "all";
}> = [
  { label: "All paper types", value: "all" },
  { label: "Research article", value: "research" },
  { label: "Review article", value: "review" },
  { label: "Survey", value: "survey" },
  { label: "Position paper", value: "position" },
  { label: "Technical report", value: "technical-report" },
];

export function getPaperTypeLabel(value: DashboardReviewRow["paperType"]) {
  switch (value) {
    case "research":
      return "Research article";
    case "review":
      return "Review article";
    case "survey":
      return "Survey";
    case "position":
      return "Position paper";
    case "technical-report":
      return "Technical report";
  }
}
