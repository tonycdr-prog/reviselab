import { Column, Grid, Tile } from "@reviselab/ui/carbon";

import { ExtensionPairingTile } from "@/components/extension-pairing-tile";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function IntegrationsPage() {
  return (
    <Grid fullWidth className="rl-page-grid">
      <Column sm={4} md={8} lg={16}>
        <Tile className="rl-section">
          <h1>Integrations</h1>
          <p className="rl-muted">
            Pair the Overleaf companion extension and route selections into your
            ReviseLab workspace.
          </p>
        </Tile>
      </Column>
      <Column sm={4} md={8} lg={10}>
        <ExtensionPairingTile />
      </Column>
    </Grid>
  );
}
