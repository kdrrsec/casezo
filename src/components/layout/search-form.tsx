"use client";

import { ArrowRight, Layers, Search, Smartphone } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useId, useRef, useState } from "react";

import type { SearchSuggestions } from "@/app/api/search/route";
import { startNavigationProgress } from "@/components/layout/navigation-progress";
import { formatPrice } from "@/lib/format";

type Option = {
  id: string;
  href: string;
  kind: "device" | "category" | "product" | "all";
  label: string;
  product?: SearchSuggestions["products"][number];
};

/**
 * Zoekbalk met suggesties tijdens het typen (combobox-patroon).
 * Pijltjestoetsen kiezen een suggestie, Enter opent hem; zonder keuze
 * verstuurt Enter het formulier naar /zoeken. Werkt ook zonder JavaScript.
 */
function Field({ id, defaultValue = "" }: { id: string; defaultValue?: string }) {
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState(defaultValue);
  const [data, setData] = useState<SearchSuggestions | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Suggesties ophalen met een korte vertraging; oudere verzoeken afbreken.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then((json: SearchSuggestions | null) => {
          if (json) {
            setData(json);
            setActive(-1);
          }
        })
        .catch(() => {});
    }, 140);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    const onPointer = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, []);

  const visible = open && query.trim().length >= 2 && data !== null && data.query === query.trim();

  const options: Option[] = [];
  if (visible && data) {
    if (data.device) {
      options.push({ id: `${listId}-device`, href: data.device.href, kind: "device", label: data.device.name });
    }
    data.categories.forEach((c, i) =>
      options.push({ id: `${listId}-cat-${i}`, href: c.href, kind: "category", label: c.name }),
    );
    data.products.forEach((p) =>
      options.push({ id: `${listId}-p-${p.id}`, href: p.href, kind: "product", label: p.title, product: p }),
    );
    if (data.total > 0) {
      options.push({
        id: `${listId}-all`,
        href: `/zoeken?q=${encodeURIComponent(data.query)}`,
        kind: "all",
        label: data.query,
      });
    }
  }

  const go = (href: string) => {
    setOpen(false);
    if (!href.startsWith("/zoeken")) setQuery("");
    inputRef.current?.blur();
    startNavigationProgress();
    router.push(href);
  };

  return (
    <div ref={wrapRef} className="relative w-full">
      <form
        action="/zoeken"
        method="get"
        role="search"
        className="relative w-full"
        onSubmit={(event) => {
          if (active >= 0 && options[active]) {
            event.preventDefault();
            go(options[active].href);
          } else if (query.trim()) {
            event.preventDefault();
            go(`/zoeken?q=${encodeURIComponent(query.trim())}`);
          }
        }}
      >
        <label htmlFor={id} className="sr-only">
          Zoek in de winkel
        </label>
        <input
          ref={inputRef}
          id={id}
          name="q"
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" && options.length) {
              event.preventDefault();
              setOpen(true);
              setActive((a) => (a + 1) % options.length);
            } else if (event.key === "ArrowUp" && options.length) {
              event.preventDefault();
              setActive((a) => (a <= 0 ? options.length - 1 : a - 1));
            } else if (event.key === "Escape") {
              setOpen(false);
              setActive(-1);
            }
          }}
          placeholder="Zoek op product, merk of toestel"
          autoComplete="off"
          enterKeyHint="search"
          role="combobox"
          aria-expanded={visible}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? options[active]?.id : undefined}
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

      {visible && data && (
        <div className="absolute inset-x-0 top-full z-50 mt-1.5 overflow-hidden rounded-md border border-line bg-white shadow-pop">
          {options.length === 0 ? (
            <p className="px-4 py-4 text-sm text-ink-soft">
              Geen resultaten voor &quot;{data.query}&quot;. Probeer een merk, categorie of toestel.
            </p>
          ) : (
            <ul id={listId} role="listbox" aria-label="Zoeksuggesties" className="max-h-[70vh] overflow-y-auto py-1">
              {options.map((option, i) => (
                <li
                  key={option.id}
                  role="presentation"
                  className={option.kind === "all" ? "border-t border-line" : undefined}
                >
                  {option.kind === "product" && options[i - 1]?.kind !== "product" && (
                    <p className="px-4 pt-2 pb-1 text-xs font-semibold tracking-wide text-muted uppercase">Producten</p>
                  )}
                  <button
                    type="button"
                    role="option"
                    id={option.id}
                    aria-selected={i === active}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(option.href)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm ${
                      i === active ? "bg-primary-soft" : "hover:bg-surface"
                    } ${option.kind === "all" ? "font-semibold text-primary" : ""}`}
                  >
                    <OptionContent option={option} deviceName={data.device?.name} total={data.total} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function OptionContent({ option, deviceName, total }: { option: Option; deviceName?: string; total: number }) {
  if (option.kind === "device") {
    return (
      <>
        <Smartphone className="size-4 text-primary" strokeWidth={1.75} aria-hidden />
        <span>
          Alle accessoires voor <strong>{option.label}</strong>
        </span>
      </>
    );
  }
  if (option.kind === "category") {
    return (
      <>
        <Layers className="size-4 text-muted" strokeWidth={1.75} aria-hidden />
        <span>
          {option.label}
          {deviceName && <span className="text-muted"> voor {deviceName}</span>}
        </span>
      </>
    );
  }
  if (option.kind === "product" && option.product) {
    const p = option.product;
    return (
      <>
        <span className="relative size-11 shrink-0 overflow-hidden rounded border border-line bg-surface">
          {p.image && <Image src={p.image} alt="" fill sizes="44px" className="object-contain" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-ink">{p.title}</span>
          <span className="block text-xs text-muted">{p.brand}</span>
        </span>
        <span className="shrink-0 font-semibold tabular-nums">
          {p.priceFrom && <span className="mr-1 text-xs font-normal text-muted">vanaf</span>}
          {formatPrice(p.price)}
        </span>
      </>
    );
  }
  return (
    <>
      Toon alle {total} resultaten voor &quot;{option.label}&quot;
      <ArrowRight className="ml-auto size-4" strokeWidth={2} aria-hidden />
    </>
  );
}

function FieldWithQuery({ id }: { id: string }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const value = pathname === "/zoeken" ? (params.get("q") ?? "") : "";
  return <Field key={value} id={id} defaultValue={value} />;
}

export function SearchForm({ id }: { id: string }) {
  return (
    <Suspense fallback={<Field id={id} />}>
      <FieldWithQuery id={id} />
    </Suspense>
  );
}
