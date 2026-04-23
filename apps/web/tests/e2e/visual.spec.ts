import { expect, test } from "@playwright/test";

const previewPages = [
  {
    name: "landing",
    path: "/preview/landing",
    viewport: { width: 1440, height: 1200 },
  },
  {
    name: "dashboard",
    path: "/preview/dashboard",
    viewport: { width: 1440, height: 1400 },
  },
  {
    name: "dashboard-mobile",
    path: "/preview/dashboard",
    viewport: { width: 390, height: 1400 },
  },
  {
    name: "upload-form",
    path: "/preview/upload-form",
    viewport: { width: 960, height: 1200 },
  },
  {
    name: "review-workspace",
    path: "/preview/review-workspace",
    viewport: { width: 1440, height: 1600 },
  },
  {
    name: "review-workspace-mobile",
    path: "/preview/review-workspace",
    viewport: { width: 390, height: 1800 },
  },
  {
    name: "extension-panel",
    path: "/preview/extension-panel",
    viewport: { width: 480, height: 1400 },
  },
] as const;

for (const preview of previewPages) {
  test(`${preview.name} visual baseline`, async ({ page }) => {
    await page.setViewportSize(preview.viewport);
    await page.goto(preview.path);

    const pageWidth = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    expect(pageWidth).toBeLessThanOrEqual(preview.viewport.width);

    await expect(page).toHaveScreenshot(`${preview.name}.png`, {
      animations: "disabled",
      fullPage: true,
    });
  });
}
