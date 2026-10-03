import type { Metadata } from "next";
import Link from "next/link";

import { ContentPage } from "@/components/ui/content-page";
import { InfoList, Placeholder } from "@/components/ui/placeholder";
import { ServiceNav } from "@/components/ui/service-nav";
import { storeConfig } from "@/config/store";

export const metadata: Metadata = { title: "Verzending en retourneren" };

export default function ShippingPage() {
  const { shipping, returns } = storeConfig;
  return (
    <ContentPage
      title="Verzending en retourneren"
      intro="Hoe je bestelling bij je komt en hoe je een product terugstuurt."
      breadcrumbs={[{ label: "Klantenservice", href: "/klantenservice" }, { label: "Verzending en retourneren" }]}
      aside={<ServiceNav current="/verzending-en-retourneren" />}
    >
      <h2>Verzending</h2>
      <p>
        We pakken je bestelling zelf in en versturen hem vanuit onze eigen voorraad. De verzendkosten zie je bij het
        afrekenen, voordat je betaalt.
      </p>
      <InfoList
        rows={[
          { label: "Vervoerder", value: shipping.carrier, todo: "vervoerder" },
          { label: "Verzendkosten", value: shipping.costs, todo: "verzendkosten" },
          { label: "Verwerking", value: shipping.dispatch, todo: "wanneer bestellingen worden verzonden" },
          { label: "Verzendlanden", value: shipping.countries, todo: "landen waarnaar verzonden wordt" },
        ]}
      />

      <h2>Retourneren</h2>
      <p>
        Als consument heb je bij een aankoop op afstand het recht om binnen 14 dagen na ontvangst zonder opgave van reden
        af te zien van de koop. Neem voor een retour eerst <Link href="/contact" className="link">contact</Link> met ons op.
      </p>
      <InfoList
        rows={[
          {
            label: "Retourtermijn",
            value: returns.periodDays === null ? null : `${returns.periodDays} dagen`,
            todo: "retourtermijn",
          },
          { label: "Retourkosten", value: returns.costs, todo: "wie de retourkosten betaalt" },
          { label: "Retouradres", value: returns.address, todo: "retouradres of -procedure" },
        ]}
      />
      <Placeholder>
        volledige retourprocedure (aanmelden, staat van het product, terugbetaling en uitzonderingen zoals geopende
        screenprotectors). Laat deze tekst juridisch controleren.
      </Placeholder>
    </ContentPage>
  );
}
