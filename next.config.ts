import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages (next-on-pages) 호환 설정
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
