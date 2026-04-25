import "server-only";

import { nowIso } from "@reviselab/core";

import { hasDatabaseConfig, hasSupabaseConfig } from "@/lib/supabase/env";

import { type requireAuthenticatedContext } from "./repository-runtime";

export type AuthenticatedReviewContext = NonNullable<
  Awaited<ReturnType<typeof requireAuthenticatedContext>>
>;

export function assertLiveReviewRuntimeReady() {
  if (!hasSupabaseConfig() || !hasDatabaseConfig()) {
    throw new Error(
      "ReviseLab live mode requires the local or remote Supabase stack and queue database to be configured.",
    );
  }
}

export async function clearReviewArtifacts(
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

export async function failParseRetryAfterQueueError(
  auth: AuthenticatedReviewContext,
  versionId: string,
  reviewIds: string[],
  message: string,
) {
  const { error: versionRollbackError } = await auth.supabase
    .from("paper_versions")
    .update({
      parse_status: "failed",
      parse_error: message,
    })
    .eq("id", versionId);
  const { error: reviewsRollbackError } = await auth.supabase
    .from("reviews")
    .update({
      status: "failed",
      failed_reason: message,
      updated_at: nowIso(),
    })
    .in("id", reviewIds);

  if (versionRollbackError || reviewsRollbackError) {
    throw new Error(
      `${message} Failed to restore failure state: ${
        versionRollbackError?.message ?? reviewsRollbackError?.message
      }`,
    );
  }
}

export async function failReviewRetryAfterQueueError(
  auth: AuthenticatedReviewContext,
  reviewId: string,
  message: string,
) {
  const { error } = await auth.supabase
    .from("reviews")
    .update({
      status: "failed",
      failed_reason: message,
      updated_at: nowIso(),
    })
    .eq("id", reviewId);

  if (error) {
    throw new Error(
      `${message} Failed to restore failure state: ${error.message}`,
    );
  }
}
