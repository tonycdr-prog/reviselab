import {
  REVIEW_ENGINE_VERSION,
  generateReviewSnapshot,
  nowIso,
  type ReviewSnapshot,
} from "@reviselab/core";

import { loadPaperVersion, loadParsedManuscript } from "./paper-version";
import { getReviewContext } from "./review-context";
import { appendWorkerReviewEvent } from "./review-events";
import { persistReviewSnapshot } from "./review-snapshot-persistence";
import { requireSupabaseResult } from "./supabase";
import { recordUsageEvent } from "./telemetry";
import type { WorkerAdminClient, WorkerJobResult } from "./types";

export async function runReview(
  adminClient: WorkerAdminClient,
  reviewId: string,
): Promise<WorkerJobResult> {
  const reviewRow = await requireSupabaseResult(
    adminClient.from("reviews").select("*").eq("id", reviewId).maybeSingle(),
    "Unable to load the review before processing.",
  );

  if (!reviewRow) {
    return {
      shouldArchive: true,
      summary: `Skipped missing review ${reviewId}`,
    };
  }

  if (
    reviewRow.status === "ready" &&
    reviewRow.summary_json &&
    reviewRow.engine_version === REVIEW_ENGINE_VERSION
  ) {
    return {
      shouldArchive: true,
      summary: `Skipped already-ready review ${reviewId}`,
    };
  }

  const loaded = await loadPaperVersion(
    adminClient,
    reviewRow.paper_version_id,
  );

  if (!loaded) {
    await requireSupabaseResult(
      adminClient
        .from("reviews")
        .update({
          status: "failed",
          failed_reason: "Paper version was not found.",
          readiness: null,
          summary_json: null,
          ai_presence_summary_json: null,
        })
        .eq("id", reviewId),
      "Unable to mark the review as failed after a missing paper version.",
    );
    await appendWorkerReviewEvent(adminClient, {
      reviewId,
      kind: "review_failed",
      detail: "Paper version was not found.",
    });
    return {
      shouldArchive: true,
      summary: `Persisted missing-version failure for review ${reviewId}`,
    };
  }

  const { paperRow, versionRow } = loaded;
  const context = getReviewContext(reviewRow.context_json, paperRow);

  const startedAt = nowIso();

  await requireSupabaseResult(
    adminClient
      .from("reviews")
      .update({
        status: "processing",
        failed_reason: null,
        updated_at: startedAt,
      })
      .eq("id", reviewId),
    "Unable to mark the review as processing.",
  );

  await recordUsageEvent(adminClient, paperRow.workspace_id, "review_started", {
    reviewId,
    paperId: paperRow.id,
    versionId: versionRow.id,
  });
  await appendWorkerReviewEvent(adminClient, {
    reviewId,
    kind: "review_started",
    detail: `Review started for ${paperRow.title}.`,
    createdAt: startedAt,
  });

  try {
    const manuscript = await loadParsedManuscript(
      adminClient,
      versionRow,
      paperRow,
    );

    const snapshot = generateReviewSnapshot({
      paperId: paperRow.id,
      versionId: versionRow.id,
      reviewId,
      title: context.title,
      abstract: context.abstract,
      intendedCategory: context.intendedCategory,
      paperType: context.paperType,
      firstTimeSubmitter: context.firstTimeSubmitter,
      manuscript,
    });

    await persistReviewSnapshot(adminClient, snapshot);

    await recordUsageEvent(
      adminClient,
      paperRow.workspace_id,
      "review_completed",
      {
        reviewId,
        paperId: paperRow.id,
        readiness: snapshot.readiness,
        suggestionCount: snapshot.suggestions.length,
      },
    );
    await appendWorkerReviewEvent(adminClient, {
      reviewId,
      kind: "review_completed",
      detail: snapshot.readiness
        ? `${snapshot.readiness}. ${snapshot.overview}`
        : snapshot.overview,
      createdAt: snapshot.generatedAt,
    });

    for (const check of snapshot.checks) {
      await recordUsageEvent(adminClient, paperRow.workspace_id, "rule_hit", {
        reviewId,
        ruleId: check.ruleId,
        state: check.state,
      });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected review failure.";

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
        .eq("id", reviewId),
      "Unable to persist the review failure state.",
    );

    await recordUsageEvent(
      adminClient,
      paperRow.workspace_id,
      "review_failed",
      {
        reviewId,
        paperId: paperRow.id,
        error: message,
      },
    );
    await appendWorkerReviewEvent(adminClient, {
      reviewId,
      kind: "review_failed",
      detail: message,
    });

    return {
      shouldArchive: true,
      summary: `Persisted review failure for ${reviewId}`,
    };
  }

  return {
    shouldArchive: true,
    summary: `Processed review ${reviewId}`,
  };
}
