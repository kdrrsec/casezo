"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { MenuItem } from "@/lib/navigation";

/**
 * Desktopnavigatie met megamenu.
 *
 * Bediening: met de muis via hover; met het toetsenbord via de pijlknop naast
 * elk menu-item (Enter/Spatie of pijl omlaag opent en focust de eerste link,
 * Escape sluit en zet de focus terug). Het hoofdlabel blijft een gewone link.
 */
export function MegaMenu({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const panels = useRef(new Map<string, HTMLDivElement>());
  const navRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const onPointer = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setOpen(null);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      window.clearTimeout(timer.current);
    };
  }, []);

  const schedule = (key: string | null, delay: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(key), delay);
  };

  const focusFirstLink = (key: string) => {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => panels.current.get(key)?.querySelector<HTMLAnchorElement>("a")?.focus()),
    );
  };

  const closeAndReturn = (key: string) => {
    setOpen(null);
    buttons.current.get(key)?.focus();
  };

  return (
    <nav
      ref={navRef}
      aria-label="Hoofdnavigatie"
      className="relative hidden border-t border-line lg:block"
      onMouseLeave={() => schedule(null, 150)}
    >
      <ul className="container-shop flex items-stretch gap-1">
        {items.map((item) => {
          const isOpen = open === item.key;
          const active = pathname.startsWith(item.href.split("?")[0]);
          return (
            <li
              key={item.key}
              onMouseEnter={() => schedule(item.key, open ? 0 : 120)}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null) && isOpen) setOpen(null);
              }}
            >
              <div
                className={`flex items-center border-b-2 ${
                  isOpen || active ? "border-primary" : "border-transparent"
                }`}
              >
                <Link
                  href={item.href}
                  className={`py-3 pr-1 pl-3 text-[0.9375rem] font-semibold ${active ? "text-primary" : "text-ink hover:text-primary"}`}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(null)}
                >
                  {item.label}
                </Link>
                <button
                  ref={(el) => {
                    if (el) buttons.current.set(item.key, el);
                  }}
                  type="button"
                  className="mr-1 flex size-7 items-center justify-center rounded text-muted hover:bg-surface hover:text-ink"
                  aria-expanded={isOpen}
                  aria-controls={`megamenu-${item.key}`}
                  aria-label={`Submenu ${item.label}`}
                  onClick={() => {
                    window.clearTimeout(timer.current);
                    setOpen(isOpen ? null : item.key);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      setOpen(item.key);
                      focusFirstLink(item.key);
                    } else if (event.key === "Escape") {
                      setOpen(null);
                    }
                  }}
                >
                  <ChevronDown
                    className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    strokeWidth={2}
                    aria-hidden
                  />
                </button>
              </div>

              <div
                id={`megamenu-${item.key}`}
                ref={(el) => {
                  if (el) panels.current.set(item.key, el);
                }}
                hidden={!isOpen}
                className="absolute inset-x-0 top-full z-40 border-y border-line bg-white shadow-pop"
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.stopPropagation();
                    closeAndReturn(item.key);
                  }
                }}
              >
                {/* Inhoud pas opbouwen bij openen: minder werk bij het laden van de pagina. */}
                {isOpen && (
                <div className="container-shop py-6">
                  <div className="grid grid-cols-4 gap-x-8 gap-y-6 xl:grid-cols-5">
                    {item.columns.map((column) => (
                      <div key={column.title}>
                        <p className="mb-2 text-xs font-bold tracking-wide text-muted uppercase">{column.title}</p>
                        <ul className="space-y-0.5">
                          {column.links.map((link) => (
                            <li key={link.href}>
                              <Link
                                href={link.href}
                                className="block rounded py-1 text-[0.9375rem] text-ink-soft hover:text-primary hover:underline"
                                onClick={() => setOpen(null)}
                              >
                                {link.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 border-t border-line pt-4">
                    <Link
                      href={item.footer.href}
                      className="text-sm font-semibold text-primary hover:underline"
                      onClick={() => setOpen(null)}
                    >
                      {item.footer.label} →
                    </Link>
                  </div>
                </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
