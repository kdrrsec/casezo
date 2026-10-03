import "server-only";

import { cookies, headers } from "next/headers";

import { storefrontFetch } from "@/lib/shopify/client";
import {
  CART_CREATE,
  CART_LINES_ADD,
  CART_LINES_REMOVE,
  CART_LINES_UPDATE,
  CART_QUERY,
} from "@/lib/shopify/queries";

import { MAX_LINE_QUANTITY, type Cart, type CartAction } from "./types";

/**
 * Shopify-winkelmand via de Storefront Cart API. Het cart-ID staat in een
 * httpOnly-cookie; afrekenen gebeurt via de checkoutUrl van Shopify.
 */
const COOKIE = "casezo_cart_id";

type Money = { amount: string; currencyCode: string };
type ShopifyCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: { subtotalAmount: Money };
  lines: {
    nodes: {
      id: string;
      quantity: number;
      cost: { amountPerQuantity: Money; totalAmount: Money };
      merchandise: {
        id: string;
        title: string;
        availableForSale: boolean;
        selectedOptions: { name: string; value: string }[];
        image: { url: string; altText: string | null; width: number | null; height: number | null } | null;
        product: {
          handle: string;
          title: string;
          vendor: string;
          featuredImage: { url: string; altText: string | null; width: number | null; height: number | null } | null;
        };
      };
    }[];
  };
};
type UserError = { field: string[] | null; message: string };

const cents = (m: Money) => Math.round(parseFloat(m.amount) * 100);

function mapCart(cart: ShopifyCart | null): Cart {
  if (!cart) return { mode: "shopify", lines: [], totalQuantity: 0, subtotal: 0, checkoutUrl: null };
  return {
    mode: "shopify",
    checkoutUrl: cart.lines.nodes.length ? cart.checkoutUrl : null,
    totalQuantity: cart.totalQuantity,
    subtotal: cents(cart.cost.subtotalAmount),
    lines: cart.lines.nodes.map((line) => {
      const m = line.merchandise;
      const img = m.image ?? m.product.featuredImage;
      return {
        id: line.id,
        variantId: m.id,
        handle: m.product.handle,
        title: m.product.title,
        brand: m.product.vendor,
        variantLabel: m.selectedOptions
          .filter((o) => !(o.name === "Title" && o.value === "Default Title"))
          .map((o) => o.value)
          .join(" · "),
        image: img
          ? { url: img.url, alt: img.altText ?? m.product.title, width: img.width ?? 600, height: img.height ?? 600 }
          : null,
        unitPrice: cents(line.cost.amountPerQuantity),
        quantity: line.quantity,
        lineTotal: cents(line.cost.totalAmount),
        availableForSale: m.availableForSale,
        maxQuantity: MAX_LINE_QUANTITY,
      };
    }),
  };
}

async function buyerIp(): Promise<string | null> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip");
}

async function setCartCookie(id: string) {
  (await cookies()).set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 10,
  });
}

async function mutate<K extends string>(
  query: string,
  key: K,
  variables: Record<string, unknown>,
): Promise<{ cart: ShopifyCart | null; error?: string }> {
  const data = await storefrontFetch<Record<K, { cart: ShopifyCart | null; userErrors: UserError[] }>>({
    query,
    variables,
    revalidate: 0,
    buyerIp: await buyerIp(),
  });
  const result = data[key];
  return { cart: result.cart, error: result.userErrors[0]?.message };
}

export async function getShopifyCart(): Promise<Cart> {
  const cartId = (await cookies()).get(COOKIE)?.value;
  if (!cartId) return mapCart(null);
  const data = await storefrontFetch<{ cart: ShopifyCart | null }>({
    query: CART_QUERY,
    variables: { cartId },
    revalidate: 0,
    buyerIp: await buyerIp(),
  });
  return mapCart(data.cart);
}

export async function updateShopifyCart(action: CartAction): Promise<{ cart: Cart; error?: string }> {
  const cartId = (await cookies()).get(COOKIE)?.value;

  if (action.type === "add") {
    const lines = [{ merchandiseId: action.variantId, quantity: action.quantity }];
    // Bestaande winkelmand aanvullen; bij een verlopen ID een nieuwe maken.
    if (cartId) {
      const result = await mutate(CART_LINES_ADD, "cartLinesAdd", { cartId, lines });
      if (result.cart) return { cart: mapCart(result.cart), error: result.error };
    }
    const created = await mutate(CART_CREATE, "cartCreate", { lines });
    if (created.cart) await setCartCookie(created.cart.id);
    return { cart: mapCart(created.cart), error: created.error };
  }

  if (!cartId) return { cart: mapCart(null) };

  const result =
    action.type === "update" && action.quantity > 0
      ? await mutate(CART_LINES_UPDATE, "cartLinesUpdate", {
          cartId,
          lines: [{ id: action.lineId, quantity: Math.min(action.quantity, MAX_LINE_QUANTITY) }],
        })
      : await mutate(CART_LINES_REMOVE, "cartLinesRemove", { cartId, lineIds: [action.lineId] });
  return { cart: mapCart(result.cart), error: result.error };
}
