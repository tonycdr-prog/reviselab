export type AuthCallbackError = {
  code: string | null;
  message: string;
};

export function getAuthCallbackError(
  searchParams: URLSearchParams,
): AuthCallbackError | null {
  const code = searchParams.get("error_code");
  const description =
    searchParams.get("error_description") ?? searchParams.get("error");

  if (!description) {
    return null;
  }

  if (code === "otp_expired") {
    return {
      code,
      message:
        "That magic link has already been used or expired. Send a fresh magic link and open the newest email once in this browser.",
    };
  }

  return {
    code,
    message: description,
  };
}
