import "server-only";

import type { DashboardReviewRow, ReviewSnapshot } from "@reviselab/core";

import { mapDashboardReview } from "./repository-helpers";
import { assertLiveReviewRuntimeReady } from "./repository-live-runtime";
import { requireAuthenticatedContext } from "./repository-runtime";

export async function listDashboardReviews(): Promise<DashboardReviewRow[]> {
  assertLiveReviewRuntimeReady();

  const auth = await requireAuthenticatedContext();

  if (!auth) {
    return [];
  }

  const { data: reviews, error } = await auth.supabase
    .from("reviews")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  const versionIds = [
    ...new Set((reviews ?? []).map((review) => review.paper_version_id)),
  ];
  const { data: versions, error: versionsError } = versionIds.length
    ? await auth.supabase
        .from("paper_versions")
        .select(
          "id, parse_status, parse_error, paper_id, source_kind, source_path, source_file_name, parse_artifact_path, parser_engine, extracted_structure_json, created_at, updated_at",
        )
        .in("id", versionIds)
    : { data: [], error: null };

  if (versionsError) {
    throw new Error(versionsError.message);
  }

  const versionById = new Map(
    (versions ?? []).map((version) => [version.id, version]),
  );

  return (reviews ?? []).map((review) =>
    mapDashboardReview(
      review,
      versionById.get(review.paper_version_id) ?? null,
      (review.summary_json as Partial<ReviewSnapshot> | null) ?? null,
    ),
  );
}
