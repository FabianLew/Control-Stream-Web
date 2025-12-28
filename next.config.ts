import type { NextConfig } from "next";

const apiBaseUrl = process.env.API_BASE_URL;

const nextConfig: NextConfig = {
  async rewrites() {
    // Jeśli nie ustawisz env, traktujemy jako local dev
    const destinationBase = apiBaseUrl ?? "http://localhost:8080";

    return [
      {
        source: "/api/:path*",
        destination: `${destinationBase}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
