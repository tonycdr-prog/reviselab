export type ReviewSeverity = "blocker" | "warning" | "info";
export type ReviewCheckState = "pass" | "warn" | "fail";
export type ReviewReadiness =
  | "Ready"
  | "Ready with revisions"
  | "High submission risk";
export type ReviewStatus = "queued" | "processing" | "ready" | "failed";
export type ReviewStage =
  | "parse-queued"
  | "parsing"
  | "review-queued"
  | "reviewing"
  | "failed-parse"
  | "failed-review"
  | "ready";
export type SuggestionOrigin = "rules" | "ai";
export type DiffStatus =
  | "unchanged"
  | "suggested"
  | "edited"
  | "accepted"
  | "rejected"
  | "resolved";
export type ReviewFilePath =
  | "title.md"
  | "abstract.md"
  | "metadata.yml"
  | "submission_notes.md";
export type PaperType =
  | "research"
  | "review"
  | "survey"
  | "position"
  | "technical-report";
export type ParseStatus =
  | "uploaded"
  | "queued"
  | "processing"
  | "parsed"
  | "failed";
export type PaperSourceKind = "pdf" | "latex-zip" | "selection";
export type SubmissionTarget = "arxiv";
export type ReviewEventKind =
  | "review_queued"
  | "parse_started"
  | "parse_completed"
  | "parse_failed"
  | "review_started"
  | "review_completed"
  | "review_failed"
  | "suggestion_applied"
  | "suggestion_rejected"
  | "suggestion_resolved"
  | "suggestion_restored"
  | "suggestion_edited";
export type SuggestionAction =
  | "apply"
  | "reject"
  | "resolve"
  | "restore"
  | "edit";
