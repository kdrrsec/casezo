import { CircleHelp, FileText, Mail, Shield, Smartphone, Truck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export const metadata: Metadata = {
  title: "Klantenservice",
  description: "Hulp bij je bestelling, verzending, retourneren en het kiezen van het juiste accessoire.",
  alternates: { canonical: "/klantenservice" },
};

const tiles = [
  { href: "/contact", icon: Mail, title: "Contact", text: "Stel je vraag rechtstreeks aan ons." },
  { href: "/veelgestelde-vragen", icon: CircleHelp, title: "Veelgestelde vragen", text: "Antwoorden over passen, laden en bestellen." },
  { href: "/verzending-en-retourneren", icon: Truck, title: "Verzending en retourneren", text: "Hoe je bestelling bij je komt en hoe retourneren werkt." },
  { href: "/toestel/apple", icon: Smartphone, title: "Hulp bij toestelkeuze", text: "Vind accessoires per merk en model." },
  { href: "/privacy", icon: Shield, title: "Privacyverklaring", text: "Hoe we met je gegevens omgaan." },
  { href: "/algemene-voorwaarden", icon: FileText, title: "Algemene voorwaarden", text: "De voorwaarden voor bestellingen." },
];

export default function CustomerServicePage() {
  return (
    <div className="container-shop pt-4 pb-8 lg:pt-6">
      <Breadcrumbs items={[{ label: "Klantenservice" }]} />
      <h1 className="mt-3 text-2xl font-bold tracking-tight lg:text-[1.75rem]">Klantenservice</h1>
      <p className="mt-2 max-w-2xl text-[0.9375rem] text-ink-soft">
        Waarmee kunnen we je helpen? Kies een onderwerp hieronder.
      </p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map(({ href, icon: Icon, title, text }) => (
          <li key={href}>
            <Link href={href} className="flex h-full gap-4 rounded-md border border-line bg-white p-5 hover:border-primary">
              <Icon className="size-6 shrink-0 text-primary" strokeWidth={1.75} aria-hidden />
              <span>
                <span className="block font-semibold">{title}</span>
                <span className="mt-1 block text-sm text-ink-soft">{text}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
