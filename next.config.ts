import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 75 is de standaard; 90 voor de homepage-banner.
    qualities: [75, 90],
    // Shopify serveert productfoto's via zijn eigen CDN.
    remotePatterns: [{ protocol: "https", hostname: "cdn.shopify.com" }],
  },
};

export default nextConfig;
