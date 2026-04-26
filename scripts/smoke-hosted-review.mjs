import postgres from "postgres";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { ROOT, assert, readHostedWebEnv } from "./local-stack-lib.mjs";
import {
  assertReadyReview,
  cleanupSmokeReview,
  createSmokeReview,
  waitForOutcome,
} from "./smoke-review-database.mjs";

const SOURCE_KIND = process.argv.includes("--pdf") ? "pdf" : "latex-zip";
const EXPECT_FAILURE = process.argv.includes("--expect-failure");
const KEEP_SMOKE_DATA = process.argv.includes("--keep");
const CHECK_TIMEOUT_MS = 120_000;
const reportPath = path.join(
  ROOT,
  ".local-runtime",
  "hosted-smoke-report.json",
);
let lastCreated = null;

async function writeSmokeReport(report) {
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(
    reportPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        sourceKind: SOURCE_KIND,
        expectedFailure: EXPECT_FAILURE,
        ...report,
      },
      null,
      2,
    )}\n`,
  );
}

async function main() {
  const env = readHostedWebEnv();
  const sql = postgres(env.DATABASE_URL, {
    max: 1,
    prepare: false,
    ssl: "require",
  });
  let created = null;
  const startedAt = Date.now();

  try {
    created = await createSmokeReview(sql, env, SOURCE_KIND);
    lastCreated = created;
    const outcome = await waitForOutcome(
      sql,
      created.reviewId,
      CHECK_TIMEOUT_MS,
    );

    if (EXPECT_FAILURE) {
      assert(outcome.status === "failed", "Expected the smoke review to fail.");
      await writeSmokeReport({
        status: "passed",
        reviewStatus: outcome.status,
        parseStatus: outcome.parse_status,
        reviewId: created.reviewId,
        failureReason: outcome.parse_error ?? outcome.failed_reason ?? null,
        durationMs: Date.now() - startedAt,
      });
      console.log(`Hosted ${SOURCE_KIND} failure smoke passed.`);
      console.log(`- Review: ${created.reviewId}`);
      console.log(
        `- Parse error: ${outcome.parse_error ?? outcome.failed_reason}`,
      );
      return;
    }

    assert(
      outcome.status === "ready",
      outcome.failed_reason ?? "Review failed.",
    );
    await assertReadyReview(sql, created.reviewId);
    await writeSmokeReport({
      status: "passed",
      reviewStatus: outcome.status,
      parseStatus: outcome.parse_status,
      readiness: outcome.readiness,
      reviewId: created.reviewId,
      durationMs: Date.now() - startedAt,
    });
    console.log(`Hosted ${SOURCE_KIND} smoke passed.`);
    console.log(`- Review: ${created.reviewId}`);
    console.log(`- Readiness: ${outcome.readiness}`);
  } finally {
    if (created && !KEEP_SMOKE_DATA) {
      await cleanupSmokeReview(sql, env, created);
    }

    await sql.end({ timeout: 2 });
  }
}

main().catch(async (error) => {
  await writeSmokeReport({
    status: "failed",
    ...(lastCreated ? { reviewId: lastCreated.reviewId } : {}),
    error: error instanceof Error ? error.message : "Hosted smoke failed.",
  }).catch(() => {});
  console.error(
    error instanceof Error ? error.message : "Hosted smoke failed.",
  );
  process.exitCode = 1;
});
