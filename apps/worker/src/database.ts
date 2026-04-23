import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";

import {
  getDatabaseUrl,
  getHostedPoolerMessage,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
  isDirectHostedSupabaseDatabaseUrl,
} from "./env";

export function createQueueSql() {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to start the ReviseLab worker.");
  }

  if (isDirectHostedSupabaseDatabaseUrl(databaseUrl)) {
    throw new Error(getHostedPoolerMessage());
  }

  return postgres(databaseUrl, {
    max: 1,
    prepare: false,
  });
}

export function createWorkerAdminClient() {
  const url = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!url || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for the worker.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
