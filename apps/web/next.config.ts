import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@vidora/shared"],
  serverExternalPackages: ["mongoose", "busboy"],
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
