"use client";

import {
  Button,
  Column,
  Grid,
  InlineNotification,
  Tile,
} from "@reviselab/ui/carbon";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <Grid fullWidth className="rl-page-grid">
      <Column sm={4} md={8} lg={16}>
        <Tile className="rl-section">
          <InlineNotification
            lowContrast
            kind="error"
            title="Dashboard unavailable"
            subtitle={
              error.message ||
              "ReviseLab could not load the review queue. Retry once the local stack is healthy."
            }
          />
          <div className="rl-toolbar">
            <Button type="button" kind="secondary" onClick={reset}>
              Retry
            </Button>
          </div>
        </Tile>
      </Column>
    </Grid>
  );
}
