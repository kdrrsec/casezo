"use client";

import { ChevronDown, Headset, Menu, Smartphone, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useDevice } from "@/components/providers/device-provider";
import { getDeviceBrand } from "@/lib/catalog/devices";
import type { MenuItem } from "@/lib/navigation";

/**
 * Mobiele navigatie: zijpaneel dat van links inschuift, met een duidelijke
 * sluitknop, sluiten via de achtergrond of Escape, en soepel uitklappende
 * onderdelen.
 */
export function MobileNav({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  // Telt hoe vaak het menu geopend is: de inhoud wordt pas bij de eerste keer
  // opgebouwd en de intro-animatie speelt bij elke opening opnieuw.
  const [openCount, setOpenCount] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { device, openPicker } = useDevice();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const show = () => {
    setOpenCount((c) => c + 1);
    setOpen(true);
  };
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 50);
    const trigger = triggerRef.current;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        const visible = [...focusables].filter((el) => !el.closest("[inert]"));
        const first = visible[0];
        const last = visible[visible.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKey);
      root.style.overflow = previous;
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={show}
        className="-ml-2 flex size-10 items-center justify-center rounded-md text-ink hover:bg-surface active:scale-95 lg:hidden"
        aria-label="Menu openen"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Menu className="size-6" strokeWidth={1.75} aria-hidden />
      </button>

      <div className="fixed inset-0 z-50 lg:hidden" inert={!open} aria-hidden={!open}>
        {/* Achtergrond: tik om te sluiten */}
        <div
          onClick={close}
          className={`absolute inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />

        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className={`absolute inset-y-0 left-0 flex w-[min(22rem,88vw)] flex-col bg-white shadow-pop transition-transform duration-[380ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="text-lg font-bold">Menu</span>
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              className="flex h-10 items-center gap-1.5 rounded-full border border-line-strong bg-white pr-4 pl-3 text-sm font-semibold text-ink transition-colors hover:bg-surface active:scale-95"
            >
              <X className="size-4" strokeWidth={2.25} aria-hidden />
              Sluiten
            </button>
          </div>

          {openCount > 0 && (
            <nav key={openCount} aria-label="Mobiele navigatie" className="flex-1 overflow-y-auto overscroll-contain">
              {device ? (
                <Link
                  href={`/toestel/${device.brandSlug}/${device.id}`}
                  onClick={close}
                  className="menu-item-in flex items-center gap-3 border-b border-line bg-primary-soft px-4 py-3 text-sm"
                >
                  <Smartphone className="size-5 text-primary" strokeWidth={1.75} aria-hidden />
                  <span>
                    Accessoires voor{" "}
                    <strong>
                      {getDeviceBrand(device.brandSlug)?.name} {device.name}
                    </strong>
                  </span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    close();
                    openPicker();
                  }}
                  className="menu-item-in flex w-full items-center gap-3 border-b border-line bg-primary-soft px-4 py-3 text-left text-sm"
                >
                  <Smartphone className="size-5 text-primary" strokeWidth={1.75} aria-hidden />
                  <span>
                    <strong>Kies je toestel</strong> en zie direct wat past
                  </span>
                </button>
              )}

              <ul>
                {items.map((item, index) => {
                  const isOpen = expanded === item.key;
                  return (
                    <li
                      key={item.key}
                      className="menu-item-in border-b border-line"
                      style={{ animationDelay: `${60 + index * 30}ms` }}
                    >
                      <button
                        type="button"
                        className="flex w-full items-center justify-between px-4 py-3.5 text-left font-semibold active:bg-surface"
                        aria-expanded={isOpen}
                        aria-controls={`mobile-${item.key}`}
                        onClick={() => setExpanded(isOpen ? null : item.key)}
                      >
                        {item.label}
                        <ChevronDown
                          className={`size-5 text-muted transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                          strokeWidth={1.75}
                          aria-hidden
                        />
                      </button>
                      {/* Soepel uitklappen via grid-rows 0fr → 1fr */}
                      <div
                        id={`mobile-${item.key}`}
                        inert={!isOpen}
                        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div className="bg-surface px-4 pt-1 pb-4">
                            <Link
                              href={item.footer.href}
                              onClick={close}
                              className="block py-2 text-[0.9375rem] font-semibold text-primary"
                            >
                              {item.footer.label}
                            </Link>
                            {item.columns.map((column) => (
                              <div key={column.title} className="mt-2">
                                <p className="py-1 text-xs font-bold tracking-wide text-muted uppercase">
                                  {column.title}
                                </p>
                                <ul>
                                  {column.links.map((link) => (
                                    <li key={link.href}>
                                      <Link
                                        href={link.href}
                                        onClick={close}
                                        className="block py-2 text-[0.9375rem] text-ink-soft"
                                      >
                                        {link.label}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <Link
                href="/klantenservice"
                onClick={close}
                className="menu-item-in flex items-center gap-3 px-4 py-3.5 text-[0.9375rem] font-semibold"
                style={{ animationDelay: `${60 + items.length * 30}ms` }}
              >
                <Headset className="size-5 text-muted" strokeWidth={1.75} aria-hidden />
                Klantenservice
              </Link>
            </nav>
          )}
        </div>
      </div>
    </>
  );
}
