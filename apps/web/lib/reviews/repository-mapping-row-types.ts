import type { Database } from "@reviselab/core";

export type StoredPaperVersionRow =
  Database["public"]["Tables"]["paper_versions"]["Row"];
export type StoredReviewRow = Database["public"]["Tables"]["reviews"]["Row"];
export type StoredReviewFileRow =
  Database["public"]["Tables"]["review_files"]["Row"];
export type StoredReviewCheckRow =
  Database["public"]["Tables"]["review_checks"]["Row"];
export type StoredReviewSuggestionRow =
  Database["public"]["Tables"]["review_suggestions"]["Row"];
export type StoredReviewCommentRow =
  Database["public"]["Tables"]["review_comments"]["Row"];
export type StoredReviewEventRow =
  Database["public"]["Tables"]["review_events"]["Row"];
