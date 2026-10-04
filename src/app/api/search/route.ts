import { NextResponse } from "next/server";

import { categories, getListing } from "@/lib/catalog";
import { normalize } from "@/lib/catalog/search";

export type SearchSuggestions = {
  query: string;
  total: number;
  device: { name: string; href: string } | null;
  categories: { name: string; href: string }[];
  products: {
    id: string;
    title: string;
    brand: string;
    href: string;
    price: number;
    priceFrom: boolean;
    image: string | null;
  }[];
};

/** Suggesties voor de zoekbalk: producten, categorieën en een herkend toestel. */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim().slice(0, 100) ?? "";
  if (q.length < 2) {
    return NextResponse.json<SearchSuggestions>({ query: q, total: 0, device: null, categories: [], products: [] });
  }

  const result = await getListing({ search: true }, { q }, "/zoeken");
  const terms = normalize(q).split(" ").filter((t) => t.length >= 3);
  const matchedCategories = categories
    .filter((c) => terms.some((t) => normalize(`${c.name} ${c.singular}`).includes(t)))
    .map((c) => ({
      name: c.name,
      href: result.detectedDevice
        ? `/categorie/${c.slug}?toestel=${result.detectedDevice.id}`
        : `/categorie/${c.slug}`,
    }));

  return NextResponse.json<SearchSuggestions>({
    query: q,
    total: result.total,
    device: result.detectedDevice
      ? {
          name: result.detectedDevice.name,
          href: `/toestel/${result.detectedDevice.brandSlug}/${result.detectedDevice.id}`,
        }
      : null,
    categories: matchedCategories,
    products: result.items.slice(0, 5).map((p) => ({
      id: p.id,
      title: p.title,
      brand: p.brand,
      href: p.href,
      price: p.price,
      priceFrom: p.priceFrom,
      image: p.image?.url ?? null,
    })),
  });
}
