import react from "@vitejs/plugin-react";
import { defineConfig } from "wxt";

export default defineConfig({
  manifest: {
    name: "ReviseLab for Overleaf",
    permissions: ["storage", "tabs"],
    host_permissions: ["https://www.overleaf.com/*"],
  },
  srcDir: ".",
  vite: () => ({
    plugins: [react()],
  }),
});
