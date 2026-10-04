"use client";

import { ChevronDown, Headset, Menu, Smartphone, X } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import { useDevice } from "@/components/providers/device-provider";
import { getDeviceBrand } from "@/lib/catalog/devices";
import type { MenuItem } from "@/lib/navigation";

/** Mobiele navigatie in een zijpaneel met uitklapbare onderdelen. */
export function MobileNav({ items }: { items: MenuItem[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { device, openPicker } = useDevice();

  const open = () => dialogRef.current?.showModal();
  const close = () => dialogRef.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="-ml-2 flex size-10 items-center justify-center rounded-md text-ink hover:bg-surface lg:hidden"
        aria-label="Menu openen"
        aria-haspopup="dialog"
      >
        <Menu className="size-6" strokeWidth={1.75} aria-hidden />
      </button>

      <dialog
        ref={dialogRef}
        aria-label="Menu"
        className="m-0 h-dvh max-h-dvh w-[min(22rem,88vw)] max-w-none bg-white p-0 text-ink backdrop:bg-black/40"
        onClick={(event) => {
          // Klik op de achtergrond sluit het paneel.
          if (event.target === dialogRef.current) close();
        }}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="text-lg font-bold">Menu</span>
            <button
              type="button"
              onClick={close}
              className="flex size-10 items-center justify-center rounded-md hover:bg-surface"
              aria-label="Menu sluiten"
            >
              <X className="size-5" strokeWidth={2} aria-hidden />
            </button>
          </div>

          <nav aria-label="Mobiele navigatie" className="flex-1 overflow-y-auto">
            {device && (
              <Link
                href={`/toestel/${device.brandSlug}/${device.id}`}
                onClick={close}
                className="flex items-center gap-3 border-b border-line bg-primary-soft px-4 py-3 text-sm"
              >
                <Smartphone className="size-5 text-primary" strokeWidth={1.75} aria-hidden />
                <span>
                  Accessoires voor{" "}
                  <strong>
                    {getDeviceBrand(device.brandSlug)?.name} {device.name}
                  </strong>
                </span>
              </Link>
            )}
            {!device && (
              <button
                type="button"
                onClick={() => {
                  close();
                  openPicker();
                }}
                className="flex w-full items-center gap-3 border-b border-line bg-primary-soft px-4 py-3 text-left text-sm"
              >
                <Smartphone className="size-5 text-primary" strokeWidth={1.75} aria-hidden />
                <span>
                  <strong>Kies je toestel</strong> en zie direct wat past
                </span>
              </button>
            )}
            <ul>
              {items.map((item) => {
                const isOpen = expanded === item.key;
                return (
                  <li key={item.key} className="border-b border-line">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-4 py-3.5 text-left font-semibold"
                      aria-expanded={isOpen}
                      aria-controls={`mobile-${item.key}`}
                      onClick={() => setExpanded(isOpen ? null : item.key)}
                    >
                      {item.label}
                      <ChevronDown
                        className={`size-5 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    </button>
                    <div id={`mobile-${item.key}`} hidden={!isOpen} className="bg-surface px-4 pt-1 pb-4">
                      <Link
                        href={item.footer.href}
                        onClick={close}
                        className="block py-2 text-[0.9375rem] font-semibold text-primary"
                      >
                        {item.footer.label}
                      </Link>
                      {item.columns.map((column) => (
                        <div key={column.title} className="mt-2">
                          <p className="py-1 text-xs font-bold tracking-wide text-muted uppercase">{column.title}</p>
                          <ul>
                            {column.links.map((link) => (
                              <li key={link.href}>
                                <Link href={link.href} onClick={close} className="block py-2 text-[0.9375rem] text-ink-soft">
                                  {link.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
            <Link
              href="/klantenservice"
              onClick={close}
              className="flex items-center gap-3 px-4 py-3.5 text-[0.9375rem] font-semibold"
            >
              <Headset className="size-5 text-muted" strokeWidth={1.75} aria-hidden />
              Klantenservice
            </Link>
          </nav>
        </div>
      </dialog>
    </>
  );
}
