import { NextResponse } from "next/server";

import { normalizeNextPath } from "@/lib/auth/next-path";
import { getViewerContext } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextPath = normalizeNextPath(url.searchParams.get("next"));
  const errorDescription =
    url.searchParams.get("error_description") ?? url.searchParams.get("error");

  if (errorDescription) {
    return NextResponse.redirect(
      new URL(
        `/auth/sign-in?error=${encodeURIComponent(errorDescription)}`,
        url.origin,
      ),
    );
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase || !code) {
    return NextResponse.redirect(new URL("/auth/sign-in", url.origin));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/auth/sign-in?error=${encodeURIComponent(error.message)}`,
        url.origin,
      ),
    );
  }

  try {
    await getViewerContext();
  } catch (error) {
    return NextResponse.redirect(
      new URL(
        `/auth/sign-in?error=${encodeURIComponent(
          error instanceof Error
            ? error.message
            : "Unable to complete sign-in.",
        )}`,
        url.origin,
      ),
    );
  }

  return NextResponse.redirect(new URL(nextPath, url.origin));
}
