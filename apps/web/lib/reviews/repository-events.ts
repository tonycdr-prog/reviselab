import "server-only";

import {
  createReviewEvent,
  type ReviewEvent,
  type ReviewFilePath,
  type SuggestionAction,
} from "@reviselab/core";

type ReviewEventClient = {
  from: (table: "review_events") => {
    insert: (value: {
      id: string;
      review_id: string;
      event_kind: string;
      label: string;
      detail?: string;
      file_path?: string;
      suggestion_id?: string;
      created_at: string;
    }) => PromiseLike<{
      error: {
        message: string;
      } | null;
    }>;
  };
};

export function getSuggestionEventKind(
  action: SuggestionAction,
): ReviewEvent["kind"] {
  switch (action) {
    case "apply":
      return "suggestion_applied";
    case "reject":
      return "suggestion_rejected";
    case "resolve":
      return "suggestion_resolved";
    case "restore":
      return "suggestion_restored";
    case "edit":
      return "suggestion_edited";
  }
}

export async function appendReviewEvent(
  client: ReviewEventClient,
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

  const { error } = await client.from("review_events").insert({
    id: event.id,
    review_id: input.reviewId,
    event_kind: event.kind,
    label: event.label,
    ...(event.detail ? { detail: event.detail } : {}),
    ...(event.filePath ? { file_path: event.filePath } : {}),
    ...(event.suggestionId ? { suggestion_id: event.suggestionId } : {}),
    created_at: event.createdAt,
  });

  if (error) {
    throw new Error(error.message);
  }

  return event;
}
