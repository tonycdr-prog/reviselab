import { DashboardControlPlane } from "@reviselab/ui";
import {
  Button,
  Column,
  Grid,
  InlineNotification,
  Tile,
} from "@reviselab/ui/carbon";

import { DashboardLiveRefresh } from "@/components/dashboard-live-refresh";
import { listDashboardReviews } from "@/lib/reviews/repository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type DashboardPageProps = {
  searchParams: Promise<{
    welcome?: string;
  }>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const { welcome } = await searchParams;
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

        {welcome === "workspace-created" ? (
          <Column sm={4} md={8} lg={16}>
            <InlineNotification
              lowContrast
              kind="success"
              title="Workspace ready"
              subtitle="Your profile, personal workspace, and owner membership were created. You can start your first manuscript review."
            />
          </Column>
        ) : null}

        <Column sm={4} md={8} lg={16}>
          <DashboardControlPlane rows={reviews} newReviewHref="/reviews/new" />
        </Column>
      </Grid>
    </>
  );
}
