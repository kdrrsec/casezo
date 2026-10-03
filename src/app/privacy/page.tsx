import type { Metadata } from "next";

import { ContentPage } from "@/components/ui/content-page";
import Link from "next/link";

import { Placeholder, showOwnerNotes } from "@/components/ui/placeholder";
import { ServiceNav } from "@/components/ui/service-nav";

export const metadata: Metadata = { title: "Privacyverklaring", robots: { index: false } };

const sections = [
  { title: "Wie is verantwoordelijk", todo: "naam, adres en contactgegevens van de verwerkingsverantwoordelijke." },
  { title: "Welke gegevens we verwerken", todo: "overzicht van persoonsgegevens (bijv. naam, adres, e-mail, bestelgegevens)." },
  { title: "Waarom we gegevens verwerken", todo: "doelen en grondslagen per verwerking (uitvoering overeenkomst, wettelijke plicht, etc.)." },
  { title: "Delen met derden", todo: "verwerkers zoals Shopify, betaalprovider en vervoerder, en eventuele doorgifte buiten de EER." },
  { title: "Bewaartermijnen", todo: "hoe lang welke gegevens worden bewaard." },
  { title: "Cookies en lokale opslag", todo: "gebruikte cookies en hun doel. De website gebruikt nu een functionele cookie voor de winkelmand en lokale opslag om je gekozen toestel te onthouden." },
  { title: "Je rechten", todo: "inzage, correctie, verwijdering, bezwaar, dataportabiliteit en klachtrecht bij de Autoriteit Persoonsgegevens." },
];

export default function PrivacyPage() {
  return (
    <ContentPage
      title="Privacyverklaring"
      breadcrumbs={[{ label: "Klantenservice", href: "/klantenservice" }, { label: "Privacyverklaring" }]}
      aside={<ServiceNav current="/privacy" />}
    >
      <Placeholder>
        Dit is een conceptopzet, geen definitieve juridische tekst. Laat de privacyverklaring opstellen of controleren
        voordat de winkel live gaat.
      </Placeholder>
      <h2>Cookies en lokale opslag</h2>
      <p>
        Deze website gebruikt een functionele cookie om je winkelmand te onthouden en lokale opslag in je browser om het
        toestel te onthouden dat je hebt gekozen. Deze gegevens worden niet gebruikt voor advertenties.
      </p>
      {!showOwnerNotes && (
        <p>
          De volledige privacyverklaring wordt binnenkort op deze pagina gepubliceerd. Heb je nu een vraag over je
          gegevens? <Link href="/contact" className="link">Neem contact met ons op</Link>.
        </p>
      )}
      {sections.map((s, i) => (
        <section key={s.title}>
          {showOwnerNotes && (
            <h2>
              {i + 1}. {s.title}
            </h2>
          )}
          <Placeholder>{s.todo}</Placeholder>
        </section>
      ))}
    </ContentPage>
  );
}
