import "server-only";

import { REVIEW_ENGINE_VERSION, type ReviewSnapshot } from "@reviselab/core";

import { completeReviewCreation } from "./repository-review-handoff";
import type { ReviewCreateInput } from "./repository-helpers";
import { assertLiveReviewRuntimeReady } from "./repository-live-runtime";
import { requireAuthenticatedContext } from "./repository-runtime";

export async function createReview(
  input: ReviewCreateInput,
): Promise<ReviewSnapshot> {
  assertLiveReviewRuntimeReady();

  const reviewId = `review_${crypto.randomUUID()}`;
  const auth = await requireAuthenticatedContext();

  if (!auth) {
    throw new Error("Sign in to create a review.");
  }

  const { data: versionRow, error: versionError } = await auth.supabase
    .from("paper_versions")
    .select("paper_id, parse_status, parse_error")
    .eq("id", input.versionId)
    .maybeSingle();

  if (versionError || !versionRow) {
    throw new Error(versionError?.message ?? "Paper version not found.");
  }

  if (versionRow.paper_id !== input.paperId) {
    throw new Error("Paper version does not match the selected paper.");
  }

  if (versionRow.parse_status === "failed") {
    throw new Error(
      versionRow.parse_error ?? "Paper parsing failed for this manuscript.",
    );
  }

  const { error: reviewError } = await auth.supabase.from("reviews").insert({
    id: reviewId,
    paper_id: input.paperId,
    paper_version_id: input.versionId,
    status: "queued",
    readiness: null,
    context_json: input,
    summary_json: null,
    ai_presence_summary_json: null,
    engine_version: REVIEW_ENGINE_VERSION,
  });

  if (reviewError) {
    throw new Error(reviewError.message);
  }

  try {
    return await completeReviewCreation(auth, reviewId, input);
  } catch (error) {
    const { error: cleanupError } = await auth.supabase
      .from("reviews")
      .delete()
      .eq("id", reviewId);

    if (cleanupError) {
      throw new Error(
        `${error instanceof Error ? error.message : "Review creation failed."} Cleanup also failed: ${cleanupError.message}`,
      );
    }

    throw error;
  }
}
