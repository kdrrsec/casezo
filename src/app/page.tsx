import { ArrowRight, PackageCheck, ShieldCheck, Smartphone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import heroImage from "../../public/brand/hero-accessoires.webp";

import { categoryImages } from "@/config/category-images";
import { JsonLd } from "@/components/seo/json-ld";
import { storeConfig } from "@/config/store";
import { absoluteUrl } from "@/lib/site";
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

  const categoryTiles = categories.map((category) => ({
    category,
    count: products.filter((p) => p.category === category.slug).length,
    image: categoryImages[category.slug],
  }));

  return (
    <div className="space-y-12 pb-4 lg:space-y-16">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: storeConfig.company.legalName ?? storeConfig.name,
            url: absoluteUrl("/"),
            logo: absoluteUrl("/brand/casezo-logo.png"),
            ...(storeConfig.contact.email ? { email: storeConfig.contact.email } : {}),
          },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: storeConfig.name,
            url: absoluteUrl("/"),
            potentialAction: {
              "@type": "SearchAction",
              target: { "@type": "EntryPoint", urlTemplate: `${absoluteUrl("/zoeken")}?q={search_term_string}` },
              "query-input": "required name=search_term_string",
            },
          },
        ]}
      />
      {/* 1. Promotiebanner */}
      <section className="container-shop pt-4 lg:pt-6">
        <div className="grid items-center overflow-hidden rounded-lg bg-[#e8f1f3] md:grid-cols-[0.85fr_1.15fr]">
          <div className="px-6 pt-8 md:py-10 lg:px-12">
            <p className="text-sm font-semibold tracking-wide text-primary-hover uppercase">Hoesjes en accessoires</p>
            <h1 className="mt-2 text-[1.75rem] leading-tight font-bold tracking-tight text-ink sm:text-[2.125rem]">
              Accessoires die bij jouw telefoon passen
            </h1>
            <p className="mt-3 max-w-md text-[0.9375rem] leading-relaxed text-ink-soft">
              Hoesjes, screenprotectors, opladers en meer, geselecteerd op het exacte model van je toestel.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/categorie/telefoonhoesjes" className="btn btn-primary h-11 px-5">
                Bekijk het assortiment
                <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
              </Link>
              <a href="#toestelkeuze" className="btn btn-secondary h-11 px-5">
                Kies je toestel
              </a>
            </div>
          </div>
          <div className="px-4 pt-4 pb-6 md:py-8 md:pr-8 md:pl-0">
            <Image
              src={heroImage}
              alt="Telefoonhoesjes, screenprotector, oplader, autohouder, autolader, kabel en oordopjes"
              preload
              fetchPriority="high"
              quality={90}
              sizes="(min-width: 1280px) 720px, (min-width: 768px) 58vw, 100vw"
              className="h-auto w-full"
            />
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
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4 text-sm">
            <span className="text-muted">Direct naar:</span>
            {deviceMenu.map(({ brand }) => (
              <Link
                key={brand.slug}
                href={`/toestel/${brand.slug}`}
                className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
              >
                Alle {brand.name}-accessoires
                <ArrowRight className="size-3.5" strokeWidth={2} aria-hidden />
              </Link>
            ))}
          </div>
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
                <div className="relative aspect-[3/4] overflow-hidden bg-[#f9f9f9]">
                  <Image
                    src={image}
                    alt=""
                    fill
                    quality={90}
                    sizes="(min-width: 1280px) 200px, (min-width: 1024px) 16vw, (min-width: 640px) 30vw, 48vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
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

      {/* 5. Merken */}
      <section aria-labelledby="merken" className="container-shop">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 id="merken" className="text-xl font-bold tracking-tight">
            Onze merken
          </h2>
          <Link href="/merken" className="text-sm font-semibold text-primary hover:underline">
            Alle merken
          </Link>
        </div>
        <ul className="flex flex-wrap gap-2.5">
          {brands.map((b) => (
            <li key={b.slug}>
              <Link
                href={`/merk/${b.slug}`}
                className="block rounded-full border border-line bg-white px-5 py-2.5 text-[0.9375rem] font-semibold tracking-tight text-ink transition-colors hover:border-primary hover:text-primary"
              >
                {b.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 6. Over Casezo */}
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
