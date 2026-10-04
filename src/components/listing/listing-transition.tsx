"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useTransition } from "react";

import { startNavigationProgress } from "@/components/layout/navigation-progress";

/**
 * Gedeelde overgang voor een productoverzicht: filters en sortering
 * navigeren binnen één transition, zodat het huidige raster zichtbaar blijft
 * (licht gedimd) tot de nieuwe resultaten er zijn.
 */
type ListingTransition = { pending: boolean; navigate: (href: string) => void };

const Ctx = createContext<ListingTransition | null>(null);

export function ListingTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const navigate = useCallback(
    (href: string) => {
      startNavigationProgress();
      startTransition(() => router.push(href, { scroll: false }));
    },
    [router],
  );
  const value = useMemo(() => ({ pending, navigate }), [pending, navigate]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useListingTransition(): ListingTransition {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useListingTransition moet binnen ListingTransitionProvider gebruikt worden.");
  return ctx;
}

/** Resultaten die tijdens het laden licht dimmen. */
export function ListingResults({ children }: { children: React.ReactNode }) {
  const { pending } = useListingTransition();
  return (
    <div
      aria-busy={pending}
      className={`transition-opacity duration-200 ${pending ? "pointer-events-none opacity-50" : "opacity-100"}`}
    >
      {children}
    </div>
  );
}
