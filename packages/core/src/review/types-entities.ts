import type {
  DiffStatus,
  ReviewCheckState,
  ReviewEventKind,
  ReviewFilePath,
  PaperType,
  ParseStatus,
  ReviewReadiness,
  ReviewSeverity,
  ReviewStage,
  ReviewStatus,
  SuggestionOrigin,
} from "./types-primitives";

export type ReviewCheckEvidence = {
  label: string;
  value: string;
  severity?: ReviewSeverity;
  sourceUrl?: string;
};

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
  sourceCheckedAt: string;
  evidence: ReviewCheckEvidence[];
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
