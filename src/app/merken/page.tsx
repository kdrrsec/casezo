import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { getCategory, getDeviceMenu, getProductBrands } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Merken",
  description: "Accessoires per telefoonmerk en alle productmerken in ons assortiment.",
  alternates: { canonical: "/merken" },
};

export default async function BrandsPage() {
  const [deviceMenu, brands] = await Promise.all([getDeviceMenu(), getProductBrands()]);

  return (
    <div className="container-shop pt-4 pb-8 lg:pt-6">
      <Breadcrumbs items={[{ label: "Merken" }]} />
      <h1 className="mt-3 text-2xl font-bold tracking-tight lg:text-[1.75rem]">Merken</h1>

      <section aria-labelledby="telefoonmerken" className="mt-8">
        <h2 id="telefoonmerken" className="mb-3 text-lg font-bold">
          Accessoires per telefoonmerk
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {deviceMenu.map(({ brand, series }) => {
            const models = series.flatMap((s) => s.devices);
            return (
              <li key={brand.slug} className="rounded-md border border-line bg-white p-5">
                <Link href={`/toestel/${brand.slug}`} className="text-lg font-bold hover:text-primary">
                  {brand.name}
                </Link>
                <p className="mt-1 text-sm text-muted">{models.length} modellen met accessoires</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {models.map((d) => (
                    <li key={d.id}>
                      <Link
                        href={`/toestel/${brand.slug}/${d.id}`}
                        className="block rounded border border-line px-2.5 py-1 text-sm text-ink-soft hover:border-primary hover:text-primary"
                      >
                        {d.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="productmerken" className="mt-10">
        <h2 id="productmerken" className="mb-3 text-lg font-bold">
          Productmerken
        </h2>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {brands.map((b) => (
            <li key={b.slug}>
              <Link
                href={`/merk/${b.slug}`}
                className="flex h-full flex-col rounded-md border border-line bg-white p-4 hover:border-primary"
              >
                <span className="text-lg font-bold tracking-tight">{b.name}</span>
                <span className="mt-1 text-sm text-muted">
                  {b.productCount} {b.productCount === 1 ? "product" : "producten"}
                </span>
                <span className="mt-2 text-xs text-ink-soft">
                  {b.categories.map((c) => getCategory(c)?.name).join(" · ")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
