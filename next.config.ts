import type { NextConfig } from "next";

const apiBaseUrl = process.env.API_BASE_URL;

const nextConfig: NextConfig = {
  async rewrites() {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
      return []; // demo: obsługa w app/api/*
    }
    const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:8080";
    return [{ source: "/api/:path*", destination: `${apiBaseUrl}/api/:path*` }];
  },
};

export default nextConfig;
