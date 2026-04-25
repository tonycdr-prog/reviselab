import { describe, expect, test } from "vitest";

import { createReviewEvent } from "@reviselab/core";

describe("review event labels", () => {
  test("uses a neutral restore label because restore applies to AI and rules suggestions", () => {
    expect(createReviewEvent({ kind: "suggestion_restored" }).label).toBe(
      "Restored suggestion",
    );
  });
});
