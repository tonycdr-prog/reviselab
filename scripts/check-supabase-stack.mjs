import postgres from "postgres";

import {
  ROOT,
  assert,
  getHostedPoolerMessage,
  isDirectHostedSupabaseDatabaseUrl,
  isHostedSupabaseUrl,
  isLocalSupabaseUrl,
  readEnvFile,
  waitForHttp,
} from "./local-stack-lib.mjs";

const mode = process.argv.includes("--hosted") ? "hosted" : "any";
const CHECK_TIMEOUT_MS = 45000;
const webEnv = readEnvFile("apps/web/.env.local");
const workerEnv =
  readEnvFile("apps/worker/.env.local") ?? readEnvFile("apps/worker/.env");

function assertMode(url) {
  if (mode === "hosted") {
    assert(
      isHostedSupabaseUrl(url),
      "apps/web/.env.local must point to a hosted Supabase project for hosted mode.",
    );
    return;
  }

  assert(
    isLocalSupabaseUrl(url) || isHostedSupabaseUrl(url),
    "apps/web/.env.local must point to local Supabase or a hosted Supabase project.",
  );
}

function assertMatchingEnv() {
  assert(webEnv, "apps/web/.env.local is missing.");
  assert(workerEnv, "apps/worker/.env or apps/worker/.env.local is missing.");
  assert(
    webEnv.NEXT_PUBLIC_SUPABASE_URL,
    "apps/web/.env.local NEXT_PUBLIC_SUPABASE_URL is missing.",
  );
  assert(
    webEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    "apps/web/.env.local NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing.",
  );
  assert(
    webEnv.SUPABASE_SERVICE_ROLE_KEY,
    "apps/web/.env.local SUPABASE_SERVICE_ROLE_KEY is missing.",
  );
  assert(webEnv.DATABASE_URL, "apps/web/.env.local DATABASE_URL is missing.");
  assert(workerEnv.DATABASE_URL, "Worker DATABASE_URL is missing.");
  assert(
    workerEnv.NEXT_PUBLIC_SUPABASE_URL,
    "Worker NEXT_PUBLIC_SUPABASE_URL is missing.",
  );
  assert(
    workerEnv.SUPABASE_SERVICE_ROLE_KEY,
    "Worker SUPABASE_SERVICE_ROLE_KEY is missing.",
  );
  assertMode(webEnv.NEXT_PUBLIC_SUPABASE_URL);
  assert(
    workerEnv.NEXT_PUBLIC_SUPABASE_URL === webEnv.NEXT_PUBLIC_SUPABASE_URL,
    "Worker Supabase URL must match the web Supabase URL.",
  );
  assert(
    workerEnv.SUPABASE_SERVICE_ROLE_KEY === webEnv.SUPABASE_SERVICE_ROLE_KEY,
    "Worker service role key must match the web service role key.",
  );
  assert(
    workerEnv.DATABASE_URL === webEnv.DATABASE_URL,
    "Worker DATABASE_URL must match the web DATABASE_URL.",
  );
  if (mode === "hosted") {
    assert(
      !isDirectHostedSupabaseDatabaseUrl(webEnv.DATABASE_URL),
      getHostedPoolerMessage(),
    );
  }
}

async function checkDatabase(databaseUrl) {
  const sql = postgres(databaseUrl, {
    max: 1,
    prepare: false,
    connect_timeout: 10,
    ssl: mode === "hosted" ? "require" : false,
  });

  try {
    const extensions = await sql`
      select extname
      from pg_extension
      where extname in ('pgmq', 'pg_cron', 'vector')
      order by extname
    `;
    const extensionNames = new Set(extensions.map((entry) => entry.extname));

    assert(extensionNames.has("pgmq"), "pgmq is not installed.");
    assert(extensionNames.has("pg_cron"), "pg_cron is not installed.");
    assert(extensionNames.has("vector"), "vector is not installed.");

    const buckets = await sql`
      select id
      from storage.buckets
      where id in ('paper-sources', 'paper-artifacts')
      order by id
    `;
    const bucketNames = new Set(buckets.map((entry) => entry.id));

    assert(
      bucketNames.has("paper-sources"),
      "paper-sources bucket is missing.",
    );
    assert(
      bucketNames.has("paper-artifacts"),
      "paper-artifacts bucket is missing.",
    );

    const queues = await sql`
      select to_regclass('pgmq.q_parse_paper') as parse_queue,
             to_regclass('pgmq.q_run_review') as review_queue,
             to_regclass('pgmq.q_cleanup_artifacts') as cleanup_queue
    `;
    const queueRow = queues[0];

    assert(queueRow?.parse_queue, "parse_paper queue table is missing.");
    assert(queueRow?.review_queue, "run_review queue table is missing.");
    assert(
      queueRow?.cleanup_queue,
      "cleanup_artifacts queue table is missing.",
    );
  } finally {
    await sql.end({ timeout: 2 });
  }
}

try {
  assertMatchingEnv();
  await waitForHttp(`${webEnv.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`, {
    headers: {
      apikey: webEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    },
    label: "Supabase Auth",
    timeoutMs: CHECK_TIMEOUT_MS,
    validate: (response) => response.ok,
  });
  const databaseTimeout = new Promise((_, reject) => {
    const timeout = setTimeout(() => {
      reject(
        new Error(
          "Timed out connecting to Supabase Postgres. Check wifi, DATABASE_URL, and whether the hosted database allows direct connections.",
        ),
      );
    }, CHECK_TIMEOUT_MS);

    timeout.unref();
  });

  await Promise.race([checkDatabase(webEnv.DATABASE_URL), databaseTimeout]);

  console.log(
    `${mode === "hosted" ? "Hosted" : "Supabase"} stack check passed.`,
  );
  console.log(`- Supabase API: ${webEnv.NEXT_PUBLIC_SUPABASE_URL}`);
  console.log(`- Workspace: ${ROOT}`);
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Supabase stack check failed.",
  );
  process.exitCode = 1;
}
