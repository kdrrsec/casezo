"use client";

import { ArrowRight, Check, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useDevice } from "@/components/providers/device-provider";
import { categories } from "@/lib/catalog/categories";
import { deviceBrands, devices } from "@/lib/catalog/devices";

/**
 * "Vind accessoires voor jouw telefoon": merk → model → accessoires.
 * De keuze wordt direct lokaal onthouden zodra een model gekozen is.
 */
export function DeviceSelector({ compact = false, onDone }: { compact?: boolean; onDone?: () => void }) {
  const { device, availableIds, setDevice, clearDevice } = useDevice();
  const [pickedBrand, setPickedBrand] = useState<string | null>(null);

  const brands = deviceBrands.filter((b) => devices.some((d) => d.brandSlug === b.slug && availableIds.includes(d.id)));
  const brand = pickedBrand ?? device?.brandSlug ?? null;
  const models = devices.filter((d) => d.brandSlug === brand && availableIds.includes(d.id));
  const series = [...new Set(models.map((m) => m.series))];
  const selectedId = device && device.brandSlug === brand ? device.id : null;
  const brandName = (slug: string) => deviceBrands.find((b) => b.slug === slug)?.name ?? "";

  const stepTitle = (n: number, text: string) => (
    <p className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-ink">
      <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
        {n}
      </span>
      {text}
    </p>
  );

  return (
    <div className={`grid gap-6 ${compact ? "" : "lg:grid-cols-[13rem_1fr_16rem] lg:gap-8"}`}>
      <div>
        {stepTitle(1, "Kies je telefoonmerk")}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Telefoonmerk">
          {brands.map((b) => {
            const active = brand === b.slug;
            return (
              <button
                key={b.slug}
                type="button"
                aria-pressed={active}
                onClick={() => setPickedBrand(b.slug)}
                className={`min-w-24 rounded-md border px-4 py-2.5 text-[0.9375rem] font-semibold transition-colors ${
                  active
                    ? "border-primary bg-primary-soft text-primary-hover"
                    : "border-line-strong bg-white text-ink hover:border-ink-soft"
                }`}
              >
                {b.name}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        {stepTitle(2, "Kies je model")}
        {brand ? (
          <div className="space-y-3">
            {series.map((s) => (
              <div key={s}>
                <p className="mb-1.5 text-xs font-medium text-muted">{s}</p>
                <div className="flex flex-wrap gap-2" role="group" aria-label={s}>
                  {models
                    .filter((m) => m.series === s)
                    .map((m) => {
                      const active = selectedId === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setDevice(m.id)}
                          className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                            active
                              ? "border-primary bg-primary text-white"
                              : "border-line-strong bg-white text-ink hover:border-ink-soft"
                          }`}
                        >
                          {active && <Check className="size-4" strokeWidth={2.25} aria-hidden />}
                          {m.name}
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-line-strong px-4 py-3 text-sm text-muted">
            Kies eerst het merk van je telefoon.
          </p>
        )}
      </div>

      <div>
        {stepTitle(3, "Bekijk passende accessoires")}
        {device ? (
          <div className="space-y-3">
            <Link
              href={`/toestel/${device.brandSlug}/${device.id}`}
              onClick={onDone}
              className="btn btn-primary w-full"
            >
              Accessoires voor {device.name}
              <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
            </Link>
            <ul className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/toestel/${device.brandSlug}/${device.id}?categorie=${c.slug}`}
                    onClick={onDone}
                    className="text-primary hover:underline"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => {
                clearDevice();
                setPickedBrand(null);
              }}
              className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
            >
              <X className="size-4" strokeWidth={2} aria-hidden />
              Toestel {brandName(device.brandSlug)} {device.name} wissen
            </button>
          </div>
        ) : (
          <span className="btn btn-primary w-full" aria-disabled="true">
            Kies eerst je model
          </span>
        )}
      </div>
    </div>
  );
}
