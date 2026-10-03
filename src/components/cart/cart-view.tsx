"use client";

import { Info, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { useCart } from "@/components/providers/cart-provider";
import type { CartLine } from "@/lib/cart/types";
import { formatPrice } from "@/lib/format";

export function CartView({ shippingNote }: { shippingNote: string | null }) {
  const { cart, pending, error, updateLine, removeLine } = useCart();

  if (!cart) {
    return (
      <div className="rounded-md border border-line bg-surface px-6 py-12 text-center text-sm text-muted" aria-busy>
        Winkelmand laden…
      </div>
    );
  }

  if (cart.lines.length === 0) {
    return (
      <div className="rounded-md border border-line bg-surface px-6 py-14 text-center">
        <ShoppingBag className="mx-auto size-10 text-muted" strokeWidth={1.5} aria-hidden />
        <h2 className="mt-4 text-lg font-bold">Je winkelmand is leeg</h2>
        <p className="mt-2 text-sm text-ink-soft">Kies je toestel en ontdek welke accessoires passen.</p>
        <Link href="/" className="btn btn-primary mt-6">
          Verder winkelen
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section aria-label="Artikelen">
        {error && (
          <p role="alert" className="mb-4 rounded-md border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}
        <ul className="divide-y divide-line rounded-md border border-line" aria-busy={pending}>
          {cart.lines.map((line) => (
            <Line
              key={line.id}
              line={line}
              disabled={pending}
              onQuantity={(q) => updateLine(line.id, q)}
              onRemove={() => removeLine(line.id)}
            />
          ))}
        </ul>
        <Link href="/" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
          ← Verder winkelen
        </Link>
      </section>

      <aside aria-label="Overzicht" className="lg:sticky lg:top-4 lg:self-start">
        <div className="rounded-md border border-line bg-surface p-5">
          <h2 className="text-lg font-bold">Overzicht</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">
                Subtotaal ({cart.totalQuantity} {cart.totalQuantity === 1 ? "artikel" : "artikelen"})
              </dt>
              <dd className="font-semibold tabular-nums">{formatPrice(cart.subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Verzendkosten</dt>
              <dd className="text-right text-ink-soft">{shippingNote ?? "Berekend bij afrekenen"}</dd>
            </div>
          </dl>
          <div className="mt-4 flex justify-between border-t border-line pt-4">
            <span className="font-bold">Totaal</span>
            <span className="text-lg font-bold tabular-nums">{formatPrice(cart.subtotal)}</span>
          </div>
          <p className="mt-1 text-xs text-muted">Inclusief btw, exclusief verzendkosten.</p>

          {cart.checkoutUrl ? (
            <a href={cart.checkoutUrl} className="btn btn-primary mt-5 h-12 w-full text-base">
              Afrekenen
            </a>
          ) : (
            <>
              <button type="button" disabled className="btn btn-primary mt-5 h-12 w-full text-base">
                Afrekenen
              </button>
              {cart.mode === "demo" && (
                <p className="mt-3 flex gap-2 text-xs text-ink-soft">
                  <Info className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.75} aria-hidden />
                  Dit is een demonstratie. Afrekenen wordt beschikbaar zodra de winkel aan Shopify is gekoppeld;
                  betalingen verlopen dan via de beveiligde Shopify-checkout.
                </p>
              )}
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

function Line({
  line,
  disabled,
  onQuantity,
  onRemove,
}: {
  line: CartLine;
  disabled: boolean;
  onQuantity: (q: number) => void;
  onRemove: () => void;
}) {
  const max = line.maxQuantity ?? 10;
  return (
    <li className="flex gap-4 p-4">
      <Link href={`/product/${line.handle}`} className="relative size-20 shrink-0 overflow-hidden rounded border border-line bg-surface sm:size-24">
        {line.image && <Image src={line.image.url} alt="" fill sizes="96px" className="object-contain p-1" />}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">{line.brand}</p>
          <Link href={`/product/${line.handle}`} className="font-semibold hover:text-primary">
            {line.title}
          </Link>
          {line.variantLabel && <p className="text-sm text-ink-soft">{line.variantLabel}</p>}
          <p className="text-sm text-muted tabular-nums">{formatPrice(line.unitPrice)} per stuk</p>
          {!line.availableForSale && <p className="text-sm font-medium text-danger">Niet meer leverbaar</p>}
        </div>
        <div className="mt-2 flex items-center justify-between gap-4 sm:mt-0 sm:flex-col sm:items-end">
          <div className="flex items-center rounded-md border border-line-strong">
            <button
              type="button"
              onClick={() => onQuantity(line.quantity - 1)}
              disabled={disabled}
              className="flex size-9 items-center justify-center disabled:text-line-strong"
              aria-label={`Aantal ${line.title} verlagen`}
            >
              <Minus className="size-4" strokeWidth={2} aria-hidden />
            </button>
            <span className="w-8 text-center text-sm font-semibold tabular-nums" aria-label={`Aantal: ${line.quantity}`}>
              {line.quantity}
            </span>
            <button
              type="button"
              onClick={() => onQuantity(line.quantity + 1)}
              disabled={disabled || line.quantity >= max}
              className="flex size-9 items-center justify-center disabled:text-line-strong"
              aria-label={`Aantal ${line.title} verhogen`}
            >
              <Plus className="size-4" strokeWidth={2} aria-hidden />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-bold tabular-nums">{formatPrice(line.lineTotal)}</span>
            <button
              type="button"
              onClick={onRemove}
              disabled={disabled}
              className="flex size-9 items-center justify-center rounded text-muted hover:bg-surface hover:text-danger"
              aria-label={`${line.title} verwijderen`}
            >
              <Trash2 className="size-4" strokeWidth={1.75} aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
