import { toCardData, type ProductCardData } from "./cards";
import { categories } from "./categories";
import { slugify } from "./colors";
import { isCompatible } from "./compatibility";
import { deviceBrands, devices, getDevice, getDeviceBrand } from "./devices";
import { detectDevice, scoreProduct } from "./search";
import type { CategorySlug, Device, Product, ProductVariant } from "./types";

/**
 * Filter-, zoek- en sorteerlogica voor productoverzichten.
 *
 * Alle toestand staat in de URL. Deze module zet URL-parameters om naar
 * filters, past ze toe op de catalogus en berekent per filteroptie een
 * kant-en-klare link, zodat de interface alleen nog hoeft te navigeren.
 */

export type SortKey = "relevantie" | "prijs-oplopend" | "prijs-aflopend" | "nieuwste";

const SORT_LABELS: Record<SortKey, string> = {
  relevantie: "Relevantie",
  "prijs-oplopend": "Prijs laag–hoog",
  "prijs-aflopend": "Prijs hoog–laag",
  nieuwste: "Nieuwste",
};

const MULTI_KEYS = ["categorie", "telefoonmerk", "toestel", "merk", "type", "kleur", "materiaal"] as const;
type MultiKey = (typeof MULTI_KEYS)[number];

export type ListingFilters = Record<MultiKey, string[]> & {
  q: string;
  magsafe: boolean;
  voorraad: boolean;
  /** Prijsbereik in hele euro's. */
  prijs: { min: number; max: number | null } | null;
  sort: SortKey | null;
  page: number;
};

export type ListingScope = {
  category?: CategorySlug;
  /** Vast toestel (toestelpagina). */
  deviceId?: string;
  /** Vast telefoonmerk (merkoverzicht van toestellen). */
  phoneBrand?: string;
  /** Vast productmerk (merkpagina). */
  brandSlug?: string;
  /** Zoekpagina: zoekterm verplicht voor resultaten. */
  search?: boolean;
};

export type FacetOption = {
  value: string;
  label: string;
  count: number;
  selected: boolean;
  href: string;
  swatch?: string;
};

export type Facet = {
  key: string;
  label: string;
  kind: "multi" | "single" | "toggle";
  options: FacetOption[];
};

export type PriceRangeForm = {
  min: number | null;
  max: number | null;
  /** Overige parameters die het formulier moet behouden. */
  hidden: [string, string][];
};

export type ListingResult = {
  items: ProductCardData[];
  total: number;
  page: number;
  pageCount: number;
  pages: { page: number; href: string }[];
  facets: Facet[];
  priceForm: PriceRangeForm;
  chips: { label: string; href: string }[];
  clearHref: string | null;
  sort: { current: SortKey; options: { value: SortKey; label: string; href: string }[] };
  query: string;
  detectedDevice?: Device;
};

export const PAGE_SIZE = 24;

const PRICE_BUCKETS: { min: number; max: number | null; label: string }[] = [
  { min: 0, max: 15, label: "Tot € 15" },
  { min: 15, max: 25, label: "€ 15 – € 25" },
  { min: 25, max: 40, label: "€ 25 – € 40" },
  { min: 40, max: null, label: "€ 40 en meer" },
];

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

function priceValue(range: { min: number; max: number | null }): string {
  return `${range.min}-${range.max ?? ""}`;
}

export function parseListingParams(raw: RawParams): ListingFilters {
  const multi = Object.fromEntries(
    MULTI_KEYS.map((key) => {
      const values = (Array.isArray(raw[key]) ? (raw[key] as string[]) : [first(raw[key])])
        .flatMap((v) => v.split(","))
        .map((v) => v.trim())
        .filter(Boolean);
      return [key, [...new Set(values)]];
    }),
  ) as Record<MultiKey, string[]>;

  let prijs: ListingFilters["prijs"] = null;
  const priceMatch = /^(\d+)?-(\d+)?$/.exec(first(raw.prijs));
  if (priceMatch && (priceMatch[1] || priceMatch[2])) {
    const min = Number(priceMatch[1] ?? 0);
    const max = priceMatch[2] ? Number(priceMatch[2]) : null;
    prijs = max !== null && max < min ? { min: max, max: min } : { min, max };
  }

  const sortRaw = first(raw.sort);
  const sort = sortRaw in SORT_LABELS ? (sortRaw as SortKey) : null;
  const page = Math.max(1, Number.parseInt(first(raw.pagina), 10) || 1);

  return {
    ...multi,
    q: first(raw.q).slice(0, 100),
    magsafe: first(raw.magsafe) === "1",
    voorraad: first(raw.voorraad) === "1",
    prijs,
    sort,
    page,
  };
}

export function serializeListingParams(filters: ListingFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  for (const key of MULTI_KEYS) {
    if (filters[key].length) params.set(key, filters[key].join(","));
  }
  if (filters.magsafe) params.set("magsafe", "1");
  if (filters.voorraad) params.set("voorraad", "1");
  if (filters.prijs) params.set("prijs", priceValue(filters.prijs));
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.page > 1) params.set("pagina", String(filters.page));
  return params.toString().replace(/%2C/g, ",");
}

function hrefWith(basePath: string, filters: ListingFilters, patch: Partial<ListingFilters>): string {
  const qs = serializeListingParams({ ...filters, page: 1, ...patch });
  return qs ? `${basePath}?${qs}` : basePath;
}

function toggle(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}

/* ------------------------------------------------------------------ */
/* Matching                                                             */
/* ------------------------------------------------------------------ */

type Context = {
  scope: ListingScope;
  /** Toestel uit de zoekopdracht, geldt als extra vaste eis. */
  searchDevice?: Device;
};

/** Toestellen waartegen gefilterd wordt, of null als er geen toesteleis is. */
function deviceSet(filters: ListingFilters, ctx: Context): Device[] | null {
  const sets: Device[][] = [];
  if (ctx.scope.deviceId) {
    const d = getDevice(ctx.scope.deviceId);
    sets.push(d ? [d] : []);
  }
  if (ctx.searchDevice) sets.push([ctx.searchDevice]);
  if (filters.toestel.length) {
    sets.push(filters.toestel.map(getDevice).filter((d): d is Device => Boolean(d)));
  } else {
    const brands = ctx.scope.phoneBrand ? [ctx.scope.phoneBrand] : filters.telefoonmerk;
    if (brands.length) sets.push(devices.filter((d) => brands.includes(d.brandSlug)));
  }
  if (ctx.scope.phoneBrand && filters.toestel.length) {
    sets.push(devices.filter((d) => d.brandSlug === ctx.scope.phoneBrand));
  }
  if (sets.length === 0) return null;
  return sets.reduce((acc, set) => acc.filter((d) => set.some((s) => s.id === d.id)));
}

/** Varianten die aan alle filters voldoen (leeg = product valt af). */
function matchingVariants(product: Product, filters: ListingFilters, ctx: Context): ProductVariant[] {
  if (filters.categorie.length && !filters.categorie.includes(product.category)) return [];
  if (filters.merk.length && !filters.merk.includes(product.brandSlug)) return [];
  if (filters.type.length && !filters.type.includes(slugify(product.productType))) return [];
  if (filters.materiaal.length && !(product.material && filters.materiaal.includes(slugify(product.material)))) {
    return [];
  }
  if (filters.magsafe && product.magsafe !== true) return [];

  const set = deviceSet(filters, ctx);
  if (set && product.compatibility.kind === "rules" && !set.some((d) => isCompatible(product, d))) {
    return [];
  }

  return product.variants.filter((v) => {
    if (set && product.compatibility.kind === "device" && !set.some((d) => d.id === v.deviceId)) return false;
    if (filters.kleur.length && !(v.color && filters.kleur.includes(slugify(v.color.name)))) return false;
    if (filters.voorraad && !v.availableForSale) return false;
    if (filters.prijs) {
      if (v.price < filters.prijs.min * 100) return false;
      if (filters.prijs.max !== null && v.price > filters.prijs.max * 100) return false;
    }
    return true;
  });
}

function inScope(product: Product, scope: ListingScope): boolean {
  if (scope.category && product.category !== scope.category) return false;
  if (scope.brandSlug && product.brandSlug !== scope.brandSlug) return false;
  return true;
}

/* ------------------------------------------------------------------ */
/* Hoofdfunctie                                                         */
/* ------------------------------------------------------------------ */

export function buildListing({
  products,
  scope,
  filters,
  basePath,
  ranking,
}: {
  products: Product[];
  scope: ListingScope;
  filters: ListingFilters;
  basePath: string;
  /** Relevantievolgorde van een externe zoekdienst (Shopify), of null. */
  ranking?: string[] | null;
}): ListingResult {
  const query = filters.q;
  const detected = query ? detectDevice(query) : { rest: "" };
  const ctx: Context = { scope, searchDevice: detected.device };

  // 1. Basisset: binnen de scope en (bij zoeken) passend bij de zoekterm.
  const scores = new Map<string, number>();
  let base = products.filter((p) => inScope(p, scope));
  if (scope.search && !query) base = [];
  if (query) {
    if (ranking) {
      const rank = new Map(ranking.map((handle, i) => [handle, ranking.length - i]));
      base = base.filter((p) => rank.has(p.handle) || (detected.device && !detected.rest));
      for (const p of base) scores.set(p.handle, rank.get(p.handle) ?? 0);
    } else {
      base = base.filter((p) => {
        const score = scoreProduct(p, detected.rest);
        if (score > 0) scores.set(p.handle, score);
        return score > 0;
      });
    }
  }

  // 2. Filteren.
  const matched = base
    .map((product) => ({ product, variants: matchingVariants(product, filters, ctx) }))
    .filter((m) => m.variants.length > 0);

  // 3. Sorteren.
  const defaultSort: SortKey = query ? "relevantie" : "nieuwste";
  const sort = filters.sort && (filters.sort !== "relevantie" || query) ? filters.sort : defaultSort;
  const minPrice = (vs: ProductVariant[]) => Math.min(...vs.map((v) => v.price));
  matched.sort((a, b) => {
    switch (sort) {
      case "prijs-oplopend":
        return minPrice(a.variants) - minPrice(b.variants) || a.product.title.localeCompare(b.product.title);
      case "prijs-aflopend":
        return minPrice(b.variants) - minPrice(a.variants) || a.product.title.localeCompare(b.product.title);
      case "relevantie":
        return (
          (scores.get(b.product.handle) ?? 0) - (scores.get(a.product.handle) ?? 0) ||
          b.product.createdAt.localeCompare(a.product.createdAt)
        );
      default:
        return b.product.createdAt.localeCompare(a.product.createdAt);
    }
  });

  // 4. Pagineren en kaarten opbouwen.
  const total = matched.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(filters.page, pageCount);
  const set = deviceSet(filters, ctx);
  const singleDevice = set?.length === 1 ? set[0].id : undefined;
  const singleColor = filters.kleur.length === 1 ? filters.kleur[0] : undefined;
  const items = matched.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(({ product, variants }) =>
    toCardData(product, {
      variants,
      deviceId: singleDevice && (product.compatibility.kind === "device" || isCompatible(product, getDevice(singleDevice)!))
        ? singleDevice
        : undefined,
      colorSlug: singleColor,
    }),
  );

  // 5. Facetten met aantallen (elk facet telt zonder zijn eigen selectie).
  const count = (patch: Partial<ListingFilters>) =>
    base.filter((p) => matchingVariants(p, { ...filters, ...patch }, ctx).length > 0).length;

  const facets: Facet[] = [];
  const multiFacet = (
    key: MultiKey,
    label: string,
    options: { value: string; label: string; swatch?: string }[],
    hrefPatch?: (next: string[]) => Partial<ListingFilters>,
    countPatch?: Partial<ListingFilters>,
  ) => {
    const built = options
      .map((o) => {
        const next = toggle(filters[key], o.value);
        return {
          ...o,
          count: count({ [key]: [o.value], ...countPatch } as Partial<ListingFilters>),
          selected: filters[key].includes(o.value),
          href: hrefWith(basePath, filters, { [key]: next, ...hrefPatch?.(next) }),
        };
      })
      .filter((o) => o.count > 0 || o.selected);
    if (built.length) facets.push({ key, label, kind: "multi", options: built });
  };

  if (!scope.category) {
    multiFacet(
      "categorie",
      "Categorie",
      categories.filter((c) => base.some((p) => p.category === c.slug)).map((c) => ({ value: c.slug, label: c.name })),
    );
  }

  if (!scope.deviceId && !detected.device) {
    if (!scope.phoneBrand) {
      multiFacet(
        "telefoonmerk",
        "Telefoonmerk",
        deviceBrands.map((b) => ({ value: b.slug, label: b.name })),
        // Bij wijzigen van het merk vervallen gekozen modellen van andere merken.
        (nextBrands) => ({
          toestel: nextBrands.length
            ? filters.toestel.filter((id) => nextBrands.includes(getDevice(id)?.brandSlug ?? ""))
            : filters.toestel,
        }),
        { toestel: [] },
      );
    }
    const brandLimit = scope.phoneBrand ? [scope.phoneBrand] : filters.telefoonmerk;
    multiFacet(
      "toestel",
      "Telefoonmodel",
      devices
        .filter((d) => brandLimit.length === 0 || brandLimit.includes(d.brandSlug))
        .map((d) => ({
          value: d.id,
          label: brandLimit.length === 1 ? d.name : `${getDeviceBrand(d.brandSlug)?.name} ${d.name}`,
        })),
    );
  }

  if (!scope.brandSlug) {
    const brands = new Map(base.map((p) => [p.brandSlug, p.brand]));
    multiFacet(
      "merk",
      "Productmerk",
      [...brands].sort((a, b) => a[1].localeCompare(b[1])).map(([value, label]) => ({ value, label })),
    );
  }

  const types = new Map(base.map((p) => [slugify(p.productType), p.productType]));
  multiFacet(
    "type",
    "Type product",
    [...types].sort((a, b) => a[1].localeCompare(b[1])).map(([value, label]) => ({ value, label })),
  );

  // Prijs
  const priceOptions = PRICE_BUCKETS.map((bucket) => {
    const value = priceValue(bucket);
    const selected = filters.prijs ? priceValue(filters.prijs) === value : false;
    return {
      value,
      label: bucket.label,
      count: count({ prijs: { min: bucket.min, max: bucket.max } }),
      selected,
      href: hrefWith(basePath, filters, { prijs: selected ? null : { min: bucket.min, max: bucket.max } }),
    };
  }).filter((o) => o.count > 0 || o.selected);
  if (priceOptions.length) facets.push({ key: "prijs", label: "Prijs", kind: "single", options: priceOptions });

  const colors = new Map<string, { label: string; swatch: string }>();
  for (const p of base) {
    for (const v of p.variants) {
      if (v.color) colors.set(slugify(v.color.name), { label: v.color.name, swatch: v.color.hex });
    }
  }
  multiFacet(
    "kleur",
    "Kleur",
    [...colors].sort((a, b) => a[1].label.localeCompare(b[1].label)).map(([value, c]) => ({ value, ...c })),
  );

  const materials = new Map(base.filter((p) => p.material).map((p) => [slugify(p.material!), p.material!]));
  if (materials.size > 1 || filters.materiaal.length) {
    multiFacet(
      "materiaal",
      "Materiaal",
      [...materials].sort((a, b) => a[1].localeCompare(b[1])).map(([value, label]) => ({ value, label })),
    );
  }

  const toggles: FacetOption[] = [];
  if (base.some((p) => p.magsafe === true) || filters.magsafe) {
    toggles.push({
      value: "magsafe",
      label: "MagSafe-compatibel",
      count: count({ magsafe: true }),
      selected: filters.magsafe,
      href: hrefWith(basePath, filters, { magsafe: !filters.magsafe }),
    });
  }
  toggles.push({
    value: "voorraad",
    label: "Alleen op voorraad",
    count: count({ voorraad: true }),
    selected: filters.voorraad,
    href: hrefWith(basePath, filters, { voorraad: !filters.voorraad }),
  });
  facets.push({ key: "overig", label: "Beschikbaarheid en functies", kind: "toggle", options: toggles });

  // 6. Actieve filters als chips.
  const chips: { label: string; href: string }[] = [];
  for (const facet of facets) {
    for (const option of facet.options) {
      if (!option.selected) continue;
      const prefix = facet.kind === "toggle" ? "" : `${facet.label}: `;
      chips.push({ label: `${prefix}${option.label}`, href: option.href });
    }
  }
  if (filters.prijs && !priceOptions.some((o) => o.selected)) {
    chips.push({
      label: `Prijs: € ${filters.prijs.min} – ${filters.prijs.max === null ? "∞" : `€ ${filters.prijs.max}`}`,
      href: hrefWith(basePath, filters, { prijs: null }),
    });
  }
  const cleared: ListingFilters = {
    ...parseListingParams({}),
    q: filters.q,
    sort: filters.sort,
  };
  const clearHref = chips.length ? hrefWith(basePath, cleared, {}) : null;

  // 7. Sorteeropties en paginering.
  const sortKeys: SortKey[] = query
    ? ["relevantie", "prijs-oplopend", "prijs-aflopend", "nieuwste"]
    : ["nieuwste", "prijs-oplopend", "prijs-aflopend"];
  const sortOptions = sortKeys.map((value) => ({
    value,
    label: SORT_LABELS[value],
    href: hrefWith(basePath, filters, { sort: value === defaultSort ? null : value }),
  }));

  const pages = Array.from({ length: pageCount }, (_, i) => ({
    page: i + 1,
    href: (() => {
      const qs = serializeListingParams({ ...filters, page: i + 1 });
      return qs ? `${basePath}?${qs}` : basePath;
    })(),
  }));

  const hidden = new URLSearchParams(serializeListingParams({ ...filters, prijs: null, page: 1 }));

  return {
    items,
    total,
    page,
    pageCount,
    pages,
    facets,
    priceForm: { min: filters.prijs?.min ?? null, max: filters.prijs?.max ?? null, hidden: [...hidden.entries()] },
    chips,
    clearHref,
    sort: { current: sort, options: sortOptions },
    query,
    detectedDevice: detected.device,
  };
}
