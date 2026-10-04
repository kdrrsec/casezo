import {
  ArrowRight,
  Check,
  Magnet,
  PackageCheck,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import heroImage from "../../public/brand/hero-accessoires.webp";

import { categoryImages, categoryTints } from "@/config/category-images";
import { JsonLd } from "@/components/seo/json-ld";
import { storeConfig } from "@/config/store";
import { absoluteUrl } from "@/lib/site";
import { DeviceSelector } from "@/components/device/device-selector";
import { ProductGrid } from "@/components/product/product-card";
import { slugify } from "@/lib/catalog/colors";
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

  // Kleuren van de telefoonhoesjes in het assortiment, met het aantal hoesjes per kleur.
  const colorCounts = new Map<
    string,
    { name: string; slug: string; hex: string; count: number }
  >();
  for (const product of products.filter(
    (p) => p.category === "telefoonhoesjes",
  )) {
    const names = new Set<string>();
    for (const v of product.variants) {
      if (!v.color || names.has(v.color.name)) continue;
      names.add(v.color.name);
      const slug = slugify(v.color.name);
      const entry = colorCounts.get(slug) ?? {
        name: v.color.name,
        slug,
        hex: v.color.hex,
        count: 0,
      };
      entry.count += 1;
      colorCounts.set(slug, entry);
    }
  }
  const caseColors = [...colorCounts.values()].sort(
    (a, b) => b.count - a.count,
  );

  return (
    <div className="space-y-14 pb-4 lg:space-y-20">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: storeConfig.company.legalName ?? storeConfig.name,
            url: absoluteUrl("/"),
            logo: absoluteUrl("/brand/casezo-logo.png"),
            ...(storeConfig.contact.email
              ? { email: storeConfig.contact.email }
              : {}),
          },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: storeConfig.name,
            url: absoluteUrl("/"),
            potentialAction: {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate: `${absoluteUrl("/zoeken")}?q={search_term_string}`,
              },
              "query-input": "required name=search_term_string",
            },
          },
        ]}
      />
      {/* 1. Hero */}
      <section className="container-shop pt-4 lg:pt-6">
        <div className="hero-bg relative grid items-center overflow-hidden rounded-3xl md:grid-cols-[0.85fr_1.15fr]">
          <div className="relative px-6 pt-9 md:py-12 lg:px-12">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold tracking-wide text-primary-hover uppercase">
              <Sparkles className="size-3.5" strokeWidth={2.25} aria-hidden />
              Hoesjes en accessoires
            </p>
            <h1 className="mt-4 text-[2rem] leading-[1.08] font-extrabold tracking-tight text-ink sm:text-[2.6rem] lg:text-5xl">
              Accessoires die bij{" "}
              <span className="relative inline-block whitespace-nowrap text-primary-hover">
                jouw telefoon
                <svg
                  viewBox="0 0 200 12"
                  preserveAspectRatio="none"
                  className="absolute -bottom-1.5 left-0 h-2.5 w-full text-primary/45"
                  aria-hidden
                >
                  <path
                    d="M2 9C40 3 120 1 198 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>{" "}
              passen
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-ink-soft">
              Hoesjes, screenprotectors, opladers en meer, geselecteerd op het
              exacte model van je toestel.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/categorie/telefoonhoesjes"
                className="btn btn-primary h-12 px-6 shadow-pop"
              >
                Bekijk het assortiment
                <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
              </Link>
              <a
                href="#toestelkeuze"
                className="btn btn-secondary h-12 border-transparent px-6"
              >
                <Smartphone className="size-4" strokeWidth={2} aria-hidden />
                Kies je toestel
              </a>
            </div>
            <p className="mt-6 flex items-center gap-2 text-sm text-ink-soft">
              <Check
                className="size-4 text-primary"
                strokeWidth={2.5}
                aria-hidden
              />
              Voor iPhone en Samsung Galaxy
            </p>
          </div>
          <div className="relative px-4 pt-4 pb-6 md:py-8 md:pr-8 md:pl-0">
            <Image
              src={heroImage}
              alt="Telefoonhoesjes, screenprotector, oplader, autohouder, autolader, kabel en oordopjes"
              preload
              fetchPriority="high"
              quality={90}
              sizes="(min-width: 1280px) 720px, (min-width: 768px) 58vw, 100vw"
              className="h-auto w-full"
            />
            <HeroChip icon={Magnet} className="top-[8%] left-[6%]" delay="0s">
              MagSafe
            </HeroChip>
            <HeroChip
              icon={Zap}
              className="right-[6%] bottom-[12%]"
              delay="-1.6s"
            >
              USB-C snelladen
            </HeroChip>
            <HeroChip
              icon={ShieldCheck}
              className="top-[4%] right-[10%] hidden sm:flex"
              delay="-3.2s"
            >
              Gehard glas
            </HeroChip>
          </div>
        </div>
      </section>

      {/* 2. Toestelkeuze */}
      <section
        id="toestelkeuze"
        aria-labelledby="toestelkeuze-titel"
        className="band-dark scroll-mt-4 py-10 text-white lg:py-14"
      >
        <div className="container-shop">
          <div className="mb-6 max-w-2xl">
            <p className="text-sm font-semibold tracking-wide text-[#7fd6e6] uppercase">
              In drie stappen
            </p>
            <h2
              id="toestelkeuze-titel"
              className="mt-1 text-[1.75rem] font-extrabold tracking-tight sm:text-3xl"
            >
              Welke telefoon heb je?
            </h2>
            <p className="mt-2 text-[0.9375rem] text-white/75">
              Kies je toestel en we laten alleen accessoires zien die erop
              passen.
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 text-ink shadow-pop lg:p-7">
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
                  <ArrowRight
                    className="size-3.5"
                    strokeWidth={2}
                    aria-hidden
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Categorieën */}
      <section aria-labelledby="categorieen" className="reveal container-shop">
        <SectionHeading
          id="categorieen"
          eyebrow="Assortiment"
          title="Shop per categorie"
        />
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {categoryTiles.map(({ category, count, image }) => (
            <li key={category.slug}>
              <Link
                href={`/categorie/${category.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-pop"
                style={{ backgroundColor: categoryTints[category.slug] }}
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={image}
                    alt=""
                    fill
                    quality={90}
                    sizes="(min-width: 1280px) 200px, (min-width: 1024px) 16vw, (min-width: 640px) 30vw, 48vw"
                    className="object-cover mix-blend-multiply transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 px-3.5 pt-1 pb-3.5">
                  <span>
                    <span className="block leading-tight font-bold">
                      {category.name}
                    </span>
                    <span className="text-xs text-ink-soft">
                      {count} producten
                    </span>
                  </span>
                  <span className="hidden size-8 shrink-0 items-center justify-center rounded-full bg-white/80 sm:flex text-ink transition-colors group-hover:bg-primary group-hover:text-white">
                    <ArrowRight
                      className="size-4"
                      strokeWidth={2}
                      aria-hidden
                    />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 4. Uitgelichte producten */}
      <section aria-labelledby="uitgelicht" className="reveal container-shop">
        <SectionHeading
          id="uitgelicht"
          eyebrow="Uit ons assortiment"
          title="Uitgelicht"
          link={{
            href: "/categorie/telefoonhoesjes",
            label: "Alle producten bekijken",
          }}
        />
        <ProductGrid products={featured} className="lg:grid-cols-4" />
      </section>

      {/* 5. Hoesjes per kleur */}
      {caseColors.length > 0 && (
        <section aria-labelledby="kleuren" className="reveal container-shop">
          <div className="rounded-3xl bg-surface px-5 py-8 sm:px-8 lg:px-10">
            <SectionHeading
              id="kleuren"
              eyebrow="Telefoonhoesjes"
              title="Kies je kleur"
            />
            <ul className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:gap-4 sm:overflow-visible">
              {caseColors.map((color) => (
                <li key={color.slug} className="snap-start">
                  <Link
                    href={`/categorie/telefoonhoesjes?kleur=${color.slug}`}
                    className="group flex w-[5.5rem] flex-col items-center gap-2 rounded-2xl bg-white px-2 pt-4 pb-3 text-center transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-pop"
                  >
                    <span
                      className="size-12 rounded-full ring-4 ring-white outline-1 -outline-offset-1 outline-black/10 transition-transform duration-300 group-hover:scale-110"
                      style={{
                        background:
                          color.slug === "transparant"
                            ? "linear-gradient(135deg, #f4f7fb 0%, #dfe6ee 45%, #ffffff 55%, #cfd8e3 100%)"
                            : color.hex,
                      }}
                      aria-hidden
                    />
                    <span className="text-sm leading-tight font-semibold">
                      {color.name}
                    </span>
                    <span className="text-xs text-muted">
                      {color.count} {color.count === 1 ? "hoesje" : "hoesjes"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* 6. Merken */}
      <section aria-labelledby="merken" className="reveal">
        <div className="container-shop">
          <SectionHeading
            id="merken"
            eyebrow="Bestaande merken"
            title="Onze merken"
            link={{ href: "/merken", label: "Alle merken" }}
          />
        </div>
        <div className="marquee overflow-hidden border-y border-primary-line bg-primary-soft py-5">
          <div className="marquee-track flex w-max">
            {[0, 1].map((copy) => (
              <ul
                key={copy}
                className="flex shrink-0 items-center"
                aria-hidden={copy === 1 || undefined}
              >
                {brands.map((b) => (
                  <li key={b.slug} className="flex items-center">
                    <Link
                      href={`/merk/${b.slug}`}
                      tabIndex={copy === 1 ? -1 : undefined}
                      className="px-6 text-2xl font-extrabold tracking-tight text-ink/80 transition-colors hover:text-primary sm:text-3xl"
                    >
                      {b.name}
                    </Link>
                    <span className="text-primary/50" aria-hidden>
                      ✦
                    </span>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Over Casezo */}
      <section aria-labelledby="over" className="reveal container-shop">
        <div className="grid gap-8 rounded-3xl border border-line p-6 lg:grid-cols-[1fr_2fr] lg:p-10">
          <div>
            <p className="text-sm font-semibold tracking-wide text-primary-hover uppercase">
              Waarom Casezo
            </p>
            <h2
              id="over"
              className="mt-1 text-2xl font-extrabold tracking-tight"
            >
              Over Casezo
            </h2>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-soft">
              Casezo is een webwinkel voor telefoonhoesjes en accessoires van
              bestaande merken. We kopen ons assortiment zelf in en versturen je
              bestelling zelf.
            </p>
          </div>
          <ul className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: Smartphone,
                tint: "#dff1f4",
                title: "Passend bij je toestel",
                text: "Hoesjes en screenprotectors tonen we alleen bij het exacte model waarvoor ze gemaakt zijn.",
              },
              {
                icon: ShieldCheck,
                tint: "#e9e5fb",
                title: "Duidelijke compatibiliteit",
                text: "Bij laders, kabels en houders staat welke aansluiting of functie je toestel nodig heeft.",
              },
              {
                icon: PackageCheck,
                tint: "#ffeedb",
                title: "Eigen voorraad",
                text: "We verkopen wat we zelf op voorraad hebben en tonen de voorraad per uitvoering.",
              },
            ].map(({ icon: Icon, tint, title, text }) => (
              <li key={title}>
                <span
                  className="flex size-12 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: tint }}
                >
                  <Icon
                    className="size-6 text-ink"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </span>
                <h3 className="mt-3 font-bold">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                  {text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}


function SectionHeading({
  id,
  eyebrow,
  title,
  link,
}: {
  id: string;
  eyebrow: string;
  title: string;
  link?: { href: string; label: string };
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <p className="text-sm font-semibold tracking-wide text-primary-hover uppercase">
          {eyebrow}
        </p>
        <h2 id={id} className="mt-0.5 text-2xl font-extrabold tracking-tight">
          {title}
        </h2>
      </div>
      {link && (
        <Link
          href={link.href}
          className="group inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          {link.label}
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-0.5"
            strokeWidth={2}
            aria-hidden
          />
        </Link>
      )}
    </div>
  );
}

function HeroChip({
  icon: Icon,
  className,
  delay,
  children,
}: {
  icon: LucideIcon;
  className: string;
  delay: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`float absolute flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-ink shadow-pop sm:text-sm ${className}`}
      style={{ animationDelay: delay }}
      aria-hidden
    >
      <span className="flex size-5 items-center justify-center rounded-full bg-primary text-white">
        <Icon className="size-3" strokeWidth={2.5} />
      </span>
      {children}
    </span>
  );
}
