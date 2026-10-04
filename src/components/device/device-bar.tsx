"use client";

import { Smartphone, X } from "lucide-react";
import Link from "next/link";

import { useDevice } from "@/components/providers/device-provider";
import { getDeviceBrand } from "@/lib/catalog/devices";

/** Smalle balk onder de navigatie, alleen zichtbaar als er een toestel gekozen is. */
export function DeviceBar() {
  const { device, clearDevice, openPicker } = useDevice();
  if (!device) return null;

  return (
    <div className="animate-[fade-in_200ms_ease-out] border-b border-line bg-surface">
      <div className="container-shop flex min-h-10 items-center gap-x-3 py-1 text-sm">
        <Smartphone className="size-4 shrink-0 text-primary" strokeWidth={1.75} aria-hidden />
        <span className="min-w-0 truncate">
          <span className="text-muted">Jouw toestel: </span>
          <Link
            href={`/toestel/${device.brandSlug}/${device.id}`}
            className="font-semibold text-ink hover:text-primary hover:underline"
          >
            <span className="hidden sm:inline">{getDeviceBrand(device.brandSlug)?.name} </span>
            {device.name}
          </Link>
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={openPicker}
            className="rounded px-2 py-1 font-medium text-primary hover:bg-white"
          >
            Wijzigen
          </button>
          <button
            type="button"
            onClick={clearDevice}
            className="flex items-center gap-1 rounded px-2 py-1 text-muted hover:bg-white hover:text-ink"
            aria-label={`Toestel ${device.name} wissen`}
          >
            <X className="size-4" strokeWidth={2} aria-hidden />
            <span className="hidden sm:inline">Wissen</span>
          </button>
        </span>
      </div>
    </div>
  );
}
