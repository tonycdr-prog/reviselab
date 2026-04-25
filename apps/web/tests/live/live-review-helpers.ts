import { expect, type Page } from "@playwright/test";
import path from "node:path";

import { getLiveMailpitUrl } from "./env";

const MAILPIT_URL = getLiveMailpitUrl();
const MANUSCRIPTS_DIR = path.resolve(process.cwd(), "../../.local-manuscripts");

export const ZIP_FIXTURE = path.join(
  MANUSCRIPTS_DIR,
  "reviselab-smoke-latex.zip",
);
export const PDF_FIXTURE = path.join(
  MANUSCRIPTS_DIR,
  "reviselab-smoke-machine-readable.pdf",
);
export const BROKEN_PDF_FIXTURE = path.join(
  MANUSCRIPTS_DIR,
  "reviselab-smoke-unreadable.pdf",
);

type MailpitAddress = {
  Address: string;
};

type MailpitMessage = {
  ID: string;
  To: MailpitAddress[];
};

type MailpitListResponse = {
  messages: MailpitMessage[];
};

type MailpitMessageDetail = {
  Text?: string;
  HTML?: string;
};

function uniqueEmail(label: string) {
  return `qa-${label}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}@institution.edu`;
}

function extractMagicLink(message: MailpitMessageDetail) {
  const body = `${message.Text ?? ""}\n${message.HTML ?? ""}`;
  const match = body.match(
    /https?:\/\/127\.0\.0\.1:54321\/auth\/v1\/verify[^\s")<]+/,
  );

  return match?.[0].replaceAll("&amp;", "&") ?? null;
}

async function waitForMagicLink(email: string) {
  const deadline = Date.now() + 45_000;

  while (Date.now() < deadline) {
    const listResponse = await fetch(`${MAILPIT_URL}/api/v1/messages?limit=50`);

    if (!listResponse.ok) {
      throw new Error(`Mailpit list failed with ${listResponse.status}.`);
    }

    const list = (await listResponse.json()) as MailpitListResponse;
    const message = list.messages.find((entry) =>
      entry.To.some((recipient) => recipient.Address === email),
    );

    if (message) {
      const detailResponse = await fetch(
        `${MAILPIT_URL}/api/v1/message/${message.ID}`,
      );

      if (!detailResponse.ok) {
        throw new Error(
          `Mailpit message fetch failed with ${detailResponse.status}.`,
        );
      }

      const magicLink = extractMagicLink(
        (await detailResponse.json()) as MailpitMessageDetail,
      );

      if (magicLink) {
        return magicLink;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  throw new Error(`No local magic link arrived for ${email}.`);
}

export async function signInWithMagicLink(page: Page, label: string) {
  const email = uniqueEmail(label);

  await page.goto("/auth/sign-in?next=%2Fdashboard");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Continue with magic link" }).click();

  const magicLink = await waitForMagicLink(email);

  await page.goto(magicLink);
  await page.waitForURL(/\/dashboard/, { timeout: 45_000 });
  await expect(page.locator("h1", { hasText: "Review queue" })).toBeVisible();

  return { email, magicLink };
}

export async function submitReview(
  page: Page,
  fixturePath: string,
  title: string,
) {
  await page.goto("/reviews/new");
  await page.getByLabel("Title").fill(title);
  await page
    .getByLabel("Abstract")
    .fill(
      "We propose a retrieval augmented review assistant for scientific writing.",
    );
  await page.locator('input[type="file"]').setInputFiles(fixturePath);
  await expect(
    page.getByRole("button", { name: "Generate review" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Generate review" }).click();
  await page.waitForURL(/\/papers\/.+\/reviews\/.+/, { timeout: 60_000 });
}

export async function waitForReadyWorkspace(page: Page, timeout = 180_000) {
  await expect(page.getByRole("tab", { name: "Files changed" })).toBeVisible({
    timeout,
  });
  await page.getByRole("tab", { name: "Files changed" }).click();
  await expect(page.getByLabel("Review context inspector")).toBeVisible();
}

export async function waitForSuggestionAction(
  page: Page,
  action: () => Promise<void>,
) {
  const responsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.url().includes("/suggestions/") &&
      response.url().endsWith("/actions") &&
      response.ok(),
  );

  await action();
  await responsePromise;
}
