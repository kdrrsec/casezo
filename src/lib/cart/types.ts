import type { Cents, ProductImage } from "@/lib/catalog/types";

/** Gedeelde vorm van de winkelmand voor demo en Shopify. */
export type CartLine = {
  id: string;
  variantId: string;
  handle: string;
  title: string;
  brand: string;
  /** Gekozen opties, bv. "iPhone 16 · Zwart". */
  variantLabel: string;
  image: ProductImage | null;
  unitPrice: Cents;
  quantity: number;
  lineTotal: Cents;
  availableForSale: boolean;
  /** Maximaal bestelbaar aantal, indien bekend. */
  maxQuantity?: number;
};

export type Cart = {
  mode: "demo" | "shopify";
  lines: CartLine[];
  totalQuantity: number;
  subtotal: Cents;
  /** Shopify-checkout; in de demo altijd null. */
  checkoutUrl: string | null;
};

export type CartAction =
  | { type: "add"; variantId: string; quantity: number }
  | { type: "update"; lineId: string; quantity: number }
  | { type: "remove"; lineId: string };

export type CartResponse = { cart: Cart; error?: string };

export const MAX_LINE_QUANTITY = 10;
