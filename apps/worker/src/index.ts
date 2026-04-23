import { createQueueSql, createWorkerAdminClient } from "./database";
import { getDatabaseUrl } from "./env";
import { parsePaperVersion } from "./paper-processing";
import { archiveQueueMessage, readQueueMessage, wait } from "./queue";
import { runReview } from "./review-processing";
import type { ParsePaperPayload, RunReviewPayload } from "./types";

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

  while (true) {
    try {
      const parseJob = await readQueueMessage<ParsePaperPayload>(
        sql,
        "parse_paper",
      );

      if (parseJob) {
        await parsePaperVersion(adminClient, sql, parseJob.message);
        await archiveQueueMessage(sql, "parse_paper", parseJob.msg_id);
        console.log(`Parsed paper version ${parseJob.message.versionId}`);
        continue;
      }

      const reviewJob = await readQueueMessage<RunReviewPayload>(
        sql,
        "run_review",
      );

      if (reviewJob) {
        await runReview(adminClient, reviewJob.message.reviewId);
        await archiveQueueMessage(sql, "run_review", reviewJob.msg_id);
        console.log(`Processed review ${reviewJob.message.reviewId}`);
        continue;
      }

      await wait(5000);
    } catch (error) {
      console.error("Worker iteration failed", error);
      await wait(5000);
    }
  }
}

main().catch((error) => {
  console.error("ReviseLab worker crashed", error);
  process.exitCode = 1;
});
