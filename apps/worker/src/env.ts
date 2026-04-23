import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CURRENT_FILE = fileURLToPath(import.meta.url);
const WORKER_DIRECTORY = path.resolve(path.dirname(CURRENT_FILE), "..");
const ENV_FILE_CANDIDATES = [".env.local", ".env"];

function parseEnvValue(rawValue: string) {
  const trimmed = rawValue.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function readWorkerEnvValue(key: string) {
  for (const fileName of ENV_FILE_CANDIDATES) {
    try {
      const filePath = path.join(WORKER_DIRECTORY, fileName);
      const content = readFileSync(filePath, "utf8");
      const lines = content.split(/\r?\n/);

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith("#")) {
          continue;
        }

        const separatorIndex = trimmedLine.indexOf("=");
        if (separatorIndex <= 0) {
          continue;
        }

        const entryKey = trimmedLine.slice(0, separatorIndex).trim();
        if (entryKey !== key) {
          continue;
        }

        return parseEnvValue(trimmedLine.slice(separatorIndex + 1));
      }
    } catch {
      // Ignore missing files and keep looking.
    }
  }

  return null;
}

export function getDatabaseUrl() {
  return process.env.DATABASE_URL ?? readWorkerEnvValue("DATABASE_URL") ?? null;
}

export function isDirectHostedSupabaseDatabaseUrl(databaseUrl: string | null) {
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
  return "Hosted Supabase direct DATABASE_URL can resolve to IPv6-only Postgres on this network. Use the Supabase Dashboard connection string for the Session pooler or Transaction pooler as DATABASE_URL in apps/web/.env.local and apps/worker/.env.local.";
}

export function getSupabaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    readWorkerEnvValue("NEXT_PUBLIC_SUPABASE_URL") ??
    null
  );
}

export function getSupabaseServiceRoleKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    readWorkerEnvValue("SUPABASE_SERVICE_ROLE_KEY") ??
    null
  );
}

export function getGrobidUrl() {
  return process.env.GROBID_URL ?? readWorkerEnvValue("GROBID_URL") ?? null;
}
