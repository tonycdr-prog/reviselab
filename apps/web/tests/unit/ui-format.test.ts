import { describe, expect, it } from "vitest";

import { formatUiDateTime } from "@reviselab/ui";

describe("formatUiDateTime", () => {
  it("formats UTC timestamps without relying on runtime locale punctuation", () => {
    expect(formatUiDateTime("2026-04-23T08:01:00.000Z")).toBe(
      "23 Apr 2026, 08:01 UTC",
    );
  });
});
