import type { Metadata } from "next";

import { CartView } from "@/components/cart/cart-view";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { storeConfig } from "@/config/store";

export const metadata: Metadata = { title: "Winkelmand", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="container-shop pt-4 pb-8 lg:pt-6">
      <Breadcrumbs items={[{ label: "Winkelmand" }]} />
      <h1 className="mt-3 mb-6 text-2xl font-bold tracking-tight lg:text-[1.75rem]">Winkelmand</h1>
      <CartView shippingNote={storeConfig.shipping.costs} />
    </div>
  );
}
