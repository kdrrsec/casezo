import "server-only";

import { cookies } from "next/headers";

import { demoProducts } from "@/lib/catalog/demo-data";
import type { Product, ProductVariant } from "@/lib/catalog/types";

import { MAX_LINE_QUANTITY, type Cart, type CartAction, type CartLine } from "./types";

/**
 * Demo-winkelmand. Alleen variant-ID's en aantallen staan in een cookie;
 * prijzen en voorraad komen altijd uit de catalogus op de server.
 */
const COOKIE = "casezo_demo_cart";

type StoredLine = { v: string; q: number };

const variantIndex = new Map<string, { product: Product; variant: ProductVariant }>();
for (const product of demoProducts) {
  for (const variant of product.variants) variantIndex.set(variant.id, { product, variant });
}

async function readLines(): Promise<StoredLine[]> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((l): l is StoredLine => typeof l?.v === "string" && Number.isInteger(l?.q) && variantIndex.has(l.v))
      .map((l) => ({ v: l.v, q: Math.min(Math.max(1, l.q), MAX_LINE_QUANTITY) }));
  } catch {
    return [];
  }
}

async function writeLines(lines: StoredLine[]) {
  (await cookies()).set(COOKIE, JSON.stringify(lines), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

function maxFor(variant: ProductVariant): number {
  return Math.min(MAX_LINE_QUANTITY, variant.quantityAvailable ?? MAX_LINE_QUANTITY);
}

function toCart(lines: StoredLine[]): Cart {
  const cartLines: CartLine[] = lines.map(({ v, q }) => {
    const { product, variant } = variantIndex.get(v)!;
    return {
      id: v,
      variantId: v,
      handle: product.handle,
      title: product.title,
      brand: product.brand,
      variantLabel: Object.values(variant.selectedOptions).join(" · "),
      image: product.images[variant.imageIndex ?? 0] ?? null,
      unitPrice: variant.price,
      quantity: q,
      lineTotal: variant.price * q,
      availableForSale: variant.availableForSale,
      maxQuantity: maxFor(variant),
    };
  });
  return {
    mode: "demo",
    lines: cartLines,
    totalQuantity: cartLines.reduce((sum, l) => sum + l.quantity, 0),
    subtotal: cartLines.reduce((sum, l) => sum + l.lineTotal, 0),
    checkoutUrl: null,
  };
}

export async function getDemoCart(): Promise<Cart> {
  return toCart(await readLines());
}

export async function updateDemoCart(action: CartAction): Promise<{ cart: Cart; error?: string }> {
  const lines = await readLines();
  let error: string | undefined;

  if (action.type === "add") {
    const entry = variantIndex.get(action.variantId);
    if (!entry) return { cart: toCart(lines), error: "Dit product bestaat niet (meer)." };
    if (!entry.variant.availableForSale) {
      return { cart: toCart(lines), error: "Deze uitvoering is uitverkocht." };
    }
    const max = maxFor(entry.variant);
    const existing = lines.find((l) => l.v === action.variantId);
    const wanted = (existing?.q ?? 0) + action.quantity;
    if (wanted > max) error = `Er kunnen maximaal ${max} stuks van deze uitvoering in je winkelmand.`;
    if (existing) existing.q = Math.min(wanted, max);
    else lines.push({ v: action.variantId, q: Math.min(wanted, max) });
  } else if (action.type === "update") {
    const line = lines.find((l) => l.v === action.lineId);
    if (line) {
      const max = maxFor(variantIndex.get(line.v)!.variant);
      if (action.quantity > max) error = `Er zijn maximaal ${max} stuks beschikbaar.`;
      line.q = Math.min(action.quantity, max);
    }
  }

  const next = lines.filter((l) => l.q > 0 && !(action.type === "remove" && l.v === action.lineId));
  await writeLines(next);
  return { cart: toCart(next), error };
}
