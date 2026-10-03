import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Shopify serveert productfoto's via zijn eigen CDN.
    remotePatterns: [{ protocol: "https", hostname: "cdn.shopify.com" }],
  },
};

export default nextConfig;
