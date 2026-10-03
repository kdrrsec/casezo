import "server-only";

import { isCategorySlug } from "@/lib/catalog/categories";
import { colorFor, slugify } from "@/lib/catalog/colors";
import { findDeviceByName, getDevice } from "@/lib/catalog/devices";
import {
  COLOR_OPTION,
  DEVICE_OPTION,
  type CategorySlug,
  type Compatibility,
  type Product,
  type ProductImage,
  type ProductSpec,
  type ProductVariant,
} from "@/lib/catalog/types";

import { storefrontFetch } from "./client";
import { PRODUCTS_QUERY, SEARCH_QUERY } from "./queries";

type Money = { amount: string; currencyCode: string };
type ShopifyImage = { url: string; altText: string | null; width: number | null; height: number | null };

type ShopifyProduct = {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  productType: string;
  description: string;
  tags: string[];
  createdAt: string;
  publishedAt: string | null;
  images: { nodes: ShopifyImage[] };
  options: { name: string; optionValues: { name: string; swatch: { color: string | null } | null }[] }[];
  variants: {
    nodes: {
      id: string;
      sku: string | null;
      title: string;
      availableForSale: boolean;
      price: Money;
      compareAtPrice: Money | null;
      selectedOptions: { name: string; value: string }[];
      image: { url: string } | null;
      device: { value: string } | null;
    }[];
  };
  collections: { nodes: { handle: string }[] };
  metafields: ({ key: string; value: string } | null)[];
};

/** Optienamen die als toestel- of kleuroptie worden herkend (NL en EN). */
const DEVICE_NAMES = ["toestel", "model", "device", "telefoon"];
const COLOR_NAMES = ["kleur", "color", "colour"];

const toCents = (money: Money | null | undefined) =>
  money ? Math.round(parseFloat(money.amount) * 100) : undefined;

function parseJson<T>(value: string | undefined): T | undefined {
  if (!value) return undefined;
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

/** Categorie: metafield > collectie met dezelfde handle > producttype. */
function resolveCategory(product: ShopifyProduct, metafieldValue?: string): CategorySlug | null {
  if (metafieldValue && isCategorySlug(metafieldValue)) return metafieldValue;
  const fromCollection = product.collections.nodes.map((c) => c.handle).find(isCategorySlug);
  if (fromCollection) return fromCollection;
  const typeSlug = slugify(product.productType);
  return isCategorySlug(typeSlug) ? typeSlug : null;
}

export function mapShopifyProduct(node: ShopifyProduct): Product | null {
  const meta = Object.fromEntries(
    node.metafields.filter((m): m is { key: string; value: string } => m !== null).map((m) => [m.key, m.value]),
  );
  const category = resolveCategory(node, meta.category);
  // Producten zonder herkenbare categorie horen niet in de winkelstructuur.
  if (!category) return null;

  const images: ProductImage[] = node.images.nodes.map((img) => ({
    url: img.url,
    alt: img.altText ?? node.title,
    width: img.width ?? 1000,
    height: img.height ?? 1000,
  }));

  const deviceOptionName = node.options.find((o) => DEVICE_NAMES.includes(o.name.toLowerCase()))?.name;
  const colorOptionName = node.options.find((o) => COLOR_NAMES.includes(o.name.toLowerCase()))?.name;
  const swatches = new Map(
    node.options
      .filter((o) => o.name === colorOptionName)
      .flatMap((o) => o.optionValues.map((v) => [v.name, v.swatch?.color ?? null] as const)),
  );
  const productDevice = getDevice(meta.device);

  const variants: ProductVariant[] = node.variants.nodes.map((v) => {
    const selectedOptions: Record<string, string> = {};
    let deviceId = getDevice(v.device?.value)?.id;
    let color: ProductVariant["color"];
    for (const option of v.selectedOptions) {
      if (option.name === "Title" && option.value === "Default Title") continue;
      if (option.name === deviceOptionName) {
        selectedOptions[DEVICE_OPTION] = option.value;
        deviceId ??= findDeviceByName(option.value)?.id;
      } else if (option.name === colorOptionName) {
        selectedOptions[COLOR_OPTION] = option.value;
        color = colorFor(option.value, swatches.get(option.value));
      } else {
        selectedOptions[option.name] = option.value;
      }
    }
    deviceId ??= productDevice?.id;
    if (deviceId && !selectedOptions[DEVICE_OPTION]) {
      selectedOptions[DEVICE_OPTION] = getDevice(deviceId)?.name ?? deviceId;
    }
    const imageIndex = v.image ? images.findIndex((img) => img.url === v.image?.url) : -1;

    return {
      id: v.id,
      sku: v.sku ?? undefined,
      title: v.title === "Default Title" ? "Standaard" : v.title,
      price: toCents(v.price) ?? 0,
      compareAtPrice: toCents(v.compareAtPrice),
      availableForSale: v.availableForSale,
      selectedOptions,
      deviceId,
      color,
      imageIndex: imageIndex >= 0 ? imageIndex : undefined,
    };
  });

  const optionNames = new Set(variants.flatMap((v) => Object.keys(v.selectedOptions)));
  const options = [...optionNames].map((name) => ({
    name,
    values: [...new Set(variants.map((v) => v.selectedOptions[name]).filter(Boolean))],
  }));

  const rules = parseJson<Omit<Extract<Compatibility, { kind: "rules" }>, "kind">>(meta.compatibility);
  const compatibility: Compatibility = variants.some((v) => v.deviceId)
    ? { kind: "device" }
    : { kind: "rules", ...(rules ?? {}) };

  return {
    id: node.id,
    handle: node.handle,
    title: node.title,
    brand: node.vendor,
    brandSlug: slugify(node.vendor),
    category,
    productType: node.productType || category,
    description: node.description,
    highlights: parseJson<string[]>(meta.highlights) ?? [],
    specs: parseJson<ProductSpec[]>(meta.specs) ?? [],
    material: meta.material || undefined,
    magsafe: meta.magsafe === undefined ? undefined : meta.magsafe === "true",
    images,
    options,
    variants,
    compatibility,
    createdAt: node.publishedAt ?? node.createdAt,
    featured: meta.featured === "true",
    tags: node.tags,
  };
}

/** Haalt de volledige catalogus op (gepagineerd), gecachet via fetch-revalidatie. */
export async function fetchShopifyProducts(): Promise<Product[]> {
  const products: Product[] = [];
  let after: string | null = null;
  // Begrens het aantal pagina's als vangnet tegen eindeloze lussen.
  for (let page = 0; page < 20; page++) {
    const data: {
      products: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: ShopifyProduct[] };
    } = await storefrontFetch({
      query: PRODUCTS_QUERY,
      variables: { first: 100, after },
      tags: ["shopify", "shopify-products"],
    });
    for (const node of data.products.nodes) {
      const product = mapShopifyProduct(node);
      if (product) products.push(product);
    }
    if (!data.products.pageInfo.hasNextPage) break;
    after = data.products.pageInfo.endCursor;
  }
  return products;
}

/** Zoekt via Shopify en geeft product-handles terug in relevantievolgorde. */
export async function searchShopifyHandles(query: string): Promise<string[]> {
  const data = await storefrontFetch<{ search: { nodes: { handle?: string }[] } }>({
    query: SEARCH_QUERY,
    variables: { query, first: 100 },
    tags: ["shopify", "shopify-search"],
  });
  return data.search.nodes.map((n) => n.handle).filter((h): h is string => Boolean(h));
}
