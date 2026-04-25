import type { WorkerAdminClient } from "./types";

const HEARTBEAT_INTERVAL_MS = 60_000;

let lastHeartbeatAt = 0;

function isTransientSchemaError(message: string) {
  return message.includes("schema cache") || message.includes("usage_events");
}

export async function recordWorkerHeartbeat(
  adminClient: WorkerAdminClient,
  force = false,
) {
  const now = Date.now();

  if (!force && now - lastHeartbeatAt < HEARTBEAT_INTERVAL_MS) {
    return;
  }

  lastHeartbeatAt = now;

  const { error } = await adminClient.from("usage_events").insert({
    id: `usage_${crypto.randomUUID()}`,
    workspace_id: null,
    event_name: "worker_heartbeat",
    event_payload: {
      pid: process.pid,
      recordedAt: new Date(now).toISOString(),
    },
  });

  if (error) {
    if (isTransientSchemaError(error.message)) {
      console.warn("Worker heartbeat waiting for database schema.");
      return;
    }

    console.error(`Worker heartbeat insert failed: ${error.message}`);
  }
}
