import {
  Column,
  Grid,
  InlineNotification,
  Tag,
  Tile,
} from "@reviselab/ui/carbon";

import {
  getLiveStackDiagnostics,
  type DiagnosticStatus,
} from "@/lib/diagnostics/live-stack";
import { isDiagnosticsEnabled } from "@/lib/supabase/env";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getTagType(status: DiagnosticStatus) {
  switch (status) {
    case "ok":
      return "green";
    case "warning":
      return "warm-gray";
    case "error":
      return "red";
  }
}

export default async function DiagnosticsPage() {
  if (!isDiagnosticsEnabled()) {
    notFound();
  }

  const diagnostics = await getLiveStackDiagnostics();
  const hasError = diagnostics.checks.some((check) => check.status === "error");
  const hasWarning = diagnostics.checks.some(
    (check) => check.status === "warning",
  );

  return (
    <Grid fullWidth className="rl-page-grid">
      <Column sm={4} md={8} lg={16}>
        <Tile className="rl-section">
          <div className="rl-page-header">
            <div className="rl-page-header-copy">
              <h1>Live diagnostics</h1>
              <p className="rl-muted">
                Check the hosted development stack before debugging uploads,
                parser jobs, or review progress.
              </p>
            </div>
            <Tag type={hasError ? "red" : hasWarning ? "warm-gray" : "green"}>
              {hasError ? "Action needed" : hasWarning ? "Partial" : "Ready"}
            </Tag>
          </div>
        </Tile>
      </Column>

      {hasError ? (
        <Column sm={4} md={8} lg={16}>
          <InlineNotification
            lowContrast
            kind="error"
            title="Live stack needs attention"
            subtitle="Resolve the failed check before trusting end-to-end upload and review results."
          />
        </Column>
      ) : null}

      {diagnostics.checks.map((check) => (
        <Column key={check.label} sm={4} md={4} lg={8}>
          <Tile className="rl-section">
            <div className="rl-section-header">
              <h2>{check.label}</h2>
              <Tag type={getTagType(check.status)}>{check.status}</Tag>
            </div>
            <p className="rl-muted">{check.detail}</p>
          </Tile>
        </Column>
      ))}

      <Column sm={4} md={8} lg={16}>
        <p className="rl-muted">Last checked {diagnostics.generatedAt}</p>
      </Column>
    </Grid>
  );
}
