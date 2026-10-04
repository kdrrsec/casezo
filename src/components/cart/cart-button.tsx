"use client";

import { ShoppingBag } from "lucide-react";

import { useCart } from "@/components/providers/cart-provider";

export function CartButton() {
  const { cart, openDrawer } = useCart();
  const count = cart?.totalQuantity ?? 0;
  return (
    <button
      type="button"
      onClick={openDrawer}
      className="relative flex items-center gap-2 rounded-md px-2 py-2 text-ink hover:bg-surface lg:px-3"
      aria-label={`Winkelmand openen, ${count} ${count === 1 ? "artikel" : "artikelen"}`}
      aria-haspopup="dialog"
    >
      <span className="relative">
        <ShoppingBag className="size-6" strokeWidth={1.75} aria-hidden />
        <span
          key={count}
          className={`absolute -top-1.5 -right-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] font-bold ${
            count > 0 ? "animate-[badge-pop_300ms_ease-out] bg-primary text-white" : "bg-line text-muted"
          }`}
          aria-hidden
        >
          {count}
        </span>
      </span>
      <span className="hidden text-sm font-semibold lg:inline">Winkelmand</span>
    </button>
  );
}
