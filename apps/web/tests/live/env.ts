export function getLiveMailpitUrl() {
  return process.env.REVISELAB_MAILPIT_URL ?? "http://127.0.0.1:54324";
}

export function getLiveDatabaseUrl() {
  return process.env.DATABASE_URL ?? null;
}

export function getLiveSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;
}

export function getLiveSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? null;
}
