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

export const PAPER_TYPES = [
  "research",
  "review",
  "survey",
  "position",
  "technical-report",
] as const satisfies readonly PaperType[];

export const PAPER_TYPE_LABELS: Record<PaperType, string> = {
  research: "Research article",
  review: "Review article",
  survey: "Survey",
  position: "Position paper",
  "technical-report": "Technical report",
};

export function getPaperTypeLabel(paperType: PaperType) {
  return PAPER_TYPE_LABELS[paperType];
}

export function isPaperType(value: string): value is PaperType {
  return PAPER_TYPES.includes(value as PaperType);
}

export type ExplainabilityPayload = {
  summary: string;
  model: string;
  provider: string;
  generatedAt: string;
  inputScope: string[];
};

export type ReviewDiffStats = {
  additions: number;
  deletions: number;
  changedLines: number;
};

export type ReviewProgress = {
  stage: ReviewStage;
  parseStatus: ParseStatus;
  reviewStatus: ReviewStatus;
  label: string;
  description: string;
  canRetry: boolean;
  error?: string;
};

export type ReviewAnchor = {
  id: string;
  filePath: ReviewFilePath;
  hunkHeader: string;
  startLine: number;
  endLine: number;
  oldStartLine: number;
  oldEndLine: number;
  label: string;
};

export type ReviewCheck = {
  id: string;
  ruleId: string;
  ruleVersion: string;
  name: string;
  state: ReviewCheckState;
  severity: ReviewSeverity;
  summary: string;
  detail: string;
  sourceUrl: string;
  reviewFilePath?: ReviewFilePath;
  anchorId?: string;
  linkedSuggestionIds: string[];
};

export type ReviewSuggestion = {
  id: string;
  reviewFileId?: string;
  filePath: ReviewFilePath;
  title: string;
  severity: ReviewSeverity;
  rationale: string;
  originalText: string;
  suggestedText: string;
  editedText?: string;
  origin: SuggestionOrigin;
  status: DiffStatus;
  anchor: ReviewAnchor;
  diffStats: ReviewDiffStats;
  linkedCheckIds: string[];
  linkedCommentIds: string[];
  explainability?: ExplainabilityPayload;
};

export type ReviewComment = {
  id: string;
  ruleId: string;
  ruleVersion: string;
  target: string;
  filePath: ReviewFilePath;
  anchorId: string;
  severity: ReviewSeverity;
  body: string;
  sourceUrl?: string;
  linkedSuggestionIds: string[];
};

export type ReviewFile = {
  id: string;
  path: ReviewFilePath;
  title: string;
  severity: ReviewSeverity;
  status: DiffStatus;
  changeCount: number;
  diffStats: ReviewDiffStats;
  baseText: string;
  currentText: string;
  suggestionIds: string[];
};

export type ReviewHistoryItem = {
  id: string;
  kind: ReviewEventKind;
  label: string;
  createdAt: string;
  detail?: string;
  filePath?: ReviewFilePath;
  suggestionId?: string;
};

export type ReviewEvent = ReviewHistoryItem;

export type DashboardReviewRow = {
  id: string;
  paperId: string;
  title: string;
  intendedCategory: string;
  paperType: PaperType;
  stage: ReviewStage;
  status: ReviewStatus;
  readiness: ReviewReadiness | null;
  parseStatus: ParseStatus;
  updatedAt: string;
  suggestionCount: number;
  checkCount: number;
  commentCount: number;
  failedReason: string | null;
  progressLabel: string;
};

export type SubmissionContext = {
  title: string;
  abstract: string;
  intendedCategory: string;
  paperType: PaperType;
  firstTimeSubmitter: boolean;
};

export type NormalizedSection = {
  title: string;
  level: number;
  text: string;
};

export type NormalizedAuthor = {
  name: string;
  affiliation?: string;
};

export type NormalizedManuscript = {
  sourceKind: PaperSourceKind;
  title: string;
  abstract: string;
  authors: NormalizedAuthor[];
  sections: NormalizedSection[];
  references: string[];
  rawText: string;
  parseDiagnostics: string[];
  artifactPath?: string;
};

export type ReviewSnapshot = {
  id: string;
  paperId: string;
  versionId: string;
  status: ReviewStatus;
  readiness: ReviewReadiness | null;
  progress: ReviewProgress;
  generatedAt: string;
  context: SubmissionContext;
  overview: string;
  manuscript?: NormalizedManuscript;
  files: ReviewFile[];
  checks: ReviewCheck[];
  suggestions: ReviewSuggestion[];
  comments: ReviewComment[];
  history: ReviewEvent[];
  aiPresenceSummary?: {
    hasAiSuggestions: boolean;
    aiSuggestionCount: number;
    generatedAt: string;
  };
};

export type ReviewInput = SubmissionContext & {
  paperId: string;
  versionId: string;
  reviewId?: string;
  manuscript?: NormalizedManuscript;
};

export type UploadedPaperRecord = {
  paperId: string;
  versionId: string;
  fileName?: string;
  createdAt: string;
  context: SubmissionContext;
};
