import "server-only";

import postgres from "postgres";

import { getViewerContext } from "@/lib/auth/session";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import {
  getDatabaseUrl,
  getHostedPoolerMessage,
  isDirectHostedSupabaseDatabaseUrl,
} from "@/lib/supabase/env";

import { buildTelemetryEventId } from "./repository-helpers";

type QueueName = "parse_paper" | "run_review";

export function createIds() {
  return {
    paperId: `paper_${crypto.randomUUID()}`,
    versionId: `version_${crypto.randomUUID()}`,
    reviewId: `review_${crypto.randomUUID()}`,
  };
}

function createAdminSql() {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    return null;
  }

  if (isDirectHostedSupabaseDatabaseUrl(databaseUrl)) {
    throw new Error(getHostedPoolerMessage());
  }

  return postgres(databaseUrl, {
    max: 1,
    prepare: false,
  });
}

export async function enqueueJob(
  queue: QueueName,
  payload: Record<string, unknown>,
) {
  const sql = createAdminSql();

  if (!sql) {
    return false;
  }

  try {
    await sql`select pgmq.send(${queue}::text, ${JSON.stringify(payload)}::jsonb)`;
  } finally {
    await sql.end();
  }

  return true;
}

export async function recordTelemetry(
  workspaceId: string,
  eventName: string,
  eventPayload: Record<string, unknown>,
) {
  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    return;
  }

  const { error } = await adminClient.from("usage_events").insert({
    id: buildTelemetryEventId("usage"),
    workspace_id: workspaceId,
    event_name: eventName,
    event_payload: eventPayload,
  });

  if (error) {
    console.error(`Telemetry insert failed for ${eventName}: ${error.message}`);
  }
}

export function getSourceKind(file: File) {
  return file.name.toLowerCase().endsWith(".zip") ? "latex-zip" : "pdf";
}

export function isSupportedSourceFile(file: File) {
  const normalizedName = file.name.toLowerCase();
  return normalizedName.endsWith(".pdf") || normalizedName.endsWith(".zip");
}

export function getSupabaseStorageAdminClient() {
  return createSupabaseAdminClient();
}

export async function requireAuthenticatedContext() {
  const viewer = await getViewerContext();
  const supabase = await createSupabaseServerClient();

  if (!viewer || !supabase) {
    return null;
  }

  return {
    viewer,
    supabase,
  };
}
