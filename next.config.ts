import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  agentRules: false,
  poweredByHeader: false,
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=(self)" },
        { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
      ],
    }];
  },
  async redirects() {
    return [
      { source: "/operations/:path*", destination: "/", permanent: false },
      { source: "/operations-docs", destination: "/", permanent: false },
      { source: "/solvivors", destination: "/community", permanent: false },
      { source: "/leaderboard", destination: "/operative", permanent: false },
      { source: "/roadmap", destination: "/community#community-files", permanent: false },
      { source: "/api/operations/:path*", destination: "/", permanent: false },
      { source: "/api/marketplace/:path*", destination: "/", permanent: false },
      { source: "/api/quests/:path*", destination: "/", permanent: false },
      { source: "/api/leaderboard", destination: "/", permanent: false },
      { source: "/api/checkin", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
