import { readEnvFile, waitForHttp } from "./local-stack-lib.mjs";

const workerEnv =
  readEnvFile("apps/worker/.env.local") ?? readEnvFile("apps/worker/.env");
const timeoutMs = Number(process.env.GROBID_CHECK_TIMEOUT_MS ?? 120000);

function fail(message) {
  throw new Error(message);
}

try {
  if (!workerEnv?.GROBID_URL) {
    fail("Worker GROBID_URL is missing.");
  }

  const grobidUrl = workerEnv.GROBID_URL.replace(/\/$/, "");

  await waitForHttp(`${grobidUrl}/api/isalive`, {
    label: "GROBID",
    timeoutMs,
    validate: (response) => response.ok,
  });

  console.log("GROBID health check passed.");
  console.log("- Endpoint: configured");
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "GROBID health check failed.",
  );
  process.exitCode = 1;
}
