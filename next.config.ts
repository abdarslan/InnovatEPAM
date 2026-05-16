import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: false,
    serverComponentsHmrCache: true,
  },
};

export default nextConfig;
