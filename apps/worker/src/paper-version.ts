import type { NormalizedManuscript } from "@reviselab/core";

import { requireSupabaseResult } from "./supabase";
import type { PaperRow, PaperVersionRow, WorkerAdminClient } from "./types";

export async function loadPaperVersion(
  adminClient: WorkerAdminClient,
  versionId: string,
) {
  const versionRow = await requireSupabaseResult(
    adminClient
      .from("paper_versions")
      .select("*")
      .eq("id", versionId)
      .maybeSingle(),
    "Unable to load the paper version.",
  );

  if (!versionRow) {
    return null;
  }

  const paperRow = await requireSupabaseResult(
    adminClient
      .from("papers")
      .select("*")
      .eq("id", versionRow.paper_id)
      .maybeSingle(),
    "Unable to load the paper record.",
  );

  if (!paperRow) {
    return null;
  }

  return {
    versionRow,
    paperRow,
  };
}

export function buildFallbackSelectionManuscript(
  versionRow: PaperVersionRow,
  paperRow: PaperRow,
) {
  const extracted =
    (versionRow.extracted_structure_json as Partial<NormalizedManuscript> | null) ??
    {};

  return {
    sourceKind: "selection" as const,
    title: extracted.title ?? paperRow.title,
    abstract: extracted.abstract ?? "",
    authors: extracted.authors ?? [],
    sections: extracted.sections ?? [],
    references: extracted.references ?? [],
    rawText:
      extracted.rawText ??
      [extracted.title ?? paperRow.title, extracted.abstract ?? ""].join(
        "\n\n",
      ),
    parseDiagnostics: extracted.parseDiagnostics ?? [
      "Created from an Overleaf selection review.",
    ],
    ...(versionRow.parse_artifact_path
      ? { artifactPath: versionRow.parse_artifact_path }
      : {}),
  };
}

export async function loadParsedManuscript(
  adminClient: WorkerAdminClient,
  versionRow: PaperVersionRow,
  paperRow: PaperRow,
) {
  if (versionRow.parse_artifact_path) {
    const { data, error } = await adminClient.storage
      .from("paper-artifacts")
      .download(versionRow.parse_artifact_path);

    if (!error && data) {
      return JSON.parse(await data.text()) as NormalizedManuscript;
    }

    if (versionRow.source_kind !== "selection") {
      throw new Error(
        error?.message ??
          "The normalized manuscript artifact is missing for this parsed paper.",
      );
    }
  }

  return buildFallbackSelectionManuscript(versionRow, paperRow);
}
