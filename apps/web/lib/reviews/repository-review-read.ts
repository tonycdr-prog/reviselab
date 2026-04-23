import "server-only";

import type { ReviewSnapshot } from "@reviselab/core";

import { hasSupabaseConfig } from "@/lib/supabase/env";

import { mapStoredReviewSnapshot } from "./repository-mappers";
import { requireAuthenticatedContext } from "./repository-runtime";

export async function getReviewById(
  reviewId: string,
): Promise<ReviewSnapshot | null> {
  if (!hasSupabaseConfig()) {
    throw new Error(
      "ReviseLab live mode requires a configured local or remote Supabase stack.",
    );
  }

  const auth = await requireAuthenticatedContext();
  if (!auth) {
    return null;
  }

  const { data: reviewRow, error: reviewError } = await auth.supabase
    .from("reviews")
    .select("*")
    .eq("id", reviewId)
    .maybeSingle();

  if (reviewError) {
    throw new Error(reviewError.message);
  }

  if (!reviewRow) {
    return null;
  }

  const [
    versionResult,
    filesResult,
    checksResult,
    suggestionsResult,
    commentsResult,
    eventsResult,
  ] = await Promise.all([
    auth.supabase
      .from("paper_versions")
      .select(
        "id, parse_status, parse_error, parse_artifact_path, parser_engine, source_kind, source_path, source_file_name, extracted_structure_json, created_at, updated_at, paper_id",
      )
      .eq("id", reviewRow.paper_version_id)
      .maybeSingle(),
    auth.supabase.from("review_files").select("*").eq("review_id", reviewId),
    auth.supabase.from("review_checks").select("*").eq("review_id", reviewId),
    auth.supabase
      .from("review_suggestions")
      .select("*")
      .eq("review_id", reviewId),
    auth.supabase.from("review_comments").select("*").eq("review_id", reviewId),
    auth.supabase
      .from("review_events")
      .select("*")
      .eq("review_id", reviewId)
      .order("created_at", { ascending: false }),
  ]);

  if (versionResult.error) {
    throw new Error(versionResult.error.message);
  }

  if (
    filesResult.error ||
    checksResult.error ||
    suggestionsResult.error ||
    commentsResult.error ||
    eventsResult.error
  ) {
    return mapStoredReviewSnapshot(
      reviewRow,
      versionResult.data ?? null,
      [],
      [],
      [],
      [],
      [],
    );
  }

  return mapStoredReviewSnapshot(
    reviewRow,
    versionResult.data ?? null,
    filesResult.data ?? [],
    checksResult.data ?? [],
    suggestionsResult.data ?? [],
    commentsResult.data ?? [],
    eventsResult.data ?? [],
  );
}
