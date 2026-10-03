import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ListingView } from "@/components/listing/listing-view";
import { getListing, getProductBrands } from "@/lib/catalog";

async function findBrand(slug: string) {
  return (await getProductBrands()).find((b) => b.slug === slug);
}

export async function generateMetadata({ params }: PageProps<"/merk/[slug]">): Promise<Metadata> {
  const brand = await findBrand((await params).slug);
  return brand ? { title: `${brand.name} accessoires` } : {};
}

export default async function BrandPage({ params, searchParams }: PageProps<"/merk/[slug]">) {
  const brand = await findBrand((await params).slug);
  if (!brand) notFound();

  const basePath = `/merk/${brand.slug}`;
  const result = await getListing({ brandSlug: brand.slug }, await searchParams, basePath);

  return (
    <ListingView
      result={result}
      basePath={basePath}
      title={brand.name}
      description={`Alle producten van ${brand.name} in ons assortiment.`}
      breadcrumbs={[{ label: "Merken", href: "/merken" }, { label: brand.name }]}
      showDeviceHint
    />
  );
}
