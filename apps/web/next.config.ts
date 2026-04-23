import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@reviselab/core", "@reviselab/ui"],
  typedRoutes: true,
};

export default nextConfig;
