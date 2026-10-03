"use client";

import { SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

import type { ListingResult } from "@/lib/catalog/listing";

import { FilterPanel } from "./filter-panel";

/** Filterpaneel voor kleine schermen, als zijpaneel over de pagina. */
export function MobileFilters({ result, basePath }: { result: ListingResult; basePath: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const close = () => dialogRef.current?.close();
  const active = result.chips.length;

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-line-strong bg-white px-3 text-sm font-semibold lg:hidden"
        aria-haspopup="dialog"
      >
        <SlidersHorizontal className="size-4" strokeWidth={2} aria-hidden />
        Filters
        {active > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs text-white">
            {active}
          </span>
        )}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="filters-title"
        className="m-0 ml-auto h-dvh max-h-dvh w-[min(24rem,92vw)] max-w-none bg-white p-0 text-ink backdrop:bg-black/40"
        onClick={(event) => {
          if (event.target === dialogRef.current) close();
        }}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 id="filters-title" className="text-lg font-bold">
              Filters
            </h2>
            <button
              type="button"
              onClick={close}
              className="flex size-10 items-center justify-center rounded-md hover:bg-surface"
              aria-label="Filters sluiten"
            >
              <X className="size-5" strokeWidth={2} aria-hidden />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <FilterPanel facets={result.facets} priceForm={result.priceForm} basePath={basePath} idPrefix="mf" />
          </div>
          <div className="grid grid-cols-2 gap-2 border-t border-line p-4">
            {result.clearHref ? (
              <Link href={result.clearHref} scroll={false} className="btn btn-secondary">
                Wis filters
              </Link>
            ) : (
              <span />
            )}
            <button type="button" onClick={close} className="btn btn-primary">
              Toon {result.total} {result.total === 1 ? "resultaat" : "resultaten"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
