import type { PaperType, ReviewSnapshot } from "@reviselab/core";

import { getSettings, saveSettings } from "./settings";

async function readApiError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}

export async function exchangePairingCode() {
  const settings = await getSettings();

  if (!settings.pairingCode) {
    throw new Error("Add a pairing code in the extension settings first.");
  }

  const response = await fetch(
    `${settings.apiBaseUrl}/api/extension/auth/exchange`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        pairingCode: settings.pairingCode,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(await readApiError(response, "Pairing failed."));
  }

  const data = (await response.json()) as { token?: string };

  if (typeof data.token !== "string" || !data.token.trim()) {
    throw new Error("Pairing response did not include an installation token.");
  }

  await saveSettings({
    pairedToken: data.token,
    pairingCode: "",
  });
  return data.token;
}

export async function createSelectionReview(input: {
  title: string;
  abstract: string;
  intendedCategory: string;
  paperType: PaperType;
  firstTimeSubmitter: boolean;
}): Promise<ReviewSnapshot> {
  const settings = await getSettings();

  const response = await fetch(
    `${settings.apiBaseUrl}/api/extension/review-selection`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(settings.pairedToken
          ? {
              Authorization: `Bearer ${settings.pairedToken}`,
            }
          : {}),
      },
      body: JSON.stringify(input),
    },
  );

  if (!response.ok) {
    throw new Error(await readApiError(response, "Selection review failed."));
  }

  return (await response.json()) as ReviewSnapshot;
}

export async function getLatestReviewLink() {
  const settings = await getSettings();

  if (!settings.pairedToken) {
    return null;
  }

  const response = await fetch(
    `${settings.apiBaseUrl}/api/extension/reviews/latest`,
    {
      headers: {
        Authorization: `Bearer ${settings.pairedToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      await readApiError(response, "Latest review is unavailable."),
    );
  }

  const data = (await response.json()) as {
    review_id?: string;
    paper_id?: string;
  };

  if (
    typeof data.review_id !== "string" ||
    typeof data.paper_id !== "string" ||
    !data.review_id ||
    !data.paper_id
  ) {
    throw new Error("Latest review response was missing required fields.");
  }

  return `${settings.apiBaseUrl}/papers/${data.paper_id}/reviews/${data.review_id}`;
}
