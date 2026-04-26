import { expect, test } from "@playwright/test";

const previewPages = [
  {
    name: "landing",
    path: "/",
    viewport: { width: 1104, height: 1200 },
  },
  {
    name: "landing-1440",
    path: "/",
    viewport: { width: 1440, height: 1200 },
  },
  {
    name: "landing-full",
    path: "/",
    viewport: { width: 1920, height: 1200 },
  },
  {
    name: "dashboard",
    path: "/preview/dashboard",
    viewport: { width: 1104, height: 1400 },
  },
  {
    name: "dashboard-1440",
    path: "/preview/dashboard",
    viewport: { width: 1440, height: 1400 },
  },
  {
    name: "dashboard-full",
    path: "/preview/dashboard",
    viewport: { width: 1920, height: 1400 },
  },
  {
    name: "dashboard-mobile",
    path: "/preview/dashboard",
    viewport: { width: 390, height: 1400 },
  },
  {
    name: "upload-form",
    path: "/preview/upload-form",
    viewport: { width: 1104, height: 1600 },
  },
  {
    name: "upload-form-1440",
    path: "/preview/upload-form",
    viewport: { width: 1440, height: 1600 },
  },
  {
    name: "upload-form-full",
    path: "/preview/upload-form",
    viewport: { width: 1920, height: 1600 },
  },
  {
    name: "sign-in",
    path: "/auth/sign-in",
    viewport: { width: 960, height: 1200 },
  },
  {
    name: "review-workspace",
    path: "/preview/review-workspace?tab=files&file=abstract.md",
    viewport: { width: 1104, height: 1600 },
  },
  {
    name: "review-workspace-1440",
    path: "/preview/review-workspace?tab=files&file=abstract.md",
    viewport: { width: 1440, height: 1600 },
  },
  {
    name: "review-workspace-full",
    path: "/preview/review-workspace?tab=files&file=abstract.md",
    viewport: { width: 1920, height: 1600 },
  },
  {
    name: "review-workspace-mobile",
    path: "/preview/review-workspace?tab=files&file=abstract.md",
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

    const pageWidth = await page.evaluate(() =>
      Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    );
    expect(pageWidth).toBeLessThanOrEqual(preview.viewport.width);

    await expect(page).toHaveScreenshot(`${preview.name}.png`, {
      animations: "disabled",
      fullPage: true,
      // Keep layout regressions covered while allowing CI/Linux font rasterization drift.
      maxDiffPixelRatio: 0.08,
    });
  });
}
