import { spawnSync } from "node:child_process";

import {
  LOCAL_GROBID_URL,
  LOCAL_INBUCKET_URL,
  ROOT,
  ensureDockerDaemonRunning,
  parseEnvBlock,
  waitForHttp,
} from "./local-stack-lib.mjs";
import { syncLocalEnv } from "./sync-local-env.mjs";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
  });

  if (result.status !== 0) {
    const stderr = options.capture ? result.stderr?.trim() : "";
    throw new Error(
      stderr ||
        `${command} ${args.join(" ")} failed with exit code ${result.status ?? 1}.`,
    );
  }

  return (result.stdout ?? "").trim();
}

function ensureCommand(command, args, label) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: "ignore",
  });

  if (result.status !== 0) {
    throw new Error(`${label} is required for local live mode.`);
  }
}

function readSupabaseStatusEnv() {
  return parseEnvBlock(
    run("supabase", ["status", "-o", "env"], { capture: true }),
  );
}

try {
  ensureCommand("supabase", ["--version"], "Supabase CLI");
  ensureCommand("docker", ["compose", "version"], "Docker Compose");
  ensureDockerDaemonRunning();

  console.log("Starting local Supabase services...");
  run("supabase", ["start"]);

  console.log("Starting local GROBID service...");
  run("docker", ["compose", "up", "-d", "grobid"]);

  const stackEnv = readSupabaseStatusEnv();
  const apiUrl = stackEnv.API_URL;

  if (!apiUrl) {
    throw new Error("Supabase did not report an API_URL after startup.");
  }

  await waitForHttp(`${apiUrl}/auth/v1/health`, {
    label: "Supabase Auth",
    validate: (response) => response.ok,
  });

  await waitForHttp(`${LOCAL_GROBID_URL}/api/isalive`, {
    label: "GROBID",
    validate: (response, body) => response.ok && body.trim() === "true",
    timeoutMs: 180000,
  });

  const syncResult = syncLocalEnv();

  console.log("");
  console.log("Local live services are ready.");
  console.log(`- Supabase API: ${apiUrl}`);
  console.log(
    `- Supabase Studio: ${stackEnv.STUDIO_URL ?? "http://127.0.0.1:54323"}`,
  );
  console.log(`- Inbucket: ${LOCAL_INBUCKET_URL}`);
  console.log(`- GROBID: ${LOCAL_GROBID_URL}`);
  console.log("");
  console.log("Local env files synced without printing secrets.");
  console.log("- apps/web/.env.local");
  console.log("- apps/worker/.env.local");
  if (syncResult.backups.length > 0) {
    console.log("Remote-looking env files were backed up before local sync.");
  }
} catch (error) {
  console.error(
    error instanceof Error
      ? error.message
      : "Unable to start local live services.",
  );
  process.exitCode = 1;
}
