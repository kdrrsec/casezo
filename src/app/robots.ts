import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Zoekresultaten, winkelmand en API's horen niet in zoekmachines.
      disallow: ["/api/", "/winkelmand", "/zoeken"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
