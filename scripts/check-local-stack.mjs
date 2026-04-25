import { spawnSync } from "node:child_process";

import postgres from "postgres";

import {
  ensureDockerDaemonRunning,
  LOCAL_GROBID_URL,
  LOCAL_INBUCKET_URL,
  ROOT,
  isLocalSupabaseUrl,
  normalizeSupabaseStatusEnv,
  parseEnvBlock,
  readEnvFile,
  waitForHttp,
} from "./local-stack-lib.mjs";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
  });

  if (result.error) {
    throw new Error(`${command} is required for local live mode.`);
  }

  if (result.status !== 0) {
    const stderr = options.capture ? result.stderr?.trim() : "";
    throw new Error(
      stderr ||
        `${command} ${args.join(" ")} failed with exit code ${result.status ?? 1}.`,
    );
  }

  return (result.stdout ?? "").trim();
}

function readSupabaseStatusEnv() {
  return normalizeSupabaseStatusEnv(
    parseEnvBlock(run("supabase", ["status", "-o", "env"], { capture: true })),
  );
}

function ensureCommand(command, args, label) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: "ignore",
  });

  if (result.status !== 0) {
    throw new Error(`${label} is required for local live mode.`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

try {
  ensureCommand("supabase", ["--version"], "Supabase CLI");
  ensureCommand("docker", ["compose", "version"], "Docker Compose");
  ensureDockerDaemonRunning();
  const stackEnv = readSupabaseStatusEnv();
  const webEnv = readEnvFile("apps/web/.env.local");
  const workerEnv =
    readEnvFile("apps/worker/.env.local") ?? readEnvFile("apps/worker/.env");

  assert(
    stackEnv.API_URL,
    "Supabase API_URL is unavailable. Run `pnpm dev:services` first.",
  );
  assert(
    stackEnv.DATABASE_URL,
    "Supabase DATABASE_URL is unavailable. Run `pnpm dev:services` first.",
  );
  assert(
    stackEnv.SERVICE_ROLE_KEY,
    "Supabase SERVICE_ROLE_KEY is unavailable. Run `pnpm dev:services` first.",
  );

  await waitForHttp(`${stackEnv.API_URL}/auth/v1/health`, {
    label: "Supabase Auth",
    validate: (response) => response.ok,
  });

  await waitForHttp(`${LOCAL_GROBID_URL}/api/isalive`, {
    label: "GROBID",
    validate: (response, body) => response.ok && body.trim() === "true",
  });

  assert(
    webEnv,
    "apps/web/.env.local is missing. Copy apps/web/.env.example first.",
  );
  assert(
    workerEnv,
    "apps/worker/.env or apps/worker/.env.local is missing. Copy apps/worker/.env.example first.",
  );
  assert(
    isLocalSupabaseUrl(webEnv.NEXT_PUBLIC_SUPABASE_URL),
    "apps/web/.env.local must point to the local Supabase stack.",
  );
  assert(
    webEnv.NEXT_PUBLIC_SUPABASE_URL === stackEnv.API_URL,
    "apps/web/.env.local NEXT_PUBLIC_SUPABASE_URL does not match the local Supabase API URL.",
  );
  assert(
    webEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY === stackEnv.ANON_KEY,
    "apps/web/.env.local NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY does not match the local anon key.",
  );
  assert(
    webEnv.SUPABASE_SERVICE_ROLE_KEY === stackEnv.SERVICE_ROLE_KEY,
    "apps/web/.env.local SUPABASE_SERVICE_ROLE_KEY does not match the local service role key.",
  );
  assert(
    webEnv.DATABASE_URL === stackEnv.DATABASE_URL,
    "apps/web/.env.local DATABASE_URL does not match the local database URL.",
  );
  assert(
    webEnv.GROBID_URL === LOCAL_GROBID_URL,
    "apps/web/.env.local GROBID_URL must point to http://127.0.0.1:8070.",
  );
  assert(
    workerEnv.DATABASE_URL === stackEnv.DATABASE_URL,
    "Worker DATABASE_URL does not match the local database URL.",
  );
  assert(
    workerEnv.NEXT_PUBLIC_SUPABASE_URL === stackEnv.API_URL,
    "Worker NEXT_PUBLIC_SUPABASE_URL does not match the local Supabase API URL.",
  );
  assert(
    workerEnv.SUPABASE_SERVICE_ROLE_KEY === stackEnv.SERVICE_ROLE_KEY,
    "Worker SUPABASE_SERVICE_ROLE_KEY does not match the local service role key.",
  );
  assert(
    workerEnv.GROBID_URL === LOCAL_GROBID_URL,
    "Worker GROBID_URL must point to http://127.0.0.1:8070.",
  );

  const sql = postgres(stackEnv.DATABASE_URL, {
    max: 1,
    prepare: false,
  });

  try {
    const extensions = await sql`
      select extname
      from pg_extension
      where extname in ('pgmq', 'pg_cron', 'vector')
      order by extname
    `;
    const extensionNames = new Set(extensions.map((entry) => entry.extname));

    assert(
      extensionNames.has("pgmq"),
      "pgmq is not installed in the local database.",
    );
    assert(
      extensionNames.has("pg_cron"),
      "pg_cron is not installed in the local database.",
    );
    assert(
      extensionNames.has("vector"),
      "vector is not installed in the local database.",
    );

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
    await sql.end();
  }

  console.log("Local stack check passed.");
  console.log(`- Supabase API: ${stackEnv.API_URL}`);
  console.log(`- Studio: ${stackEnv.STUDIO_URL ?? "disabled locally"}`);
  console.log(`- Inbucket: ${LOCAL_INBUCKET_URL}`);
  console.log(`- GROBID: ${LOCAL_GROBID_URL}`);
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Local stack check failed.",
  );
  process.exitCode = 1;
}
