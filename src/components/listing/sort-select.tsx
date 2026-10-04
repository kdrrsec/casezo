"use client";

import { ArrowUpDown, ChevronDown } from "lucide-react";

import type { ListingResult } from "@/lib/catalog/listing";

import { useListingTransition } from "./listing-transition";

/** Sorteerkeuze als native select: op mobiel opent de vertrouwde systeemkiezer. */
export function SortSelect({ sort }: { sort: ListingResult["sort"] }) {
  const { pending, navigate } = useListingTransition();
  const current = sort.options.find((o) => o.value === sort.current);

  return (
    <div className="relative">
      <label htmlFor="sorteren" className="sr-only">
        Sorteren
      </label>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-3 flex items-center gap-2 text-sm font-semibold text-ink sm:hidden"
      >
        <ArrowUpDown className="size-4" strokeWidth={2} />
        Sorteren
      </div>
      <select
        id="sorteren"
        value={current?.href}
        disabled={pending}
        onChange={(event) => navigate(event.target.value)}
        className="h-10 w-full appearance-none rounded-md border border-line-strong bg-white pr-9 pl-3 text-sm font-medium text-transparent focus:border-primary focus:outline-none sm:w-auto sm:text-ink"
      >
        {sort.options.map((o) => (
          <option key={o.value} value={o.href} className="text-ink">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted"
        strokeWidth={2}
        aria-hidden
      />
    </div>
  );
}
