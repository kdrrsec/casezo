import "@fontsource-variable/inter";
import "./globals.css";

import type { Metadata, Viewport } from "next";

import { CartDrawer } from "@/components/cart/cart-drawer";
import { DevicePicker } from "@/components/device/device-picker";
import { SiteFooter } from "@/components/layout/site-footer";
import { NavigationProgress } from "@/components/layout/navigation-progress";
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
        <NavigationProgress />
        <DeviceProvider availableIds={availableDevices.map((d) => d.id)}>
          <CartProvider>
            <SiteHeader menu={menu} />
            <main id="inhoud" className="flex-1">
              {children}
            </main>
            <SiteFooter />
            <CartDrawer />
            <DevicePicker />
          </CartProvider>
        </DeviceProvider>
      </body>
    </html>
  );
}
