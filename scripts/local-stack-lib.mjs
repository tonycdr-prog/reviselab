import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));

export const ROOT = path.resolve(SCRIPT_DIR, "..");
export const LOCAL_GROBID_URL = "http://127.0.0.1:8070";
export const LOCAL_INBUCKET_URL = "http://127.0.0.1:54324";

export function parseEnvBlock(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith("#"))
    .reduce((entries, line) => {
      const separatorIndex = line.indexOf("=");

      if (separatorIndex <= 0) {
        return entries;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();

      return {
        ...entries,
        [key]: value,
      };
    }, {});
}

export function readEnvFile(relativePath) {
  const filePath = path.join(ROOT, relativePath);

  if (!existsSync(filePath)) {
    return null;
  }

  return parseEnvBlock(readFileSync(filePath, "utf8"));
}

export function isLocalSupabaseUrl(url) {
  if (!url) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost";
  } catch {
    return false;
  }
}

export function ensureDockerDaemonRunning() {
  const result = spawnSync("docker", ["info"], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: "pipe",
  });

  if (result.error) {
    throw new Error("Docker is required for local live mode.");
  }

  if (result.status === 0) {
    return;
  }

  const stderr = `${result.stderr ?? ""}${result.stdout ?? ""}`.trim();
  throw new Error(
    stderr || "Docker is installed, but the Docker daemon is not running.",
  );
}

export async function wait(ms) {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function waitForHttp(url, options) {
  const {
    label,
    timeoutMs = 120000,
    validate = (response, body) => response.ok && body.length > 0,
  } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const response = await fetch(url);
      const body = await response.text();

      if (validate(response, body)) {
        return;
      }
    } catch {
      // Retry until timeout.
    }

    await wait(1000);
  }

  throw new Error(`Timed out waiting for ${label} at ${url}.`);
}
