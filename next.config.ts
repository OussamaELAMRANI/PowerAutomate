import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Allow any localhost origin (dynamic port in Electron)
      allowedOrigins: ["localhost", "127.0.0.1"],
    },
  },
  output: "standalone",
};

export default nextConfig;
