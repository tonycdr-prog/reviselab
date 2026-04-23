import "server-only";

import { hasDatabaseConfig, hasSupabaseConfig } from "@/lib/supabase/env";

export function assertLiveReviewRuntimeReady() {
  if (!hasSupabaseConfig() || !hasDatabaseConfig()) {
    throw new Error(
      "ReviseLab live mode requires the local or remote Supabase stack and queue database to be configured.",
    );
  }
}
