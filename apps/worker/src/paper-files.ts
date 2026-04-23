import type { NormalizedManuscript } from "@reviselab/core";

import type { WorkerAdminClient } from "./types";

export async function downloadSourceFile(
  adminClient: WorkerAdminClient,
  sourcePath: string | null,
) {
  if (!sourcePath) {
    return null;
  }

  const { data, error } = await adminClient.storage
    .from("paper-sources")
    .download(sourcePath);

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to download source file.");
  }

  return data.arrayBuffer();
}

export async function uploadArtifact(
  adminClient: WorkerAdminClient,
  paperId: string,
  versionId: string,
  manuscript: NormalizedManuscript,
) {
  const artifactPath = `${paperId}/${versionId}/normalized-manuscript.json`;

  const { error } = await adminClient.storage.from("paper-artifacts").upload(
    artifactPath,
    new Blob([JSON.stringify(manuscript, null, 2)], {
      type: "application/json",
    }),
    {
      contentType: "application/json",
      upsert: true,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  return artifactPath;
}
