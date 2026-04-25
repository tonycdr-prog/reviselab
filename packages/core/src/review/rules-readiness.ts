import type { ReviewRule } from "./rules-shared";
import { AI_DISCLOSURE_RULE } from "./rules-readiness-ai";
import { ENDORSEMENT_RULE } from "./rules-readiness-endorsement";
import { METADATA_RULE } from "./rules-readiness-metadata";
import { OVERCLAIMING_RULE } from "./rules-readiness-overclaiming";
import { SOURCE_PARSE_RULE } from "./rules-readiness-source";

export const READINESS_RULES: ReviewRule[] = [
  ENDORSEMENT_RULE,
  METADATA_RULE,
  OVERCLAIMING_RULE,
  AI_DISCLOSURE_RULE,
  SOURCE_PARSE_RULE,
];
