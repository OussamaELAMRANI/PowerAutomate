import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      allowedOrigins: ["127.0.0.1:3000"],
    },
  },
  output: "standalone",
};

export default nextConfig;
