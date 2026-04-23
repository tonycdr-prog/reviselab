import { createQueueSql } from "./database";
import type { QueueMessage, QueueName, WorkerSql } from "./types";

export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeQueueMessage<T>(message: QueueMessage<T>) {
  if (typeof message.message !== "string") {
    return message;
  }

  return {
    ...message,
    message: JSON.parse(message.message) as T,
  };
}

export async function readQueueMessage<T>(
  sql: WorkerSql,
  queueName: QueueName,
) {
  const messages = await sql<
    QueueMessage<T>[]
  >`select * from pgmq.read(${queueName}::text, 30, 1)`;

  return messages[0] ? normalizeQueueMessage(messages[0]) : null;
}

export async function archiveQueueMessage(
  sql: WorkerSql,
  queueName: QueueName,
  messageId: number,
) {
  await sql`select * from pgmq.archive(${queueName}::text, ${messageId}::bigint)`;
}

export async function enqueueRunReview(sql: WorkerSql, reviewId: string) {
  await sql`select pgmq.send('run_review'::text, ${JSON.stringify({ reviewId })}::jsonb)`;
}

export type QueueClient = ReturnType<typeof createQueueSql>;
