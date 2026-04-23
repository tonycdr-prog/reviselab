import "server-only";

import { checkDatabase } from "./live-stack-database";
import { checkGrobid, checkSupabaseAuth } from "./live-stack-services";
import type {
  DiagnosticStatus,
  LiveStackDiagnostics,
} from "./live-stack-types";

export type { DiagnosticStatus, LiveStackDiagnostics };

export async function getLiveStackDiagnostics(): Promise<LiveStackDiagnostics> {
  const [authCheck, databaseChecks, grobidCheck] = await Promise.all([
    checkSupabaseAuth(),
    checkDatabase(),
    checkGrobid(),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    checks: [authCheck, ...databaseChecks, grobidCheck],
  };
}
