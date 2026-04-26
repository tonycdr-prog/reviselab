import {
  getHostedPoolerMessage,
  isDirectHostedSupabaseDatabaseUrl,
  isHostedSupabaseUrl,
  isLocalDatabaseUrl,
  readEnvFile,
} from "./local-stack-lib.mjs";

function fail(message) {
  throw new Error(message);
}

function requireValue(env, key, fileName) {
  if (!env?.[key]) {
    fail(`${fileName} is missing ${key}.`);
  }
}

function assertHostedSupabase(env, fileName) {
  requireValue(env, "NEXT_PUBLIC_SUPABASE_URL", fileName);
  requireValue(env, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", fileName);
  requireValue(env, "SUPABASE_SERVICE_ROLE_KEY", fileName);
  requireValue(env, "REVISELAB_SITE_URL", fileName);
  requireValue(env, "DATABASE_URL", fileName);

  if (!isHostedSupabaseUrl(env.NEXT_PUBLIC_SUPABASE_URL)) {
    fail(`${fileName} NEXT_PUBLIC_SUPABASE_URL must point at hosted Supabase.`);
  }

  if (isLocalDatabaseUrl(env.DATABASE_URL)) {
    fail(`${fileName} DATABASE_URL must point at hosted Supabase.`);
  }

  if (isDirectHostedSupabaseDatabaseUrl(env.DATABASE_URL)) {
    fail(getHostedPoolerMessage());
  }

  try {
    const siteUrl = new URL(env.REVISELAB_SITE_URL);
    if (siteUrl.protocol !== "https:") {
      fail(`${fileName} REVISELAB_SITE_URL must use https in production.`);
    }
  } catch {
    fail(`${fileName} REVISELAB_SITE_URL must be a valid URL.`);
  }
}

function assertMatchingWorkerEnv(webEnv, workerEnv) {
  requireValue(workerEnv, "NEXT_PUBLIC_SUPABASE_URL", "apps/worker/.env.local");
  requireValue(
    workerEnv,
    "SUPABASE_SERVICE_ROLE_KEY",
    "apps/worker/.env.local",
  );
  requireValue(workerEnv, "DATABASE_URL", "apps/worker/.env.local");
  requireValue(workerEnv, "GROBID_URL", "apps/worker/.env.local");

  if (workerEnv.NEXT_PUBLIC_SUPABASE_URL !== webEnv.NEXT_PUBLIC_SUPABASE_URL) {
    fail("Worker Supabase URL must match the web Supabase URL.");
  }

  if (
    workerEnv.SUPABASE_SERVICE_ROLE_KEY !== webEnv.SUPABASE_SERVICE_ROLE_KEY
  ) {
    fail("Worker service-role key must match the web service-role key.");
  }

  if (workerEnv.DATABASE_URL !== webEnv.DATABASE_URL) {
    fail("Worker DATABASE_URL must match the web DATABASE_URL.");
  }
}

try {
  const webEnv = readEnvFile("apps/web/.env.local");
  const workerEnv =
    readEnvFile("apps/worker/.env.local") ?? readEnvFile("apps/worker/.env");

  if (!webEnv) {
    fail("apps/web/.env.local is missing.");
  }

  if (!workerEnv) {
    fail("apps/worker/.env.local or apps/worker/.env is missing.");
  }

  assertHostedSupabase(webEnv, "apps/web/.env.local");
  assertMatchingWorkerEnv(webEnv, workerEnv);

  console.log("Production readiness env check passed.");
  console.log("- Hosted Supabase URL is configured.");
  console.log("- Production auth site URL is configured.");
  console.log(
    "- DATABASE_URL is not the direct hosted IPv6-prone Postgres URL.",
  );
  console.log(
    "- Worker and web Supabase credentials point to the same project.",
  );
  console.log("- Worker GROBID_URL is configured.");
} catch (error) {
  console.error(
    error instanceof Error
      ? error.message
      : "Production readiness env check failed.",
  );
  process.exitCode = 1;
}
