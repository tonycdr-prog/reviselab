import "server-only";

import { nowIso } from "@reviselab/core";

import {
  createUploadedPaperRecord,
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

export async function createUploadedPaper(input: UploadInput) {
  assertLiveReviewRuntimeReady();

  const ids = createIds();
  const createdAt = nowIso();
  const auth = await requireAuthenticatedContext();
  const storageAdminClient = getSupabaseStorageAdminClient();

  if (!auth) {
    throw new Error("Sign in to upload a paper.");
  }

  if (!isSupportedSourceFile(input.file)) {
    throw new Error("Upload a PDF or LaTeX ZIP file.");
  }

  const sourceKind = getSourceKind(input.file);
  const inputWithSourceKind = {
    ...input,
    targetServer: input.targetServer ?? "arxiv",
    sourceKind,
  };
  const record = createUploadedPaperRecord(inputWithSourceKind, ids, createdAt);
  const sourcePath = `${auth.viewer.workspaceId}/${record.paperId}/${record.versionId}/${input.file.name}`;

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
        extracted_structure_json: record.context,
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
