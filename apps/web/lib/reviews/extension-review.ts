import "server-only";

import { randomInt, randomUUID } from "node:crypto";

import { REVIEW_ENGINE_VERSION, nowIso, type PaperType } from "@reviselab/core";

import { getViewerContext } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { hasDatabaseConfig, hasSupabaseConfig } from "@/lib/supabase/env";

import { appendReviewEvent } from "./repository-events";
import { createQueuedReviewSnapshot } from "./repository-helpers";
import {
  createIds,
  enqueueRunReview,
  getInstallationByToken,
  getLatestWorkspaceReview,
} from "./extension-review-helpers";

const PAIRING_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function createPairingCode() {
  return Array.from({ length: 6 }, () =>
    PAIRING_CODE_ALPHABET.charAt(randomInt(PAIRING_CODE_ALPHABET.length)),
  ).join("");
}

function assertSelectionHasReviewText(selection: { abstract: string }) {
  if (!selection.abstract.trim()) {
    throw new Error(
      "Capture or paste manuscript text before sending a review.",
    );
  }
}

export async function createExtensionPairingCode() {
  const viewer = await getViewerContext();
  const adminClient = createSupabaseAdminClient();

  if (!viewer || !adminClient) {
    throw new Error("Sign in to create a pairing code.");
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = createPairingCode();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 10).toISOString();

    const { error } = await adminClient.from("extension_pairings").insert({
      id: `pairing_${randomUUID()}`,
      profile_id: viewer.userId,
      workspace_id: viewer.workspaceId,
      code,
      expires_at: expiresAt,
    });

    if (!error) {
      return {
        code,
        expiresAt,
      };
    }

    if (!error.message.toLowerCase().includes("duplicate")) {
      throw new Error(error.message);
    }
  }

  throw new Error("Unable to allocate a unique pairing code.");
}

export async function createExtensionPairing(code: string) {
  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    throw new Error("Supabase admin access is required for pairing.");
  }

  const now = nowIso();
  const { data: pairing, error: pairingError } = await adminClient
    .from("extension_pairings")
    .select("*")
    .eq("code", code)
    .is("used_at", null)
    .gt("expires_at", now)
    .maybeSingle();

  if (pairingError) {
    throw new Error(pairingError.message);
  }

  if (!pairing) {
    throw new Error("That pairing code is missing or has expired.");
  }

  const token = `ext_${randomUUID()}`;
  const installationId = `installation_${randomUUID()}`;

  const { data: usedPairing, error: reserveError } = await adminClient
    .from("extension_pairings")
    .update({
      used_at: now,
      updated_at: now,
    })
    .eq("id", pairing.id)
    .is("used_at", null)
    .select("id")
    .maybeSingle();

  if (reserveError) {
    throw new Error(reserveError.message);
  }

  if (!usedPairing) {
    throw new Error("That pairing code has already been used.");
  }

  try {
    const { error: installError } = await adminClient
      .from("extension_installations")
      .insert({
        id: installationId,
        profile_id: pairing.profile_id,
        workspace_id: pairing.workspace_id,
        browser_name: "chrome",
        paired_token: token,
      });

    if (installError) {
      throw new Error(installError.message);
    }
  } catch (error) {
    const { error: resetError } = await adminClient
      .from("extension_pairings")
      .update({
        used_at: null,
        updated_at: nowIso(),
      })
      .eq("id", pairing.id);

    if (resetError) {
      throw new Error(
        `${error instanceof Error ? error.message : "Pairing failed."} Recovery also failed: ${resetError.message}`,
      );
    }

    throw error;
  }

  return token;
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
      context_json: {
        paperId: ids.paperId,
        versionId: ids.versionId,
        title: selection.title,
        abstract: selection.abstract,
        intendedCategory: selection.intendedCategory,
        paperType: selection.paperType,
        firstTimeSubmitter: selection.firstTimeSubmitter ?? false,
      },
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

  return createQueuedReviewSnapshot(
    ids.reviewId,
    {
      paperId: ids.paperId,
      versionId: ids.versionId,
      title: selection.title,
      abstract: selection.abstract,
      intendedCategory: selection.intendedCategory,
      paperType: selection.paperType,
      firstTimeSubmitter: selection.firstTimeSubmitter ?? false,
    },
    "parsed",
    "queued",
  );
}

export async function getLatestReviewForToken(pairedToken: string) {
  return getLatestWorkspaceReview(pairedToken);
}
