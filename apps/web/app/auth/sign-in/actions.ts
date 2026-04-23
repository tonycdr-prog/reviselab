"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureAuthProviderAvailable } from "@/lib/auth/provider-availability";
import { normalizeNextPath } from "@/lib/auth/next-path";
import { getRequestOrigin } from "@/lib/auth/origin";

type OAuthProviderId = "google" | `custom:${string}`;

function getRedirectPath(formData: FormData) {
  return normalizeNextPath(String(formData.get("next") ?? "/dashboard"));
}

async function startOAuth(provider: OAuthProviderId, formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/auth/sign-in?error=Supabase%20is%20not%20configured");
  }

  const origin = await getRequestOrigin();
  const nextPath = getRedirectPath(formData);
  const redirectTo = new URL("/auth/callback", origin);
  redirectTo.searchParams.set("next", nextPath);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as never,
    options: {
      redirectTo: redirectTo.toString(),
    },
  });

  if (error || !data.url) {
    redirect(
      `/auth/sign-in?error=${encodeURIComponent(
        error?.message ?? "Unable to start sign-in.",
      )}`,
    );
  }

  redirect(data.url as never);
}

export async function sendMagicLink(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/auth/sign-in?error=Supabase%20is%20not%20configured");
  }

  const email = String(formData.get("email") ?? "").trim();
  const nextPath = getRedirectPath(formData);

  if (!email) {
    redirect(
      `/auth/sign-in?next=${encodeURIComponent(nextPath)}&error=${encodeURIComponent(
        "Enter an email address first.",
      )}`,
    );
  }

  const origin = await getRequestOrigin();
  const redirectTo = new URL("/auth/callback", origin);
  redirectTo.searchParams.set("next", nextPath);

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo.toString(),
    },
  });

  if (error) {
    redirect(
      `/auth/sign-in?next=${encodeURIComponent(nextPath)}&error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  redirect(
    `/auth/sign-in?next=${encodeURIComponent(nextPath)}&message=${encodeURIComponent(
      "Check your inbox for the newest magic link. Magic links are single use.",
    )}`,
  );
}

export async function signInWithGoogle(formData: FormData) {
  try {
    await ensureAuthProviderAvailable("google");
  } catch (error) {
    const nextPath = getRedirectPath(formData);
    redirect(
      `/auth/sign-in?next=${encodeURIComponent(nextPath)}&error=${encodeURIComponent(
        error instanceof Error ? error.message : "Unable to start sign-in.",
      )}`,
    );
  }

  await startOAuth("google", formData);
}

export async function signInWithOrcid(formData: FormData) {
  try {
    await ensureAuthProviderAvailable("orcid");
  } catch (error) {
    const nextPath = getRedirectPath(formData);
    redirect(
      `/auth/sign-in?next=${encodeURIComponent(nextPath)}&error=${encodeURIComponent(
        error instanceof Error ? error.message : "Unable to start sign-in.",
      )}`,
    );
  }

  await startOAuth("custom:orcid", formData);
}
