import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLAYWRIGHT_PORT = 3100;

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: `http://127.0.0.1:${PLAYWRIGHT_PORT}`,
  },
  webServer: {
    command: `pnpm build && next start --hostname 127.0.0.1 --port ${PLAYWRIGHT_PORT}`,
    cwd: __dirname,
    port: PLAYWRIGHT_PORT,
    reuseExistingServer: false,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
