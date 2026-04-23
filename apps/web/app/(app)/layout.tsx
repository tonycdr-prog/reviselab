import { redirect } from "next/navigation";

import { brandConfig } from "@reviselab/core";
import { AppHeader } from "@reviselab/ui";
import { Content } from "@reviselab/ui/carbon";

import { getViewerContext } from "@/lib/auth/session";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const viewer = await getViewerContext();

  if (!viewer) {
    redirect("/auth/sign-in?next=/dashboard");
  }

  return (
    <div className="rl-page">
      <AppHeader
        brandName={brandConfig.name}
        authHref="/auth/sign-out"
        authLabel="Sign out"
      />
      <Content>
        <main id="main-content" className="rl-main">
          {children}
        </main>
      </Content>
    </div>
  );
}
