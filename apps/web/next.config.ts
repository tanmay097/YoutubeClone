import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@vidora/shared"],
  serverExternalPackages: ["mongoose", "busboy"],
  experimental: {
    // proxy.ts runs on /api/*, and Next truncates proxied request bodies at 10MB by default, which cuts off
    // video uploads ("Unexpected end of form"). Allow MAX_VIDEO_BYTES (500MB) plus room for the form fields.
    proxyClientMaxBodySize: "520mb",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
