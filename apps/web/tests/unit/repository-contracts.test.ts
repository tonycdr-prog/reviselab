import { describe, expect, test } from "vitest";

import { isPaperType } from "@reviselab/core";

import {
  createQueuedReviewSnapshot,
  getReviewStatusForParseStatus,
} from "../../lib/reviews/repository-contracts";

describe("repository contracts", () => {
  test("maps uploaded parse work to a queued review status", () => {
    expect(getReviewStatusForParseStatus("uploaded")).toBe("queued");
    expect(getReviewStatusForParseStatus("queued")).toBe("queued");
    expect(getReviewStatusForParseStatus("processing")).toBe("queued");
    expect(getReviewStatusForParseStatus("parsed")).toBe("queued");
  });

  test("queued review snapshots keep queued copy for non-processing states", () => {
    const snapshot = createQueuedReviewSnapshot(
      "review_1",
      {
        paperId: "paper_1",
        versionId: "version_1",
        title: "Queued paper",
        abstract: "Queued abstract",
        intendedCategory: "cs.AI",
        paperType: "research",
        firstTimeSubmitter: false,
      },
      "queued",
    );

    expect(snapshot.status).toBe("queued");
    expect(snapshot.progress.stage).toBe("parse-queued");
    expect(snapshot.overview).toContain("waiting to start parsing");
  });

  test("validates paper type values", () => {
    expect(isPaperType("research")).toBe(true);
    expect(isPaperType("technical-report")).toBe(true);
    expect(isPaperType("essay")).toBe(false);
  });
});
