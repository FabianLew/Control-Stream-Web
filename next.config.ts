import type { NextConfig } from "next";

console.log("[next.config] API_URL =", process.env.NEXT_PUBLIC_API_URL);
console.log("[next.config] AUTH_MODE =", process.env.NEXT_PUBLIC_AUTH_MODE);

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
