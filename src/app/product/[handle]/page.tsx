import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductGrid } from "@/components/product/product-card";
import { ProductMain } from "@/components/product/product-main";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { getCategory, getProduct, getProducts, getRelatedProducts } from "@/lib/catalog";
import { deviceIdsOf, describeRequirements, isCompatible } from "@/lib/catalog/compatibility";
import { deviceBrands, devices, getDevice } from "@/lib/catalog/devices";
import type { Device, Product } from "@/lib/catalog/types";

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ handle: p.handle }));
}

export async function generateMetadata({ params }: PageProps<"/product/[handle]">): Promise<Metadata> {
  const product = await getProduct((await params).handle);
  if (!product) return {};
  return {
    title: `${product.brand} ${product.title}`,
    description: product.description.slice(0, 155),
    openGraph: { images: product.images[0] ? [{ url: product.images[0].url }] : [] },
  };
}

function compatibleDevices(product: Product): Device[] {
  if (product.compatibility.kind === "device") {
    const ids = deviceIdsOf(product);
    return devices.filter((d) => ids.includes(d.id));
  }
  return devices.filter((d) => isCompatible(product, d));
}

export default async function ProductPage({ params, searchParams }: PageProps<"/product/[handle]">) {
  const product = await getProduct((await params).handle);
  if (!product) notFound();

  const sp = await searchParams;
  const urlDeviceId = typeof sp.toestel === "string" && getDevice(sp.toestel) ? sp.toestel : undefined;
  const urlColor = typeof sp.kleur === "string" ? sp.kleur : undefined;

  const category = getCategory(product.category)!;
  const related = await getRelatedProducts(product, urlDeviceId);
  const fits = compatibleDevices(product);
  const requirements = describeRequirements(product);
  const note = product.compatibility.kind === "rules" ? product.compatibility.note : undefined;

  const specs = [
    { label: "Merk", value: product.brand },
    { label: "Type", value: product.productType },
    ...(product.material && !product.specs.some((s) => s.label === "Materiaal")
      ? [{ label: "Materiaal", value: product.material }]
      : []),
    ...(product.magsafe !== undefined && !product.specs.some((s) => /magsafe/i.test(s.label))
      ? [{ label: "MagSafe-compatibel", value: product.magsafe ? "Ja" : "Nee" }]
      : []),
    ...product.specs,
  ];

  return (
    <div className="container-shop pt-4 pb-24 lg:pt-6 lg:pb-8">
      <Breadcrumbs
        items={[
          { label: category.name, href: `/categorie/${category.slug}` },
          { label: product.title },
        ]}
      />

      <div className="mt-4">
        <ProductMain product={product} urlDeviceId={urlDeviceId} urlColor={urlColor} categoryName={category.singular} />
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-10">
        <div className="space-y-10">
          <section aria-labelledby="beschrijving">
            <h2 id="beschrijving" className="mb-3 text-xl font-bold">
              Beschrijving
            </h2>
            <p className="leading-relaxed text-ink-soft">{product.description}</p>
          </section>

          <section aria-labelledby="specificaties">
            <h2 id="specificaties" className="mb-3 text-xl font-bold">
              Specificaties
            </h2>
            <dl className="divide-y divide-line overflow-hidden rounded-md border border-line">
              {specs.map((s, i) => (
                <div key={`${s.label}-${i}`} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 px-4 py-2.5 text-sm odd:bg-surface">
                  <dt className="font-medium text-ink">{s.label}</dt>
                  <dd className="text-ink-soft">{s.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <section aria-labelledby="compatibiliteit">
          <h2 id="compatibiliteit" className="mb-3 text-xl font-bold">
            Compatibiliteit
          </h2>
          <div className="rounded-md border border-line p-4">
            {product.compatibility.kind === "device" ? (
              <p className="text-sm text-ink-soft">
                Dit product is gemaakt voor de exacte maten van onderstaande modellen. Kies bij het bestellen het juiste
                toestel; het past niet op andere modellen.
              </p>
            ) : (
              <>
                {requirements.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-5 text-sm text-ink-soft">
                    {requirements.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-ink-soft">
                    Voor dit product zijn nog geen compatibiliteitsgegevens vastgelegd.
                  </p>
                )}
                {note && <p className="mt-3 text-sm text-ink-soft">{note}</p>}
              </>
            )}
            {fits.length > 0 && (
              <div className="mt-4 space-y-3 border-t border-line pt-4">
                {deviceBrands.map((brand) => {
                  const list = fits.filter((d) => d.brandSlug === brand.slug);
                  if (list.length === 0) return null;
                  return (
                    <div key={brand.slug}>
                      <p className="mb-1.5 text-sm font-semibold">Geschikt voor {brand.name}</p>
                      <ul className="flex flex-wrap gap-1.5">
                        {list.map((d) => (
                          <li
                            key={d.id}
                            className="rounded border border-line bg-surface px-2 py-0.5 text-xs text-ink-soft"
                          >
                            {d.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="bijpassend" className="mt-14">
          <h2 id="bijpassend" className="mb-4 text-xl font-bold">
            Bijpassende accessoires
            {urlDeviceId && <span className="font-normal text-ink-soft"> voor {getDevice(urlDeviceId)?.name}</span>}
          </h2>
          <ProductGrid products={related} className="lg:grid-cols-4" />
        </section>
      )}
    </div>
  );
}
