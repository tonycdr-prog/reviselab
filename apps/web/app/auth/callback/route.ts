import { NextResponse } from "next/server";

import { getAuthCallbackError } from "@/lib/auth/callback-error";
import { normalizeNextPath } from "@/lib/auth/next-path";
import { getViewerContext } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function redirectSignedInViewer(nextPath: string, origin: string) {
  try {
    const viewer = await getViewerContext();

    if (viewer) {
      return NextResponse.redirect(new URL(nextPath, origin));
    }
  } catch {
    return null;
  }

  return null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextPath = normalizeNextPath(url.searchParams.get("next"));
  const callbackError = getAuthCallbackError(url.searchParams);

  if (callbackError) {
    const signedInRedirect = await redirectSignedInViewer(nextPath, url.origin);

    if (signedInRedirect) {
      return signedInRedirect;
    }

    const signInUrl = new URL("/auth/sign-in", url.origin);
    signInUrl.searchParams.set("next", nextPath);
    signInUrl.searchParams.set("error", callbackError.message);

    if (callbackError.code) {
      signInUrl.searchParams.set("errorCode", callbackError.code);
    }

    return NextResponse.redirect(signInUrl);
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase || !code) {
    const signedInRedirect = await redirectSignedInViewer(nextPath, url.origin);

    if (signedInRedirect) {
      return signedInRedirect;
    }

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
