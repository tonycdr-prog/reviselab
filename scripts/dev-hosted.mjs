import { spawn } from "node:child_process";
import process from "node:process";

import { ROOT } from "./local-stack-lib.mjs";

if (process.argv.includes("--help")) {
  console.log("Start the local web app and worker against hosted Supabase.");
  console.log(
    "Run `pnpm dev:hosted:check` first when you want a remote stack preflight.",
  );
  process.exit(0);
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

function spawnHostedProcess(prefix, args) {
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

const children = [
  spawnHostedProcess("worker", ["--filter", "@reviselab/worker", "dev"]),
  spawnHostedProcess("web", ["--filter", "@reviselab/web", "dev"]),
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
