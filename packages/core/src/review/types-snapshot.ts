import type {
  ReviewCheck,
  ReviewComment,
  ReviewEvent,
  ReviewFile,
  ReviewProgress,
  ReviewSuggestion,
} from "./types-entities";
import type { NormalizedManuscript, SubmissionContext } from "./types-input";
import type { ReviewReadiness, ReviewStatus } from "./types-primitives";

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
