import { SearchX, X } from "lucide-react";

import { ProductGrid } from "@/components/product/product-card";
import { Breadcrumbs, type Crumb } from "@/components/ui/breadcrumbs";
import type { ListingResult } from "@/lib/catalog/listing";

import { DeviceHint } from "./device-hint";
import { FilterPanel } from "./filter-panel";
import { ListingResults, ListingTransitionProvider } from "./listing-transition";
import { MobileFilters } from "./mobile-filters";
import { SortSelect } from "./sort-select";
import { TransitionLink } from "./transition-link";

/**
 * Standaard productoverzicht: kruimels, titel met aantal, filters links,
 * raster rechts. Wordt gebruikt door categorie-, merk-, toestel- en zoekpagina's.
 */
export function ListingView({
  result,
  basePath,
  title,
  description,
  breadcrumbs,
  intro,
  showDeviceHint = false,
}: {
  result: ListingResult;
  basePath: string;
  title: string;
  description?: string;
  breadcrumbs: Crumb[];
  /** Extra inhoud tussen kop en overzicht, bv. modeltegels. */
  intro?: React.ReactNode;
  /** Toon de suggestie om op het eigen toestel te filteren. */
  showDeviceHint?: boolean;
}) {
  return (
    <ListingTransitionProvider>
    <div className="container-shop pt-4 pb-8 lg:pt-6">
      <Breadcrumbs items={breadcrumbs} />

      <header className="mt-3 mb-5 lg:mb-6">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-2xl font-bold tracking-tight lg:text-[1.75rem]">{title}</h1>
          <p className="text-sm text-muted" aria-live="polite">
            {result.total} {result.total === 1 ? "product" : "producten"}
          </p>
        </div>
        {description && <p className="mt-1.5 max-w-3xl text-[0.9375rem] text-ink-soft">{description}</p>}
      </header>

      {intro}

      <div className="lg:grid lg:grid-cols-[15.5rem_1fr] lg:gap-8">
        <aside aria-label="Filters" className="hidden lg:block">
          <FilterPanel facets={result.facets} priceForm={result.priceForm} basePath={basePath} idPrefix="f" />
        </aside>

        <section aria-labelledby="producten-titel" className="min-w-0">
          <h2 id="producten-titel" className="sr-only">
            Producten
          </h2>
          {showDeviceHint && <DeviceHint basePath={basePath} />}

          <div className="mb-4 grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-between">
            <MobileFilters result={result} basePath={basePath} />
            <div className="hidden min-w-0 flex-1 flex-wrap items-center gap-2 lg:flex">
              <ActiveChips result={result} />
            </div>
            <div className="sm:ml-auto">
              <SortSelect sort={result.sort} />
            </div>
          </div>

          {result.chips.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2 lg:hidden">
              <ActiveChips result={result} />
            </div>
          )}

          <ListingResults>
            {result.items.length > 0 ? (
              <>
                <ProductGrid products={result.items} className="xl:grid-cols-4" />
                {result.pageCount > 1 && <Pagination result={result} />}
              </>
            ) : (
              <EmptyState result={result} basePath={basePath} />
            )}
          </ListingResults>
        </section>
      </div>
    </div>
    </ListingTransitionProvider>
  );
}

function ActiveChips({ result }: { result: ListingResult }) {
  if (result.chips.length === 0) return null;
  return (
    <>
      {result.chips.map((chip) => (
        <TransitionLink
          key={chip.href + chip.label}
          href={chip.href}
         
          className="inline-flex items-center gap-1.5 rounded-full border border-primary-line bg-primary-soft py-1 pr-2 pl-3 text-sm text-ink hover:border-primary"
          aria-label={`Filter verwijderen: ${chip.label}`}
        >
          {chip.label}
          <X className="size-3.5 text-primary" strokeWidth={2.25} aria-hidden />
        </TransitionLink>
      ))}
      {result.clearHref && (
        <TransitionLink href={result.clearHref} className="px-1 text-sm font-medium text-primary hover:underline">
          Wis filters
        </TransitionLink>
      )}
    </>
  );
}

function Pagination({ result }: { result: ListingResult }) {
  return (
    <nav aria-label="Paginering" className="mt-8 flex justify-center">
      <ul className="flex flex-wrap gap-1">
        {result.pages.map((p) => (
          <li key={p.page}>
            <TransitionLink
              href={p.href}
              aria-current={p.page === result.page ? "page" : undefined}
              className={`flex size-10 items-center justify-center rounded-md border text-sm font-semibold ${
                p.page === result.page
                  ? "border-primary bg-primary text-white"
                  : "border-line-strong bg-white hover:border-ink-soft"
              }`}
            >
              {p.page}
            </TransitionLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function EmptyState({ result, basePath }: { result: ListingResult; basePath: string }) {
  const lastChip = result.chips.at(-1);
  return (
    <div className="rounded-md border border-line bg-surface px-6 py-12 text-center">
      <SearchX className="mx-auto size-10 text-muted" strokeWidth={1.5} aria-hidden />
      <h2 className="mt-4 text-lg font-bold">
        {result.query && result.chips.length === 0
          ? `Geen resultaten voor "${result.query}"`
          : "Geen producten gevonden met deze filters"}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
        {result.chips.length > 0
          ? "Verwijder een of meer filters om meer producten te zien."
          : "Controleer de spelling of probeer een algemenere zoekterm, zoals een categorie of je toestel."}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {lastChip && result.chips.length > 1 && (
          <TransitionLink href={lastChip.href} className="btn btn-secondary">
            Laatste filter verwijderen
          </TransitionLink>
        )}
        {result.clearHref ? (
          <TransitionLink href={result.clearHref} className="btn btn-primary">
            Wis alle filters
          </TransitionLink>
        ) : (
          <TransitionLink href={basePath === "/zoeken" ? "/" : basePath} className="btn btn-primary">
            {basePath === "/zoeken" ? "Bekijk het assortiment" : "Toon alle producten"}
          </TransitionLink>
        )}
      </div>
    </div>
  );
}
