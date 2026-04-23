import { describe, expect, test } from "vitest";

import type { DashboardReviewRow } from "@reviselab/core";

import {
  filterDashboardRows,
  paginateDashboardRows,
} from "../../../../packages/ui/src/components/dashboard-control-plane-helpers";

const rows: DashboardReviewRow[] = [
  {
    id: "review_1",
    paperId: "paper_1",
    title: "Benchmarking retrieval review",
    intendedCategory: "cs.AI",
    paperType: "research",
    stage: "ready",
    status: "ready",
    readiness: "Ready with revisions",
    parseStatus: "parsed",
    updatedAt: "2026-04-23T09:00:00.000Z",
    suggestionCount: 3,
    checkCount: 2,
    commentCount: 1,
    failedReason: null,
    progressLabel: "Ready with revisions",
  },
  {
    id: "review_2",
    paperId: "paper_2",
    title: "Queue health for scientific review",
    intendedCategory: "cs.DL",
    paperType: "technical-report",
    stage: "review-queued",
    status: "queued",
    readiness: null,
    parseStatus: "parsed",
    updatedAt: "2026-04-23T10:00:00.000Z",
    suggestionCount: 0,
    checkCount: 0,
    commentCount: 0,
    failedReason: null,
    progressLabel: "Review queued",
  },
  {
    id: "review_3",
    paperId: "paper_3",
    title: "Failed parse example",
    intendedCategory: "cs.CL",
    paperType: "survey",
    stage: "failed-parse",
    status: "failed",
    readiness: null,
    parseStatus: "failed",
    updatedAt: "2026-04-23T08:00:00.000Z",
    suggestionCount: 0,
    checkCount: 0,
    commentCount: 0,
    failedReason: "GROBID unavailable.",
    progressLabel: "Failed parse",
  },
];

describe("dashboard control plane helpers", () => {
  test("filters rows and keeps the newest rows first", () => {
    const filtered = filterDashboardRows(rows, {
      searchTerm: "review",
      stageFilter: "all",
      readinessFilter: "all",
      paperTypeFilter: "all",
    });

    expect(filtered.map((row) => row.id)).toEqual(["review_2", "review_1"]);
  });

  test("clamps pagination to the last available page", () => {
    const filtered = filterDashboardRows(rows, {
      searchTerm: "",
      stageFilter: "all",
      readinessFilter: "all",
      paperTypeFilter: "all",
    });

    const paginated = paginateDashboardRows(filtered, 4, 2);

    expect(paginated.currentPage).toBe(2);
    expect(paginated.totalPages).toBe(2);
    expect(paginated.paginatedRows.map((row) => row.id)).toEqual(["review_3"]);
  });
});
