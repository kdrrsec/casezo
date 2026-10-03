"use client";

import { Check, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

import { useCart } from "@/components/providers/cart-provider";
import { formatPrice } from "@/lib/format";

/** Bevestiging na toevoegen aan de winkelmand. */
export function AddedNotice() {
  const { added, dismissAdded } = useCart();

  useEffect(() => {
    if (!added) return;
    const t = window.setTimeout(dismissAdded, 7000);
    return () => window.clearTimeout(t);
  }, [added, dismissAdded]);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-4 sm:justify-end">
      {added && (
        <div
          key={added.at}
          role="status"
          className="pointer-events-auto w-full max-w-sm rounded-lg border border-line bg-white p-4 shadow-pop"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-success">
              <Check className="size-4" strokeWidth={2.5} aria-hidden />
              Toegevoegd aan je winkelmand
            </p>
            <button
              type="button"
              onClick={dismissAdded}
              className="-mt-1 -mr-1 flex size-8 items-center justify-center rounded hover:bg-surface"
              aria-label="Melding sluiten"
            >
              <X className="size-4" strokeWidth={2} aria-hidden />
            </button>
          </div>
          <div className="mt-3 flex gap-3">
            {added.line.image && (
              <Image
                src={added.line.image.url}
                alt=""
                width={56}
                height={56}
                className="size-14 shrink-0 rounded border border-line bg-surface object-cover"
              />
            )}
            <div className="min-w-0 text-sm">
              <p className="truncate font-semibold">{added.line.title}</p>
              <p className="truncate text-muted">{added.line.variantLabel}</p>
              <p className="mt-0.5">
                {added.quantity} × {formatPrice(added.line.unitPrice)}
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" onClick={dismissAdded} className="btn btn-secondary text-sm">
              Verder winkelen
            </button>
            <Link href="/winkelmand" onClick={dismissAdded} className="btn btn-primary text-sm">
              Naar winkelmand
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
