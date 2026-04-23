import { createQueueSql } from "./database";
import type { QueueMessage, QueueName, WorkerSql } from "./types";

export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function readQueueMessage<T>(
  sql: WorkerSql,
  queueName: QueueName,
) {
  const messages = await sql.unsafe<QueueMessage<T>[]>(
    `select * from pgmq.read('${queueName}', 30, 1)`,
  );

  return messages[0] ?? null;
}

export async function archiveQueueMessage(
  sql: WorkerSql,
  queueName: QueueName,
  messageId: number,
) {
  await sql`select * from pgmq.archive(${queueName}, ${messageId})`;
}

export async function enqueueRunReview(sql: WorkerSql, reviewId: string) {
  await sql`select pgmq.send('run_review', ${JSON.stringify({ reviewId })}::jsonb)`;
}

export type QueueClient = ReturnType<typeof createQueueSql>;
