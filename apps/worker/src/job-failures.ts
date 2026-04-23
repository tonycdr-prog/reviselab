import { nowIso } from "@reviselab/core";

import { appendWorkerReviewEvent } from "./review-events";
import { requireSupabaseResult } from "./supabase";
import type {
  ParsePaperPayload,
  RunReviewPayload,
  WorkerAdminClient,
} from "./types";

export function getWorkerErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected worker failure.";
}

export async function markParseJobAttemptsExhausted(
  adminClient: WorkerAdminClient,
  payload: ParsePaperPayload,
  error: unknown,
) {
  const message = `Parsing did not complete after repeated worker attempts: ${getWorkerErrorMessage(error)}`;
  const versionRow = await requireSupabaseResult(
    adminClient
      .from("paper_versions")
      .select("id,paper_id")
      .eq("id", payload.versionId)
      .maybeSingle(),
    "Unable to load the exhausted parse job paper version.",
  );

  if (!versionRow) {
    return;
  }

  const pendingReviews = await requireSupabaseResult(
    adminClient
      .from("reviews")
      .select("id")
      .eq("paper_version_id", versionRow.id)
      .in("status", ["queued", "processing", "failed"]),
    "Unable to load reviews for the exhausted parse job.",
  );

  await requireSupabaseResult(
    adminClient
      .from("paper_versions")
      .update({
        parse_status: "failed",
        parse_error: message,
        updated_at: nowIso(),
      })
      .eq("id", versionRow.id),
    "Unable to mark the exhausted parse job as failed.",
  );

  await requireSupabaseResult(
    adminClient
      .from("reviews")
      .update({
        status: "failed",
        failed_reason: message,
        readiness: null,
        summary_json: null,
        ai_presence_summary_json: null,
        updated_at: nowIso(),
      })
      .eq("paper_version_id", versionRow.id)
      .in("status", ["queued", "processing", "failed"]),
    "Unable to mark reviews failed after parse attempts were exhausted.",
  );

  await Promise.all(
    (pendingReviews ?? []).map((review) =>
      appendWorkerReviewEvent(adminClient, {
        reviewId: review.id,
        kind: "parse_failed",
        detail: message,
      }),
    ),
  );
}

export async function markReviewJobAttemptsExhausted(
  adminClient: WorkerAdminClient,
  payload: RunReviewPayload,
  error: unknown,
) {
  const message = `Review did not complete after repeated worker attempts: ${getWorkerErrorMessage(error)}`;
  const reviewRow = await requireSupabaseResult(
    adminClient
      .from("reviews")
      .select("id")
      .eq("id", payload.reviewId)
      .maybeSingle(),
    "Unable to load the exhausted review job.",
  );

  if (!reviewRow) {
    return;
  }

  await requireSupabaseResult(
    adminClient
      .from("reviews")
      .update({
        status: "failed",
        failed_reason: message,
        readiness: null,
        summary_json: null,
        ai_presence_summary_json: null,
        updated_at: nowIso(),
      })
      .eq("id", reviewRow.id),
    "Unable to mark the exhausted review job as failed.",
  );

  await appendWorkerReviewEvent(adminClient, {
    reviewId: reviewRow.id,
    kind: "review_failed",
    detail: message,
  });
}
