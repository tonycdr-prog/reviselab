import "server-only";

import {
  REVIEW_ENGINE_VERSION,
  nowIso,
  type DashboardReviewRow,
  type ReviewSnapshot,
} from "@reviselab/core";

import { appendReviewEvent } from "./repository-events";
import {
  createQueuedReviewSnapshot,
  createUploadedPaperRecord,
  mapDashboardReview,
  type ReviewCreateInput,
  type UploadInput,
} from "./repository-helpers";
import { assertLiveReviewRuntimeReady } from "./repository-live-runtime";
import {
  createIds,
  enqueueJob,
  getSupabaseStorageAdminClient,
  getSourceKind,
  isSupportedSourceFile,
  recordTelemetry,
  requireAuthenticatedContext,
} from "./repository-runtime";

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

export async function createUploadedPaper(input: UploadInput) {
  assertLiveReviewRuntimeReady();

  const ids = createIds();
  const createdAt = nowIso();
  const record = createUploadedPaperRecord(input, ids, createdAt);
  const auth = await requireAuthenticatedContext();
  const storageAdminClient = getSupabaseStorageAdminClient();

  if (!auth) {
    throw new Error("Sign in to upload a paper.");
  }

  if (!isSupportedSourceFile(input.file)) {
    throw new Error("Upload a PDF or LaTeX ZIP file.");
  }

  const sourcePath = `${auth.viewer.workspaceId}/${record.paperId}/${record.versionId}/${input.file.name}`;
  const sourceKind = getSourceKind(input.file);

  try {
    if (!storageAdminClient) {
      throw new Error("Storage administration is unavailable for uploads.");
    }

    const { error: uploadError } = await storageAdminClient.storage
      .from("paper-sources")
      .upload(sourcePath, input.file, {
        contentType: input.file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { error: paperError } = await auth.supabase.from("papers").insert({
      id: record.paperId,
      owner_user_id: auth.viewer.userId,
      workspace_id: auth.viewer.workspaceId,
      title: input.title,
      intended_category: input.intendedCategory,
      paper_type: input.paperType,
      first_time_submitter: input.firstTimeSubmitter,
    });

    if (paperError) {
      throw new Error(paperError.message);
    }

    const { error: versionError } = await auth.supabase
      .from("paper_versions")
      .insert({
        id: record.versionId,
        paper_id: record.paperId,
        source_kind: sourceKind,
        source_path: sourcePath,
        source_file_name: input.file.name,
        parse_status: "queued",
        parse_error: null,
        extracted_structure_json: {
          title: input.title,
          abstract: input.abstract,
          intendedCategory: input.intendedCategory,
          paperType: input.paperType,
          firstTimeSubmitter: input.firstTimeSubmitter,
        },
      });

    if (versionError) {
      throw new Error(versionError.message);
    }

    const wasQueued = await enqueueJob("parse_paper", {
      paperId: record.paperId,
      versionId: record.versionId,
      workspaceId: auth.viewer.workspaceId,
      ownerUserId: auth.viewer.userId,
    });

    if (!wasQueued) {
      throw new Error("The review worker queue is unavailable.");
    }

    await recordTelemetry(auth.viewer.workspaceId, "upload_created", {
      paperId: record.paperId,
      versionId: record.versionId,
      sourceKind,
      fileName: input.file.name,
    });

    return record;
  } catch (error) {
    const cleanupErrors: string[] = [];

    if (storageAdminClient) {
      const { error: storageCleanupError } = await storageAdminClient.storage
        .from("paper-sources")
        .remove([sourcePath]);

      if (storageCleanupError) {
        cleanupErrors.push(storageCleanupError.message);
      }
    }

    const { error: paperCleanupError } = await auth.supabase
      .from("papers")
      .delete()
      .eq("id", record.paperId);

    if (paperCleanupError) {
      cleanupErrors.push(paperCleanupError.message);
    }

    if (cleanupErrors.length > 0) {
      throw new Error(
        `${error instanceof Error ? error.message : "Paper upload failed."} Cleanup also failed: ${cleanupErrors.join("; ")}`,
      );
    }

    throw error;
  }
}

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
    await appendReviewEvent(auth.supabase, {
      reviewId,
      kind: "review_queued",
      detail: `Review created for ${input.title}.`,
    });

    if (versionRow.parse_status === "parsed") {
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
      versionRow.parse_status as ReviewSnapshot["progress"]["parseStatus"],
      "queued",
    );
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
