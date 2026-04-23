import { access, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const typesPath = path.join(
  root,
  "packages/core/src/generated/database.types.ts",
);
const REQUIRED_SIGNATURES = [
  "export type Database = {",
  "arxiv_categories:",
  "extension_installations:",
  "paper_versions:",
  "papers:",
  "profiles:",
  "review_checks:",
  "review_events:",
  "review_suggestions:",
  "reviews:",
  "usage_events:",
  "workspace_members:",
  "workspaces:",
  "first_time_submitter: boolean;",
  "ai_presence_summary_json: Json | null;",
  "explainability_json: Json | null;",
];

try {
  await access(typesPath);
  const content = await readFile(typesPath, "utf8");

  for (const signature of REQUIRED_SIGNATURES) {
    if (!content.includes(signature)) {
      throw new Error(
        `Generated DB types file is missing required signature: ${signature}`,
      );
    }
  }

  console.log("DB types verification passed.");
} catch (error) {
  console.error(
    "DB types verification failed. Ensure packages/core/src/generated/database.types.ts exists and is up to date.",
  );
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
