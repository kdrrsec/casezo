"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

/**
 * Dunne laadbalk bovenaan tijdens navigatie.
 *
 * Start bij een klik op een interne link of bij `startNavigationProgress()`
 * (voor router.push vanuit filters), en stopt zodra de URL is bijgewerkt.
 * De balk wordt via de DOM aangestuurd, zodat er geen extra renders zijn.
 */
const START_EVENT = "casezo:navigatie-start";

export function startNavigationProgress() {
  window.dispatchEvent(new Event(START_EVENT));
}

function Bar() {
  const barRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const url = `${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    const start = () => {
      window.clearTimeout(timer.current);
      // Kleine vertraging: bij snelle navigaties verschijnt geen balk.
      timer.current = window.setTimeout(() => {
        bar.style.transition = "none";
        bar.style.opacity = "1";
        bar.style.transform = "scaleX(0.08)";
        requestAnimationFrame(() => {
          bar.style.transition = "transform 8s cubic-bezier(0.1, 0.7, 0.2, 1)";
          bar.style.transform = "scaleX(0.9)";
        });
      }, 120);
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      const next = new URL(anchor.href, location.href);
      if (next.origin !== location.origin) return;
      if (next.pathname === location.pathname && next.search === location.search) return;
      start();
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener(START_EVENT, start);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener(START_EVENT, start);
    };
  }, []);

  // URL gewijzigd: navigatie is klaar.
  useEffect(() => {
    const bar = barRef.current;
    window.clearTimeout(timer.current);
    if (!bar || bar.style.opacity !== "1") return;
    bar.style.transition = "transform 200ms ease-out, opacity 300ms ease 200ms";
    bar.style.transform = "scaleX(1)";
    bar.style.opacity = "0";
  }, [url]);

  return (
    <div
      ref={barRef}
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-primary opacity-0"
      style={{ transform: "scaleX(0)" }}
    />
  );
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <Bar />
    </Suspense>
  );
}
