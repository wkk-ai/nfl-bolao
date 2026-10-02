import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  output: "export",
  trailingSlash: true,
  basePath: "/nfl-bolao",
  assetPrefix: "/nfl-bolao",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
