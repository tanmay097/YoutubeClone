import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@vidora/shared"],
  // Videos upload straight from the client to Vercel Blob, so no API route receives large bodies.
  serverExternalPackages: ["mongoose"],
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
