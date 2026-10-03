/**
 * Centrale datatypes van de Casezo-catalogus.
 *
 * Deze types zijn bewust los van de databron gehouden: de lokale
 * voorbeeldcatalogus en de Shopify-integratie leveren allebei exact deze
 * vormen aan, zodat pagina's en componenten niet weten waar data vandaan komt.
 */

/** Bedrag in eurocenten, om afrondingsfouten te voorkomen. */
export type Cents = number;

export type CategorySlug =
  | "telefoonhoesjes"
  | "screenprotectors"
  | "opladers"
  | "kabels"
  | "houders"
  | "powerbanks";

export type Category = {
  slug: CategorySlug;
  name: string;
  /** Enkelvoudige naam, bv. voor kruimels of kaartlabels. */
  singular: string;
  description: string;
  /**
   * Toestelgebonden categorieën (hoesjes, screenprotectors) passen alleen bij
   * het exacte model. Andere categorieën gebruiken compatibiliteitsregels.
   */
  deviceSpecific: boolean;
};

/* ------------------------------------------------------------------ */
/* Toestellen                                                          */
/* ------------------------------------------------------------------ */

export type Connector = "usb-c" | "lightning";

/** Eigenschappen van een toestel waar accessoires op kunnen leunen. */
export type DeviceFeature =
  /** Magnetische uitlijning (MagSafe of Qi2 met magneten). */
  | "magsafe"
  /** Draadloos laden volgens de Qi-standaard. */
  | "qi";

/** Bekabelde snellaadstandaarden die een toestel ondersteunt. */
export type ChargingStandard = "usb-pd" | "pps";

export type DeviceBrand = {
  slug: string;
  name: string;
};

export type Device = {
  /** Stabiele sleutel, ook gebruikt in URL's (?toestel=…) en in Shopify-metafields. */
  id: string;
  brandSlug: string;
  name: string;
  /** Serie voor groepering in menu's, bv. "iPhone 17-serie". */
  series: string;
  releaseYear: number;
  connector: Connector;
  features: DeviceFeature[];
  charging: ChargingStandard[];
  /** Breedte van het toestel in millimeters, voor klemhouders. */
  widthMm: number;
};

/* ------------------------------------------------------------------ */
/* Producten                                                           */
/* ------------------------------------------------------------------ */

export type ProductImage = {
  url: string;
  alt: string;
  width: number;
  height: number;
};

export type ProductOption = {
  /** Weergavenaam, bv. "Toestel", "Kleur" of "Lengte". */
  name: string;
  values: string[];
};

/** Vaste optienamen die de winkel herkent. */
export const DEVICE_OPTION = "Toestel";
export const COLOR_OPTION = "Kleur";

export type ColorValue = {
  name: string;
  /** Kleurcode voor stalen en filters. */
  hex: string;
};

export type ProductVariant = {
  id: string;
  sku?: string;
  /** Leesbare naam, bv. "iPhone 16 / Zwart". */
  title: string;
  price: Cents;
  /** Doorgestreepte prijs alleen als de bron die echt aanlevert. */
  compareAtPrice?: Cents;
  availableForSale: boolean;
  /** Alleen bekend als de bron voorraadaantallen deelt. */
  quantityAvailable?: number;
  selectedOptions: Record<string, string>;
  /** Exact toestel voor toestelgebonden varianten. */
  deviceId?: string;
  color?: ColorValue;
  /** Index in product.images van de eerste foto voor deze variant. */
  imageIndex?: number;
};

/**
 * Compatibiliteit van een product.
 *
 * - `device`: het product (of de variant) is gemaakt voor exacte modellen.
 * - `rules`: expliciete technische eisen. Een toestel past alleen als het
 *   aan ALLE opgegeven eisen voldoet. Een regelset zonder eisen past nergens
 *   bij: universeel geschikt wordt nooit aangenomen.
 */
export type Compatibility =
  | { kind: "device" }
  | {
      kind: "rules";
      /** Toestel moet één van deze aansluitingen hebben. */
      connectorsAny?: Connector[];
      /** Toestel moet al deze eigenschappen hebben. */
      featuresAll?: DeviceFeature[];
      /** Toestel moet minstens één van deze laadstandaarden ondersteunen. */
      chargingAny?: ChargingStandard[];
      /** Toestelbreedte moet binnen dit bereik vallen (klemhouders). */
      widthMm?: { min: number; max: number };
      /** Korte toelichting voor de klant, bv. "USB-C-kabel inbegrepen". */
      note?: string;
    };

export type ProductSpec = { label: string; value: string };

export type Product = {
  id: string;
  handle: string;
  title: string;
  /** Productmerk (fabrikant van het accessoire). */
  brand: string;
  brandSlug: string;
  category: CategorySlug;
  /** Soort product binnen de categorie, bv. "Bookcase" of "Gehard glas". */
  productType: string;
  description: string;
  highlights: string[];
  specs: ProductSpec[];
  material?: string;
  /** Alleen gezet als het relevant is (hoesjes, laders, houders, powerbanks). */
  magsafe?: boolean;
  images: ProductImage[];
  options: ProductOption[];
  variants: ProductVariant[];
  compatibility: Compatibility;
  /** ISO-datum, gebruikt voor sorteren op nieuwste. */
  createdAt: string;
  featured: boolean;
  tags: string[];
};

export type ProductBrand = {
  slug: string;
  name: string;
  productCount: number;
  categories: CategorySlug[];
};
