import { spawnSync } from "node:child_process";
import process from "node:process";

import { ROOT } from "./local-stack-lib.mjs";

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed.`);
  }
}

try {
  run("node", ["./scripts/check-local-manuscripts.mjs"]);
  run("node", ["./scripts/check-local-stack.mjs"]);
  run("node", ["./scripts/run-supabase-command.mjs", "db", "reset"]);
  run("node", ["./scripts/run-supabase-command.mjs", "test", "db"]);
  run("node", ["./scripts/check-db-types.mjs"]);
  console.log("Live local stack tests passed.");
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Live local stack tests failed.",
  );
  process.exitCode = 1;
}
