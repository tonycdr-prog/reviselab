import type { NormalizedManuscript } from "@reviselab/core";

import { downloadSourceFile } from "./paper-files";
import { parseLatexArchive, parsePdfWithGrobid } from "./parsers";
import { buildFallbackSelectionManuscript } from "./paper-version";
import type { PaperRow, PaperVersionRow, WorkerAdminClient } from "./types";

export async function parsePaperSource(
  adminClient: WorkerAdminClient,
  paperRow: PaperRow,
  versionRow: PaperVersionRow,
): Promise<{
  manuscript: NormalizedManuscript;
  parserEngine: string;
}> {
  if (versionRow.source_kind === "selection") {
    return {
      parserEngine: "selection-manifest",
      manuscript: buildFallbackSelectionManuscript(versionRow, paperRow),
    };
  }

  const fileBuffer = await downloadSourceFile(
    adminClient,
    versionRow.source_path,
  );

  if (!fileBuffer) {
    throw new Error("The uploaded source file is missing.");
  }

  if (versionRow.source_kind === "latex-zip") {
    return parseLatexArchive(fileBuffer);
  }

  const extracted =
    (versionRow.extracted_structure_json as {
      title?: string;
      abstract?: string;
    } | null) ?? {};

  return parsePdfWithGrobid(fileBuffer, {
    sourceKind: "pdf",
    title: extracted.title ?? paperRow.title,
    abstract: extracted.abstract ?? "",
    rawText: [extracted.title ?? paperRow.title, extracted.abstract ?? ""].join(
      "\n\n",
    ),
  });
}
