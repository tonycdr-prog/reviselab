import { Column, DataTableSkeleton, Grid, Tile } from "@reviselab/ui/carbon";

export default function DashboardLoading() {
  return (
    <Grid fullWidth className="rl-page-grid">
      <Column sm={4} md={8} lg={16}>
        <Tile className="rl-section">
          <h1>Review queue</h1>
          <p className="rl-muted">
            Loading the latest manuscript review activity.
          </p>
        </Tile>
      </Column>
      <Column sm={4} md={8} lg={16}>
        <Tile className="rl-section">
          <DataTableSkeleton
            columnCount={8}
            rowCount={8}
            headers={[
              { key: "title", header: "Manuscript" },
              { key: "category", header: "Category" },
              { key: "paperType", header: "Paper type" },
              { key: "stage", header: "Stage" },
              { key: "readiness", header: "Readiness" },
              { key: "updatedAt", header: "Updated" },
              { key: "changes", header: "Changes" },
              { key: "actions", header: "Actions" },
            ]}
          />
        </Tile>
      </Column>
    </Grid>
  );
}
