import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: "standalone",
  experimental: {
    dynamicIO: true,
    useCache: true,
    serverActions: {
      allowedOrigins:
        process.env.NODE_ENV === "production" ? ["localhost:8080"] : [],
    },
  },
};

export default nextConfig;
