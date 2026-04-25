import { createQueueSql, createWorkerAdminClient } from "./database";
import { getDatabaseUrl } from "./env";
import { recordWorkerHeartbeat } from "./heartbeat";
import {
  getWorkerErrorMessage,
  markParseJobAttemptsExhausted,
  markReviewJobAttemptsExhausted,
} from "./job-failures";
import { parsePaperVersion } from "./paper-processing";
import { archiveQueueMessage, readQueueMessage, wait } from "./queue";
import { runReview } from "./review-processing";
import type {
  ParsePaperPayload,
  QueueMessage,
  RunReviewPayload,
  WorkerSql,
} from "./types";

const MAX_QUEUE_ATTEMPTS = 3;

function isResetTransientError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error.code === "3F000" || error.code === "57P01")
  );
}

async function processParseJob(
  adminClient: ReturnType<typeof createWorkerAdminClient>,
  sql: WorkerSql,
  job: QueueMessage<ParsePaperPayload> | null,
) {
  if (!job) {
    return false;
  }

  try {
    const result = await parsePaperVersion(adminClient, sql, job.message);
    if (result.shouldArchive) {
      await archiveQueueMessage(sql, "parse_paper", job.msg_id);
    }
    console.log(result.summary ?? `Handled parse job ${job.msg_id}`);
  } catch (error) {
    console.error("Parse job failed", error);
    if (job.read_ct >= MAX_QUEUE_ATTEMPTS) {
      await markParseJobAttemptsExhausted(adminClient, job.message, error);
      await archiveQueueMessage(sql, "parse_paper", job.msg_id);
      console.error(
        `Archived exhausted parse job ${job.msg_id}: ${getWorkerErrorMessage(error)}`,
      );
    }
  }

  return true;
}

async function processReviewJob(
  adminClient: ReturnType<typeof createWorkerAdminClient>,
  sql: WorkerSql,
  job: QueueMessage<RunReviewPayload> | null,
) {
  if (!job) {
    return false;
  }

  try {
    const result = await runReview(adminClient, job.message.reviewId);
    if (result.shouldArchive) {
      await archiveQueueMessage(sql, "run_review", job.msg_id);
    }
    console.log(result.summary ?? `Handled review job ${job.msg_id}`);
  } catch (error) {
    console.error("Review job failed", error);
    if (job.read_ct >= MAX_QUEUE_ATTEMPTS) {
      await markReviewJobAttemptsExhausted(adminClient, job.message, error);
      await archiveQueueMessage(sql, "run_review", job.msg_id);
      console.error(
        `Archived exhausted review job ${job.msg_id}: ${getWorkerErrorMessage(error)}`,
      );
    }
  }

  return true;
}

async function main() {
  if (!getDatabaseUrl()) {
    console.log(
      "ReviseLab worker idle: set DATABASE_URL to consume queued reviews.",
    );
    return;
  }

  const sql = createQueueSql();
  const adminClient = createWorkerAdminClient();
  console.log("ReviseLab worker started.");
  await recordWorkerHeartbeat(adminClient, true);

  while (true) {
    try {
      await recordWorkerHeartbeat(adminClient);

      const parseJob = await readQueueMessage<ParsePaperPayload>(
        sql,
        "parse_paper",
      );

      if (await processParseJob(adminClient, sql, parseJob)) {
        continue;
      }

      const reviewJob = await readQueueMessage<RunReviewPayload>(
        sql,
        "run_review",
      );

      if (await processReviewJob(adminClient, sql, reviewJob)) {
        continue;
      }

      await wait(5000);
    } catch (error) {
      if (isResetTransientError(error)) {
        console.warn(
          "Worker waiting for local database queues to become available.",
        );
      } else {
        console.error("Worker iteration failed", error);
      }
      await wait(5000);
    }
  }
}

main().catch((error) => {
  console.error("ReviseLab worker crashed", error);
  process.exitCode = 1;
});
