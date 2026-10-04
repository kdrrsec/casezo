"use client";

import { Check, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { useCart } from "@/components/providers/cart-provider";
import { formatPrice } from "@/lib/format";

/** Mini-winkelmand die van rechts inschuift, na toevoegen of via de winkelmandknop. */
export function CartDrawer() {
  const { cart, drawerOpen, closeDrawer, added, dismissAdded, pending, error, updateLine, removeLine } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<Element | null>(null);

  useEffect(() => {
    if (!drawerOpen) return;
    returnFocus.current = document.activeElement;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDrawer();
      // Focus binnen het paneel houden.
      if (event.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
        );
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      root.style.overflow = previous;
      (returnFocus.current as HTMLElement | null)?.focus?.();
      dismissAdded();
    };
  }, [drawerOpen, closeDrawer, dismissAdded]);

  const lines = cart?.lines ?? [];

  return (
    <div className="fixed inset-0 z-50" inert={!drawerOpen} aria-hidden={!drawerOpen}>
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${drawerOpen ? "opacity-100" : "opacity-0"}`}
        onClick={closeDrawer}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-pop transition-transform duration-300 ease-out ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id="cart-drawer-title" className="text-lg font-bold">
            Winkelmand
            {cart && cart.totalQuantity > 0 && (
              <span className="ml-2 text-sm font-normal text-muted">
                ({cart.totalQuantity} {cart.totalQuantity === 1 ? "artikel" : "artikelen"})
              </span>
            )}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={closeDrawer}
            className="flex size-10 items-center justify-center rounded-md hover:bg-surface"
            aria-label="Winkelmand sluiten"
          >
            <X className="size-5" strokeWidth={2} aria-hidden />
          </button>
        </div>

        {added && (
          <p role="status" className="flex items-center gap-2 border-b border-line bg-success/5 px-5 py-2.5 text-sm font-medium text-success">
            <Check className="size-4" strokeWidth={2.5} aria-hidden />
            {added.line.title} is toegevoegd
          </p>
        )}
        {error && (
          <p role="alert" className="border-b border-line bg-danger/5 px-5 py-2.5 text-sm text-danger">
            {error}
          </p>
        )}

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <ShoppingBag className="size-10 text-muted" strokeWidth={1.5} aria-hidden />
            <p className="mt-3 font-semibold">Je winkelmand is leeg</p>
            <button type="button" onClick={closeDrawer} className="btn btn-secondary mt-5">
              Verder winkelen
            </button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5" aria-busy={pending}>
              {lines.map((line) => (
                <li key={line.id} className="flex gap-3 py-4">
                  <Link
                    href={`/product/${line.handle}`}
                    onClick={closeDrawer}
                    className="relative size-20 shrink-0 overflow-hidden rounded border border-line bg-surface"
                  >
                    {line.image && <Image src={line.image.url} alt="" fill sizes="80px" className="object-contain" />}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="text-xs font-semibold tracking-wide text-muted uppercase">{line.brand}</p>
                    <Link
                      href={`/product/${line.handle}`}
                      onClick={closeDrawer}
                      className="truncate text-sm font-semibold hover:text-primary"
                    >
                      {line.title}
                    </Link>
                    {line.variantLabel && <p className="truncate text-xs text-ink-soft">{line.variantLabel}</p>}
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded border border-line-strong">
                        <button
                          type="button"
                          onClick={() => updateLine(line.id, line.quantity - 1)}
                          disabled={pending}
                          className="flex size-8 items-center justify-center disabled:text-line-strong"
                          aria-label={`Aantal ${line.title} verlagen`}
                        >
                          <Minus className="size-3.5" strokeWidth={2} aria-hidden />
                        </button>
                        <span className="w-7 text-center text-sm font-semibold tabular-nums">{line.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateLine(line.id, line.quantity + 1)}
                          disabled={pending || line.quantity >= (line.maxQuantity ?? 10)}
                          className="flex size-8 items-center justify-center disabled:text-line-strong"
                          aria-label={`Aantal ${line.title} verhogen`}
                        >
                          <Plus className="size-3.5" strokeWidth={2} aria-hidden />
                        </button>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-bold tabular-nums">{formatPrice(line.lineTotal)}</span>
                        <button
                          type="button"
                          onClick={() => removeLine(line.id)}
                          disabled={pending}
                          className="flex size-8 items-center justify-center rounded text-muted hover:bg-surface hover:text-danger"
                          aria-label={`${line.title} verwijderen`}
                        >
                          <Trash2 className="size-4" strokeWidth={1.75} aria-hidden />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-line bg-surface px-5 py-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-ink-soft">Subtotaal</span>
                <span className="text-lg font-bold tabular-nums">{formatPrice(cart?.subtotal ?? 0)}</span>
              </div>
              <p className="mt-0.5 text-xs text-muted">Inclusief btw. Verzendkosten zie je bij het afrekenen.</p>
              <div className="mt-4 grid gap-2">
                {cart?.checkoutUrl ? (
                  <a href={cart.checkoutUrl} className="btn btn-primary h-12 text-base">
                    Afrekenen
                  </a>
                ) : null}
                <Link
                  href="/winkelmand"
                  onClick={closeDrawer}
                  className={`btn h-12 text-base ${cart?.checkoutUrl ? "btn-secondary" : "btn-primary"}`}
                >
                  Bekijk winkelmand
                </Link>
                <button type="button" onClick={closeDrawer} className="py-1 text-sm font-medium text-primary hover:underline">
                  Verder winkelen
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
