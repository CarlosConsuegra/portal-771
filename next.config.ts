import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseStoragePattern = supabaseUrl
  ? new URL("/storage/v1/object/public/**", supabaseUrl)
  : null;

const nextConfig: NextConfig = {
  images: supabaseStoragePattern
    ? {
        remotePatterns: [supabaseStoragePattern],
      }
    : undefined,
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
