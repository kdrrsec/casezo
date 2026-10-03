import "server-only";

/**
 * Leest de Shopify-configuratie uit de omgeving. Zonder volledige
 * configuratie draait de winkel als demonstratie met lokale voorbeelddata.
 */
export type ShopifyConfig = {
  domain: string;
  apiVersion: string;
  token: string;
  tokenType: "private" | "public";
  country: string;
  language: string;
  revalidate: number;
};

export function getShopifyConfig(): ShopifyConfig | null {
  const domain = process.env.SHOPIFY_STORE_DOMAIN?.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  const privateToken = process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN?.trim();
  const publicToken = process.env.SHOPIFY_STOREFRONT_PUBLIC_TOKEN?.trim();
  const token = privateToken || publicToken;
  if (!domain || !token) return null;

  return {
    domain,
    apiVersion: process.env.SHOPIFY_STOREFRONT_API_VERSION?.trim() || "2026-10",
    token,
    tokenType: privateToken ? "private" : "public",
    country: (process.env.SHOPIFY_COUNTRY_CODE?.trim() || "NL").toUpperCase(),
    language: (process.env.SHOPIFY_LANGUAGE_CODE?.trim() || "NL").toUpperCase(),
    revalidate: Number(process.env.SHOPIFY_REVALIDATE_SECONDS) || 300,
  };
}

export function isShopifyEnabled(): boolean {
  return getShopifyConfig() !== null;
}
