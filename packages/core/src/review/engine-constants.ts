import { CANONICAL_REVIEW_FILES } from "./utils";

export const CATEGORY_HINTS: Record<string, string[]> = {
  "cs.CL": ["language", "transformer", "llm", "nlp", "dialogue", "translation"],
  "cs.AI": ["agent", "reasoning", "planning", "knowledge", "general ai"],
  "cs.LG": [
    "training",
    "optimization",
    "generalization",
    "learning",
    "benchmark",
  ],
  "math.GM": ["theorem", "proof", "lemma", "conjecture", "mathematics"],
  "physics.gen-ph": ["quantum", "fusion", "plasma", "gravity", "physics"],
};

export const OVERCLAIMING_PATTERNS = [
  "revolutionary",
  "groundbreaking",
  "definitive proof",
  "solves all",
  "guaranteed",
  "world-changing",
];

export const FILE_TITLES: Record<
  (typeof CANONICAL_REVIEW_FILES)[number],
  string
> = {
  "title.md": "Title",
  "abstract.md": "Abstract",
  "metadata.yml": "Metadata",
  "submission_notes.md": "Submission notes",
};
