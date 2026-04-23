import type {
  NormalizedManuscript,
  ReviewCheck,
  ReviewComment,
  ReviewInput,
  ReviewSuggestion,
} from "./types";
import { REVIEW_ENGINE_VERSION } from "./utils";

export type RuleResult = {
  checks?: ReviewCheck[];
  suggestions?: ReviewSuggestion[];
  comments?: ReviewComment[];
};

export type RuleContext = {
  input: ReviewInput;
  manuscript: NormalizedManuscript;
  bestCategory: string;
  categoryScore: number;
  hasOverclaiming: boolean;
  summarySuggestionId: string;
  abstractSuggestionId: string;
  metadataSuggestionId?: string;
  titleSuggestionId: string;
  abstractAnchorId: string;
  metadataAnchorId?: string;
  submissionNotesAnchorId: string;
};

export type ReviewRule = {
  id: string;
  version: string;
  run: (context: RuleContext) => RuleResult;
};

export const OVERCLAIMING_SOURCE =
  "https://info.arxiv.org/help/moderation/index.html";
export const CATEGORY_SOURCE = "https://arxiv.org/category_taxonomy";
export const CONTENT_TYPE_SOURCE =
  "https://blog.arxiv.org/2025/10/31/attention-authors-updated-practice-for-review-articles-and-position-papers-in-arxiv-cs-category/";
export const ENDORSEMENT_SOURCE =
  "https://blog.arxiv.org/2026/01/21/attention-authors-updated-endorsement-policy/";

export function createRuleVersion(suffix: string) {
  return `${REVIEW_ENGINE_VERSION}.${suffix}`;
}
