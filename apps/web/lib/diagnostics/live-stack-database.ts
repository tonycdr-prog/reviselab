import postgres from "postgres";

import {
  getDatabaseUrl,
  getHostedPoolerMessage,
  getSupabaseEnv,
  isDirectHostedSupabaseDatabaseUrl,
  isLocalSupabaseUrl,
} from "@/lib/supabase/env";

import { type DiagnosticCheck, statusFromBoolean } from "./live-stack-types";

function buildMissingDatabaseCheck(label: string): DiagnosticCheck {
  return {
    label,
    status: "error",
    detail: "DATABASE_URL is not configured.",
  };
}

export async function checkDatabase(): Promise<DiagnosticCheck[]> {
  const databaseUrl = getDatabaseUrl();
  const env = getSupabaseEnv();

  if (!databaseUrl) {
    return [
      buildMissingDatabaseCheck("Postgres"),
      buildMissingDatabaseCheck("Queues"),
      buildMissingDatabaseCheck("Storage buckets"),
      buildMissingDatabaseCheck("Worker heartbeat"),
    ];
  }

  if (isDirectHostedSupabaseDatabaseUrl(databaseUrl)) {
    return [
      {
        label: "Postgres",
        status: "error",
        detail: getHostedPoolerMessage(),
      },
    ];
  }

  const sql = postgres(databaseUrl, {
    max: 1,
    prepare: false,
    connect_timeout: 10,
    ssl: env && !isLocalSupabaseUrl(env.url) ? "require" : false,
  });

  try {
    const [extensions, buckets, queues, heartbeat] = await Promise.all([
      sql`
        select extname
        from pg_extension
        where extname in ('pgmq', 'pg_cron', 'vector')
      `,
      sql`
        select id
        from storage.buckets
        where id in ('paper-sources', 'paper-artifacts')
      `,
      sql`
        select to_regclass('pgmq.q_parse_paper') as parse_queue,
               to_regclass('pgmq.q_run_review') as review_queue
      `,
      sql`
        select created_at
        from public.usage_events
        where event_name = 'worker_heartbeat'
        order by created_at desc
        limit 1
      `,
    ]);

    const extensionNames = new Set(extensions.map((row) => row.extname));
    const bucketNames = new Set(buckets.map((row) => row.id));
    const queueRow = queues[0];
    const heartbeatAt = heartbeat[0]?.created_at
      ? new Date(heartbeat[0].created_at).toISOString()
      : null;

    return [
      statusFromBoolean(
        "Postgres",
        ["pgmq", "pg_cron", "vector"].every((name) => extensionNames.has(name)),
        "Required Postgres extensions are installed.",
        "One or more required Postgres extensions are missing.",
      ),
      statusFromBoolean(
        "Queues",
        Boolean(queueRow?.parse_queue && queueRow?.review_queue),
        "Review worker queues are available.",
        "Review worker queues are missing.",
      ),
      statusFromBoolean(
        "Storage buckets",
        bucketNames.has("paper-sources") && bucketNames.has("paper-artifacts"),
        "Private upload and artifact buckets are available.",
        "One or more private storage buckets are missing.",
      ),
      {
        label: "Worker heartbeat",
        status: heartbeatAt ? "ok" : "warning",
        detail: heartbeatAt
          ? `Latest heartbeat at ${heartbeatAt}.`
          : "No worker heartbeat has been recorded yet.",
      },
    ];
  } catch {
    return [
      {
        label: "Postgres",
        status: "error",
        detail:
          "Database check failed. Verify DATABASE_URL, network access, and required Supabase migrations.",
      },
    ];
  } finally {
    await sql.end({ timeout: 2 });
  }
}
