import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { ROOT, assert, readHostedWebEnv } from "./local-stack-lib.mjs";

const reportPath = path.join(ROOT, ".local-runtime", "auth-smoke-report.json");

async function writeReport(report) {
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(
    reportPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        ...report,
      },
      null,
      2,
    )}\n`,
  );
}

function getSmokeEmail(env) {
  return (
    process.env.REVISELAB_AUTH_SMOKE_EMAIL ??
    env.REVISELAB_ADMIN_EMAILS?.split(",")[0]?.trim() ??
    null
  );
}

async function main() {
  const env = readHostedWebEnv();
  const siteUrl = env.REVISELAB_SITE_URL;
  const smokeEmail = getSmokeEmail(env);

  assert(siteUrl, "REVISELAB_SITE_URL is missing.");
  assert(
    smokeEmail,
    "Set REVISELAB_AUTH_SMOKE_EMAIL or REVISELAB_ADMIN_EMAILS.",
  );

  const callbackUrl = new URL("/auth/callback", siteUrl);
  callbackUrl.searchParams.set("next", "/dashboard");

  assert(
    callbackUrl.origin === new URL(siteUrl).origin,
    "Auth callback origin does not match REVISELAB_SITE_URL.",
  );
  assert(
    !callbackUrl.href.includes("0.0.0.0") &&
      !callbackUrl.href.includes(":8080"),
    "Auth callback contains an internal Railway origin.",
  );

  const response = await fetch(
    `${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/generate_link`,
    {
      method: "POST",
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        type: "magiclink",
        email: smokeEmail,
        options: {
          redirect_to: callbackUrl.toString(),
        },
      }),
    },
  );

  const body = await response.json().catch(() => ({}));

  assert(response.ok, body?.msg ?? "Supabase auth link generation failed.");
  const actionLink =
    typeof body.action_link === "string" ? new URL(body.action_link) : null;
  const redirectTo = actionLink?.searchParams.get("redirect_to");

  assert(
    redirectTo && new URL(redirectTo).origin === new URL(siteUrl).origin,
    "Generated auth link does not use the production site URL.",
  );
  assert(
    !String(redirectTo).includes("0.0.0.0") &&
      !String(redirectTo).includes(":8080"),
    "Generated auth link contains an internal Railway origin.",
  );

  const callbackResponse = await fetch(callbackUrl, {
    method: "HEAD",
    redirect: "manual",
  });

  assert(
    callbackResponse.status >= 300 && callbackResponse.status < 400,
    `Auth callback route returned ${callbackResponse.status}.`,
  );

  await writeReport({
    status: "passed",
    callbackOrigin: callbackUrl.origin,
    generatedRedirectOrigin: new URL(redirectTo).origin,
    generatedLink: "redacted",
  });

  console.log("Hosted auth redirect smoke passed.");
  console.log(`- Callback origin: ${callbackUrl.origin}`);
}

main().catch(async (error) => {
  await writeReport({
    status: "failed",
    error: error instanceof Error ? error.message : "Auth smoke failed.",
  }).catch(() => {});
  console.error(error instanceof Error ? error.message : "Auth smoke failed.");
  process.exitCode = 1;
});
