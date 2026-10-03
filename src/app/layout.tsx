import "@fontsource-variable/inter";
import "./globals.css";

import type { Metadata, Viewport } from "next";

import { AddedNotice } from "@/components/cart/added-notice";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { CartProvider } from "@/components/providers/cart-provider";
import { DeviceProvider } from "@/components/providers/device-provider";
import { storeConfig } from "@/config/store";
import { getDevicesWithProducts } from "@/lib/catalog";
import { getMainMenu } from "@/lib/navigation";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: {
    default: `${storeConfig.name} – telefoonhoesjes en accessoires`,
    template: `%s | ${storeConfig.name}`,
  },
  description: storeConfig.tagline,
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [menu, availableDevices] = await Promise.all([getMainMenu(), getDevicesWithProducts()]);

  return (
    <html lang="nl">
      <body className="flex min-h-dvh flex-col">
        <DeviceProvider availableIds={availableDevices.map((d) => d.id)}>
          <CartProvider>
            <SiteHeader menu={menu} />
            <main id="inhoud" className="flex-1">
              {children}
            </main>
            <SiteFooter />
            <AddedNotice />
          </CartProvider>
        </DeviceProvider>
      </body>
    </html>
  );
}
