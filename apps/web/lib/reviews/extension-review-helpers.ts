import "server-only";

import postgres from "postgres";

import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  getDatabaseUrl,
  getHostedPoolerMessage,
  isDirectHostedSupabaseDatabaseUrl,
} from "@/lib/supabase/env";

type InstallationRecord = {
  id: string;
  profile_id: string | null;
  workspace_id: string | null;
};

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

export async function enqueueRunReview(reviewId: string) {
  const sql = createAdminSql();

  if (!sql) {
    return false;
  }

  try {
    await sql`select pgmq.send('run_review'::text, ${JSON.stringify({ reviewId })}::jsonb)`;
  } finally {
    await sql.end();
  }

  return true;
}

export async function getInstallationByToken(token: string) {
  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    return null;
  }

  const { data, error } = await adminClient
    .from("extension_installations")
    .select("id,profile_id,workspace_id")
    .eq("paired_token", token)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as InstallationRecord | null) ?? null;
}

export async function getLatestWorkspaceReview(pairedToken: string) {
  const installation = await getInstallationByToken(pairedToken);
  const sql = createAdminSql();

  if (!installation?.workspace_id || !sql) {
    return null;
  }

  const rows = await sql<Array<{ review_id: string; paper_id: string }>>`
    select reviews.id as review_id, reviews.paper_id
    from public.reviews
    inner join public.papers on papers.id = reviews.paper_id
    where papers.workspace_id = ${installation.workspace_id}
    order by reviews.updated_at desc
    limit 1
  `.finally(async () => {
    await sql.end();
  });

  return rows[0] ?? null;
}
