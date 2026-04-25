import { expect, test } from "@playwright/test";

import { cleanupLiveTestData } from "./live-cleanup";
import {
  BROKEN_PDF_FIXTURE,
  PDF_FIXTURE,
  signInWithMagicLink,
  submitReview,
  waitForReadyWorkspace,
  waitForSuggestionAction,
  ZIP_FIXTURE,
} from "./live-review-helpers";

let cleanupEmails: string[] = [];
let cleanupTitles: string[] = [];

function trackTitle(label: string) {
  const title = `${label} ${Date.now()}`;
  cleanupTitles.push(title);
  return title;
}

test.afterEach(async () => {
  await cleanupLiveTestData({
    emails: cleanupEmails,
    titles: cleanupTitles,
  });

  cleanupEmails = [];
  cleanupTitles = [];
});

test("live LaTeX ZIP flow signs in, reviews, and persists suggestion actions", async ({
  page,
}) => {
  test.setTimeout(240_000);

  const { email, magicLink } = await signInWithMagicLink(page, "zip");
  cleanupEmails.push(email);

  await page.goto(magicLink);
  await expect(page).toHaveURL(/\/dashboard/);
  await expect.poll(() => page.url()).not.toContain("otp_expired");

  await submitReview(
    page,
    ZIP_FIXTURE,
    trackTitle("A deterministic review pipeline for scientific writing"),
  );
  await waitForReadyWorkspace(page);

  await page.getByRole("tab", { name: "Comments" }).click();
  await page.getByRole("button", { name: "Open linked diff" }).first().click();
  await expect(page).toHaveURL(/tab=files/);
  await expect(page).toHaveURL(/context=comment/);

  const inspector = page.getByLabel("Review context inspector");

  await waitForSuggestionAction(page, () =>
    inspector.getByRole("button", { name: "Apply suggestion" }).click(),
  );
  await expect(
    inspector.getByRole("button", { name: /Restore (AI )?suggestion/ }),
  ).toBeVisible();
  await waitForSuggestionAction(page, () =>
    inspector.getByRole("button", { name: /Restore (AI )?suggestion/ }).click(),
  );

  await page.reload();
  await page.getByRole("tab", { name: "History" }).click();
  await expect(page.getByText("Restored suggestion").first()).toBeVisible();
});

test("live PDF upload reaches a ready review workspace", async ({ page }) => {
  test.setTimeout(300_000);

  const { email } = await signInWithMagicLink(page, "pdf");
  cleanupEmails.push(email);
  await submitReview(
    page,
    PDF_FIXTURE,
    trackTitle("A machine-readable PDF smoke review for ReviseLab"),
  );
  await waitForReadyWorkspace(page, 240_000);
});

test("failed parse exposes retry without hiding the error state", async ({
  page,
}) => {
  test.setTimeout(240_000);

  const { email } = await signInWithMagicLink(page, "failed-parse");
  cleanupEmails.push(email);
  await submitReview(
    page,
    BROKEN_PDF_FIXTURE,
    trackTitle("Unreadable PDF retry smoke"),
  );

  await expect(page.getByRole("button", { name: "Retry review" })).toBeVisible({
    timeout: 180_000,
  });
  await page.getByRole("button", { name: "Retry review" }).click();
  await expect(page.getByText("Retrying this review")).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry review" })).toBeVisible({
    timeout: 180_000,
  });
});
