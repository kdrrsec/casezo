# Casezo webshop

Nederlandstalige webshop voor telefoonhoesjes en telefoonaccessoires. Gebouwd met Next.js (App Router), TypeScript,
Tailwind CSS en Lucide-iconen.

Zonder Shopify-configuratie draait de winkel als volledig werkende demonstratie met een lokale voorbeeldcatalogus
(35 producten van fictieve merken). Met Shopify-configuratie gebruikt dezelfde code de echte catalogus, de Shopify-zoekfunctie,
de Shopify-winkelmand en de Shopify-checkout. Er is geen eigen betaalverwerking.

## Snel starten

```bash
npm install
npm run dev        # http://localhost:3000
```

Overige scripts:

| Script              | Doel                                        |
| ------------------- | ------------------------------------------- |
| `npm run build`     | Productiebuild                              |
| `npm start`         | Productieserver na een build                |
| `npm run lint`      | ESLint                                      |
| `npm run typecheck` | Routetypes genereren en TypeScript checken  |

## Pagina's

| Route                            | Inhoud                                                         |
| -------------------------------- | -------------------------------------------------------------- |
| `/`                              | Homepage: banner, toestelkeuze, categorieën, uitgelicht, merken |
| `/categorie/[slug]`              | Categorieoverzicht met filters en sortering                     |
| `/merken`, `/merk/[slug]`        | Merkenoverzicht en productmerkpagina's                          |
| `/toestel/[merk]`                | Accessoires per telefoonmerk, met modelkeuze                    |
| `/toestel/[merk]/[toestel]`      | Alles wat past bij één toestel                                  |
| `/zoeken?q=…`                    | Zoekresultaten (herkent ook toestellen, bv. "hoesje iphone 16") |
| `/product/[handle]`              | Productdetail met varianten, voorraad en compatibiliteit        |
| `/winkelmand`                    | Winkelmand en doorgang naar de Shopify-checkout                 |
| `/klantenservice`, `/contact`, `/veelgestelde-vragen`, `/verzending-en-retourneren` | Service |
| `/privacy`, `/algemene-voorwaarden` | Conceptopzetten, duidelijk gemarkeerd als nog in te vullen   |

Alle filter-, zoek- en sorteertoestand staat in de URL (`?toestel=iphone-16&kleur=zwart&sort=prijs-oplopend`),
dus links zijn deelbaar en de terugknop werkt.

## Projectstructuur

```
src/
  app/                    Routes (Server Components) en /api/cart
  components/             UI; client components alleen waar interactie nodig is
  config/store.ts         Winkelgegevens (contact, bedrijf, verzending, retour)
  lib/catalog/            Centrale cataloguslaag
    types.ts              Datamodel (product, variant, toestel, compatibiliteit)
    devices.ts            Toestelregister (merken, modellen, aansluiting, MagSafe, laadstandaarden)
    compatibility.ts      Wat past bij welk toestel
    listing.ts            Filters, facetten, sortering en URL-parameters
    search.ts             Lokale zoekfunctie met toestelherkenning
    source.ts             Kiest tussen Shopify en voorbeelddata
    demo-data.ts          Voorbeeldcatalogus
    index.ts              Publieke API voor pagina's
  lib/shopify/            Storefront API-client, queries en mapping
  lib/cart/               Winkelmand: demo (cookie) en Shopify (Cart API)
```

Pagina's praten alleen met `@/lib/catalog` en `@/lib/cart`. Het vervangen van de voorbeelddata door Shopify vraagt dus
geen wijzigingen in pagina's of componenten.

## Toestelkeuze en compatibiliteit

- **Toestelgebonden** producten (hoesjes, screenprotectors) hebben per variant een exact toestel. Ze verschijnen alleen bij
  dat model.
- **Overige** producten gebruiken expliciete regels: aansluiting (`connectorsAny`), vereiste functies (`featuresAll`,
  bv. MagSafe of Qi), laadstandaard (`chargingAny`, USB PD of PPS) en toestelbreedte (`widthMm`, voor klemhouders).
  Een product zonder regels past bij **geen** toestel; universele geschiktheid wordt nooit aangenomen.
- Het gekozen toestel wordt in `localStorage` bewaard en bovenaan elke pagina getoond (wijzigen of wissen kan altijd).
- Op een productpagina wordt nooit automatisch een ander model gekozen als het gekozen toestel niet beschikbaar is.

Een merk of model toevoegen: voeg het toe in `src/lib/catalog/devices.ts`. Menu's, filters en toestelkeuze tonen
alleen modellen waarvoor producten bestaan.

## Shopify koppelen

1. Installeer in Shopify-admin het **Headless**-kanaal en maak een storefront aan. Je krijgt een publieke en een
   privé Storefront-token.
2. Zorg dat de Storefront-toegang leesrechten heeft voor producten, productlabels en collecties, en lees-/schrijfrechten
   voor winkelmand en checkout (in Shopify: `unauthenticated_read_product_listings`, `unauthenticated_read_product_tags`,
   `unauthenticated_read_collection_listings`, `unauthenticated_read_checkouts`, `unauthenticated_write_checkouts`).
   Controleer de actuele namen in de Shopify-documentatie. Maak de metafields hieronder toegankelijk voor de Storefront API.
3. Kopieer `.env.example` naar `.env.local` en vul `SHOPIFY_STORE_DOMAIN` en `SHOPIFY_STOREFRONT_PRIVATE_TOKEN` in.

De token wordt uitsluitend server-side gebruikt (`server-only`); er is geen `NEXT_PUBLIC_`-variabele. Verzoeken gaan naar
`https://{winkel}.myshopify.com/api/{versie}/graphql.json` met de header `Shopify-Storefront-Private-Token`
(winkelmandverzoeken sturen ook `Shopify-Storefront-Buyer-IP` mee). Standaardversie: `2026-10`.

### Hoe Shopify-data wordt gelezen

| Casezo-veld          | Shopify-bron                                                                 |
| -------------------- | ---------------------------------------------------------------------------- |
| Categorie            | Metafield `casezo.category`, anders collectie met handle gelijk aan de categorie (`telefoonhoesjes`, `screenprotectors`, `opladers`, `kabels`, `houders`, `powerbanks`) |
| Productmerk          | `vendor`                                                                     |
| Type product         | `productType`                                                                |
| Toestel per variant  | Variant-metafield `casezo.device` (bv. `iphone-16`), anders optie "Toestel"/"Model" met de modelnaam, anders product-metafield `casezo.device` |
| Kleur                | Optie "Kleur"/"Color" (met Shopify-kleurstaal indien ingesteld)              |
| Compatibiliteitsregels | Metafield `casezo.compatibility` (JSON), bv. `{"connectorsAny":["usb-c"],"chargingAny":["usb-pd"],"note":"Kabel niet inbegrepen."}` |
| Materiaal / MagSafe  | `casezo.material` (tekst), `casezo.magsafe` (boolean)                        |
| Specificaties        | `casezo.specs` (JSON: `[{"label":"Dikte","value":"1,4 mm"}]`)                 |
| Kenmerken            | `casezo.highlights` (lijst van tekst)                                        |
| Uitgelicht           | `casezo.featured` (boolean)                                                  |

Producten zonder herkenbare categorie worden niet getoond. Zoeken gebruikt de Shopify `search`-query voor relevantie,
waarna dezelfde filters en toestelregels worden toegepast. De catalogus wordt gecachet (`SHOPIFY_REVALIDATE_SECONDS`,
standaard 300 seconden). De winkelmand gebruikt `cartCreate`, `cartLinesAdd`, `cartLinesUpdate` en `cartLinesRemove`;
afrekenen gaat via `checkoutUrl`.

## Huisstijl aanpassen

- **Accentkleur**: wijzig `--color-primary` in `src/app/globals.css`; hover- en lichte tinten worden automatisch afgeleid.
- **Logo**: `public/brand/casezo-logo.png` (transparant, gebruikt in header en footer via
  `src/components/layout/logo.tsx`). Het favicon (`src/app/icon.png`, `src/app/apple-icon.png`) is de "C" uit het logo.

## Productbeelden van de voorbeeldcatalogus

De voorbeeldproducten hebben fotorealistische 3D-renders (studiolicht, siliconen, leer, transparant, glas), gemaakt
per toestelmerk en kleur. Ze staan in `public/products/` en worden gemaakt met `scripts/product-renders/`:

```bash
npx tsx scripts/product-renders/specs.ts > /tmp/specs.json            # alle opnamen
npx tsx scripts/product-renders/specs.ts --missing > /tmp/specs.json  # alleen ontbrekende
node scripts/product-renders/render.mjs /tmp/specs.json
```

Met Shopify gebruikt de winkel automatisch de productfoto's uit Shopify. Leveranciers en merken stellen vaak
officiële productfoto's beschikbaar; gebruik die alleen als je er toestemming voor hebt.

## Nog in te vullen door de eigenaar

Alles in `src/config/store.ts` dat `null` is, wordt tijdens ontwikkeling (`npm run dev`) gemarkeerd als
**Nog in te vullen**. Op de live site worden ontbrekende gegevens weggelaten in plaats van gemarkeerd; zet
`NEXT_PUBLIC_SHOW_OWNER_NOTES=1` om de markeringen ook online te zien. Het gaat om:
contactgegevens, bedrijfsgegevens (KvK, btw, adres), verzendkosten en -proces, retourbeleid. De privacyverklaring en
algemene voorwaarden zijn bewust alleen een opzet; laat ze juridisch opstellen of controleren.

De website toont geen reviews, keurmerken, verkoopaantallen, kortingen, gratis verzending of leverbeloftes. Voeg zulke
claims pas toe als ze kloppen.
