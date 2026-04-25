import { appendWorkerReviewEvent } from "./review-events";
import { requireSupabaseResult } from "./supabase";
import type { WorkerAdminClient } from "./types";

export async function markPendingReviewsFailed(
  adminClient: WorkerAdminClient,
  input: {
    paperVersionId: string;
    message: string;
    eventKind: "parse_failed" | "review_failed";
    reviewIds: string[];
    persistenceMessage: string;
  },
) {
  await requireSupabaseResult(
    adminClient
      .from("reviews")
      .update({
        status: "failed",
        failed_reason: input.message,
        readiness: null,
        summary_json: null,
        ai_presence_summary_json: null,
        updated_at: new Date().toISOString(),
      })
      .eq("paper_version_id", input.paperVersionId)
      .in("status", ["queued", "processing"]),
    input.persistenceMessage,
  );

  for (const reviewId of input.reviewIds) {
    await appendWorkerReviewEvent(adminClient, {
      reviewId,
      kind: input.eventKind,
      detail: input.message,
    });
  }
}
