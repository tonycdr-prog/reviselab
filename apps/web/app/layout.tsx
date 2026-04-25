import type { Metadata } from "next";
import { Theme } from "@reviselab/ui/carbon";

import "@carbon/styles/css/styles.css";
import "@reviselab/ui/styles.css";

import { brandConfig } from "@reviselab/core";

import { AuthErrorHashCleaner } from "@/components/auth-error-hash-cleaner";

export const metadata: Metadata = {
  title: brandConfig.name,
  description: brandConfig.shortDescription,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthErrorHashCleaner />
        <Theme theme="g10">{children}</Theme>
      </body>
    </html>
  );
}
