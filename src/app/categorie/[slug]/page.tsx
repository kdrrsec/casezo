import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ListingView } from "@/components/listing/listing-view";
import { categories, getCategory, getListing } from "@/lib/catalog";

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/categorie/[slug]">): Promise<Metadata> {
  const category = getCategory((await params).slug);
  return category ? { title: category.name, description: category.description } : {};
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/categorie/[slug]">) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const basePath = `/categorie/${category.slug}`;
  const result = await getListing({ category: category.slug }, await searchParams, basePath);

  return (
    <ListingView
      result={result}
      basePath={basePath}
      title={category.name}
      description={category.description}
      breadcrumbs={[{ label: category.name }]}
      showDeviceHint
    />
  );
}
