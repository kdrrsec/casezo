import { Mail, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ContentPage } from "@/components/ui/content-page";
import { InfoList, Placeholder } from "@/components/ui/placeholder";
import { ServiceNav } from "@/components/ui/service-nav";
import { storeConfig } from "@/config/store";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  const { contact, company } = storeConfig;
  return (
    <ContentPage
      title="Contact"
      intro="Heb je een vraag over een product, je bestelling of welk accessoire bij je telefoon past? We helpen je graag."
      breadcrumbs={[{ label: "Klantenservice", href: "/klantenservice" }, { label: "Contact" }]}
      aside={<ServiceNav current="/contact" />}
    >
      {(contact.email || contact.phone) && (
        <div className="not-prose mb-6 grid gap-3 sm:grid-cols-2">
          {contact.email && (
            <a href={`mailto:${contact.email}`} className="flex items-center gap-3 rounded-md border border-line p-4 hover:border-primary">
              <Mail className="size-5 text-primary" strokeWidth={1.75} aria-hidden />
              <span>
                <span className="block text-sm text-muted">E-mail</span>
                <span className="font-semibold">{contact.email}</span>
              </span>
            </a>
          )}
          {contact.phone && (
            <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="flex items-center gap-3 rounded-md border border-line p-4 hover:border-primary">
              <Phone className="size-5 text-primary" strokeWidth={1.75} aria-hidden />
              <span>
                <span className="block text-sm text-muted">Telefoon</span>
                <span className="font-semibold">{contact.phone}</span>
              </span>
            </a>
          )}
        </div>
      )}
      {!contact.email && !contact.phone && (
        <Placeholder>
          e-mailadres en/of telefoonnummer voor klantvragen. Vul deze in via <code>src/config/store.ts</code>.
        </Placeholder>
      )}

      {contact.hours && (
        <>
          <h2>Bereikbaarheid</h2>
          <p>{contact.hours}</p>
        </>
      )}

      <h2>Voordat je contact opneemt</h2>
      <p>
        Gaat je vraag over een bestelling, vermeld dan je bestelnummer. Twijfel je of een product past? Noem het exacte
        model van je telefoon, bijvoorbeeld &quot;iPhone 16 Pro&quot; of &quot;Galaxy S25 Ultra&quot;. Veel antwoorden
        vind je ook bij de <Link href="/veelgestelde-vragen" className="link">veelgestelde vragen</Link>.
      </p>

      <InfoList
        title="Bedrijfsgegevens"
        rows={[
          { label: "Bedrijfsnaam", value: company.legalName, todo: "officiële bedrijfsnaam" },
          { label: "Adres", value: company.address, todo: "vestigingsadres" },
          { label: "KvK-nummer", value: company.kvk, todo: "KvK-nummer" },
          { label: "Btw-nummer", value: company.vat, todo: "btw-identificatienummer" },
        ]}
      />
    </ContentPage>
  );
}
