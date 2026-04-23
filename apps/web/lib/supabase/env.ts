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
