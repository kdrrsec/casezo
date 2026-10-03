import "server-only";

import { cache } from "react";

import { isShopifyEnabled } from "@/lib/env";
import { fetchShopifyProducts, searchShopifyHandles } from "@/lib/shopify/catalog";

import { demoProducts } from "./demo-data";
import type { Product } from "./types";

/**
 * Kiest de databron: Shopify als die geconfigureerd is, anders de lokale
 * voorbeeldcatalogus. Bij een storing van Shopify wordt de fout gelogd en
 * blijft de winkel bereikbaar met een lege catalogus.
 */
export const loadProducts = cache(async (): Promise<Product[]> => {
  if (!isShopifyEnabled()) return demoProducts;
  try {
    return await fetchShopifyProducts();
  } catch (error) {
    console.error("[catalogus] Shopify-producten konden niet worden geladen", error);
    return [];
  }
});

/** Shopify-zoekvolgorde, of `null` als de lokale zoekfunctie gebruikt moet worden. */
export const loadSearchRanking = cache(async (query: string): Promise<string[] | null> => {
  if (!isShopifyEnabled()) return null;
  try {
    return await searchShopifyHandles(query);
  } catch (error) {
    console.error("[catalogus] Shopify-zoekopdracht mislukt, lokale zoekfunctie gebruikt", error);
    return null;
  }
});

export function catalogMode(): "shopify" | "demo" {
  return isShopifyEnabled() ? "shopify" : "demo";
}
