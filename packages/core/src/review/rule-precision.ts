import type { ReviewCheckState, ReviewFilePath, ReviewSeverity } from "./types";

export type RulePrecisionLabel = {
  arxivId: string;
  ruleId: string;
  expectedState: ReviewCheckState;
  expectedSeverity: ReviewSeverity;
  rationale: string;
};

export type RulePrecisionFinding = {
  arxivId: string;
  ruleId: string;
  actualState: ReviewCheckState | "missing";
  expectedState: ReviewCheckState;
  actualSeverity?: ReviewSeverity;
  expectedSeverity: ReviewSeverity;
  outcome:
    | "true-positive"
    | "true-negative"
    | "false-positive"
    | "false-negative"
    | "severity-mismatch";
  hasAnchor: boolean;
  hasEvidence: boolean;
  hasSource: boolean;
  filePath?: ReviewFilePath;
  rationale: string;
};

export type RulePrecisionReport = {
  generatedAt: string;
  manuscriptCount: number;
  labeledFindingCount: number;
  findings: RulePrecisionFinding[];
  rules: Record<
    string,
    {
      labeledCount: number;
      firedCount: number;
      warningRate: number;
      blockerRate: number;
      precision: number | null;
      anchorCoverage: number;
      evidenceCoverage: number;
      sourceCoverage: number;
    }
  >;
};
