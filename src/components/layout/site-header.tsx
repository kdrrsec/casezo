import { Headset } from "lucide-react";
import Link from "next/link";

import { CartButton } from "@/components/cart/cart-button";
import { DeviceBar } from "@/components/device/device-bar";
import type { MenuItem } from "@/lib/navigation";

import { Logo } from "./logo";
import { MegaMenu } from "./mega-menu";
import { MobileNav } from "./mobile-nav";
import { SearchForm } from "./search-form";

export function SiteHeader({ menu }: { menu: MenuItem[] }) {
  return (
    <>
      <a
        href="#inhoud"
        className="sr-only z-50 rounded bg-primary px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Naar de inhoud
      </a>
      <header className="sticky top-0 z-40 border-b border-line bg-white lg:static">
        <div className="container-shop">
          <div className="flex h-14 items-center gap-2 lg:h-[4.5rem] lg:gap-8">
            <MobileNav items={menu} />
            <Logo />
            <div className="hidden flex-1 lg:block lg:max-w-2xl">
              <SearchForm id="zoeken-desktop" />
            </div>
            <div className="ml-auto flex items-center gap-1">
              <Link
                href="/klantenservice"
                className="flex items-center gap-2 rounded-md px-2 py-2 text-ink hover:bg-surface lg:px-3"
              >
                <Headset className="size-6" strokeWidth={1.75} aria-hidden />
                <span className="sr-only text-sm font-semibold lg:not-sr-only">Klantenservice</span>
              </Link>
              <CartButton />
            </div>
          </div>
          <div className="pb-3 lg:hidden">
            <SearchForm id="zoeken-mobiel" />
          </div>
        </div>
        <MegaMenu items={menu} />
      </header>
      <DeviceBar />
    </>
  );
}
