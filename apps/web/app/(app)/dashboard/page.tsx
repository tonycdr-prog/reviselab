import { DashboardControlPlane } from "@reviselab/ui";
import { Button, Column, Grid, Tile } from "@reviselab/ui/carbon";

import { DashboardLiveRefresh } from "@/components/dashboard-live-refresh";
import { listDashboardReviews } from "@/lib/reviews/repository";

export default async function DashboardPage() {
  const reviews = await listDashboardReviews();

  return (
    <>
      <DashboardLiveRefresh rows={reviews} />

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
                <Button kind="ghost" size="sm" href="/reviews/new">
                  New review
                </Button>
                <Button kind="ghost" size="sm" href="/settings/integrations">
                  Extension pairing
                </Button>
              </div>
            </div>
          </Tile>
        </Column>

        <Column sm={4} md={8} lg={16}>
          <DashboardControlPlane rows={reviews} newReviewHref="/reviews/new" />
        </Column>
      </Grid>
    </>
  );
}
