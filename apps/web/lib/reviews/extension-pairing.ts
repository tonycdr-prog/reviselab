import "server-only";

import { randomInt, randomUUID } from "node:crypto";

import { nowIso } from "@reviselab/core";

import { getViewerContext } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const PAIRING_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function createPairingCode() {
  return Array.from({ length: 6 }, () =>
    PAIRING_CODE_ALPHABET.charAt(randomInt(PAIRING_CODE_ALPHABET.length)),
  ).join("");
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
