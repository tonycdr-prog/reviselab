import { redirect } from "next/navigation";

import { brandConfig } from "@reviselab/core";
import {
  Button,
  Column,
  Content,
  Grid,
  InlineNotification,
  TextInput,
  Tile,
} from "@reviselab/ui/carbon";

import { getViewerContext } from "@/lib/auth/session";
import { getAuthProviderAvailability } from "@/lib/auth/provider-availability";

import { sendMagicLink, signInWithGoogle, signInWithOrcid } from "./actions";
import { normalizeNextPath } from "@/lib/auth/next-path";

type SignInPageProps = {
  searchParams: Promise<{
    next?: string;
    message?: string;
    error?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const viewer = await getViewerContext();
  const providerAvailability = await getAuthProviderAvailability();
  const { next, message, error } = await searchParams;
  const nextPath = normalizeNextPath(next);

  if (viewer) {
    redirect(nextPath as never);
  }

  return (
    <div className="rl-page">
      <Content>
        <main id="main-content" className="rl-main">
          <Grid fullWidth className="rl-page-grid">
            <Column sm={4} md={8} lg={16}>
              <Tile className="rl-section rl-signin-card">
                <h1>Sign in to {brandConfig.name}</h1>
                <p className="rl-muted">
                  Use a magic link or your research identity provider to open
                  your personal {brandConfig.name} workspace.
                </p>

                {providerAvailability.isLocalStack ? (
                  <InlineNotification
                    lowContrast
                    kind="info"
                    title="Local auth mode"
                    subtitle="Magic links are delivered to Inbucket at http://127.0.0.1:54324. Google and ORCID stay disabled unless those providers are enabled in supabase/config.toml."
                  />
                ) : null}

                {message ? (
                  <InlineNotification
                    lowContrast
                    kind="success"
                    title="Check your email"
                    subtitle={message}
                  />
                ) : null}

                {error ? (
                  <InlineNotification
                    lowContrast
                    kind="error"
                    title="Sign-in problem"
                    subtitle={error}
                  />
                ) : null}

                <form action={sendMagicLink} className="rl-section">
                  <input type="hidden" name="next" value={nextPath} />
                  <TextInput
                    id="email"
                    name="email"
                    labelText="Email"
                    helperText="Use the email tied to your institution or research identity."
                    placeholder="you@institution.edu"
                    type="email"
                    autoComplete="email"
                  />
                  <Button type="submit">Continue with magic link</Button>
                </form>

                <div className="rl-toolbar">
                  <form action={signInWithGoogle}>
                    <input type="hidden" name="next" value={nextPath} />
                    <Button
                      type="submit"
                      kind="secondary"
                      disabled={!providerAvailability.googleAvailable}
                    >
                      Continue with Google
                    </Button>
                  </form>
                  <form action={signInWithOrcid}>
                    <input type="hidden" name="next" value={nextPath} />
                    <Button
                      type="submit"
                      kind="tertiary"
                      disabled={!providerAvailability.orcidAvailable}
                    >
                      Continue with ORCID
                    </Button>
                  </form>
                </div>
              </Tile>
            </Column>
          </Grid>
        </main>
      </Content>
    </div>
  );
}
