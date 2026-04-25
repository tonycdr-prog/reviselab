import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

import {
  getLiveDatabaseUrl,
  getLiveSupabaseServiceRoleKey,
  getLiveSupabaseUrl,
} from "./env";

type CleanupInput = {
  emails: string[];
  titles: string[];
};

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

async function removeStoragePaths(bucket: string, paths: string[]) {
  const supabaseUrl = getLiveSupabaseUrl();
  const serviceRoleKey = getLiveSupabaseServiceRoleKey();
  const uniquePaths = unique(paths);

  if (!supabaseUrl || !serviceRoleKey || uniquePaths.length === 0) {
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
  const { error } = await supabase.storage.from(bucket).remove(uniquePaths);

  if (error) {
    throw new Error(`Unable to remove ${bucket} artifacts: ${error.message}`);
  }
}

export async function cleanupLiveTestData(input: CleanupInput) {
  const databaseUrl = getLiveDatabaseUrl();
  const emails = unique(input.emails);
  const titles = unique(input.titles);

  if (!databaseUrl || (emails.length === 0 && titles.length === 0)) {
    return;
  }

  const sql = postgres(databaseUrl, { max: 1, prepare: false });

  try {
    const users = emails.length
      ? await sql<{ id: string }[]>`
          select id
          from auth.users
          where email in ${sql(emails)}
        `
      : [];
    const userIds = users.map((user) => user.id);
    const papersByTitle = titles.length
      ? await sql<{ id: string }[]>`
          select id
          from public.papers
          where title in ${sql(titles)}
        `
      : [];
    const papersByUser = userIds.length
      ? await sql<{ id: string }[]>`
          select id
          from public.papers
          where owner_user_id in ${sql(userIds)}
        `
      : [];
    const paperIds = unique([
      ...papersByTitle.map((paper) => paper.id),
      ...papersByUser.map((paper) => paper.id),
    ]);
    const versions = paperIds.length
      ? await sql<
          {
            source_path: string | null;
            parse_artifact_path: string | null;
            artifact_path: string | null;
          }[]
        >`
          select
            source_path,
            parse_artifact_path,
            extracted_structure_json->>'artifactPath' as artifact_path
          from public.paper_versions
          where paper_id in ${sql(paperIds)}
        `
      : [];

    await removeStoragePaths(
      "paper-sources",
      versions.flatMap((version) =>
        version.source_path ? [version.source_path] : [],
      ),
    );
    await removeStoragePaths(
      "paper-artifacts",
      versions.flatMap((version) =>
        (version.parse_artifact_path ?? version.artifact_path)
          ? [version.parse_artifact_path ?? version.artifact_path ?? ""]
          : [],
      ),
    );

    if (paperIds.length) {
      await sql`
        delete from public.papers
        where id in ${sql(paperIds)}
      `;
    }

    if (userIds.length) {
      await sql`
        delete from public.workspace_members
        where user_id in ${sql(userIds)}
      `;
      await sql`
        delete from public.workspaces
        where owner_user_id in ${sql(userIds)}
      `;
      await sql`
        delete from public.profiles
        where id in ${sql(userIds)}
      `;
      await sql`
        delete from auth.users
        where id in ${sql(userIds)}
      `;
    }
  } finally {
    await sql.end();
  }
}
