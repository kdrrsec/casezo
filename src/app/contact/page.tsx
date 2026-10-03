import type { Metadata } from "next";

import { ContentPage } from "@/components/ui/content-page";
import { ConfigValue, Placeholder } from "@/components/ui/placeholder";
import { ServiceNav } from "@/components/ui/service-nav";
import { storeConfig } from "@/config/store";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  const { contact, company } = storeConfig;
  const missing = !contact.email && !contact.phone;
  return (
    <ContentPage
      title="Contact"
      intro="Heb je een vraag over een product, je bestelling of welk accessoire bij je telefoon past? Neem gerust contact op."
      breadcrumbs={[{ label: "Klantenservice", href: "/klantenservice" }, { label: "Contact" }]}
      aside={<ServiceNav current="/contact" />}
    >
      {missing && (
        <Placeholder>
          e-mailadres en/of telefoonnummer voor klantvragen. Vul deze in via <code>src/config/store.ts</code>.
        </Placeholder>
      )}
      <h2>Bereikbaarheid</h2>
      <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
        <dt className="font-medium">E-mail</dt>
        <dd>
          {contact.email ? (
            <a className="link" href={`mailto:${contact.email}`}>
              {contact.email}
            </a>
          ) : (
            <ConfigValue value={null} label="e-mailadres" />
          )}
        </dd>
        <dt className="font-medium">Telefoon</dt>
        <dd>
          <ConfigValue value={contact.phone} label="telefoonnummer" />
        </dd>
        <dt className="font-medium">Openingstijden</dt>
        <dd>
          <ConfigValue value={contact.hours} label="openingstijden klantenservice" />
        </dd>
      </dl>

      <h2>Bedrijfsgegevens</h2>
      <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
        <dt className="font-medium">Naam</dt>
        <dd>
          <ConfigValue value={company.legalName} label="officiële bedrijfsnaam" />
        </dd>
        <dt className="font-medium">Adres</dt>
        <dd>
          <ConfigValue value={company.address} label="vestigingsadres" />
        </dd>
        <dt className="font-medium">KvK-nummer</dt>
        <dd>
          <ConfigValue value={company.kvk} label="KvK-nummer" />
        </dd>
        <dt className="font-medium">Btw-nummer</dt>
        <dd>
          <ConfigValue value={company.vat} label="btw-identificatienummer" />
        </dd>
      </dl>

      <h2>Tip: vermeld je bestelling en toestel</h2>
      <p>
        Gaat je vraag over een bestelling, vermeld dan je bestelnummer. Twijfel je of een product past? Noem dan het
        exacte model van je telefoon, bijvoorbeeld &quot;iPhone 16 Pro&quot; of &quot;Galaxy S25 Ultra&quot;.
      </p>
    </ContentPage>
  );
}
