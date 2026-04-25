import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": dirname,
      "server-only": path.resolve(dirname, "tests/mocks/server-only.ts"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    exclude: ["tests/e2e/**", "tests/live/**", "node_modules/**"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
