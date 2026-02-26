import type { NextConfig } from "next";

const nextConfig: any = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' }
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
