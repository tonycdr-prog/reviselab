import { spawn } from "node:child_process";

const action = process.argv[2];
const serviceName = process.env.RAILWAY_SERVICE_NAME ?? "";

function getCommand() {
  if (action !== "build" && action !== "start") {
    throw new Error("Usage: node scripts/railway-command.mjs <build|start>");
  }

  if (serviceName.includes("worker")) {
    return ["pnpm", "--filter", "@reviselab/worker", action];
  }

  return ["pnpm", "--filter", "@reviselab/web", action];
}

const [command, ...args] = getCommand();

console.log(
  `Railway ${action} for ${serviceName || "default web service"}: ${command} ${args.join(" ")}`,
);

const child = spawn(command, args, {
  stdio: "inherit",
  shell: process.platform === "win32",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
