import type { Metadata } from "next";

import { brandConfig } from "@reviselab/core";
import { Content } from "@reviselab/ui/carbon";

export const metadata: Metadata = {
  title: `${brandConfig.name} previews`,
  robots: {
    index: false,
    follow: false,
  },
};

export default function PreviewLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="rl-page">
      <Content>
        <main id="main-content" className="rl-main">
          {children}
        </main>
      </Content>
    </div>
  );
}
