import { expect, test, type Page } from "@playwright/test";

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    scrollWidth: Math.max(
      document.documentElement.scrollWidth,
      document.body.scrollWidth,
    ),
  }));

  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.viewport);
}

test("review workspace tabs and file rail are interactive", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/preview/review-workspace");

  await page.getByRole("tab", { name: "Checks" }).click();
  await expect(
    page.getByRole("heading", { name: "Policy checks" }),
  ).toBeVisible();

  await page.getByRole("tab", { name: "Files changed" }).click();
  await page.getByRole("button", { name: /abstract\.md/ }).click();

  await expect(page).toHaveURL(/tab=files/);
  await expect(page).toHaveURL(/file=abstract\.md/);
  await expect(page.getByLabel("Review context inspector")).toContainText(
    "abstract.md",
  );
  await expect(
    page
      .locator(".rl-diff-main")
      .getByRole("heading", { name: /Conservative abstract/i }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("checks and comments jump into the linked diff context", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/preview/review-workspace");

  await page.getByRole("tab", { name: "Checks" }).click();
  await page.getByRole("button", { name: "Open diff" }).first().click();

  await expect(page.getByRole("tab", { selected: true })).toHaveText(
    "Files changed",
  );
  await expect(page).toHaveURL(/tab=files/);
  await expect(page).toHaveURL(/context=check/);
  await expect(page.getByLabel("Review context inspector")).toContainText(
    /Linked check|Selected file/,
  );

  await page.getByRole("tab", { name: "Comments" }).click();
  await page.getByRole("button", { name: "Open linked diff" }).first().click();

  await expect(page.getByRole("tab", { selected: true })).toHaveText(
    "Files changed",
  );
  await expect(page).toHaveURL(/tab=files/);
  await expect(page).toHaveURL(/context=comment/);
  await expect(page.getByLabel("Review context inspector")).toContainText(
    /Linked comment|Selected file/,
  );
  await expectNoHorizontalOverflow(page);
});

test("full-width diff workbench has one action surface and no page overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1000 });
  await page.goto("/preview/review-workspace?tab=files&file=abstract.md");

  await expect(page.getByRole("tab", { selected: true })).toHaveText(
    "Files changed",
  );
  await expect(
    page
      .locator(".rl-diff-main")
      .getByRole("heading", { name: /Conservative abstract/i }),
  ).toBeVisible();
  await expect(
    page
      .getByLabel("Review context inspector")
      .getByRole("button", { name: "Apply suggestion" }),
  ).toHaveCount(1);
  await expectNoHorizontalOverflow(page);
});

test("dashboard overflow menus expose row actions", async ({ page }) => {
  await page.setViewportSize({ width: 1104, height: 900 });
  await page.goto("/preview/dashboard");

  await page.locator("button.cds--overflow-menu").first().click();

  await expect(
    page.getByRole("menuitem", { name: "Open review workspace" }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("upload preview exposes stable file and submit affordances", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1104, height: 1000 });
  await page.goto("/preview/upload-form");

  await expect(
    page.locator("button").filter({ hasText: "Replace manuscript" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Generate review" }),
  ).toBeEnabled();
  await expectNoHorizontalOverflow(page);
});
