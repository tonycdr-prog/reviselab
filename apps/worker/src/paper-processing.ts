import type { NormalizedManuscript } from "@reviselab/core";

import { downloadSourceFile, uploadArtifact } from "./paper-files";
import { parseLatexArchive, parsePdfWithGrobid } from "./parsers";
import {
  buildFallbackSelectionManuscript,
  loadPaperVersion,
} from "./paper-version";
import { enqueueRunReview } from "./queue";
import { appendWorkerReviewEvent } from "./review-events";
import { requireSupabaseResult } from "./supabase";
import { recordUsageEvent } from "./telemetry";
import type {
  ParsePaperPayload,
  WorkerAdminClient,
  WorkerJobResult,
  WorkerSql,
} from "./types";

export async function parsePaperVersion(
  adminClient: WorkerAdminClient,
  sql: WorkerSql,
  payload: ParsePaperPayload,
): Promise<WorkerJobResult> {
  const loaded = await loadPaperVersion(adminClient, payload.versionId);

  if (!loaded) {
    return {
      shouldArchive: true,
      summary: `Skipped missing paper version ${payload.versionId}`,
    };
  }

  const { paperRow, versionRow } = loaded;
  const pendingReviews = await requireSupabaseResult(
    adminClient
      .from("reviews")
      .select("id")
      .eq("paper_version_id", versionRow.id)
      .in("status", ["queued", "processing"]),
    "Unable to load pending reviews for the paper version.",
  );

  if (versionRow.parse_status === "parsed" && versionRow.parse_artifact_path) {
    for (const review of pendingReviews ?? []) {
      await enqueueRunReview(sql, review.id);
    }

    return {
      shouldArchive: true,
      summary: `Queued reviews for already parsed version ${versionRow.id}`,
    };
  }

  await requireSupabaseResult(
    adminClient
      .from("paper_versions")
      .update({
        parse_status: "processing",
        parse_error: null,
      })
      .eq("id", versionRow.id),
    "Unable to mark the paper version as processing.",
  );

  await recordUsageEvent(adminClient, payload.workspaceId, "parse_started", {
    paperId: paperRow.id,
    versionId: versionRow.id,
    sourceKind: versionRow.source_kind,
  });

  for (const review of pendingReviews ?? []) {
    await appendWorkerReviewEvent(adminClient, {
      reviewId: review.id,
      kind: "parse_started",
      detail: `Parsing started for ${paperRow.title}.`,
    });
  }

  let parserEngine = "";
  let artifactPath = "";

  try {
    let parseResult:
      | {
          manuscript: NormalizedManuscript;
          parserEngine: string;
        }
      | undefined;

    if (versionRow.source_kind === "selection") {
      parseResult = {
        parserEngine: "selection-manifest",
        manuscript: buildFallbackSelectionManuscript(versionRow, paperRow),
      };
    } else {
      const fileBuffer = await downloadSourceFile(
        adminClient,
        versionRow.source_path,
      );

      if (!fileBuffer) {
        throw new Error("The uploaded source file is missing.");
      }

      if (versionRow.source_kind === "latex-zip") {
        parseResult = await parseLatexArchive(fileBuffer);
      } else {
        const extracted =
          (versionRow.extracted_structure_json as {
            title?: string;
            abstract?: string;
          } | null) ?? {};

        parseResult = await parsePdfWithGrobid(fileBuffer, {
          sourceKind: "pdf",
          title: extracted.title ?? paperRow.title,
          abstract: extracted.abstract ?? "",
          rawText: [
            extracted.title ?? paperRow.title,
            extracted.abstract ?? "",
          ].join("\n\n"),
        });
      }
    }

    artifactPath = await uploadArtifact(
      adminClient,
      paperRow.id,
      versionRow.id,
      parseResult.manuscript,
    );
    parserEngine = parseResult.parserEngine;

    await requireSupabaseResult(
      adminClient
        .from("paper_versions")
        .update({
          parse_status: "parsed",
          parser_engine: parserEngine,
          parse_artifact_path: artifactPath,
          parse_error: null,
          extracted_structure_json: {
            title: parseResult.manuscript.title,
            abstract: parseResult.manuscript.abstract,
            parseDiagnostics: parseResult.manuscript.parseDiagnostics,
            artifactPath,
          },
        })
        .eq("id", versionRow.id),
      "Unable to persist the parsed manuscript metadata.",
    );

    await recordUsageEvent(
      adminClient,
      payload.workspaceId,
      "parse_completed",
      {
        paperId: paperRow.id,
        versionId: versionRow.id,
        parserEngine,
        artifactPath,
      },
    );

    for (const review of pendingReviews ?? []) {
      await appendWorkerReviewEvent(adminClient, {
        reviewId: review.id,
        kind: "parse_completed",
        detail: `Parsing completed with ${parserEngine}.`,
      });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected parse failure.";

    await requireSupabaseResult(
      adminClient
        .from("paper_versions")
        .update({
          parse_status: "failed",
          parse_error: message,
        })
        .eq("id", versionRow.id),
      "Unable to persist the parse failure state.",
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
          updated_at: new Date().toISOString(),
        })
        .eq("paper_version_id", versionRow.id)
        .in("status", ["queued", "processing"]),
      "Unable to mark queued reviews as failed after parsing.",
    );

    await recordUsageEvent(adminClient, payload.workspaceId, "parse_failed", {
      paperId: paperRow.id,
      versionId: versionRow.id,
      error: message,
    });

    for (const review of pendingReviews ?? []) {
      await appendWorkerReviewEvent(adminClient, {
        reviewId: review.id,
        kind: "parse_failed",
        detail: message,
      });
    }

    return {
      shouldArchive: true,
      summary: `Persisted parse failure for paper version ${versionRow.id}`,
    };
  }

  try {
    for (const review of pendingReviews ?? []) {
      await enqueueRunReview(sql, review.id);
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "The review worker queue is unavailable.";

    await requireSupabaseResult(
      adminClient
        .from("reviews")
        .update({
          status: "failed",
          failed_reason: message,
          readiness: null,
          summary_json: null,
          ai_presence_summary_json: null,
          updated_at: new Date().toISOString(),
        })
        .eq("paper_version_id", versionRow.id)
        .in("status", ["queued", "processing"]),
      "Unable to mark pending reviews as failed after queue handoff failed.",
    );

    for (const review of pendingReviews ?? []) {
      await appendWorkerReviewEvent(adminClient, {
        reviewId: review.id,
        kind: "review_failed",
        detail: message,
      });
    }

    return {
      shouldArchive: true,
      summary: `Persisted review queue handoff failure for ${versionRow.id}`,
    };
  }

  return {
    shouldArchive: true,
    summary: `Parsed paper version ${versionRow.id}`,
  };
}
