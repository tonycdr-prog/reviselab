import "server-only";

import { REVIEW_ENGINE_VERSION, type PaperType } from "@reviselab/core";

import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { hasDatabaseConfig, hasSupabaseConfig } from "@/lib/supabase/env";

import { appendReviewEvent } from "./repository-events";
import { createQueuedReviewSnapshot } from "./repository-helpers";
import { createSelectionReviewContext } from "./extension-review-context";
import {
  createIds,
  enqueueRunReview,
  getInstallationByToken,
  getLatestWorkspaceReview,
} from "./extension-review-helpers";
export {
  createExtensionPairing,
  createExtensionPairingCode,
} from "./extension-pairing";

function assertSelectionHasReviewText(selection: { abstract: string }) {
  if (!selection.abstract.trim()) {
    throw new Error(
      "Capture or paste manuscript text before sending a review.",
    );
  }
}

export async function reviewSelection(
  selection: {
    title: string;
    abstract: string;
    intendedCategory: string;
    paperType: PaperType;
    firstTimeSubmitter?: boolean;
  },
  pairedToken?: string,
) {
  assertSelectionHasReviewText(selection);

  if (!hasSupabaseConfig() || !hasDatabaseConfig()) {
    throw new Error(
      "ReviseLab live mode requires the local or remote Supabase stack and queue database to be configured.",
    );
  }

  if (!pairedToken) {
    throw new Error("Pair the Overleaf extension before sending a selection.");
  }

  const installation = await getInstallationByToken(pairedToken);
  const adminClient = createSupabaseAdminClient();

  if (!installation?.profile_id || !installation.workspace_id || !adminClient) {
    throw new Error("The extension is not paired to a ReviseLab workspace.");
  }

  const ids = createIds();
  const context = createSelectionReviewContext(selection, ids);

  try {
    const { error: paperError } = await adminClient.from("papers").insert({
      id: ids.paperId,
      workspace_id: installation.workspace_id,
      owner_user_id: installation.profile_id,
      title: selection.title,
      intended_category: selection.intendedCategory,
      paper_type: selection.paperType,
      first_time_submitter: selection.firstTimeSubmitter ?? false,
    });

    if (paperError) {
      throw new Error(paperError.message);
    }

    const manuscript = {
      sourceKind: "selection",
      title: selection.title,
      abstract: selection.abstract,
      authors: [],
      sections: [],
      references: [],
      rawText: selection.abstract,
      parseDiagnostics: ["Created from an Overleaf selection review."],
    };

    const { error: versionError } = await adminClient
      .from("paper_versions")
      .insert({
        id: ids.versionId,
        paper_id: ids.paperId,
        source_kind: "selection",
        source_path: null,
        source_file_name: "overleaf-selection.txt",
        parse_status: "parsed",
        parser_engine: "selection-manifest",
        extracted_structure_json: manuscript,
      });

    if (versionError) {
      throw new Error(versionError.message);
    }

    const { error: reviewError } = await adminClient.from("reviews").insert({
      id: ids.reviewId,
      paper_id: ids.paperId,
      paper_version_id: ids.versionId,
      status: "queued",
      readiness: null,
      context_json: context,
      summary_json: null,
      ai_presence_summary_json: null,
      engine_version: REVIEW_ENGINE_VERSION,
    });

    if (reviewError) {
      throw new Error(reviewError.message);
    }

    await appendReviewEvent(adminClient, {
      reviewId: ids.reviewId,
      kind: "review_queued",
      detail: `Review created from the Overleaf extension for ${selection.title}.`,
    });

    const wasQueued = await enqueueRunReview(ids.reviewId);

    if (!wasQueued) {
      throw new Error("The review worker queue is unavailable.");
    }
  } catch (error) {
    const { error: cleanupError } = await adminClient
      .from("papers")
      .delete()
      .eq("id", ids.paperId);

    if (cleanupError) {
      throw new Error(
        `${error instanceof Error ? error.message : "Selection review failed."} Cleanup also failed: ${cleanupError.message}`,
      );
    }

    throw error;
  }

  return createQueuedReviewSnapshot(ids.reviewId, context, "parsed", "queued");
}

export async function getLatestReviewForToken(pairedToken: string) {
  return getLatestWorkspaceReview(pairedToken);
}
