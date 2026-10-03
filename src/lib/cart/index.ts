import "server-only";

import { isShopifyEnabled } from "@/lib/env";

import { getDemoCart, updateDemoCart } from "./demo-cart";
import { getShopifyCart, updateShopifyCart } from "./shopify-cart";
import type { Cart, CartAction } from "./types";

/** Winkelmand-service: kiest automatisch tussen demo en Shopify. */
export async function getCart(): Promise<Cart> {
  return isShopifyEnabled() ? getShopifyCart() : getDemoCart();
}

export async function updateCart(action: CartAction): Promise<{ cart: Cart; error?: string }> {
  return isShopifyEnabled() ? updateShopifyCart(action) : updateDemoCart(action);
}
