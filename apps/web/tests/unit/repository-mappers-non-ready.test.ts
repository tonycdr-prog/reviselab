import { describe, expect, test } from "vitest";

import type { Database } from "@reviselab/core";

import { mapStoredReviewSnapshot } from "../../lib/reviews/repository-mappers";

type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];
type ReviewFileRow = Database["public"]["Tables"]["review_files"]["Row"];

describe("mapStoredReviewSnapshot non-ready reviews", () => {
  test("does not hydrate stale artifact rows for non-ready reviews", () => {
    const review = mapStoredReviewSnapshot(
      {
        id: "review_retrying",
        paper_id: "paper_retrying",
        paper_version_id: "version_retrying",
        status: "queued",
        readiness: null,
        context_json: null,
        summary_json: null,
        ai_presence_summary_json: null,
        engine_version: "test",
        failed_reason: null,
        created_at: "2026-04-23T12:00:00.000Z",
        updated_at: "2026-04-23T12:00:00.000Z",
      } as ReviewRow,
      {
        id: "version_retrying",
        paper_id: "paper_retrying",
        source_kind: "pdf",
        source_path: "paper-sources/paper_retrying/version_retrying/paper.pdf",
        source_file_name: "paper.pdf",
        parse_status: "queued",
        parse_error: null,
        parse_artifact_path: null,
        parser_engine: null,
        extracted_structure_json: null,
        created_at: "2026-04-23T12:00:00.000Z",
        updated_at: "2026-04-23T12:00:00.000Z",
      } as Database["public"]["Tables"]["paper_versions"]["Row"],
      [
        {
          id: "file_stale",
          review_id: "review_retrying",
          path: "abstract.md",
          title: "Abstract",
          severity: "warning",
          status: "suggested",
          change_count: 1,
          diff_stats_json: {
            additions: 1,
            deletions: 1,
            changedLines: 1,
          },
          base_text: "Old abstract",
          current_text: "Old suggestion",
          suggestion_ids_json: ["suggestion_stale"],
          created_at: "2026-04-23T12:00:00.000Z",
          updated_at: "2026-04-23T12:00:00.000Z",
        } as ReviewFileRow,
      ],
      [],
      [
        {
          id: "suggestion_stale",
          review_id: "review_retrying",
          review_file_id: "file_stale",
          file_path: "abstract.md",
          title: "Old suggestion",
          severity: "warning",
          rationale: "Old rationale",
          original_text: "Old abstract",
          suggested_text: "Old suggestion",
          edited_text: null,
          origin: "rules",
          status: "suggested",
          anchor_json: {
            id: "anchor_stale",
            filePath: "abstract.md",
            hunkHeader: "@@ -1,1 +1,1 @@",
            startLine: 1,
            endLine: 1,
            oldStartLine: 1,
            oldEndLine: 1,
            label: "Old suggestion",
          },
          diff_stats_json: {
            additions: 1,
            deletions: 1,
            changedLines: 1,
          },
          linked_check_ids_json: [],
          linked_comment_ids_json: [],
          explainability_json: null,
          applied_at: null,
          resolved_at: null,
          created_at: "2026-04-23T12:00:00.000Z",
          updated_at: "2026-04-23T12:00:00.000Z",
        } as Database["public"]["Tables"]["review_suggestions"]["Row"],
      ],
      [],
      [],
    );

    expect(review.progress.stage).toBe("parse-queued");
    expect(review.files).toEqual([]);
    expect(review.suggestions).toEqual([]);
  });
});
