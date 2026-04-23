import { getGrobidUrl, getSupabaseEnv } from "@/lib/supabase/env";

import { type DiagnosticCheck, statusFromBoolean } from "./live-stack-types";

export async function checkSupabaseAuth(): Promise<DiagnosticCheck> {
  const env = getSupabaseEnv();

  if (!env) {
    return {
      label: "Supabase Auth",
      status: "error",
      detail: "Supabase environment values are not configured.",
    };
  }

  try {
    const response = await fetch(`${env.url}/auth/v1/health`, {
      headers: { apikey: env.publishableKey },
      cache: "no-store",
    });

    return statusFromBoolean(
      "Supabase Auth",
      response.ok,
      "Auth service is reachable.",
      `Auth health returned ${response.status}.`,
    );
  } catch (error) {
    return {
      label: "Supabase Auth",
      status: "error",
      detail: error instanceof Error ? error.message : "Auth check failed.",
    };
  }
}

export async function checkGrobid(): Promise<DiagnosticCheck> {
  const grobidUrl = getGrobidUrl();

  if (!grobidUrl) {
    return {
      label: "GROBID",
      status: "warning",
      detail: "GROBID_URL is not configured in the web process.",
    };
  }

  try {
    const response = await fetch(
      `${grobidUrl.replace(/\/$/, "")}/api/isalive`,
      {
        cache: "no-store",
        signal: AbortSignal.timeout(3000),
      },
    );
    const body = await response.text();

    return statusFromBoolean(
      "GROBID",
      response.ok && body.trim() === "true",
      "PDF parser service is reachable.",
      `PDF parser health returned ${response.status}.`,
    );
  } catch (error) {
    return {
      label: "GROBID",
      status: "warning",
      detail:
        error instanceof Error ? error.message : "PDF parser check failed.",
    };
  }
}
