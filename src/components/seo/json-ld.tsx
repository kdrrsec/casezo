/** Gestructureerde data (schema.org) voor zoekmachines. */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // `<` escapen voorkomt dat tekst uit de catalogus de script-tag kan afsluiten.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
