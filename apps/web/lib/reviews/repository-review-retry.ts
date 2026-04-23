import "server-only";

import { nowIso } from "@reviselab/core";

import { hasDatabaseConfig, hasSupabaseConfig } from "@/lib/supabase/env";

import { appendReviewEvent } from "./repository-events";
import { getReviewById } from "./repository-review-read";
import {
  enqueueJob,
  getSupabaseStorageAdminClient,
  requireAuthenticatedContext,
} from "./repository-runtime";

type AuthenticatedReviewContext = NonNullable<
  Awaited<ReturnType<typeof requireAuthenticatedContext>>
>;

function assertLiveReviewRuntimeReady() {
  if (!hasSupabaseConfig() || !hasDatabaseConfig()) {
    throw new Error(
      "ReviseLab live mode requires the local or remote Supabase stack and queue database to be configured.",
    );
  }
}

async function clearReviewArtifacts(
  supabase: AuthenticatedReviewContext["supabase"],
  reviewIds: string[],
) {
  if (reviewIds.length === 0) {
    return;
  }

  const tables = [
    "review_comments",
    "review_checks",
    "review_suggestions",
    "review_files",
  ] as const;

  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .in("review_id", reviewIds);

    if (error) {
      throw new Error(error.message);
    }
  }
}

export async function retryReview(reviewId: string) {
  assertLiveReviewRuntimeReady();

  const auth = await requireAuthenticatedContext();

  if (!auth) {
    throw new Error("Sign in to retry a review.");
  }

  const adminClient = getSupabaseStorageAdminClient();

  if (!adminClient) {
    throw new Error(
      "Privileged server access is unavailable for review retries.",
    );
  }

  const { data: reviewRow, error: reviewError } = await auth.supabase
    .from("reviews")
    .select("id,paper_id,paper_version_id,status,failed_reason")
    .eq("id", reviewId)
    .maybeSingle();

  if (reviewError || !reviewRow) {
    throw new Error(reviewError?.message ?? "Review not found.");
  }

  const { data: paperRow, error: paperError } = await auth.supabase
    .from("papers")
    .select("workspace_id,owner_user_id,title")
    .eq("id", reviewRow.paper_id)
    .maybeSingle();

  if (paperError || !paperRow?.workspace_id || !paperRow.owner_user_id) {
    throw new Error(paperError?.message ?? "Paper ownership is unavailable.");
  }

  const { data: versionRow, error: versionError } = await auth.supabase
    .from("paper_versions")
    .select("id,parse_status,parse_error")
    .eq("id", reviewRow.paper_version_id)
    .maybeSingle();

  if (versionError || !versionRow) {
    throw new Error(versionError?.message ?? "Paper version not found.");
  }

  const timestamp = nowIso();

  if (versionRow.parse_status === "failed") {
    const { data: affectedReviews, error: affectedReviewsError } =
      await auth.supabase
        .from("reviews")
        .select("id")
        .eq("paper_version_id", versionRow.id)
        .in("status", ["failed", "queued", "processing"]);

    if (affectedReviewsError) {
      throw new Error(affectedReviewsError.message);
    }

    const retryReviewIds = (affectedReviews ?? []).map((review) => review.id);
    if (!retryReviewIds.includes(reviewId)) {
      retryReviewIds.push(reviewId);
    }
    await clearReviewArtifacts(adminClient, retryReviewIds);

    const { error: versionUpdateError } = await auth.supabase
      .from("paper_versions")
      .update({
        parse_status: "queued",
        parse_error: null,
      })
      .eq("id", versionRow.id);

    if (versionUpdateError) {
      throw new Error(versionUpdateError.message);
    }

    const { error: reviewUpdateError } = await auth.supabase
      .from("reviews")
      .update({
        status: "queued",
        failed_reason: null,
        readiness: null,
        summary_json: null,
        ai_presence_summary_json: null,
        updated_at: timestamp,
      })
      .eq("paper_version_id", versionRow.id)
      .in("status", ["failed", "queued", "processing"]);

    if (reviewUpdateError) {
      throw new Error(reviewUpdateError.message);
    }

    const wasQueued = await enqueueJob("parse_paper", {
      paperId: reviewRow.paper_id,
      versionId: versionRow.id,
      workspaceId: paperRow.workspace_id,
      ownerUserId: paperRow.owner_user_id,
    });

    if (!wasQueued) {
      const queueFailureMessage = "The review worker queue is unavailable.";
      const { error: versionRollbackError } = await auth.supabase
        .from("paper_versions")
        .update({
          parse_status: "failed",
          parse_error: queueFailureMessage,
        })
        .eq("id", versionRow.id);
      const { error: reviewsRollbackError } = await auth.supabase
        .from("reviews")
        .update({
          status: "failed",
          failed_reason: queueFailureMessage,
          updated_at: nowIso(),
        })
        .in("id", retryReviewIds);

      if (versionRollbackError || reviewsRollbackError) {
        throw new Error(
          `${queueFailureMessage} Failed to restore failure state: ${
            versionRollbackError?.message ?? reviewsRollbackError?.message
          }`,
        );
      }

      throw new Error(queueFailureMessage);
    }

    await Promise.all(
      retryReviewIds.map((nextReviewId) =>
        appendReviewEvent(auth.supabase, {
          reviewId: nextReviewId,
          kind: "review_queued",
          detail: "Retry requested after a parse failure.",
          createdAt: timestamp,
        }),
      ),
    );

    return getReviewById(reviewId);
  }

  if (reviewRow.status !== "failed") {
    throw new Error("Only failed reviews can be retried.");
  }

  await clearReviewArtifacts(adminClient, [reviewId]);

  const { error: reviewUpdateError } = await auth.supabase
    .from("reviews")
    .update({
      status: "queued",
      failed_reason: null,
      readiness: null,
      summary_json: null,
      ai_presence_summary_json: null,
      updated_at: timestamp,
    })
    .eq("id", reviewId);

  if (reviewUpdateError) {
    throw new Error(reviewUpdateError.message);
  }

  const wasQueued = await enqueueJob("run_review", {
    reviewId,
  });

  if (!wasQueued) {
    const queueFailureMessage = "The review worker queue is unavailable.";
    const { error: reviewRollbackError } = await auth.supabase
      .from("reviews")
      .update({
        status: "failed",
        failed_reason: queueFailureMessage,
        updated_at: nowIso(),
      })
      .eq("id", reviewId);

    if (reviewRollbackError) {
      throw new Error(
        `${queueFailureMessage} Failed to restore failure state: ${reviewRollbackError.message}`,
      );
    }

    throw new Error(queueFailureMessage);
  }

  await appendReviewEvent(auth.supabase, {
    reviewId,
    kind: "review_queued",
    detail: "Retry requested after a review failure.",
    createdAt: timestamp,
  });

  return getReviewById(reviewId);
}
