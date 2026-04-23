import { spawn, spawnSync } from "node:child_process";
import process from "node:process";

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
    throw new Error(
      result.stderr?.trim() ||
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

function prefixStream(stream, prefix) {
  let pending = "";
  stream.on("data", (chunk) => {
    pending += chunk.toString();
    const lines = pending.split(/\r?\n/);
    pending = lines.pop() ?? "";
    for (const line of lines) {
      if (line.trim()) {
        console.log(`[${prefix}] ${line}`);
      }
    }
  });
}

function spawnLiveProcess(prefix, args) {
  const child = spawn("pnpm", args, {
    cwd: ROOT,
    stdio: ["inherit", "pipe", "pipe"],
    env: process.env,
  });

  prefixStream(child.stdout, prefix);
  prefixStream(child.stderr, prefix);
  return child;
}

function stopChildren(children) {
  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGINT");
    }
  }
}

try {
  ensureCommand("supabase", ["--version"], "Supabase CLI");
  ensureCommand("docker", ["compose", "version"], "Docker Compose");
  ensureCommand("pnpm", ["--version"], "pnpm");
  ensureDockerDaemonRunning();

  console.log("Starting local Supabase services...");
  run("supabase", ["start"]);

  console.log("Starting local GROBID service...");
  run("docker", ["compose", "up", "-d", "grobid"]);

  const stackEnv = parseEnvBlock(
    run("supabase", ["status", "-o", "env"], { capture: true }),
  );
  if (!stackEnv.API_URL) {
    throw new Error("Supabase did not report an API_URL after startup.");
  }

  await waitForHttp(`${stackEnv.API_URL}/auth/v1/health`, {
    label: "Supabase Auth",
    validate: (response) => response.ok,
  });
  await waitForHttp(`${LOCAL_GROBID_URL}/api/isalive`, {
    label: "GROBID",
    validate: (response, body) => response.ok && body.trim() === "true",
    timeoutMs: 180000,
  });

  const syncResult = syncLocalEnv();
  if (syncResult.backups.length > 0) {
    console.log("Backed up remote-looking env files before local sync.");
  }

  run("node", ["./scripts/check-local-stack.mjs"]);

  console.log("");
  console.log("Local live stack is ready.");
  console.log(`- Supabase API: ${stackEnv.API_URL}`);
  console.log(
    `- Supabase Studio: ${stackEnv.STUDIO_URL ?? "http://127.0.0.1:54323"}`,
  );
  console.log(`- Inbucket: ${LOCAL_INBUCKET_URL}`);
  console.log(`- GROBID: ${LOCAL_GROBID_URL}`);
  console.log("- Web: Next.js will print the selected localhost port below.");
  console.log("");

  const children = [
    spawnLiveProcess("worker", ["--filter", "@reviselab/worker", "dev"]),
    spawnLiveProcess("web", ["--filter", "@reviselab/web", "dev"]),
  ];

  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => {
      stopChildren(children);
      process.exit(0);
    });
  }

  for (const child of children) {
    child.on("exit", (code) => {
      stopChildren(children);
      process.exitCode = code ?? 1;
    });
  }
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Unable to start local live mode.",
  );
  process.exitCode = 1;
}
