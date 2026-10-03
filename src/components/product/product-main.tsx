"use client";

import { Check, CircleAlert, Minus, Plus, ShoppingBag, Smartphone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useCart } from "@/components/providers/cart-provider";
import { useDevice } from "@/components/providers/device-provider";
import { stockState } from "@/lib/catalog/cards";
import { colorSlug } from "@/lib/catalog/colors";
import { describeRequirements, isCompatible } from "@/lib/catalog/compatibility";
import { getDevice } from "@/lib/catalog/devices";
import { COLOR_OPTION, DEVICE_OPTION, type Product, type ProductImage } from "@/lib/catalog/types";
import {
  deviceOptionValue,
  findVariant,
  imagesForVariant,
  optionValueState,
  resolveSelection,
  type Selection,
} from "@/lib/catalog/variants";
import { MAX_LINE_QUANTITY } from "@/lib/cart/types";

import { Price } from "./price";
import { StockLabel } from "./stock-label";

/**
 * Bovenste deel van de productpagina: galerij, opties, voorraad en koopknop.
 * Galerij en koopblok delen de variantkeuze, daarom zitten ze samen hier.
 */
export function ProductMain({
  product,
  urlDeviceId,
  urlColor,
  categoryName,
}: {
  product: Product;
  urlDeviceId?: string;
  urlColor?: string;
  categoryName: string;
}) {
  const { device: storedDevice } = useDevice();
  const { addItem, pending, error } = useCart();
  const [picked, setPicked] = useState<Selection>({});
  const [quantity, setQuantity] = useState(1);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const buyRef = useRef<HTMLDivElement>(null);

  const hasDeviceOption = product.options.some((o) => o.name === DEVICE_OPTION);
  const selection = resolveSelection(product, picked, {
    urlDeviceId,
    storedDeviceId: storedDevice?.id,
    urlColor,
  });
  const variant = findVariant(product, selection);
  const images = imagesForVariant(product, variant);

  // Het toestel waar de klant naar zoekt, maar dat dit product niet heeft.
  const wantedDevice = getDevice(urlDeviceId ?? storedDevice?.id);
  const wantedMissing =
    hasDeviceOption && wantedDevice && !picked[DEVICE_OPTION] && !deviceOptionValue(product, wantedDevice.id)
      ? wantedDevice
      : undefined;

  const maxQuantity = Math.min(MAX_LINE_QUANTITY, variant?.quantityAvailable ?? MAX_LINE_QUANTITY);
  const qty = Math.min(quantity, Math.max(1, maxQuantity));
  const canAdd = Boolean(variant?.availableForSale) && !pending;

  // Houd de URL in lijn met de keuze, zodat de link deelbaar is.
  const selectedDeviceId = variant?.deviceId;
  const deviceChosen = Boolean(selection[DEVICE_OPTION]);
  const selectedColor = selection[COLOR_OPTION];
  const colorCount = product.options.find((o) => o.name === COLOR_OPTION)?.values.length ?? 0;
  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedDeviceId) url.searchParams.set("toestel", selectedDeviceId);
    else if (deviceChosen) url.searchParams.delete("toestel");
    if (selectedColor && colorCount > 1) url.searchParams.set("kleur", colorSlug(selectedColor));
    else url.searchParams.delete("kleur");
    if (url.href !== window.location.href) window.history.replaceState(null, "", url);
  }, [selectedDeviceId, deviceChosen, selectedColor, colorCount]);

  // Vaste koopbalk op mobiel zodra de gewone koopknop uit beeld is.
  useEffect(() => {
    const el = buyRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      setShowStickyBar(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const add = async () => {
    if (!variant) return;
    const ok = await addItem(variant.id, qty);
    if (ok) setQuantity(1);
  };

  const buttonLabel = !variant
    ? hasDeviceOption && !selection[DEVICE_OPTION]
      ? "Kies eerst je toestel"
      : "Maak een keuze"
    : variant.availableForSale
      ? pending
        ? "Bezig met toevoegen…"
        : "In winkelmand"
      : "Uitverkocht";

  const ruleCheck =
    product.compatibility.kind === "rules" && storedDevice
      ? { device: storedDevice, ok: isCompatible(product, storedDevice) }
      : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-10">
      <Gallery key={images[0]?.url ?? "leeg"} images={images} title={product.title} />

      <div>
        <p className="text-sm font-semibold tracking-wide text-muted uppercase">
          <Link href={`/merk/${product.brandSlug}`} className="hover:text-primary hover:underline">
            {product.brand}
          </Link>
          <span className="mx-1.5">·</span>
          {categoryName}
        </p>
        <h1 className="mt-1 text-2xl leading-tight font-bold tracking-tight lg:text-3xl">{product.title}</h1>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
          <Price
            amount={variant?.price ?? Math.min(...product.variants.map((v) => v.price))}
            from={!variant && new Set(product.variants.map((v) => v.price)).size > 1}
            compareAt={variant?.compareAtPrice}
            size="lg"
          />
          {variant ? (
            <StockLabel stock={stockState([variant])} />
          ) : (
            <p className="text-sm text-muted">Kies een uitvoering om de voorraad te zien</p>
          )}
        </div>

        {product.highlights.length > 0 && (
          <ul className="mt-4 space-y-1.5 text-[0.9375rem] text-ink-soft">
            {product.highlights.map((h) => (
              <li key={h} className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-success" strokeWidth={2.5} aria-hidden />
                {h}
              </li>
            ))}
          </ul>
        )}

        {ruleCheck && (
          <p
            className={`mt-4 flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm ${
              ruleCheck.ok ? "border-success/30 bg-success/5 text-success" : "border-warning/30 bg-warning/5 text-warning"
            }`}
          >
            {ruleCheck.ok ? (
              <Check className="mt-0.5 size-4 shrink-0" strokeWidth={2.5} aria-hidden />
            ) : (
              <CircleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={2} aria-hidden />
            )}
            <span>
              {ruleCheck.ok
                ? `Geschikt voor jouw ${ruleCheck.device.name}.`
                : `Niet geschikt voor jouw ${ruleCheck.device.name}. ${describeRequirements(product).join(". ")}.`}
            </span>
          </p>
        )}

        <div className="mt-6 space-y-5">
          {product.options.map((option) => (
            <fieldset key={option.name}>
              <legend className="mb-2 text-sm font-semibold">
                {option.name === DEVICE_OPTION ? "Geschikt voor toestel" : option.name}
                {selection[option.name] && (
                  <span className="font-normal text-ink-soft">: {selection[option.name]}</span>
                )}
              </legend>

              {option.name === DEVICE_OPTION && wantedMissing && (
                <p className="mb-3 flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 px-3 py-2.5 text-sm text-warning">
                  <Smartphone className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                  <span>
                    Dit product is niet verkrijgbaar voor de {wantedMissing.name}. Kies hieronder zelf een
                    toestel als je het voor een ander model wilt bestellen, of{" "}
                    <Link
                      href={`/toestel/${wantedMissing.brandSlug}/${wantedMissing.id}?categorie=${product.category}`}
                      className="font-semibold underline"
                    >
                      bekijk alternatieven voor de {wantedMissing.name}
                    </Link>
                    .
                  </span>
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {option.values.map((value) => {
                  const state = optionValueState(product, { ...selection }, option.name, value);
                  const active = selection[option.name] === value;
                  const swatch =
                    option.name === COLOR_OPTION
                      ? product.variants.find((v) => v.selectedOptions[COLOR_OPTION] === value)?.color?.hex
                      : undefined;
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={active}
                      disabled={state === "none"}
                      onClick={() => setPicked((p) => ({ ...p, [option.name]: value }))}
                      className={`relative inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                        active
                          ? "border-primary bg-primary-soft text-primary ring-1 ring-primary"
                          : "border-line-strong bg-white text-ink hover:border-ink-soft"
                      } ${state === "soldout" ? "text-muted line-through decoration-1" : ""}`}
                    >
                      {swatch && (
                        <span
                          aria-hidden
                          className="size-4 rounded-full border border-black/10"
                          style={{ backgroundColor: swatch }}
                        />
                      )}
                      {value}
                      {state === "soldout" && <span className="sr-only"> (uitverkocht)</span>}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>

        <div ref={buyRef} className="mt-6 flex flex-wrap items-stretch gap-3">
          <QuantityInput value={qty} max={maxQuantity} disabled={!variant?.availableForSale} onChange={setQuantity} />
          <button type="button" onClick={add} disabled={!canAdd} className="btn btn-primary h-12 flex-1 text-base">
            <ShoppingBag className="size-5" strokeWidth={1.75} aria-hidden />
            {buttonLabel}
          </button>
        </div>
        {error && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {error}
          </p>
        )}
        {variant && !variant.availableForSale && (
          <p className="mt-3 text-sm text-ink-soft">
            Deze uitvoering is momenteel uitverkocht. Kies een andere kleur of uitvoering.
          </p>
        )}
        <p className="mt-4 text-sm text-muted">
          Meer over{" "}
          <Link href="/verzending-en-retourneren" className="link">
            verzending en retourneren
          </Link>
          .
        </p>
      </div>

      {/* Vaste koopbalk op mobiel */}
      <div
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white px-4 py-3 shadow-pop transition-transform lg:hidden ${
          showStickyBar ? "translate-y-0" : "translate-y-full"
        }`}
        aria-hidden={!showStickyBar}
        inert={!showStickyBar}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{product.title}</p>
            <p className="truncate text-xs text-muted">
              {variant ? Object.values(variant.selectedOptions).join(" · ") : "Kies een uitvoering"}
            </p>
          </div>
          <button type="button" onClick={add} disabled={!canAdd} className="btn btn-primary h-11 shrink-0">
            {variant?.availableForSale ? "In winkelmand" : buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function QuantityInput({
  value,
  max,
  disabled,
  onChange,
}: {
  value: number;
  max: number;
  disabled: boolean;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex h-12 items-center rounded-md border border-line-strong bg-white">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={disabled || value <= 1}
        className="flex h-full w-10 items-center justify-center text-ink disabled:text-line-strong"
        aria-label="Aantal verlagen"
      >
        <Minus className="size-4" strokeWidth={2} aria-hidden />
      </button>
      <label htmlFor="aantal" className="sr-only">
        Aantal
      </label>
      <input
        id="aantal"
        type="number"
        inputMode="numeric"
        min={1}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const n = Number.parseInt(e.target.value, 10);
          if (!Number.isNaN(n)) onChange(Math.min(Math.max(1, n), max));
        }}
        className="h-full w-10 border-x border-line text-center text-[0.9375rem] font-semibold tabular-nums focus:outline-none disabled:text-muted"
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        className="flex h-full w-10 items-center justify-center text-ink disabled:text-line-strong"
        aria-label="Aantal verhogen"
      >
        <Plus className="size-4" strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}

function Gallery({ images, title }: { images: ProductImage[]; title: string }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  if (!current) {
    return <div className="aspect-square rounded-md border border-line bg-surface" aria-label={`Geen foto van ${title}`} />;
  }

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row lg:sticky lg:top-4 lg:self-start">
      {images.length > 1 && (
        <ul className="flex gap-2 sm:flex-col" aria-label="Productfoto's">
          {images.map((img, i) => (
            <li key={img.url}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Toon foto ${i + 1} van ${images.length}`}
                aria-current={i === active}
                className={`relative block size-16 overflow-hidden rounded border bg-surface sm:size-20 ${
                  i === active ? "border-primary ring-1 ring-primary" : "border-line hover:border-line-strong"
                }`}
              >
                <Image src={img.url} alt="" fill sizes="80px" className="object-contain p-1" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="relative aspect-square flex-1 overflow-hidden rounded-md border border-line bg-surface">
        <Image
          src={current.url}
          alt={current.alt}
          fill
          priority
          sizes="(min-width: 1024px) 45vw, 100vw"
          className="object-contain p-4"
        />
      </div>
    </div>
  );
}
