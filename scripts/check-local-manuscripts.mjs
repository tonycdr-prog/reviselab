import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

import { ROOT } from "./local-stack-lib.mjs";
import { makeLatexZip, makePdf } from "./smoke-review-fixtures.mjs";

const MANIFEST_PATH = path.join(ROOT, "docs/local-manuscript-fixtures.json");
const SHOULD_PREPARE = process.argv.includes("--prepare");

function makeUnreadablePdf() {
  return Buffer.from(
    "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n",
    "utf8",
  );
}

function makeBrokenLatexZip() {
  return Buffer.from("This is not a valid LaTeX ZIP archive.", "utf8");
}

async function readManifest() {
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));

  if (
    !manifest ||
    manifest.fixtureDirectory !== ".local-manuscripts" ||
    !Array.isArray(manifest.fixtures)
  ) {
    throw new Error("Local manuscript fixture manifest is invalid.");
  }

  return manifest;
}

async function prepareGeneratedFixture(directory, fileName) {
  const outputPath = path.join(directory, fileName);

  switch (fileName) {
    case "reviselab-smoke-latex.zip":
      await writeFile(outputPath, makeLatexZip());
      return;
    case "reviselab-smoke-machine-readable.pdf":
      await writeFile(outputPath, makePdf());
      return;
    case "reviselab-smoke-unreadable.pdf":
      await writeFile(outputPath, makeUnreadablePdf());
      return;
    case "reviselab-smoke-broken-latex.zip":
      await writeFile(outputPath, makeBrokenLatexZip());
      return;
    default:
      return;
  }
}

async function main() {
  const manifest = await readManifest();
  const fixtureDirectory = path.join(ROOT, manifest.fixtureDirectory);

  if (SHOULD_PREPARE) {
    await mkdir(fixtureDirectory, { recursive: true });

    for (const fixture of manifest.fixtures) {
      if (fixture.generated) {
        await prepareGeneratedFixture(fixtureDirectory, fixture.fileName);
      }
    }
  }

  const missingRequired = manifest.fixtures
    .filter((fixture) => fixture.required)
    .filter(
      (fixture) => !existsSync(path.join(fixtureDirectory, fixture.fileName)),
    )
    .map((fixture) => fixture.fileName);

  if (missingRequired.length > 0) {
    throw new Error(
      `Missing local manuscript fixtures: ${missingRequired.join(", ")}. Run pnpm fixtures:prepare.`,
    );
  }

  console.log("Local manuscript fixture check passed.");
}

main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Local manuscript fixture check failed.",
  );
  process.exitCode = 1;
});
