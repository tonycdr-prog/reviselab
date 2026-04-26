import { notFound } from "next/navigation";

import {
  Column,
  Grid,
  InlineNotification,
  Tag,
  Tile,
} from "@reviselab/ui/carbon";

import {
  getPlatformOpsSnapshot,
  type PlatformMetric,
} from "@/lib/admin/platform-ops";
import { requireViewerContext } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getTagType(status: PlatformMetric["status"]) {
  switch (status) {
    case "ok":
      return "green";
    case "warning":
      return "warm-gray";
    case "error":
      return "red";
  }
}

export default async function PlatformAdminPage() {
  const viewer = await requireViewerContext("/admin/platform");

  if (!viewer.isPlatformAdmin) {
    notFound();
  }

  const snapshot = await getPlatformOpsSnapshot();
  const hasError = snapshot.metrics.some((metric) => metric.status === "error");
  const hasWarning = snapshot.metrics.some(
    (metric) => metric.status === "warning",
  );

  return (
    <Grid fullWidth className="rl-page-grid">
      <Column sm={4} md={8} lg={16}>
        <Tile className="rl-section">
          <div className="rl-page-header">
            <div className="rl-page-header-copy">
              <p className="rl-eyebrow">Private platform operations</p>
              <h1>Platform admin</h1>
              <p className="rl-muted">
                Monitor production health without exposing diagnostics to normal
                users.
              </p>
            </div>
            <Tag type={hasError ? "red" : hasWarning ? "warm-gray" : "green"}>
              {hasError ? "Action needed" : hasWarning ? "Watch" : "Ready"}
            </Tag>
          </div>
        </Tile>
      </Column>

      {hasError ? (
        <Column sm={4} md={8} lg={16}>
          <InlineNotification
            lowContrast
            kind="error"
            title="Platform needs attention"
            subtitle="Review failing checks, queue depth, and recent failure events before trusting new production uploads."
          />
        </Column>
      ) : null}

      {snapshot.metrics.map((metric) => (
        <Column key={metric.label} sm={4} md={4} lg={8}>
          <Tile className="rl-section">
            <div className="rl-section-header">
              <h2>{metric.label}</h2>
              <Tag type={getTagType(metric.status)}>{metric.status}</Tag>
            </div>
            <p className="rl-metric">{metric.value}</p>
            <p className="rl-muted">{metric.detail}</p>
          </Tile>
        </Column>
      ))}

      <Column sm={4} md={8} lg={16}>
        <Tile className="rl-section">
          <div className="rl-section-header">
            <h2>Recent parse and review failures</h2>
            <Tag type={snapshot.failures.length > 0 ? "warm-gray" : "green"}>
              {snapshot.failures.length}
            </Tag>
          </div>
          {snapshot.failures.length > 0 ? (
            <div className="rl-stack">
              {snapshot.failures.map((failure) => (
                <div key={failure.id} className="rl-admin-event">
                  <p>
                    <strong>{failure.label}</strong>{" "}
                    <span className="rl-muted">{failure.kind}</span>
                  </p>
                  <p className="rl-muted">
                    {failure.detail ?? "No detail recorded."}
                  </p>
                  <p className="rl-muted">{failure.createdAt}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="rl-muted">
              No recent parse or review failures recorded.
            </p>
          )}
        </Tile>
      </Column>

      <Column sm={4} md={8} lg={16}>
        <p className="rl-muted">Last checked {snapshot.generatedAt}</p>
      </Column>
    </Grid>
  );
}
