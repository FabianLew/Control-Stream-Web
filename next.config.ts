import type { NextConfig } from "next";

console.log("[next.config] DEMO_MODE =", process.env.DEMO_MODE);
console.log("[next.config] BACKEND_URL =", process.env.BACKEND_URL);

const nextConfig: NextConfig = {
  async rewrites() {
    const demoMode =
      (process.env.DEMO_MODE ?? "false").toLowerCase() === "true";

    if (demoMode) {
      return [];
    }

    const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8080";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
