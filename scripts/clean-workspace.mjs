import { spawnSync } from "node:child_process";
import { readdir, rm } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const DIRECTORIES_TO_REMOVE = [
  ".cache",
  ".turbo",
  ".vercel",
  "coverage",
  "playwright-report",
  "apps/web/.next",
  "apps/web/test-results",
  "apps/web/playwright-report",
  "apps/web/coverage",
  "apps/extension/.wxt",
  "apps/extension/.output",
  "apps/worker/dist",
  "supabase/.temp",
  "test-results",
];
const IGNORED_DIRECTORIES = new Set([".git", "node_modules"]);
const NEXT_BUILD_DIR = "apps/web/.next";

function isNextDevServerRunning() {
  if (process.env.REVISELAB_FORCE_CLEAN_NEXT === "1") {
    return false;
  }

  const result = spawnSync("ps", ["-axo", "command="], {
    encoding: "utf8",
  });

  if (result.status !== 0) {
    return false;
  }

  const webAppPath = path.join(ROOT, "apps/web");

  return (result.stdout ?? "")
    .split(/\r?\n/)
    .some(
      (command) =>
        command.includes(webAppPath) &&
        command.includes("next") &&
        command.includes(" dev"),
    );
}

const shouldPreserveNextBuild = isNextDevServerRunning();

async function removeIfPresent(relativePath) {
  if (relativePath === NEXT_BUILD_DIR && shouldPreserveNextBuild) {
    console.log(
      "Skipped apps/web/.next because Next dev is running. Stop the dev server or set REVISELAB_FORCE_CLEAN_NEXT=1 to remove it.",
    );
    return;
  }

  await rm(path.join(ROOT, relativePath), {
    force: true,
    recursive: true,
  });
}

async function removeMatchingFiles(relativeDirectory = "") {
  const absoluteDirectory = path.join(ROOT, relativeDirectory);
  const entries = await readdir(absoluteDirectory, {
    withFileTypes: true,
  });

  await Promise.all(
    entries.map(async (entry) => {
      if (IGNORED_DIRECTORIES.has(entry.name)) {
        return;
      }

      const entryRelativePath = path.join(relativeDirectory, entry.name);

      if (entry.isDirectory()) {
        await removeMatchingFiles(entryRelativePath);
        return;
      }

      if (entry.name !== ".DS_Store" && !entry.name.endsWith(".tsbuildinfo")) {
        return;
      }

      await removeIfPresent(entryRelativePath);
    }),
  );
}

await Promise.all([
  ...DIRECTORIES_TO_REMOVE.map(removeIfPresent),
  removeMatchingFiles(),
]);

console.log("Workspace cleanup complete.");
