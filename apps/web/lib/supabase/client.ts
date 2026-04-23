"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnv } from "./env";

export function createSupabaseBrowserClient() {
  const env = getSupabaseEnv();

  if (!env) {
    throw new Error(
      "Supabase browser client requested without required environment variables.",
    );
  }

  return createBrowserClient(env.url, env.publishableKey);
}
