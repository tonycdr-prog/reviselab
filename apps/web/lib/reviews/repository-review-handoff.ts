import "server-only";

import { nowIso, type ParseStatus, type ReviewSnapshot } from "@reviselab/core";

import { appendReviewEvent } from "./repository-events";
import {
  createQueuedReviewSnapshot,
  getReviewStatusForParseStatus,
  type ReviewCreateInput,
} from "./repository-helpers";
import {
  enqueueJob,
  type requireAuthenticatedContext,
} from "./repository-runtime";

type AuthenticatedContext = NonNullable<
  Awaited<ReturnType<typeof requireAuthenticatedContext>>
>;

export async function completeReviewCreation(
  auth: AuthenticatedContext,
  reviewId: string,
  input: ReviewCreateInput,
): Promise<ReviewSnapshot> {
  await appendReviewEvent(auth.supabase, {
    reviewId,
    kind: "review_queued",
    detail: `Review created for ${input.title}.`,
  });

  const { data: currentVersionRow, error: currentVersionError } =
    await auth.supabase
      .from("paper_versions")
      .select("parse_status, parse_error")
      .eq("id", input.versionId)
      .maybeSingle();

  if (currentVersionError || !currentVersionRow) {
    throw new Error(currentVersionError?.message ?? "Paper version not found.");
  }

  const parseStatus = currentVersionRow.parse_status as ParseStatus;

  if (parseStatus === "failed") {
    const { error: failedReviewError } = await auth.supabase
      .from("reviews")
      .update({
        status: "failed",
        failed_reason:
          currentVersionRow.parse_error ??
          "Paper parsing failed for this manuscript.",
        readiness: null,
        summary_json: null,
        ai_presence_summary_json: null,
        updated_at: nowIso(),
      })
      .eq("id", reviewId);

    if (failedReviewError) {
      throw new Error(failedReviewError.message);
    }
  }

  if (parseStatus === "parsed") {
    const wasQueued = await enqueueJob("run_review", {
      reviewId,
    });

    if (!wasQueued) {
      throw new Error("The review worker queue is unavailable.");
    }
  }

  return createQueuedReviewSnapshot(
    reviewId,
    input,
    parseStatus,
    getReviewStatusForParseStatus(parseStatus),
  );
}
