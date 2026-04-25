import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  PAPER_ROW,
  REVIEW_ROW,
  countOperations,
  createMockClient,
  findUpdate,
  type MockClient,
} from "./repository-review-retry-mock";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  auth: { current: null as { supabase: MockClient } | null },
  admin: { current: null as MockClient | null },
  enqueueJob: vi.fn(),
  getReviewById: vi.fn(),
}));

vi.mock("@/lib/supabase/env", () => ({
  hasDatabaseConfig: () => true,
  hasSupabaseConfig: () => true,
}));

vi.mock("../../lib/reviews/repository-runtime", () => ({
  enqueueJob: mocks.enqueueJob,
  getSupabaseStorageAdminClient: () => mocks.admin.current,
  requireAuthenticatedContext: () => mocks.auth.current,
}));

vi.mock("../../lib/reviews/repository-review-read", () => ({
  getReviewById: mocks.getReviewById,
}));

async function loadRetryReview() {
  return (await import("../../lib/reviews/repository-review-retry"))
    .retryReview;
}

describe("retryReview", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.enqueueJob.mockReset().mockResolvedValue(true);
    mocks.getReviewById.mockReset().mockResolvedValue({ id: "snapshot" });
  });

  test("requeues parsing and clears dependent review artifacts after parse failure", async () => {
    const supabase = createMockClient({
      affectedReviews: [{ id: "review_1" }, { id: "review_2" }],
      paperRow: PAPER_ROW,
      reviewRow: REVIEW_ROW,
      versionRow: { id: "version_1", parse_status: "failed" },
    });
    const admin = createMockClient({});
    mocks.auth.current = { supabase };
    mocks.admin.current = admin;

    const retryReview = await loadRetryReview();
    await retryReview("review_1");

    expect(mocks.enqueueJob).toHaveBeenCalledWith("parse_paper", {
      ownerUserId: "user_1",
      paperId: "paper_1",
      versionId: "version_1",
      workspaceId: "workspace_1",
    });
    expect(countOperations(admin, (op) => op.action === "delete")).toBe(4);
    expect(findUpdate(supabase, "paper_versions")).toMatchObject({
      parse_error: null,
      parse_status: "queued",
    });
    expect(
      countOperations(
        supabase,
        (op) => op.table === "review_events" && op.action === "insert",
      ),
    ).toBe(2);
  });

  test("requeues only the selected review after review failure", async () => {
    const supabase = createMockClient({
      paperRow: PAPER_ROW,
      reviewRow: REVIEW_ROW,
      versionRow: { id: "version_1", parse_status: "parsed" },
    });
    const admin = createMockClient({});
    mocks.auth.current = { supabase };
    mocks.admin.current = admin;

    const retryReview = await loadRetryReview();
    await retryReview("review_1");

    expect(mocks.enqueueJob).toHaveBeenCalledWith("run_review", {
      reviewId: "review_1",
    });
    expect(countOperations(admin, (op) => op.action === "delete")).toBe(4);
    expect(findUpdate(supabase, "reviews")).toMatchObject({
      failed_reason: null,
      status: "queued",
    });
    expect(
      countOperations(
        supabase,
        (op) => op.table === "review_events" && op.action === "insert",
      ),
    ).toBe(1);
  });
});
