import { ArrowRight, PackageCheck, ShieldCheck, Smartphone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { DeviceSelector } from "@/components/device/device-selector";
import { ProductGrid } from "@/components/product/product-card";
import {
  categories,
  getDeviceMenu,
  getFeaturedProducts,
  getProductBrands,
  getProducts,
} from "@/lib/catalog";

export default async function HomePage() {
  const [products, featured, deviceMenu, brands] = await Promise.all([
    getProducts(),
    getFeaturedProducts(8),
    getDeviceMenu(),
    getProductBrands(),
  ]);

  const categoryTiles = categories.map((category) => {
    const inCategory = products.filter((p) => p.category === category.slug);
    const lead = inCategory.find((p) => p.featured) ?? inCategory[0];
    return { category, count: inCategory.length, image: lead?.images[0] };
  });
  const bannerImages = featured
    .map((p) => p.image)
    .filter((img): img is NonNullable<typeof img> => Boolean(img))
    .slice(0, 3);

  return (
    <div className="space-y-12 pb-4 lg:space-y-16">
      {/* 1. Promotiebanner */}
      <section className="container-shop pt-4 lg:pt-6">
        <div className="grid items-center overflow-hidden rounded-lg bg-primary text-white md:grid-cols-[1.2fr_1fr]">
          <div className="px-6 py-7 lg:px-10 lg:py-9">
            <h1 className="text-2xl leading-tight font-bold tracking-tight sm:text-3xl">
              Accessoires die bij jouw telefoon passen
            </h1>
            <p className="mt-2 max-w-md text-[0.9375rem] text-white/85">
              Hoesjes, screenprotectors, opladers en meer, geselecteerd op het exacte model van je toestel.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/categorie/telefoonhoesjes" className="btn bg-white text-primary hover:bg-white/90">
                Bekijk het assortiment
                <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
              </Link>
              <a href="#toestelkeuze" className="btn border border-white/40 text-white hover:bg-white/10">
                Kies je toestel
              </a>
            </div>
          </div>
          <div className="hidden h-full grid-cols-3 gap-2 p-4 md:grid lg:p-5">
            {bannerImages.map((img) => (
              <div key={img.url} className="relative aspect-[3/4] overflow-hidden rounded-md bg-white">
                <Image src={img.url} alt="" fill sizes="15vw" className="object-contain p-2" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Toestelkeuze */}
      <section id="toestelkeuze" aria-labelledby="toestelkeuze-titel" className="container-shop scroll-mt-4">
        <div className="rounded-lg border border-line bg-white p-5 shadow-card lg:p-7">
          <div className="mb-5 flex items-center gap-3">
            <Smartphone className="size-6 text-primary" strokeWidth={1.75} aria-hidden />
            <h2 id="toestelkeuze-titel" className="text-xl font-bold tracking-tight">
              Vind accessoires voor jouw telefoon
            </h2>
          </div>
          <DeviceSelector />
        </div>
      </section>

      {/* 3. Categorieën */}
      <section aria-labelledby="categorieen" className="container-shop">
        <h2 id="categorieen" className="mb-4 text-xl font-bold tracking-tight">
          Shop per categorie
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categoryTiles.map(({ category, count, image }) => (
            <li key={category.slug}>
              <Link
                href={`/categorie/${category.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-md border border-line bg-white hover:border-primary"
              >
                <div className="relative aspect-[4/3] bg-surface">
                  {image && (
                    <Image
                      src={image.url}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 15vw, (min-width: 640px) 30vw, 45vw"
                      className="object-contain p-3 transition-transform group-hover:scale-[1.03]"
                    />
                  )}
                </div>
                <div className="px-3 py-2.5">
                  <span className="block font-semibold group-hover:text-primary">{category.name}</span>
                  <span className="text-xs text-muted">{count} producten</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 4. Uitgelichte producten */}
      <section aria-labelledby="uitgelicht" className="container-shop">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 id="uitgelicht" className="text-xl font-bold tracking-tight">
            Uitgelicht
          </h2>
          <Link href="/categorie/telefoonhoesjes" className="text-sm font-semibold text-primary hover:underline">
            Alle producten bekijken
          </Link>
        </div>
        <ProductGrid products={featured} className="lg:grid-cols-4" />
      </section>

      {/* 5. Snelle links per telefoonmerk */}
      <section aria-labelledby="per-merk" className="bg-surface py-10 lg:py-12">
        <div className="container-shop">
          <h2 id="per-merk" className="mb-4 text-xl font-bold tracking-tight">
            Accessoires per telefoonmerk
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {deviceMenu.map(({ brand, series }) => (
              <div key={brand.slug} className="rounded-md border border-line bg-white p-5">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-lg font-bold">{brand.name}</h3>
                  <Link href={`/toestel/${brand.slug}`} className="text-sm font-semibold text-primary hover:underline">
                    Alle {brand.name}-accessoires
                  </Link>
                </div>
                <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
                  {series
                    .flatMap((s) => s.devices)
                    .map((d) => (
                      <li key={d.id}>
                        <Link
                          href={`/toestel/${brand.slug}/${d.id}`}
                          className="block py-1 text-sm text-ink-soft hover:text-primary hover:underline"
                        >
                          {d.name}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Merken */}
      <section aria-labelledby="merken" className="container-shop">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 id="merken" className="text-xl font-bold tracking-tight">
            Onze merken
          </h2>
          <Link href="/merken" className="text-sm font-semibold text-primary hover:underline">
            Alle merken
          </Link>
        </div>
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-3">
          {brands.map((b) => (
            <li key={b.slug}>
              <Link
                href={`/merk/${b.slug}`}
                className="flex h-20 flex-col items-center justify-center rounded-md border border-line bg-white px-3 text-center hover:border-primary"
              >
                <span className="text-lg font-bold tracking-tight">{b.name}</span>
                <span className="text-xs text-muted">{b.productCount} producten</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 7. Over Casezo */}
      <section aria-labelledby="over" className="container-shop">
        <div className="grid gap-8 rounded-lg border border-line p-6 lg:grid-cols-[1fr_2fr] lg:p-8">
          <div>
            <h2 id="over" className="text-xl font-bold tracking-tight">
              Over Casezo
            </h2>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">
              Casezo is een webwinkel voor telefoonhoesjes en accessoires van bestaande merken. We kopen ons
              assortiment zelf in en versturen je bestelling zelf.
            </p>
          </div>
          <ul className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: Smartphone,
                title: "Passend bij je toestel",
                text: "Hoesjes en screenprotectors tonen we alleen bij het exacte model waarvoor ze gemaakt zijn.",
              },
              {
                icon: ShieldCheck,
                title: "Duidelijke compatibiliteit",
                text: "Bij laders, kabels en houders staat welke aansluiting of functie je toestel nodig heeft.",
              },
              {
                icon: PackageCheck,
                title: "Eigen voorraad",
                text: "We verkopen wat we zelf op voorraad hebben en tonen de voorraad per uitvoering.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <Icon className="size-6 text-primary" strokeWidth={1.75} aria-hidden />
                <h3 className="mt-2 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-ink-soft">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
