import { describe, expect, test } from "vitest";

import { getAuthCallbackError } from "../../lib/auth/callback-error";

describe("getAuthCallbackError", () => {
  test("returns null when the callback has no provider error", () => {
    expect(getAuthCallbackError(new URLSearchParams("code=abc"))).toBeNull();
  });

  test("maps expired magic links to a resend-oriented message", () => {
    const error = getAuthCallbackError(
      new URLSearchParams(
        "error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired",
      ),
    );

    expect(error).toEqual({
      code: "otp_expired",
      message:
        "That magic link has already been used or expired. Send a fresh magic link and open the newest email once in this browser.",
    });
  });

  test("keeps other auth errors intact", () => {
    expect(
      getAuthCallbackError(
        new URLSearchParams(
          "error_code=provider_error&error_description=Provider+is+unavailable",
        ),
      ),
    ).toEqual({
      code: "provider_error",
      message: "Provider is unavailable",
    });
  });
});
