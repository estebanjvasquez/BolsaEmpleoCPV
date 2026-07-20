import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root: a stray lockfile in the user's home directory
  // otherwise makes Next.js misdetect the monorepo root (npm workspaces live here).
  turbopack: {
    root: path.join(__dirname, "..", ".."),
  },
  // Same root pin for the webpack/file-tracing path (production builds use
  // --webpack — see apps/frontend/package.json — since @opennextjs/cloudflare
  // can't yet consume Turbopack's server chunk format).
  outputFileTracingRoot: path.join(__dirname, "..", ".."),
};

export default nextConfig;
