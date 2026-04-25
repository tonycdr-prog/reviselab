import postgres from "postgres";
import { spawnSync } from "node:child_process";

import { readLocalWebEnv } from "./local-stack-lib.mjs";
import {
  assertReadyReview,
  cleanupSmokeReview,
  createSmokeReview,
  waitForOutcome,
} from "./smoke-review-database.mjs";

const SOURCE_KIND = process.argv.includes("--pdf") ? "pdf" : "latex-zip";
const KEEP_SMOKE_DATA = process.argv.includes("--keep");
const CHECK_TIMEOUT_MS = SOURCE_KIND === "pdf" ? 240_000 : 120_000;

async function main() {
  const fixtureCheck = spawnSync(
    "node",
    ["./scripts/check-local-manuscripts.mjs"],
    {
      cwd: process.cwd(),
      stdio: "inherit",
    },
  );

  if (fixtureCheck.status !== 0) {
    throw new Error("Local manuscript fixture check failed.");
  }

  const env = readLocalWebEnv();
  const sql = postgres(env.DATABASE_URL, {
    max: 1,
    prepare: false,
  });
  let created = null;

  try {
    created = await createSmokeReview(sql, env, SOURCE_KIND);
    const outcome = await waitForOutcome(
      sql,
      created.reviewId,
      CHECK_TIMEOUT_MS,
    );

    if (outcome.status !== "ready") {
      throw new Error(
        outcome.parse_error ?? outcome.failed_reason ?? "Review failed.",
      );
    }

    await assertReadyReview(sql, created.reviewId);
    console.log(`Live ${SOURCE_KIND} smoke passed.`);
    console.log(`- Review: ${created.reviewId}`);
    console.log(`- Readiness: ${outcome.readiness}`);
  } finally {
    if (created && !KEEP_SMOKE_DATA) {
      await cleanupSmokeReview(sql, env, created);
    }

    await sql.end({ timeout: 2 });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Live smoke failed.");
  process.exitCode = 1;
});
