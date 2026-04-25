import { describe, expect, test } from "vitest";

import type { Database } from "@reviselab/core";

import { mapStoredEvent } from "../../lib/reviews/repository-mapping-helpers";

type ReviewEventRow = Database["public"]["Tables"]["review_events"]["Row"];

describe("repository mapping helpers", () => {
  test("normalizes stored restore event labels from the event kind", () => {
    const event = mapStoredEvent({
      id: "event_restored",
      review_id: "review_events",
      event_kind: "suggestion_restored",
      label: "Restored AI suggestion",
      detail: "Adjust intended category in metadata.yml.",
      file_path: "metadata.yml",
      suggestion_id: "suggestion_metadata",
      created_at: "2026-04-23T12:00:00.000Z",
    } as ReviewEventRow);

    expect(event.label).toBe("Restored suggestion");
    expect(event.filePath).toBe("metadata.yml");
    expect(event.suggestionId).toBe("suggestion_metadata");
  });
});
