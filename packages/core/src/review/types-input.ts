import type {
  PaperSourceKind,
  PaperType,
  SubmissionTarget,
} from "./types-primitives";

export type SubmissionContext = {
  targetServer?: SubmissionTarget;
  title: string;
  abstract: string;
  intendedCategory: string;
  paperType: PaperType;
  firstTimeSubmitter: boolean;
  sourceKind?: PaperSourceKind;
  priorArxivAuthorship?: boolean;
  hasInstitutionalEmail?: boolean;
  hasPersonalEndorser?: boolean;
  peerReviewedVenue?: string;
  journalRef?: string;
  doi?: string;
  aiAssistanceUsed?: boolean;
  aiDisclosureText?: string;
  comments?: string;
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
