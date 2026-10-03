import { ChevronDown } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ContentPage } from "@/components/ui/content-page";
import { Placeholder, showOwnerNotes } from "@/components/ui/placeholder";
import { ServiceNav } from "@/components/ui/service-nav";

export const metadata: Metadata = { title: "Veelgestelde vragen" };

type Faq = { q: string; a: React.ReactNode; ownerTodo?: boolean };

const groups: { title: string; items: Faq[] }[] = [
  {
    title: "Het juiste accessoire vinden",
    items: [
      {
        q: "Hoe weet ik welk hoesje bij mijn telefoon past?",
        a: (
          <p>
            Hoesjes en screenprotectors worden gemaakt voor één exact model. Kies je toestel via &quot;Kies je
            toestel&quot; bovenaan de pagina; je ziet dan alleen producten die precies passen. Een hoesje voor de
            iPhone 16 past bijvoorbeeld niet op de iPhone 16 Pro.
          </p>
        ),
      },
      {
        q: "Hoe vind ik het exacte model van mijn telefoon?",
        a: (
          <p>
            Op een iPhone vind je het model via Instellingen › Algemeen › Info. Op een Samsung via Instellingen › Over
            de telefoon.
          </p>
        ),
      },
      {
        q: "Wat betekent MagSafe-compatibel?",
        a: (
          <p>
            MagSafe-accessoires hechten magnetisch aan de achterkant van je toestel. Dit werkt alleen bij toestellen
            met ingebouwde magneten (zoals iPhone 12 en nieuwer) of met een hoesje met magneetring. Bij elk product
            staat of het MagSafe vereist.
          </p>
        ),
      },
      {
        q: "Werkt elke oplader met mijn telefoon?",
        a: (
          <p>
            Niet altijd even snel. Snelladen werkt alleen als oplader én toestel dezelfde laadstandaard ondersteunen,
            zoals USB Power Delivery of PPS. Kijk bij &quot;Compatibiliteit&quot; op de productpagina welke standaard
            nodig is en of er een kabel is meegeleverd.
          </p>
        ),
      },
      {
        q: "Welke kabel heb ik nodig?",
        a: (
          <p>
            iPhone 15 en nieuwer en de meeste Android-toestellen hebben een USB-C-aansluiting. Oudere iPhones (zoals de
            iPhone 13) gebruiken Lightning. Filter in de categorie <Link className="link" href="/categorie/kabels">Kabels</Link> op
            je toestel om alleen passende kabels te zien.
          </p>
        ),
      },
    ],
  },
  {
    title: "Bestellen en betalen",
    items: [
      {
        q: "Welke betaalmethoden kan ik gebruiken?",
        a: <Placeholder>beschikbare betaalmethoden (worden ingesteld in Shopify Payments of de gekozen betaalprovider).</Placeholder>,
        ownerTodo: true,
      },
      {
        q: "Wanneer wordt mijn bestelling verzonden?",
        a: (
          <p>
            Zie <Link className="link" href="/verzending-en-retourneren">Verzending en retourneren</Link>.
          </p>
        ),
      },
      {
        q: "Kan ik mijn bestelling nog wijzigen?",
        a: <Placeholder>beleid voor het wijzigen of annuleren van bestellingen.</Placeholder>,
        ownerTodo: true,
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <ContentPage
      title="Veelgestelde vragen"
      breadcrumbs={[{ label: "Klantenservice", href: "/klantenservice" }, { label: "Veelgestelde vragen" }]}
      aside={<ServiceNav current="/veelgestelde-vragen" />}
    >
      {groups.map((group) => (
        <section key={group.title}>
          <h2>{group.title}</h2>
          <div className="divide-y divide-line rounded-md border border-line">
            {group.items.filter((item) => !item.ownerTodo || showOwnerNotes).map((item) => (
              <details key={item.q} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5 font-semibold text-ink [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <ChevronDown className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180" strokeWidth={2} aria-hidden />
                </summary>
                <div className="px-4 pb-4 text-sm [&_p]:mb-0">{item.a}</div>
              </details>
            ))}
          </div>
        </section>
      ))}
    </ContentPage>
  );
}
