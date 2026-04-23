import { describe, expect, test } from "vitest";

import { normalizeNextPath } from "../../lib/auth/next-path";

describe("normalizeNextPath", () => {
  test("keeps safe relative paths", () => {
    expect(normalizeNextPath("/papers/review?id=123")).toBe(
      "/papers/review?id=123",
    );
  });

  test("falls back for missing or external paths", () => {
    expect(normalizeNextPath(undefined)).toBe("/dashboard");
    expect(normalizeNextPath("https://example.com/evil")).toBe("/dashboard");
    expect(normalizeNextPath("//example.com/evil")).toBe("/dashboard");
  });
});
