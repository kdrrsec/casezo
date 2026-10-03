import Link from "next/link";

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
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="container-shop grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-soft">{storeConfig.tagline}</p>
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
            ...categories.map((c) => ({ label: c.name, href: `/categorie/${c.slug}` })),
            { label: "Alle merken", href: "/merken" },
          ]}
        />
        <FooterColumn
          title="Per toestel"
          links={deviceBrands.map((b) => ({ label: `${b.name}-accessoires`, href: `/toestel/${b.slug}` }))}
        />
        <FooterColumn title="Klantenservice" links={[...service, ...legal]} />
      </div>
      <div className="border-t border-line">
        <div className="container-shop flex flex-col gap-2 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {company.legalName ?? storeConfig.name}
            {company.kvk && ` · KvK ${company.kvk}`}
            {company.vat && ` · Btw ${company.vat}`}
          </p>
          <p>Prijzen in euro&apos;s, inclusief btw.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-bold">{title}</h2>
      <ul className="space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-ink-soft hover:text-primary hover:underline">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
