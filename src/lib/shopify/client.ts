import "server-only";

import { getShopifyConfig, type ShopifyConfig } from "@/lib/env";

/**
 * Minimale Storefront API-client (GraphQL).
 *
 * Endpoint en headers volgens de officiële documentatie:
 *   POST https://{shop}.myshopify.com/api/{versie}/graphql.json
 *   - privétoken:  Shopify-Storefront-Private-Token (+ Shopify-Storefront-Buyer-IP)
 *   - publieke token: X-Shopify-Storefront-Access-Token
 * De token wordt alleen op de server gebruikt en komt nooit in clientcode.
 */

export class ShopifyError extends Error {
  constructor(
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ShopifyError";
  }
}

type FetchOptions = {
  query: string;
  variables?: Record<string, unknown>;
  /** Seconden; `0` = niet cachen (winkelmand). */
  revalidate?: number;
  tags?: string[];
  /** IP van de klant; alleen meesturen bij niet-gecachte verzoeken. */
  buyerIp?: string | null;
};

function headersFor(config: ShopifyConfig, buyerIp?: string | null): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (config.tokenType === "private") {
    headers["Shopify-Storefront-Private-Token"] = config.token;
    if (buyerIp) headers["Shopify-Storefront-Buyer-IP"] = buyerIp;
  } else {
    headers["X-Shopify-Storefront-Access-Token"] = config.token;
  }
  return headers;
}

export async function storefrontFetch<T>({
  query,
  variables,
  revalidate,
  tags,
  buyerIp,
}: FetchOptions): Promise<T> {
  const config = getShopifyConfig();
  if (!config) throw new ShopifyError("Shopify is niet geconfigureerd.");

  const endpoint = `https://${config.domain}/api/${config.apiVersion}/graphql.json`;
  const ttl = revalidate ?? config.revalidate;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: headersFor(config, ttl === 0 ? buyerIp : null),
    body: JSON.stringify({
      query,
      variables: { country: config.country, language: config.language, ...variables },
    }),
    ...(ttl === 0
      ? { cache: "no-store" as const }
      : { next: { revalidate: ttl, tags: tags ?? ["shopify"] } }),
  });

  if (!response.ok) {
    throw new ShopifyError(`Storefront API gaf status ${response.status}.`);
  }

  const json = (await response.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) {
    throw new ShopifyError(json.errors.map((e) => e.message).join("; "), json.errors);
  }
  if (!json.data) throw new ShopifyError("Lege respons van de Storefront API.");
  return json.data;
}
