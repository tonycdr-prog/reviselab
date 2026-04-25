"use client";

import { useEffect } from "react";

const AUTH_ERROR_HASH_PATTERN =
  /(?:^|[&#])(?:error|error_code|error_description)=|otp_expired/;

export function AuthErrorHashCleaner() {
  useEffect(() => {
    const { hash, pathname, search } = window.location;

    if (
      hash &&
      pathname !== "/auth/sign-in" &&
      AUTH_ERROR_HASH_PATTERN.test(hash)
    ) {
      window.history.replaceState(
        window.history.state,
        "",
        `${pathname}${search}`,
      );
    }
  }, []);

  return null;
}
