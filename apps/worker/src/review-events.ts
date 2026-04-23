import {
  createReviewEvent,
  type ReviewEvent,
  type ReviewFilePath,
} from "@reviselab/core";

import { requireSupabaseResult } from "./supabase";
import type { WorkerAdminClient } from "./types";

export async function appendWorkerReviewEvent(
  adminClient: WorkerAdminClient,
  input: {
    reviewId: string;
    kind: ReviewEvent["kind"];
    detail?: string;
    filePath?: ReviewFilePath;
    suggestionId?: string;
    createdAt?: string;
  },
) {
  const event = createReviewEvent({
    kind: input.kind,
    ...(input.detail ? { detail: input.detail } : {}),
    ...(input.filePath ? { filePath: input.filePath } : {}),
    ...(input.suggestionId ? { suggestionId: input.suggestionId } : {}),
    ...(input.createdAt ? { createdAt: input.createdAt } : {}),
  });

  await requireSupabaseResult(
    adminClient.from("review_events").insert({
      id: event.id,
      review_id: input.reviewId,
      event_kind: event.kind,
      label: event.label,
      ...(event.detail ? { detail: event.detail } : {}),
      ...(event.filePath ? { file_path: event.filePath } : {}),
      ...(event.suggestionId ? { suggestion_id: event.suggestionId } : {}),
      created_at: event.createdAt,
    }),
    "Unable to persist a review event.",
  );

  return event;
}
