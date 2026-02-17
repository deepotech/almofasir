import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Redirects are now handled by middleware (src/middleware.ts)
  // This avoids config bloat and supports thousands of redirects at Edge
};

export default nextConfig;
