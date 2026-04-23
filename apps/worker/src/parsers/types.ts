import type { NormalizedManuscript, PaperSourceKind } from "@reviselab/core";

export type ParseResult = {
  manuscript: NormalizedManuscript;
  parserEngine: string;
};

export type ParseFallbackContext = {
  sourceKind: PaperSourceKind;
  title: string;
  abstract: string;
  rawText: string;
  artifactPath?: string;
};
