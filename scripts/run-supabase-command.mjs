import { spawnSync } from "node:child_process";
import process from "node:process";

import { ensureDockerDaemonRunning } from "./local-stack-lib.mjs";

const args = process.argv.slice(2);
const isCi = process.env.CI === "true";

if (args.length === 0) {
  console.error("Provide a Supabase CLI command, for example: db reset");
  process.exit(1);
}

const probe = spawnSync("supabase", ["--version"], {
  encoding: "utf8",
  stdio: "ignore",
});

if (
  probe.error &&
  probe.error.name === "Error" &&
  "code" in probe.error &&
  probe.error.code === "ENOENT"
) {
  if (isCi) {
    console.error(
      `Supabase CLI is required in CI. Install it before running: supabase ${args.join(" ")}`,
    );
    process.exit(1);
  }

  console.log(`Supabase CLI not found. Skipping: supabase ${args.join(" ")}`);
  process.exit(0);
}

try {
  ensureDockerDaemonRunning();
} catch (error) {
  console.error(
    error instanceof Error
      ? error.message
      : "Docker is required for Supabase local commands.",
  );
  process.exit(1);
}

const result = spawnSync("supabase", args, {
  stdio: "inherit",
});

process.exit(result.status ?? 1);
