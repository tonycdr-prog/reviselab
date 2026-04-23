import { test, expect } from "@playwright/test";

test("landing page shows ReviseLab brand", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /Review your paper like a pull request/i,
    }),
  ).toBeVisible();
  await expect(page.getByText("ReviseLab")).toBeVisible();
});
