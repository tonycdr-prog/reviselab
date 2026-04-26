export function hasSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function hasDatabaseConfig() {
  return Boolean(process.env.DATABASE_URL);
}

export function isLocalSupabaseUrl(url = process.env.NEXT_PUBLIC_SUPABASE_URL) {
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

export function getDatabaseUrl() {
  return process.env.DATABASE_URL ?? null;
}

export function getGrobidUrl() {
  return process.env.GROBID_URL ?? null;
}

export function getSiteUrl() {
  return (
    process.env.REVISELAB_SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? null
  );
}

export function isDiagnosticsEnabled() {
  return process.env.REVISELAB_DIAGNOSTICS_ENABLED === "true";
}

export function getPlatformAdminEmails() {
  return (process.env.REVISELAB_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isDirectHostedSupabaseDatabaseUrl(
  databaseUrl = getDatabaseUrl(),
) {
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
  return "Hosted Supabase direct DATABASE_URL can resolve to IPv6-only Postgres on this network. Use the Supabase Dashboard connection string for the Session pooler or Transaction pooler as DATABASE_URL.";
}

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !publishableKey) {
    return null;
  }

  return {
    url,
    publishableKey,
    serviceRoleKey,
  };
}
