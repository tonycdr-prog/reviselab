import "server-only";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPlatformAdminEmails } from "@/lib/supabase/env";

const DEFAULT_SIGN_IN_PATH = "/auth/sign-in";

export type ViewerContext = {
  userId: string;
  email: string | null;
  displayName: string | null;
  workspaceId: string;
  isPlatformAdmin: boolean;
  createdWorkspace: boolean;
};

function throwIfSupabaseError(
  error: { message: string } | null,
  fallbackMessage: string,
) {
  if (error) {
    throw new Error(error.message || fallbackMessage);
  }
}

function getDisplayName(email: string | null) {
  if (!email) {
    return null;
  }

  const localPart = email.split("@")[0];
  if (!localPart) {
    return null;
  }

  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(" ");
}

function getWorkspaceName(email: string | null, displayName: string | null) {
  if (displayName) {
    return `${displayName}'s workspace`;
  }

  if (email) {
    return `${email}'s workspace`;
  }

  return "ReviseLab workspace";
}

function buildWorkspaceId(userId: string) {
  return `workspace_${userId.replaceAll("-", "")}`;
}

export async function getViewerContext(): Promise<ViewerContext | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const userId = typeof claims?.sub === "string" ? claims.sub : null;

  if (error || !userId) {
    return null;
  }

  const email = typeof claims?.email === "string" ? claims.email : null;
  const displayName = getDisplayName(email);

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      display_name: displayName,
      onboarding_state: "ready",
    },
    {
      onConflict: "id",
    },
  );
  throwIfSupabaseError(profileError, "Unable to upsert the profile.");

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  throwIfSupabaseError(membershipError, "Unable to load workspace membership.");

  const workspaceId = membership?.workspace_id ?? buildWorkspaceId(userId);
  const createdWorkspace = !membership;

  if (!membership) {
    const { error: workspaceError } = await supabase.from("workspaces").upsert(
      {
        id: workspaceId,
        name: getWorkspaceName(email, displayName),
        owner_user_id: userId,
      },
      {
        onConflict: "id",
      },
    );
    throwIfSupabaseError(
      workspaceError,
      "Unable to create the personal workspace.",
    );

    const { error: workspaceMemberError } = await supabase
      .from("workspace_members")
      .upsert(
        {
          workspace_id: workspaceId,
          user_id: userId,
          role: "owner",
        },
        {
          onConflict: "workspace_id,user_id",
        },
      );
    throwIfSupabaseError(
      workspaceMemberError,
      "Unable to create the workspace membership.",
    );
  }

  return {
    userId,
    email,
    displayName,
    workspaceId,
    isPlatformAdmin: email
      ? getPlatformAdminEmails().includes(email.toLowerCase())
      : false,
    createdWorkspace,
  };
}

export async function requireViewerContext(nextPath = "/dashboard") {
  const viewer = await getViewerContext();

  if (!viewer) {
    redirect(`${DEFAULT_SIGN_IN_PATH}?next=${encodeURIComponent(nextPath)}`);
  }

  return viewer;
}
