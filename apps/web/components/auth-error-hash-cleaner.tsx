"use client";

import { useEffect } from "react";

const AUTH_ERROR_HASH_PATTERN =
  /(?:^|[&#])(?:error|error_code|error_description)=|otp_expired/;

function getAuthErrorFromHash(hash: string) {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const code = params.get("error_code");
  const description = params.get("error_description") ?? params.get("error");

  if (!description) {
    return null;
  }

  return {
    code,
    message:
      code === "otp_expired"
        ? "That magic link has already been used or expired. Send a fresh magic link and open the newest email once in this browser."
        : description,
  };
}

export function AuthErrorHashCleaner() {
  useEffect(() => {
    const { hash, pathname, search } = window.location;

    if (!hash || !AUTH_ERROR_HASH_PATTERN.test(hash)) {
      return;
    }

    const authError = getAuthErrorFromHash(hash);

    if (authError) {
      const signInUrl = new URL("/auth/sign-in", window.location.origin);
      signInUrl.searchParams.set("next", pathname);
      signInUrl.searchParams.set("error", authError.message);

      if (authError.code) {
        signInUrl.searchParams.set("errorCode", authError.code);
      }

      window.location.replace(signInUrl);
      return;
    }

    window.history.replaceState(
      window.history.state,
      "",
      `${pathname}${search}`,
    );
  }, []);

  return null;
}
