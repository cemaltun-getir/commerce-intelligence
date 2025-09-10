import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    EXTERNAL_API_BASE_URL: process.env.EXTERNAL_API_BASE_URL,
  },
  /* config options here */
};

export default nextConfig;
