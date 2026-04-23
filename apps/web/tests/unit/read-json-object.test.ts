import { describe, expect, test } from "vitest";

import { readJsonObject } from "../../app/api/_helpers/read-json-object";

describe("readJsonObject", () => {
  test("returns null for invalid JSON bodies", async () => {
    const request = new Request("http://localhost/test", {
      method: "POST",
      body: "{not-json",
      headers: {
        "content-type": "application/json",
      },
    });

    await expect(readJsonObject(request)).resolves.toBeNull();
  });

  test("returns null for non-object JSON payloads", async () => {
    const request = new Request("http://localhost/test", {
      method: "POST",
      body: "null",
      headers: {
        "content-type": "application/json",
      },
    });

    await expect(readJsonObject(request)).resolves.toBeNull();
  });

  test("returns the parsed object for object JSON payloads", async () => {
    const request = new Request("http://localhost/test", {
      method: "POST",
      body: JSON.stringify({
        pairingCode: "ABC123",
      }),
      headers: {
        "content-type": "application/json",
      },
    });

    await expect(
      readJsonObject<{ pairingCode: string }>(request),
    ).resolves.toEqual({
      pairingCode: "ABC123",
    });
  });
});
