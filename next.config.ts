import type { NextConfig } from "next";

const onPages = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  agentRules: false,
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  ...(onPages
    ? {
        basePath: "/nfl-bolao",
        assetPrefix: "/nfl-bolao",
      }
    : {}),
};

export default nextConfig;
