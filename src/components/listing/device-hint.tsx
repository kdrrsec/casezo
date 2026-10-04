"use client";

import { Smartphone } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { useDevice } from "@/components/providers/device-provider";

import { TransitionLink } from "./transition-link";

function Hint({ basePath }: { basePath: string }) {
  const { device, openPicker } = useDevice();
  const params = useSearchParams();
  if (params.get("toestel") || params.get("telefoonmerk")) return null;

  // Nog geen toestel: compacte uitnodiging om er een te kiezen.
  if (!device) {
    return (
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border border-line bg-surface px-4 py-2.5 text-sm">
        <Smartphone className="size-4 shrink-0 text-primary" strokeWidth={1.75} aria-hidden />
        <span className="flex-1 text-ink-soft">Zie alleen wat bij jouw telefoon past.</span>
        <button type="button" onClick={openPicker} className="font-semibold text-primary hover:underline">
          Kies je toestel
        </button>
      </div>
    );
  }

  const next = new URLSearchParams(params);
  next.set("toestel", device.id);
  next.delete("pagina");

  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border border-primary-line bg-primary-soft px-4 py-2.5 text-sm">
      <Smartphone className="size-4 shrink-0 text-primary" strokeWidth={1.75} aria-hidden />
      <span className="flex-1">
        Alleen producten voor je <strong>{device.name}</strong> tonen?
      </span>
      <TransitionLink
        href={`${basePath}?${next.toString().replace(/%2C/g, ",")}`}
        className="font-semibold text-primary hover:underline"
      >
        Toon passend
      </TransitionLink>
    </div>
  );
}

/** Suggereert filteren op het gekozen toestel; de URL blijft leidend. */
export function DeviceHint({ basePath }: { basePath: string }) {
  return (
    <Suspense fallback={null}>
      <Hint basePath={basePath} />
    </Suspense>
  );
}
