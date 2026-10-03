import "server-only";

import { toCardData, type ProductCardData } from "./cards";
import { categories } from "./categories";
import { deviceIdsOf, isCompatible, variantsForDevice } from "./compatibility";
import { deviceBrands, devices, getDevice } from "./devices";
import { buildListing, parseListingParams, type ListingScope } from "./listing";
import { loadProducts, loadSearchRanking } from "./source";
import type { CategorySlug, Device, DeviceBrand, Product, ProductBrand } from "./types";

/**
 * Publieke cataloguslaag. Pagina's en componenten praten alleen met deze
 * functies; of de data uit Shopify of uit de voorbeeldcatalogus komt, is
 * hier verborgen (zie ./source.ts).
 */

export async function getProducts(): Promise<Product[]> {
  return loadProducts();
}

export async function getProduct(handle: string): Promise<Product | undefined> {
  return (await loadProducts()).find((p) => p.handle === handle);
}

export async function getFeaturedProducts(limit = 8): Promise<ProductCardData[]> {
  const products = await loadProducts();
  const featured = products.filter((p) => p.featured);
  const list = (featured.length ? featured : products).slice(0, limit);
  return list.map((p) => toCardData(p));
}

export async function getProductBrands(): Promise<ProductBrand[]> {
  const products = await loadProducts();
  const map = new Map<string, ProductBrand>();
  for (const p of products) {
    const brand = map.get(p.brandSlug) ?? { slug: p.brandSlug, name: p.brand, productCount: 0, categories: [] };
    brand.productCount++;
    if (!brand.categories.includes(p.category)) brand.categories.push(p.category);
    map.set(p.brandSlug, brand);
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Toestellen waarvoor in de gegeven categorieën echt producten bestaan. */
export async function getDevicesWithProducts(categorySlugs?: CategorySlug[]): Promise<Device[]> {
  const products = await loadProducts();
  const relevant = categorySlugs ? products.filter((p) => categorySlugs.includes(p.category)) : products;
  const ids = new Set<string>();
  for (const product of relevant) {
    if (product.compatibility.kind === "device") {
      for (const id of deviceIdsOf(product)) ids.add(id);
    } else {
      for (const d of devices) if (isCompatible(product, d)) ids.add(d.id);
    }
  }
  return devices.filter((d) => ids.has(d.id));
}

export type DeviceMenuGroup = { brand: DeviceBrand; series: { name: string; devices: Device[] }[] };

/** Toestellen per merk en serie, alleen met bestaande producten. */
export async function getDeviceMenu(categorySlug?: CategorySlug): Promise<DeviceMenuGroup[]> {
  const available = await getDevicesWithProducts(categorySlug ? [categorySlug] : undefined);
  return deviceBrands
    .map((brand) => {
      const seriesMap = new Map<string, Device[]>();
      for (const d of available.filter((d) => d.brandSlug === brand.slug)) {
        seriesMap.set(d.series, [...(seriesMap.get(d.series) ?? []), d]);
      }
      return { brand, series: [...seriesMap].map(([name, list]) => ({ name, devices: list })) };
    })
    .filter((g) => g.series.length > 0);
}

/** Aantal passende producten per categorie voor een toestel. */
export async function getDeviceCategoryCounts(deviceId: string): Promise<Record<CategorySlug, number>> {
  const device = getDevice(deviceId);
  const products = await loadProducts();
  const counts = Object.fromEntries(categories.map((c) => [c.slug, 0])) as Record<CategorySlug, number>;
  if (!device) return counts;
  for (const p of products) if (isCompatible(p, device)) counts[p.category]++;
  return counts;
}

export async function getProductTypes(category: CategorySlug): Promise<string[]> {
  const products = await loadProducts();
  return [...new Set(products.filter((p) => p.category === category).map((p) => p.productType))].sort();
}

/**
 * Bijpassende accessoires: andere categorieën die bij hetzelfde toestel passen.
 * Zonder toestel: producten uit andere categorieën met overlappende toestellen.
 */
export async function getRelatedProducts(product: Product, deviceId?: string, limit = 4): Promise<ProductCardData[]> {
  const products = (await loadProducts()).filter((p) => p.id !== product.id);
  const device = getDevice(deviceId);
  if (device) {
    return products
      .filter((p) => p.category !== product.category && isCompatible(p, device))
      .sort((a, b) => Number(b.featured) - Number(a.featured))
      .slice(0, limit)
      .map((p) => toCardData(p, { variants: variantsForDevice(p, device), deviceId: device.id }));
  }
  const ownDevices = product.compatibility.kind === "device"
    ? deviceIdsOf(product).map(getDevice).filter((d): d is Device => Boolean(d))
    : devices.filter((d) => isCompatible(product, d));
  return products
    .filter((p) => p.category !== product.category && ownDevices.some((d) => isCompatible(p, d)))
    .sort((a, b) => Number(b.featured) - Number(a.featured))
    .slice(0, limit)
    .map((p) => toCardData(p));
}

export async function getListing(
  scope: ListingScope,
  rawParams: Record<string, string | string[] | undefined>,
  basePath: string,
) {
  const filters = parseListingParams(rawParams);
  const products = await loadProducts();
  const ranking = filters.q ? await loadSearchRanking(filters.q) : null;
  return buildListing({ products, scope, filters, basePath, ranking });
}

export { categories, getCategory } from "./categories";
export { deviceBrands, devices, getDevice, getDeviceBrand, getDevicesForBrand } from "./devices";
export type { ProductCardData } from "./cards";
