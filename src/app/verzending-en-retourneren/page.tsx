import type { Metadata } from "next";

import { ContentPage } from "@/components/ui/content-page";
import { ConfigValue, Placeholder } from "@/components/ui/placeholder";
import { ServiceNav } from "@/components/ui/service-nav";
import { storeConfig } from "@/config/store";

export const metadata: Metadata = { title: "Verzending en retourneren" };

export default function ShippingPage() {
  const { shipping, returns } = storeConfig;
  return (
    <ContentPage
      title="Verzending en retourneren"
      intro="Hier lees je hoe je bestelling bij je komt en hoe je een product kunt terugsturen."
      breadcrumbs={[{ label: "Klantenservice", href: "/klantenservice" }, { label: "Verzending en retourneren" }]}
      aside={<ServiceNav current="/verzending-en-retourneren" />}
    >
      <h2>Verzending</h2>
      <dl className="grid grid-cols-[minmax(8rem,auto)_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="font-medium">Vervoerder</dt>
        <dd>
          <ConfigValue value={shipping.carrier} label="vervoerder" />
        </dd>
        <dt className="font-medium">Verzendkosten</dt>
        <dd>
          <ConfigValue value={shipping.costs} label="verzendkosten" />
        </dd>
        <dt className="font-medium">Verwerking</dt>
        <dd>
          <ConfigValue value={shipping.dispatch} label="wanneer bestellingen worden verzonden" />
        </dd>
        <dt className="font-medium">Verzendlanden</dt>
        <dd>
          <ConfigValue value={shipping.countries} label="landen waarnaar verzonden wordt" />
        </dd>
      </dl>
      <p className="mt-4">
        Bestellingen worden door Casezo zelf ingepakt en verstuurd vanuit eigen voorraad. De definitieve verzendkosten
        zie je bij het afrekenen, voordat je betaalt.
      </p>

      <h2>Retourneren</h2>
      <p>
        Als consument heb je bij een aankoop op afstand wettelijk het recht om binnen 14 dagen na ontvangst zonder opgave
        van reden af te zien van de koop.
      </p>
      <dl className="grid grid-cols-[minmax(8rem,auto)_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="font-medium">Bedenktijd Casezo</dt>
        <dd>
          <ConfigValue value={returns.periodDays === null ? null : `${returns.periodDays} dagen`} label="retourtermijn" />
        </dd>
        <dt className="font-medium">Retourkosten</dt>
        <dd>
          <ConfigValue value={returns.costs} label="wie de retourkosten betaalt" />
        </dd>
        <dt className="font-medium">Retouradres</dt>
        <dd>
          <ConfigValue value={returns.address} label="retouradres of -procedure" />
        </dd>
      </dl>
      <Placeholder>
        volledige retourprocedure (aanmelden, staat van het product, terugbetaling en uitzonderingen zoals geopende
        screenprotectors). Laat deze tekst juridisch controleren.
      </Placeholder>
    </ContentPage>
  );
}
