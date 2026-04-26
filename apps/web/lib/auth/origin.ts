import "server-only";

import { headers } from "next/headers";

import { getSiteUrl } from "@/lib/supabase/env";

function getConfiguredSiteOrigin() {
  const configuredUrl = getSiteUrl();

  if (!configuredUrl) {
    return null;
  }

  try {
    const parsed = new URL(configuredUrl);
    return parsed.origin;
  } catch {
    return null;
  }
}

export async function getRequestOrigin() {
  const configuredSiteOrigin = getConfiguredSiteOrigin();

  if (configuredSiteOrigin) {
    return configuredSiteOrigin;
  }

  const headerStore = await headers();
  const origin = headerStore.get("origin");

  if (origin) {
    return origin;
  }

  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");

  if (!host) {
    return "http://127.0.0.1:3000";
  }

  return `${protocol}://${host}`;
}
