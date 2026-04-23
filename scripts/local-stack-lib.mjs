import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));

export const ROOT = path.resolve(SCRIPT_DIR, "..");
export const LOCAL_GROBID_URL = "http://127.0.0.1:8070";
export const LOCAL_INBUCKET_URL = "http://127.0.0.1:54324";

export function parseEnvBlock(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith("#"))
    .reduce((entries, line) => {
      const separatorIndex = line.indexOf("=");

      if (separatorIndex <= 0) {
        return entries;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();

      return {
        ...entries,
        [key]: value,
      };
    }, {});
}

export function readEnvFile(relativePath) {
  const filePath = path.join(ROOT, relativePath);

  if (!existsSync(filePath)) {
    return null;
  }

  return parseEnvBlock(readFileSync(filePath, "utf8"));
}

export function isLocalSupabaseUrl(url) {
  if (!url) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost";
  } catch {
    return false;
  }
}

export function isHostedSupabaseUrl(url) {
  if (!url) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

export function isDirectHostedSupabaseDatabaseUrl(databaseUrl) {
  if (!databaseUrl) {
    return false;
  }

  try {
    const parsed = new URL(databaseUrl);
    return (
      parsed.hostname.startsWith("db.") &&
      parsed.hostname.endsWith(".supabase.co") &&
      parsed.port === "5432"
    );
  } catch {
    return false;
  }
}

export function getHostedPoolerMessage() {
  return "Hosted Supabase direct DATABASE_URL can resolve to IPv6-only Postgres. Use the Supabase Dashboard connection string for the Session pooler or Transaction pooler as DATABASE_URL in apps/web/.env.local and apps/worker/.env.local.";
}

export function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

export function readHostedWebEnv() {
  const env = readEnvFile("apps/web/.env.local");

  assert(env, "apps/web/.env.local is missing.");
  assert(env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL is missing.");
  assert(
    env.SUPABASE_SERVICE_ROLE_KEY,
    "SUPABASE_SERVICE_ROLE_KEY is missing.",
  );
  assert(env.DATABASE_URL, "DATABASE_URL is missing.");
  assert(
    isHostedSupabaseUrl(env.NEXT_PUBLIC_SUPABASE_URL),
    "apps/web/.env.local must point at hosted Supabase for hosted smoke tests.",
  );
  assert(
    !isDirectHostedSupabaseDatabaseUrl(env.DATABASE_URL),
    getHostedPoolerMessage(),
  );

  return env;
}

export function ensureDockerDaemonRunning() {
  const result = spawnSync("docker", ["info"], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: "pipe",
  });

  if (result.error) {
    throw new Error("Docker is required for local live mode.");
  }

  if (result.status === 0) {
    return;
  }

  const stderr = `${result.stderr ?? ""}${result.stdout ?? ""}`.trim();
  const colimaHint = stderr.toLowerCase().includes("colima")
    ? " Start Colima with `colima start`, then rerun the command."
    : "";

  throw new Error(
    `${stderr || "Docker is installed, but the Docker daemon is not running."}${colimaHint}`,
  );
}

export async function wait(ms) {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function waitForHttp(url, options) {
  const {
    headers,
    label,
    timeoutMs = 120000,
    validate = (response, body) => response.ok && body.length > 0,
  } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const response = await fetch(url, { headers });
      const body = await response.text();

      if (validate(response, body)) {
        return;
      }
    } catch {
      // Retry until timeout.
    }

    await wait(1000);
  }

  throw new Error(`Timed out waiting for ${label} at ${url}.`);
}
