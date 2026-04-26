import { CANONICAL_REVIEW_FILES } from "./utils";

export const CATEGORY_HINTS: Record<string, string[]> = {
  "cs.AI": [
    "agent",
    "agents",
    "reasoning",
    "planning",
    "knowledge",
    "expert system",
    "theorem proving",
    "uncertainty",
    "general ai",
  ],
  "cs.CL": [
    "language",
    "transformer",
    "llm",
    "nlp",
    "dialogue",
    "translation",
    "large language model",
    "natural language",
    "corpus",
  ],
  "cs.CV": [
    "vision",
    "image",
    "video",
    "detection",
    "segmentation",
    "recognition",
    "visual",
  ],
  "cs.CY": [
    "society",
    "policy",
    "ethics",
    "governance",
    "law",
    "privacy",
    "education",
    "social impact",
  ],
  "cs.LG": [
    "training",
    "optimization",
    "generalization",
    "learning",
    "benchmark",
    "machine learning",
    "reinforcement",
    "supervised",
    "unsupervised",
    "fairness",
  ],
  "cs.MA": [
    "multiagent",
    "multi-agent",
    "agent coordination",
    "distributed artificial intelligence",
    "game theory",
  ],
  "cs.RO": [
    "robot",
    "robotics",
    "manipulation",
    "navigation",
    "embodied",
    "autonomous vehicle",
  ],
  "math.GM": ["theorem", "proof", "lemma", "conjecture", "mathematics"],
  "physics.gen-ph": ["quantum", "fusion", "plasma", "gravity", "physics"],
};

export const OVERCLAIMING_PATTERNS = [
  /\brevolutionary\b/i,
  /\bgroundbreaking\b/i,
  /\bdefinitive proof\b/i,
  /\bsolves all\b/i,
  /\bguarantees?\b/i,
  /\bfirst ever\b/i,
  /\bworld-changing\b/i,
  /\bbest\b.{0,80}\b(guaranteed|guarantees?|ever)\b/i,
  /\bproves?\b.{0,80}\b(all|every|guaranteed|guarantees?|definitive)\b/i,
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
