import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: process.cwd(),
  },
  async redirects() {
    return [
      { source: "/operations/:path*", destination: "/", permanent: false },
      { source: "/operations-docs", destination: "/", permanent: false },
      { source: "/solvivors", destination: "/", permanent: false },
      { source: "/leaderboard", destination: "/", permanent: false },
      { source: "/roadmap", destination: "/", permanent: false },
      { source: "/api/operations/:path*", destination: "/", permanent: false },
      { source: "/api/marketplace/:path*", destination: "/", permanent: false },
      { source: "/api/quests/:path*", destination: "/", permanent: false },
      { source: "/api/leaderboard", destination: "/", permanent: false },
      { source: "/api/checkin", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
