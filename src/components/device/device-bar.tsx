"use client";

import { Smartphone, X } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

import { useDevice } from "@/components/providers/device-provider";
import { getDeviceBrand } from "@/lib/catalog/devices";

import { DeviceSelector } from "./device-selector";

/** Smalle balk onder de navigatie met het actieve toestel. */
export function DeviceBar() {
  const { device, clearDevice } = useDevice();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const close = () => dialogRef.current?.close();

  return (
    <div className="border-b border-line bg-surface">
      <div className="container-shop flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 py-1.5 text-sm">
        <Smartphone className="size-4 shrink-0 text-primary" strokeWidth={1.75} aria-hidden />
        {device ? (
          <>
            <span className="min-w-0">
              <span className="text-muted">Jouw toestel: </span>
              <Link
                href={`/toestel/${device.brandSlug}/${device.id}`}
                className="font-semibold text-ink hover:text-primary hover:underline"
              >
                {getDeviceBrand(device.brandSlug)?.name} {device.name}
              </Link>
            </span>
            <span className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={() => dialogRef.current?.showModal()}
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
          </>
        ) : (
          <>
            <span className="text-ink-soft">
              <span className="sm:hidden">Welke telefoon heb je?</span>
              <span className="hidden sm:inline">Zie direct welke accessoires bij jouw telefoon passen.</span>
            </span>
            <button
              type="button"
              onClick={() => dialogRef.current?.showModal()}
              className="ml-auto rounded px-2 py-1 font-semibold text-primary hover:bg-white"
            >
              Kies je toestel
            </button>
          </>
        )}
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby="device-dialog-title"
        className="m-auto w-[min(40rem,calc(100vw-2rem))] max-w-none rounded-lg bg-white p-0 text-ink shadow-pop backdrop:bg-black/40"
        onClick={(event) => {
          if (event.target === dialogRef.current) close();
        }}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 id="device-dialog-title" className="text-lg font-bold">
            Vind accessoires voor jouw telefoon
          </h2>
          <button
            type="button"
            onClick={close}
            className="flex size-9 items-center justify-center rounded-md hover:bg-surface"
            aria-label="Sluiten"
          >
            <X className="size-5" strokeWidth={2} aria-hidden />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5">
          <DeviceSelector compact onDone={close} />
        </div>
      </dialog>
    </div>
  );
}
