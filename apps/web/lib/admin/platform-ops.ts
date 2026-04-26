import "server-only";

import postgres from "postgres";

import { getLiveStackDiagnostics } from "@/lib/diagnostics/live-stack";
import {
  getDatabaseUrl,
  getHostedPoolerMessage,
  getSupabaseEnv,
  isDirectHostedSupabaseDatabaseUrl,
  isLocalSupabaseUrl,
} from "@/lib/supabase/env";

export type PlatformMetric = {
  label: string;
  value: string;
  detail: string;
  status: "ok" | "warning" | "error";
};

export type PlatformFailure = {
  id: string;
  kind: string;
  label: string;
  detail: string | null;
  createdAt: string;
};

export type PlatformOpsSnapshot = {
  generatedAt: string;
  metrics: PlatformMetric[];
  failures: PlatformFailure[];
};

function formatCount(value: unknown) {
  return String(Number(value ?? 0));
}

function getFreshnessStatus(createdAt: Date | null): PlatformMetric["status"] {
  if (!createdAt) {
    return "warning";
  }

  const ageMs = Date.now() - createdAt.getTime();

  if (ageMs > 5 * 60_000) {
    return "error";
  }

  if (ageMs > 2 * 60_000) {
    return "warning";
  }

  return "ok";
}

function buildUnavailableSnapshot(detail: string): PlatformOpsSnapshot {
  return {
    generatedAt: new Date().toISOString(),
    metrics: [
      {
        label: "Platform database",
        value: "Unavailable",
        detail,
        status: "error",
      },
    ],
    failures: [],
  };
}

export async function getPlatformOpsSnapshot(): Promise<PlatformOpsSnapshot> {
  const databaseUrl = getDatabaseUrl();
  const env = getSupabaseEnv();

  if (!databaseUrl) {
    return buildUnavailableSnapshot("DATABASE_URL is not configured.");
  }

  if (isDirectHostedSupabaseDatabaseUrl(databaseUrl)) {
    return buildUnavailableSnapshot(getHostedPoolerMessage());
  }

  const sql = postgres(databaseUrl, {
    max: 1,
    prepare: false,
    connect_timeout: 10,
    ssl: env && !isLocalSupabaseUrl(env.url) ? "require" : false,
  });

  try {
    const [diagnostics, counts, queues, heartbeat, failures] =
      await Promise.all([
        getLiveStackDiagnostics(),
        sql`
          select
            (select count(*)::int from public.profiles) as profiles,
            (select count(*)::int from public.workspaces) as workspaces,
            (select count(*)::int from public.reviews) as reviews,
            (select count(*)::int from public.reviews where status = 'failed') as failed_reviews,
            (select count(*)::int from public.paper_versions where parse_status = 'failed') as failed_parses
        `,
        sql`
          select
            (select count(*)::int from pgmq.q_parse_paper) as parse_queue,
            (select count(*)::int from pgmq.q_run_review) as review_queue
        `,
        sql`
          select created_at
          from public.usage_events
          where event_name = 'worker_heartbeat'
          order by created_at desc
          limit 1
        `,
        sql`
          select id, event_kind, label, detail, created_at
          from public.review_events
          where event_kind in ('parse_failed', 'review_failed')
          order by created_at desc
          limit 10
        `,
      ]);

    const countRow = counts[0];
    const queueRow = queues[0];
    const heartbeatAt = heartbeat[0]?.created_at
      ? new Date(heartbeat[0].created_at)
      : null;
    const failingChecks = diagnostics.checks.filter(
      (check) => check.status !== "ok",
    );

    return {
      generatedAt: new Date().toISOString(),
      metrics: [
        {
          label: "Stack health",
          value: failingChecks.length === 0 ? "Ready" : "Needs attention",
          detail:
            failingChecks.length === 0
              ? "Auth, database, storage, queues, worker heartbeat, and GROBID are healthy."
              : failingChecks
                  .map((check) => `${check.label}: ${check.detail}`)
                  .join(" "),
          status: failingChecks.some((check) => check.status === "error")
            ? "error"
            : failingChecks.length > 0
              ? "warning"
              : "ok",
        },
        {
          label: "Worker heartbeat",
          value: heartbeatAt ? heartbeatAt.toISOString() : "Missing",
          detail: heartbeatAt
            ? "Worker heartbeat is recorded from the background processor."
            : "No worker heartbeat has been recorded.",
          status: getFreshnessStatus(heartbeatAt),
        },
        {
          label: "Queue depth",
          value: `${formatCount(queueRow?.parse_queue)} parse / ${formatCount(
            queueRow?.review_queue,
          )} review`,
          detail: "Messages currently present in PGMQ queues.",
          status:
            Number(queueRow?.parse_queue ?? 0) +
              Number(queueRow?.review_queue ?? 0) >
            20
              ? "warning"
              : "ok",
        },
        {
          label: "Review failures",
          value: `${formatCount(countRow?.failed_reviews)} review / ${formatCount(
            countRow?.failed_parses,
          )} parse`,
          detail: "Current failed review and parse records.",
          status:
            Number(countRow?.failed_reviews ?? 0) +
              Number(countRow?.failed_parses ?? 0) >
            0
              ? "warning"
              : "ok",
        },
        {
          label: "Accounts",
          value: `${formatCount(countRow?.profiles)} profiles`,
          detail: `${formatCount(countRow?.workspaces)} workspaces and ${formatCount(
            countRow?.reviews,
          )} reviews exist in the platform database.`,
          status: "ok",
        },
      ],
      failures: failures.map((failure) => ({
        id: String(failure.id),
        kind: String(failure.event_kind),
        label: String(failure.label),
        detail: failure.detail ? String(failure.detail) : null,
        createdAt: new Date(failure.created_at).toISOString(),
      })),
    };
  } finally {
    await sql.end({ timeout: 2 });
  }
}
