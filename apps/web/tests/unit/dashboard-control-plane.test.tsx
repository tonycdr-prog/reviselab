import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import type { DashboardReviewRow } from "@reviselab/core";
import { DashboardControlPlane } from "@reviselab/ui";

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
    progressLabel: "Ready",
  },
];

describe("DashboardControlPlane", () => {
  test("uses the supplied review href for row actions", () => {
    render(
      <DashboardControlPlane
        rows={rows}
        newReviewHref="/preview/upload-form"
        getReviewHref={() => "/preview/review-workspace"}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Options" }));

    expect(screen.getByRole("menuitem", { hidden: true })).toHaveAttribute(
      "href",
      "/preview/review-workspace",
    );
  });
});
