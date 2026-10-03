import { demoProducts, type DemoImageKind } from "@/lib/catalog/demo-data";
import { renderDemoImage } from "@/lib/catalog/demo-images";

/** Productillustraties voor de voorbeeldcatalogus, statisch gegenereerd. */
export const dynamic = "force-static";

const files = new Set(demoProducts.flatMap((p) => p.images.map((img) => img.url.split("/").pop()!)));

export function generateStaticParams() {
  return [...files].map((file) => ({ file }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const match = /^([a-z]+)_([a-z]+)_([0-9a-f]{6})_([12])\.svg$/.exec(file);
  if (!files.has(file) || !match) return new Response("Niet gevonden", { status: 404 });

  const [, kind, brand, hex, view] = match;
  return new Response(renderDemoImage(kind as DemoImageKind, brand, hex, Number(view)), {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
