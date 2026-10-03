import type { Metadata } from "next";

import { ContentPage } from "@/components/ui/content-page";
import { Placeholder } from "@/components/ui/placeholder";
import { ServiceNav } from "@/components/ui/service-nav";

export const metadata: Metadata = { title: "Algemene voorwaarden (concept)", robots: { index: false } };

const sections = [
  { title: "Identiteit van de ondernemer", todo: "bedrijfsnaam, adres, KvK-nummer, btw-nummer en contactgegevens." },
  { title: "Toepasselijkheid", todo: "op welke aanbiedingen en overeenkomsten de voorwaarden van toepassing zijn." },
  { title: "Aanbod en overeenkomst", todo: "hoe het aanbod tot stand komt en wanneer de overeenkomst gesloten is." },
  { title: "Prijzen en betaling", todo: "prijzen, betaalmethoden en betalingstermijnen." },
  { title: "Levering", todo: "levertermijnen, verzendgebied en wat er gebeurt bij vertraging." },
  { title: "Herroepingsrecht", todo: "bedenktijd, uitzonderingen, retourprocedure en terugbetaling." },
  { title: "Garantie en conformiteit", todo: "garantievoorwaarden en de wettelijke conformiteit." },
  { title: "Klachten en geschillen", todo: "klachtenprocedure en eventuele geschillenregeling." },
];

export default function TermsPage() {
  return (
    <ContentPage
      title="Algemene voorwaarden"
      breadcrumbs={[{ label: "Klantenservice", href: "/klantenservice" }, { label: "Algemene voorwaarden" }]}
      aside={<ServiceNav current="/algemene-voorwaarden" />}
    >
      <Placeholder>
        Dit is een conceptopzet, geen definitieve juridische tekst. Laat de algemene voorwaarden opstellen of
        controleren voordat de winkel live gaat.
      </Placeholder>
      {sections.map((s, i) => (
        <section key={s.title}>
          <h2>
            Artikel {i + 1}. {s.title}
          </h2>
          <Placeholder>{s.todo}</Placeholder>
        </section>
      ))}
    </ContentPage>
  );
}
