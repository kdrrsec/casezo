"use client";

import { Search } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function Field({ id, defaultValue = "" }: { id: string; defaultValue?: string }) {
  return (
    <form action="/zoeken" method="get" role="search" className="relative w-full">
      <label htmlFor={id} className="sr-only">
        Zoek in de winkel
      </label>
      <input
        key={defaultValue}
        id={id}
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="Zoek op product, merk of toestel"
        autoComplete="off"
        enterKeyHint="search"
        className="h-11 w-full rounded-md border border-line-strong bg-white pr-12 pl-4 text-[0.9375rem] text-ink placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none"
      />
      <button
        type="submit"
        className="absolute top-1 right-1 flex h-9 w-10 items-center justify-center rounded bg-primary text-white hover:bg-primary-hover"
        aria-label="Zoeken"
      >
        <Search className="size-[18px]" strokeWidth={2} aria-hidden />
      </button>
    </form>
  );
}

function FieldWithQuery({ id }: { id: string }) {
  const params = useSearchParams();
  const pathname = usePathname();
  return <Field id={id} defaultValue={pathname === "/zoeken" ? (params.get("q") ?? "") : ""} />;
}

export function SearchForm({ id }: { id: string }) {
  return (
    <Suspense fallback={<Field id={id} />}>
      <FieldWithQuery id={id} />
    </Suspense>
  );
}
