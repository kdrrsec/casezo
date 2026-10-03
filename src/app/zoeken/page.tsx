import type { Metadata } from "next";

import { ListingView } from "@/components/listing/listing-view";
import { getListing } from "@/lib/catalog";

export async function generateMetadata({ searchParams }: PageProps<"/zoeken">): Promise<Metadata> {
  const q = (await searchParams).q;
  const term = Array.isArray(q) ? q[0] : q;
  return { title: term ? `Zoekresultaten voor "${term}"` : "Zoeken", robots: { index: false } };
}

export default async function SearchPage({ searchParams }: PageProps<"/zoeken">) {
  const result = await getListing({ search: true }, await searchParams, "/zoeken");
  const title = result.query ? `Zoekresultaten voor "${result.query}"` : "Zoeken";

  return (
    <ListingView
      result={result}
      basePath="/zoeken"
      title={title}
      description={
        result.detectedDevice
          ? `Alleen producten die passen bij de ${result.detectedDevice.name}.`
          : result.query
            ? undefined
            : "Typ in de zoekbalk waar je naar zoekt, bijvoorbeeld \"hoesje iPhone 16\" of \"USB-C kabel\"."
      }
      breadcrumbs={[{ label: "Zoeken" }]}
    />
  );
}
