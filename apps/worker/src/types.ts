import type { Database } from "@reviselab/core";

import type { createQueueSql, createWorkerAdminClient } from "./database";

export type WorkerSql = ReturnType<typeof createQueueSql>;
export type WorkerAdminClient = ReturnType<typeof createWorkerAdminClient>;

export type QueueName = "parse_paper" | "run_review";

export type QueueMessage<T> = {
  msg_id: number;
  read_ct: number;
  message: T;
};

export type WorkerJobResult = {
  shouldArchive: boolean;
  summary?: string;
};

export type ParsePaperPayload = {
  paperId: string;
  versionId: string;
  workspaceId: string;
  ownerUserId: string;
};

export type RunReviewPayload = {
  reviewId: string;
};

export type PaperVersionRow =
  Database["public"]["Tables"]["paper_versions"]["Row"];
export type PaperRow = Database["public"]["Tables"]["papers"]["Row"];
