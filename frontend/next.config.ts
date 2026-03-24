import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL;

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    // In production, Caddy reverse-proxies /api/* and /socket.io/* to the
    // backend directly, so no Next.js rewrites are needed unless BACKEND_URL
    // is explicitly set (e.g. local dev against a containerised backend).
    if (!backendUrl) {
      return [];
    }
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
