"use client";

import { Smartphone } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { useDevice } from "@/components/providers/device-provider";

function Hint({ basePath }: { basePath: string }) {
  const { device } = useDevice();
  const params = useSearchParams();
  if (!device || params.get("toestel") || params.get("telefoonmerk")) return null;

  const next = new URLSearchParams(params);
  next.set("toestel", device.id);
  next.delete("pagina");

  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border border-primary-line bg-primary-soft px-4 py-3 text-sm">
      <Smartphone className="size-4 shrink-0 text-primary" strokeWidth={1.75} aria-hidden />
      <span className="flex-1">
        Je bekijkt alle producten. Wil je alleen zien wat past bij je <strong>{device.name}</strong>?
      </span>
      <Link
        href={`${basePath}?${next.toString().replace(/%2C/g, ",")}`}
        scroll={false}
        className="font-semibold text-primary hover:underline"
      >
        Toon passend voor {device.name}
      </Link>
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
