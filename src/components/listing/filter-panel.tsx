"use client";

import { Check, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { Facet, FacetOption, PriceRangeForm } from "@/lib/catalog/listing";

const VISIBLE_OPTIONS = 8;

/**
 * Filterkolom. Elke optie bevat al de doel-URL (server-side berekend);
 * dit component navigeert alleen. Zo blijft de URL de enige bron van
 * waarheid en werken delen en de terugknop vanzelf.
 */
export function FilterPanel({
  facets,
  priceForm,
  basePath,
  idPrefix,
}: {
  facets: Facet[];
  priceForm: PriceRangeForm;
  basePath: string;
  idPrefix: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const go = (href: string) => startTransition(() => router.push(href, { scroll: false }));

  return (
    <div aria-busy={pending} className={pending ? "opacity-70 transition-opacity" : "transition-opacity"}>
      {facets.map((facet) => (
        <FacetSection key={facet.key} facet={facet} idPrefix={idPrefix} onSelect={go}>
          {facet.key === "prijs" && (
            <PriceForm form={priceForm} basePath={basePath} idPrefix={idPrefix} onApply={go} />
          )}
        </FacetSection>
      ))}
    </div>
  );
}

function FacetSection({
  facet,
  idPrefix,
  onSelect,
  children,
}: {
  facet: Facet;
  idPrefix: string;
  onSelect: (href: string) => void;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const selectedHidden = facet.options.slice(VISIBLE_OPTIONS).some((o) => o.selected);
  const options = showAll || selectedHidden ? facet.options : facet.options.slice(0, VISIBLE_OPTIONS);
  const panelId = `${idPrefix}-${facet.key}`;

  return (
    <section className="border-b border-line py-4 first:pt-0">
      <h3>
        <button
          type="button"
          className="flex w-full items-center justify-between text-left text-[0.9375rem] font-semibold"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen(!open)}
        >
          {facet.label}
          <ChevronDown
            className={`size-4 text-muted transition-transform ${open ? "rotate-180" : ""}`}
            strokeWidth={2}
            aria-hidden
          />
        </button>
      </h3>
      <div id={panelId} hidden={!open} className="mt-3">
        <ul className="space-y-1">
          {options.map((option) => (
            <li key={option.value}>
              <OptionRow option={option} facet={facet} idPrefix={idPrefix} onSelect={onSelect} />
            </li>
          ))}
        </ul>
        {facet.options.length > VISIBLE_OPTIONS && !selectedHidden && (
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="mt-2 text-sm font-medium text-primary hover:underline"
          >
            {showAll ? "Toon minder" : `Toon alle ${facet.options.length}`}
          </button>
        )}
        {children}
      </div>
    </section>
  );
}

function OptionRow({
  option,
  facet,
  idPrefix,
  onSelect,
}: {
  option: FacetOption;
  facet: Facet;
  idPrefix: string;
  onSelect: (href: string) => void;
}) {
  const id = `${idPrefix}-${facet.key}-${option.value}`;
  return (
    <label
      htmlFor={id}
      className="group flex cursor-pointer items-center gap-2.5 rounded py-1 text-sm text-ink-soft hover:text-ink"
    >
      <input
        id={id}
        type="checkbox"
        checked={option.selected}
        onChange={() => onSelect(option.href)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={`flex size-[18px] shrink-0 items-center justify-center border transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary ${
          facet.kind === "single" ? "rounded-full" : "rounded-[4px]"
        } ${option.selected ? "border-primary bg-primary text-white" : "border-line-strong bg-white group-hover:border-ink-soft"}`}
      >
        {option.selected && <Check className="size-3.5" strokeWidth={3} />}
      </span>
      {option.swatch && (
        <span
          aria-hidden
          className="size-4 shrink-0 rounded-full border border-black/10"
          style={{ backgroundColor: option.swatch }}
        />
      )}
      <span className={`flex-1 ${option.selected ? "font-medium text-ink" : ""}`}>{option.label}</span>
      <span className="text-xs text-muted tabular-nums">{option.count}</span>
    </label>
  );
}

function PriceForm({
  form,
  basePath,
  idPrefix,
  onApply,
}: {
  form: PriceRangeForm;
  basePath: string;
  idPrefix: string;
  onApply: (href: string) => void;
}) {
  return (
    <form
      className="mt-3 flex items-end gap-2"
      action={basePath}
      method="get"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const min = String(data.get("min") ?? "").trim();
        const max = String(data.get("max") ?? "").trim();
        const params = new URLSearchParams(form.hidden);
        if (min || max) params.set("prijs", `${min || 0}-${max}`);
        const qs = params.toString().replace(/%2C/g, ",");
        onApply(qs ? `${basePath}?${qs}` : basePath);
      }}
    >
      <PriceInput id={`${idPrefix}-min`} name="min" label="Min. €" defaultValue={form.min} />
      <span className="pb-2 text-muted">–</span>
      <PriceInput id={`${idPrefix}-max`} name="max" label="Max. €" defaultValue={form.max} />
      <button type="submit" className="btn btn-secondary h-9 px-3 text-sm">
        OK
      </button>
    </form>
  );
}

function PriceInput({
  id,
  name,
  label,
  defaultValue,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: number | null;
}) {
  return (
    <div className="min-w-0 flex-1">
      <label htmlFor={id} className="mb-1 block text-xs text-muted">
        {label}
      </label>
      <input
        key={defaultValue ?? ""}
        id={id}
        name={name}
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        defaultValue={defaultValue ?? undefined}
        className="h-9 w-full rounded border border-line-strong px-2 text-sm focus:border-primary focus:outline-none"
      />
    </div>
  );
}
