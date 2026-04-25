"use client";

import { DashboardControlPlane } from "@reviselab/ui";
import { Button, Column, Grid, Tile } from "@reviselab/ui/carbon";

import { getPreviewDashboardRows } from "../fixtures";

export default function PreviewDashboardPage() {
  const rows = getPreviewDashboardRows();

  return (
    <Grid fullWidth className="rl-page-grid">
      <Column sm={4} md={8} lg={16}>
        <Tile className="rl-section">
          <div className="rl-page-header">
            <div className="rl-page-header-copy">
              <h1>Review queue</h1>
              <p className="rl-muted">
                Track parsing, review progress, and manuscript readiness from
                one Carbon control plane.
              </p>
            </div>
            <div className="rl-toolbar rl-header-actions">
              <Button kind="ghost" size="sm" href="/preview/upload-form">
                New review
              </Button>
              <Button kind="ghost" size="sm" href="/preview/extension-panel">
                Extension pairing
              </Button>
            </div>
          </div>
        </Tile>
      </Column>
      <Column sm={4} md={8} lg={16}>
        <DashboardControlPlane
          rows={rows}
          newReviewHref="/preview/upload-form"
          getReviewHref={() => "/preview/review-workspace"}
        />
      </Column>
    </Grid>
  );
}
