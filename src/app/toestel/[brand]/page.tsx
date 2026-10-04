import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ListingView } from "@/components/listing/listing-view";
import { deviceBrands, getDeviceBrand, getDeviceCategoryCounts, getDeviceMenu, getListing } from "@/lib/catalog";

export function generateStaticParams() {
  return deviceBrands.map((b) => ({ brand: b.slug }));
}

export async function generateMetadata({ params }: PageProps<"/toestel/[brand]">): Promise<Metadata> {
  const brand = getDeviceBrand((await params).brand);
  return brand
    ? {
        title: `${brand.name}-accessoires`,
        description: `Hoesjes en accessoires voor ${brand.name}-telefoons.`,
        alternates: { canonical: `/toestel/${brand.slug}` },
      }
    : {};
}

export default async function PhoneBrandPage({ params, searchParams }: PageProps<"/toestel/[brand]">) {
  const brand = getDeviceBrand((await params).brand);
  if (!brand) notFound();

  const menu = (await getDeviceMenu()).find((g) => g.brand.slug === brand.slug);
  const series = menu?.series ?? [];
  const counts = new Map(
    await Promise.all(
      series.flatMap((s) => s.devices).map(async (d) => {
        const perCategory = await getDeviceCategoryCounts(d.id);
        return [d.id, Object.values(perCategory).reduce((a, b) => a + b, 0)] as const;
      }),
    ),
  );

  const basePath = `/toestel/${brand.slug}`;
  const result = await getListing({ phoneBrand: brand.slug }, await searchParams, basePath);

  return (
    <ListingView
      result={result}
      basePath={basePath}
      title={`${brand.name}-accessoires`}
      description={`Kies je ${brand.name}-model voor een overzicht van alles wat past, of filter hieronder door het hele ${brand.name}-assortiment.`}
      breadcrumbs={[{ label: "Merken", href: "/merken" }, { label: brand.name }]}
      intro={
        <section aria-labelledby="modellen" className="mb-8">
          <h2 id="modellen" className="mb-3 text-lg font-bold">
            Kies je model
          </h2>
          <div className="space-y-4">
            {series.map((s) => (
              <div key={s.name}>
                <p className="mb-2 text-sm font-medium text-muted">{s.name}</p>
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                  {s.devices.map((d) => (
                    <li key={d.id}>
                      <Link
                        href={`/toestel/${brand.slug}/${d.id}`}
                        className="flex h-full flex-col rounded-md border border-line bg-white px-3 py-2.5 hover:border-primary"
                      >
                        <span className="text-[0.9375rem] font-semibold">{d.name}</span>
                        <span className="text-xs text-muted">{counts.get(d.id) ?? 0} accessoires</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      }
    />
  );
}
