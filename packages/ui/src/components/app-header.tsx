import {
  Header,
  HeaderMenuItem,
  HeaderName,
  HeaderNavigation,
  SkipToContent,
} from "../carbon";

type AppHeaderProps = {
  brandName: string;
  authHref?: string;
  authLabel?: string;
  showAdmin?: boolean;
  showDiagnostics?: boolean;
};

export function AppHeader({
  brandName,
  authHref = "/auth/sign-in",
  authLabel = "Sign in",
  showAdmin = false,
  showDiagnostics = false,
}: AppHeaderProps) {
  return (
    <>
      <SkipToContent />
      <Header aria-label={brandName}>
        <HeaderName href="/" prefix="">
          {brandName}
        </HeaderName>
        <HeaderNavigation aria-label="Primary navigation">
          <HeaderMenuItem href="/dashboard">Dashboard</HeaderMenuItem>
          <HeaderMenuItem href="/reviews/new">New review</HeaderMenuItem>
          <HeaderMenuItem href="/settings/integrations">
            Integrations
          </HeaderMenuItem>
          {showAdmin ? (
            <HeaderMenuItem href="/admin/platform">
              Platform admin
            </HeaderMenuItem>
          ) : null}
          {showDiagnostics ? (
            <HeaderMenuItem href="/settings/diagnostics">
              Diagnostics
            </HeaderMenuItem>
          ) : null}
          <HeaderMenuItem href={authHref}>{authLabel}</HeaderMenuItem>
        </HeaderNavigation>
      </Header>
    </>
  );
}
