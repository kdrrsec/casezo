import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { OpenPickerButton } from "@/components/device/open-picker-button";
import { storeConfig } from "@/config/store";
import { categories, deviceBrands } from "@/lib/catalog";

import { Logo } from "./logo";

const service = [
  { label: "Klantenservice", href: "/klantenservice" },
  { label: "Contact", href: "/contact" },
  { label: "Veelgestelde vragen", href: "/veelgestelde-vragen" },
  { label: "Verzending en retourneren", href: "/verzending-en-retourneren" },
];

const legal = [
  { label: "Privacyverklaring", href: "/privacy" },
  { label: "Algemene voorwaarden", href: "/algemene-voorwaarden" },
];

export function SiteFooter() {
  const { company, contact } = storeConfig;
  return (
    <footer className="mt-20">
      <div className="container-shop">
        <div className="band-dark relative -mb-12 flex flex-col gap-5 overflow-hidden rounded-3xl px-6 py-8 text-white sm:px-10 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-2xl font-extrabold tracking-tight">
              Twijfel je of iets past?
            </p>
            <p className="mt-1 text-[0.9375rem] text-white/75">
              Kies je toestel en zie alleen wat erop past, of stel ons je vraag.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <OpenPickerButton className="btn h-11 bg-white px-5 text-ink hover:bg-white/90" />
            <Link
              href="/contact"
              className="btn h-11 border border-white/30 px-5 text-white hover:bg-white/10"
            >
              Neem contact op
              <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-line bg-surface pt-12">
        <div className="container-shop grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-soft">
              {storeConfig.tagline}
            </p>
            {(contact.email || contact.phone) && (
              <ul className="mt-4 space-y-1 text-sm">
                {contact.email && (
                  <li>
                    <a className="link" href={`mailto:${contact.email}`}>
                      {contact.email}
                    </a>
                  </li>
                )}
                {contact.phone && <li>{contact.phone}</li>}
              </ul>
            )}
          </div>

          <FooterColumn
            title="Assortiment"
            links={[
              ...categories.map((c) => ({
                label: c.name,
                href: `/categorie/${c.slug}`,
              })),
              { label: "Alle merken", href: "/merken" },
            ]}
          />
          <FooterColumn
            title="Per toestel"
            links={deviceBrands.map((b) => ({
              label: `${b.name}-accessoires`,
              href: `/toestel/${b.slug}`,
            }))}
          />
          <FooterColumn title="Klantenservice" links={[...service, ...legal]} />
        </div>
        <div className="border-t border-line">
          <div className="container-shop flex flex-col gap-2 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()}{" "}
              {company.legalName ?? storeConfig.name}
              {company.kvk && ` · KvK ${company.kvk}`}
              {company.vat && ` · Btw ${company.vat}`}
            </p>
            <p>Prijzen in euro&apos;s, inclusief btw.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-bold">{title}</h2>
      <ul className="space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-ink-soft hover:text-primary hover:underline"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
