import type { WorkerAdminClient } from "./types";

export async function recordUsageEvent(
  adminClient: WorkerAdminClient,
  workspaceId: string | null | undefined,
  eventName: string,
  eventPayload: Record<string, unknown>,
) {
  if (!workspaceId) {
    return;
  }

  const { error } = await adminClient.from("usage_events").insert({
    id: `usage_${crypto.randomUUID()}`,
    workspace_id: workspaceId,
    event_name: eventName,
    event_payload: eventPayload,
  });

  if (error) {
    console.error(
      `Usage event insert failed for ${eventName}: ${error.message}`,
    );
  }
}
