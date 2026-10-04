import type { MetadataRoute } from "next";

import { categories, deviceBrands, getDevicesWithProducts, getProductBrands, getProducts } from "@/lib/catalog";
import { absoluteUrl } from "@/lib/site";

/** Sitemap met alle vindbare pagina's, opgebouwd uit de actuele catalogus. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, brands, devices] = await Promise.all([getProducts(), getProductBrands(), getDevicesWithProducts()]);
  const now = new Date();

  const pages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    ...categories.map((c) => ({
      url: absoluteUrl(`/categorie/${c.slug}`),
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
    ...deviceBrands.map((b) => ({
      url: absoluteUrl(`/toestel/${b.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...devices.map((d) => ({
      url: absoluteUrl(`/toestel/${d.brandSlug}/${d.id}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    { url: absoluteUrl("/merken"), lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    ...brands.map((b) => ({
      url: absoluteUrl(`/merk/${b.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...products.map((p) => ({
      url: absoluteUrl(`/product/${p.handle}`),
      lastModified: new Date(p.createdAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
      images: p.images.slice(0, 1).map((img) => absoluteUrl(img.url)),
    })),
    ...["/klantenservice", "/contact", "/veelgestelde-vragen", "/verzending-en-retourneren"].map((path) => ({
      url: absoluteUrl(path),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    })),
  ];
  return pages;
}
