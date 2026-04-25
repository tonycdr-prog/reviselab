import { REVIEW_ENGINE_VERSION, type ReviewSnapshot } from "@reviselab/core";

import { requireSupabaseResult } from "./supabase";
import type { WorkerAdminClient } from "./types";

function buildAiPresenceSummary(snapshot: ReviewSnapshot) {
  return {
    hasAiSuggestions: snapshot.suggestions.some(
      (suggestion) => suggestion.origin === "ai",
    ),
    aiSuggestionCount: snapshot.suggestions.filter(
      (suggestion) => suggestion.origin === "ai",
    ).length,
    generatedAt: snapshot.generatedAt,
  };
}

export async function persistReviewSnapshot(
  adminClient: WorkerAdminClient,
  snapshot: ReviewSnapshot,
) {
  const fileIdByPath = new Map(
    snapshot.files.map((file) => [file.path, file.id]),
  );

  await requireSupabaseResult(
    adminClient.from("review_comments").delete().eq("review_id", snapshot.id),
    "Unable to clear existing review comments.",
  );
  await requireSupabaseResult(
    adminClient.from("review_checks").delete().eq("review_id", snapshot.id),
    "Unable to clear existing review checks.",
  );
  await requireSupabaseResult(
    adminClient
      .from("review_suggestions")
      .delete()
      .eq("review_id", snapshot.id),
    "Unable to clear existing review suggestions.",
  );
  await requireSupabaseResult(
    adminClient.from("review_files").delete().eq("review_id", snapshot.id),
    "Unable to clear existing review files.",
  );

  if (snapshot.files.length > 0) {
    await requireSupabaseResult(
      adminClient.from("review_files").insert(
        snapshot.files.map((file) => ({
          id: file.id,
          review_id: snapshot.id,
          path: file.path,
          title: file.title,
          severity: file.severity,
          status: file.status,
          change_count: file.changeCount,
          diff_stats_json: file.diffStats,
          base_text: file.baseText,
          current_text: file.currentText,
          suggestion_ids_json: file.suggestionIds,
        })),
      ),
      "Unable to persist review files.",
    );
  }

  if (snapshot.suggestions.length > 0) {
    await requireSupabaseResult(
      adminClient.from("review_suggestions").insert(
        snapshot.suggestions.map((suggestion) => ({
          id: suggestion.id,
          review_id: snapshot.id,
          review_file_id: fileIdByPath.get(suggestion.filePath) ?? null,
          file_path: suggestion.filePath,
          title: suggestion.title,
          severity: suggestion.severity,
          rationale: suggestion.rationale,
          original_text: suggestion.originalText,
          suggested_text: suggestion.suggestedText,
          edited_text: suggestion.editedText ?? null,
          origin: suggestion.origin,
          status: suggestion.status,
          anchor_json: suggestion.anchor,
          diff_stats_json: suggestion.diffStats,
          linked_check_ids_json: suggestion.linkedCheckIds,
          linked_comment_ids_json: suggestion.linkedCommentIds,
          explainability_json: suggestion.explainability ?? null,
        })),
      ),
      "Unable to persist review suggestions.",
    );
  }

  if (snapshot.checks.length > 0) {
    await requireSupabaseResult(
      adminClient.from("review_checks").insert(
        snapshot.checks.map((check) => ({
          id: check.id,
          review_id: snapshot.id,
          review_file_id: check.reviewFilePath
            ? (fileIdByPath.get(check.reviewFilePath) ?? null)
            : null,
          rule_id: check.ruleId,
          rule_version: check.ruleVersion,
          name: check.name,
          state: check.state,
          severity: check.severity,
          summary: check.summary,
          detail: check.detail,
          source_url: check.sourceUrl,
          source_checked_at: check.sourceCheckedAt,
          evidence_json: check.evidence,
          anchor_id: check.anchorId ?? null,
          linked_suggestion_ids_json: check.linkedSuggestionIds,
        })),
      ),
      "Unable to persist review checks.",
    );
  }

  if (snapshot.comments.length > 0) {
    await requireSupabaseResult(
      adminClient.from("review_comments").insert(
        snapshot.comments.map((comment) => {
          const reviewFileId = fileIdByPath.get(comment.filePath);

          if (!reviewFileId) {
            throw new Error(
              `Unable to persist comment ${comment.id} because file ${comment.filePath} is missing.`,
            );
          }

          return {
            id: comment.id,
            review_id: snapshot.id,
            review_file_id: reviewFileId,
            file_path: comment.filePath,
            anchor_id: comment.anchorId,
            rule_id: comment.ruleId,
            rule_version: comment.ruleVersion,
            target: comment.target,
            severity: comment.severity,
            body: comment.body,
            source_url: comment.sourceUrl ?? null,
            linked_suggestion_ids_json: comment.linkedSuggestionIds,
          };
        }),
      ),
      "Unable to persist review comments.",
    );
  }

  await requireSupabaseResult(
    adminClient
      .from("reviews")
      .update({
        status: snapshot.status,
        readiness: snapshot.readiness,
        summary_json: snapshot,
        ai_presence_summary_json: buildAiPresenceSummary(snapshot),
        engine_version: REVIEW_ENGINE_VERSION,
        failed_reason: null,
        updated_at: snapshot.generatedAt,
      })
      .eq("id", snapshot.id),
    "Unable to finalize the review snapshot.",
  );
}
