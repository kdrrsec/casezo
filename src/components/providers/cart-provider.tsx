"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import type { Cart, CartAction, CartLine, CartResponse } from "@/lib/cart/types";

type AddedNotice = { line: CartLine; quantity: number; at: number };

type CartContextValue = {
  cart: Cart | null;
  /** Mini-winkelmand die van rechts inschuift. */
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  /** True zolang een wijziging onderweg is. */
  pending: boolean;
  error: string | null;
  added: AddedNotice | null;
  addItem: (variantId: string, quantity: number) => Promise<boolean>;
  updateLine: (lineId: string, quantity: number) => Promise<void>;
  removeLine: (lineId: string) => Promise<void>;
  dismissAdded: () => void;
  clearError: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

async function send(action?: CartAction): Promise<CartResponse> {
  const response = await fetch("/api/cart", {
    method: action ? "POST" : "GET",
    headers: action ? { "Content-Type": "application/json" } : undefined,
    body: action ? JSON.stringify(action) : undefined,
    cache: "no-store",
  });
  const json = (await response.json()) as Partial<CartResponse> & { error?: string };
  if (!response.ok || !json.cart) throw new Error(json.error ?? "Er ging iets mis met de winkelmand.");
  return json as CartResponse;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<AddedNotice | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    let active = true;
    send()
      .then((res) => {
        if (active) setCart(res.cart);
      })
      .catch((e: Error) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);

  const run = useCallback(async (action: CartAction) => {
    setPending(true);
    setError(null);
    try {
      const res = await send(action);
      setCart(res.cart);
      if (res.error) setError(res.error);
      return res;
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setPending(false);
    }
  }, []);

  const addItem = useCallback(
    async (variantId: string, quantity: number) => {
      const res = await run({ type: "add", variantId, quantity });
      const line = res?.cart.lines.find((l) => l.variantId === variantId);
      if (res && line) {
        setAdded({ line, quantity, at: Date.now() });
        setDrawerOpen(true);
      }
      return Boolean(res && line && !res.error);
    },
    [run],
  );

  const updateLine = useCallback(
    async (lineId: string, quantity: number) => {
      await run(quantity > 0 ? { type: "update", lineId, quantity } : { type: "remove", lineId });
    },
    [run],
  );

  const removeLine = useCallback(
    async (lineId: string) => {
      await run({ type: "remove", lineId });
    },
    [run],
  );

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const dismissAdded = useCallback(() => setAdded(null), []);
  const clearError = useCallback(() => setError(null), []);

  const value = useMemo(
    () => ({
      cart,
      drawerOpen,
      openDrawer,
      closeDrawer,
      pending,
      error,
      added,
      addItem,
      updateLine,
      removeLine,
      dismissAdded,
      clearError,
    }),
    [cart, drawerOpen, openDrawer, closeDrawer, pending, error, added, addItem, updateLine, removeLine, dismissAdded, clearError],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart moet binnen CartProvider gebruikt worden.");
  return ctx;
}
