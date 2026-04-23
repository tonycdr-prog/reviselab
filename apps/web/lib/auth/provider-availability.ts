import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { getSupabaseEnv, isLocalSupabaseUrl } from "@/lib/supabase/env";

type OAuthProvider = "google" | "orcid";

type ProviderAvailability = {
  isLocalStack: boolean;
  googleAvailable: boolean;
  orcidAvailable: boolean;
};

const SUPABASE_CONFIG_PATH = path.join(
  process.cwd(),
  "supabase",
  "config.toml",
);

function readProviderEnabled(configContent: string, provider: OAuthProvider) {
  const sectionPattern = new RegExp(
    String.raw`\[auth\.external\.${provider}\]([\s\S]*?)(?:\n\[|$)`,
    "i",
  );
  const match = sectionPattern.exec(configContent);

  if (!match?.[1]) {
    return false;
  }

  return /^\s*enabled\s*=\s*true\s*$/im.test(match[1]);
}

async function readLocalProviderAvailability(): Promise<ProviderAvailability> {
  try {
    const configContent = await readFile(SUPABASE_CONFIG_PATH, "utf8");

    return {
      isLocalStack: true,
      googleAvailable: readProviderEnabled(configContent, "google"),
      orcidAvailable: readProviderEnabled(configContent, "orcid"),
    };
  } catch {
    return {
      isLocalStack: true,
      googleAvailable: false,
      orcidAvailable: false,
    };
  }
}

export async function getAuthProviderAvailability(): Promise<ProviderAvailability> {
  const supabaseEnv = getSupabaseEnv();

  if (!supabaseEnv) {
    return {
      isLocalStack: false,
      googleAvailable: false,
      orcidAvailable: false,
    };
  }

  if (!isLocalSupabaseUrl(supabaseEnv.url)) {
    return {
      isLocalStack: false,
      googleAvailable: true,
      orcidAvailable: true,
    };
  }

  return readLocalProviderAvailability();
}

export async function ensureAuthProviderAvailable(provider: OAuthProvider) {
  const availability = await getAuthProviderAvailability();
  const isAvailable =
    provider === "google"
      ? availability.googleAvailable
      : availability.orcidAvailable;

  if (availability.isLocalStack && !isAvailable) {
    throw new Error(
      `Continue with ${provider === "google" ? "Google" : "ORCID"} is unavailable in local mode until the provider is enabled in supabase/config.toml.`,
    );
  }
}
