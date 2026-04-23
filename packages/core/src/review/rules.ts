export * from "./rules-shared";

import { CONTENT_RULES } from "./rules-content";
import { READINESS_RULES } from "./rules-readiness";

export const RULE_REGISTRY = [...CONTENT_RULES, ...READINESS_RULES];
