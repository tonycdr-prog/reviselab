import { describe, expect, test } from "vitest";

import type { Database } from "@reviselab/core";

import { mapStoredReviewSnapshot } from "../../lib/reviews/repository-mappers";

type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];
type ReviewFileRow = Database["public"]["Tables"]["review_files"]["Row"];
type ReviewCheckRow = Database["public"]["Tables"]["review_checks"]["Row"];

describe("mapStoredReviewSnapshot", () => {
  test("rehydrates a check file path from the stored review file id", () => {
    const review = mapStoredReviewSnapshot(
      {
        id: "review_1",
        paper_id: "paper_1",
        paper_version_id: "version_1",
        status: "ready",
        readiness: "Ready with revisions",
        context_json: null,
        summary_json: null,
        ai_presence_summary_json: null,
        engine_version: "test",
        failed_reason: null,
        created_at: "2026-04-23T12:00:00.000Z",
        updated_at: "2026-04-23T12:00:00.000Z",
      } as ReviewRow,
      {
        id: "version_1",
        paper_id: "paper_1",
        source_kind: "pdf",
        source_path: "paper-sources/paper_1/version_1/paper.pdf",
        source_file_name: "paper.pdf",
        parse_status: "parsed",
        parse_error: null,
        parse_artifact_path: null,
        parser_engine: "grobid",
        extracted_structure_json: null,
        created_at: "2026-04-23T12:00:00.000Z",
        updated_at: "2026-04-23T12:00:00.000Z",
      } as Database["public"]["Tables"]["paper_versions"]["Row"],
      [
        {
          id: "file_abstract",
          review_id: "review_1",
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
          base_text: "Original abstract",
          current_text: "Suggested abstract",
          suggestion_ids_json: [],
          created_at: "2026-04-23T12:00:00.000Z",
          updated_at: "2026-04-23T12:00:00.000Z",
        } as ReviewFileRow,
      ],
      [
        {
          id: "check_1",
          review_id: "review_1",
          review_file_id: "file_abstract",
          rule_id: "rule.abstract",
          rule_version: "1.0.0",
          name: "Abstract clarity",
          state: "warn",
          severity: "warning",
          summary: "Clarify the abstract.",
          detail: "The abstract needs tighter wording.",
          source_url: "https://example.com/policy",
          anchor_id: "anchor_1",
          linked_suggestion_ids_json: [],
          created_at: "2026-04-23T12:00:00.000Z",
          updated_at: "2026-04-23T12:00:00.000Z",
        } as ReviewCheckRow,
      ],
      [],
      [],
      [],
    );

    expect(review.checks[0]?.reviewFilePath).toBe("abstract.md");
    expect(review.checks[0]?.anchorId).toBe("anchor_1");
  });

  test("falls back to the stored summary snapshot when related rows are unavailable", () => {
    const review = mapStoredReviewSnapshot(
      {
        id: "review_2",
        paper_id: "paper_2",
        paper_version_id: "version_2",
        status: "ready",
        readiness: "Ready with revisions",
        context_json: null,
        summary_json: {
          files: [
            {
              id: "file_summary",
              path: "title.md",
              title: "Title",
              severity: "info",
              status: "suggested",
              changeCount: 1,
              diffStats: {
                additions: 1,
                deletions: 0,
                changedLines: 1,
              },
              baseText: "Original title",
              currentText: "Suggested title",
              suggestionIds: ["suggestion_summary"],
            },
          ],
          suggestions: [
            {
              id: "suggestion_summary",
              filePath: "title.md",
              title: "Tighten title wording",
              severity: "info",
              rationale: "Keep the title concise.",
              originalText: "Original title",
              suggestedText: "Suggested title",
              origin: "rules",
              status: "suggested",
              anchor: {
                id: "anchor_summary",
                filePath: "title.md",
                hunkHeader: "@@ -1,1 +1,1 @@",
                startLine: 1,
                endLine: 1,
                oldStartLine: 1,
                oldEndLine: 1,
                label: "Tighten title wording",
              },
              diffStats: {
                additions: 1,
                deletions: 0,
                changedLines: 1,
              },
              linkedCheckIds: [],
              linkedCommentIds: [],
            },
          ],
        },
        ai_presence_summary_json: null,
        engine_version: "test",
        failed_reason: null,
        created_at: "2026-04-23T12:00:00.000Z",
        updated_at: "2026-04-23T12:00:00.000Z",
      } as ReviewRow,
      {
        id: "version_2",
        paper_id: "paper_2",
        source_kind: "pdf",
        source_path: "paper-sources/paper_2/version_2/paper.pdf",
        source_file_name: "paper.pdf",
        parse_status: "parsed",
        parse_error: null,
        parse_artifact_path: null,
        parser_engine: "grobid",
        extracted_structure_json: null,
        created_at: "2026-04-23T12:00:00.000Z",
        updated_at: "2026-04-23T12:00:00.000Z",
      } as Database["public"]["Tables"]["paper_versions"]["Row"],
      [],
      [],
      [],
      [],
      [],
    );

    expect(review.files).toHaveLength(1);
    expect(review.files[0]?.path).toBe("title.md");
    expect(review.suggestions[0]?.id).toBe("suggestion_summary");
  });

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
