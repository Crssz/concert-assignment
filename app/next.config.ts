import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: "standalone",
  experimental: {
    dynamicIO: true,
    useCache: true,
  },
};

export default nextConfig;
