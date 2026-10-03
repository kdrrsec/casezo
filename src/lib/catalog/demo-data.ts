import { colorFor, slugify } from "./colors";
import { getDevice } from "./devices";
import {
  COLOR_OPTION,
  DEVICE_OPTION,
  type CategorySlug,
  type Cents,
  type Compatibility,
  type Product,
  type ProductImage,
  type ProductOption,
  type ProductSpec,
  type ProductVariant,
} from "./types";

/**
 * Voorbeeldcatalogus voor de demonstratie.
 *
 * De merken en productlijnen bestaan echt; prijzen, voorraad en varianten zijn
 * voorbeeldwaarden. Controleer specificaties bij de leverancier voordat je ze
 * als definitieve productinformatie gebruikt.
 * Productbeelden zijn 3D-renders (zie scripts/product-renders), zodat er
 * geen beeldmateriaal van derden wordt gebruikt.
 */

/** Soorten productopnamen die scripts/product-renders kan maken. */
export type DemoImageKind =
  | "hardcase"
  | "silicone"
  | "leather"
  | "clear"
  | "book"
  | "wallet"
  | "rugged"
  | "glass"
  | "privacy"
  | "lens"
  | "film"
  | "charger"
  | "dual"
  | "pps"
  | "wireless"
  | "stand"
  | "carcharger"
  | "cable"
  | "lightning"
  | "multi"
  | "vent"
  | "clamp"
  | "bike"
  | "desk"
  | "magpack"
  | "powerbank"
  | "minipack";

/** Beschrijving van één productopname, gebruikt door scripts/product-renders. */
export type DemoImageSpec = {
  kind: DemoImageKind;
  brand: string;
  color: string;
  view: number;
  magsafe?: boolean;
  big?: boolean;
};

/** Bestandsnaam van een opname in public/products. */
export function demoImageFile(spec: DemoImageSpec): string {
  const flags = `${spec.magsafe ? "-m" : ""}${spec.big ? "-xl" : ""}`;
  return `${spec.kind}-${spec.brand}-${spec.color.slice(1)}${flags}-${spec.view}.webp`;
}

type Def = {
  handle: string;
  title: string;
  brand: string;
  category: CategorySlug;
  productType: string;
  description: string;
  highlights: string[];
  specs: ProductSpec[];
  material?: string;
  magsafe?: boolean;
  compatibility: Compatibility;
  createdAt: string;
  featured?: boolean;
  price: Cents;
  compareAtPrice?: Cents;
  image: DemoImageKind;
  /** Grotere variant van het model (bv. 20.000 mAh). */
  imageBig?: boolean;
  /** Toestel-ID's voor toestelgebonden producten. */
  devices?: string[];
  colors?: string[];
  /** Extra optie, bv. lengte bij kabels, met optionele meerprijs. */
  extra?: { name: string; values: { value: string; surcharge?: Cents }[] };
  /** Varianten die uitverkocht zijn, als sleutel "toestel|kleur|extra" (lege delen weglaten). */
  soldOut?: string[];
  /** Beperkte voorraad per variant-sleutel. */
  lowStock?: Record<string, number>;
  tags?: string[];
};

/** Alle opnamen die de voorbeeldcatalogus gebruikt, per bestandsnaam. */
export const demoImageSpecs = new Map<string, DemoImageSpec>();

function registerImage(spec: DemoImageSpec): string {
  const file = demoImageFile(spec);
  demoImageSpecs.set(file, spec);
  return file;
}

function imagesFor(def: Def): { images: ProductImage[]; indexByKey: Map<string, number> } {
  const images: ProductImage[] = [];
  const indexByKey = new Map<string, number>();
  const colors = def.colors ?? ["Zwart"];
  // Voor hoesjes verschilt de camera-uitsparing per merk; per merk eigen beelden.
  const brands = def.devices
    ? [...new Set(def.devices.map((id) => getDevice(id)?.brandSlug ?? "x"))]
    : ["x"];
  for (const brand of brands) {
    for (const color of colors) {
      const hex = colorFor(color).hex.slice(1);
      indexByKey.set(`${brand}|${color}`, images.length);
      for (const view of [1, 2]) {
        images.push({
          url: `/products/${registerImage({
            kind: def.image,
            brand,
            color: `#${hex}`,
            view,
            magsafe: def.magsafe && brand !== "samsung",
            big: def.imageBig,
          })}`,
          alt: [def.title, def.colors ? color : null, view === 2 ? "ander aanzicht" : null]
            .filter(Boolean)
            .join(" – "),
          width: 1000,
          height: 1000,
        });
      }
    }
  }
  return { images, indexByKey };
}

function build(def: Def): Product {
  const deviceValues = def.devices ?? [undefined];
  const colorValues = def.colors ?? [undefined];
  const extraValues = def.extra?.values ?? [undefined];
  const { images, indexByKey } = imagesFor(def);

  const options: ProductOption[] = [];
  if (def.devices) {
    options.push({
      name: DEVICE_OPTION,
      values: def.devices.map((id) => getDevice(id)?.name ?? id),
    });
  }
  if (def.colors) options.push({ name: COLOR_OPTION, values: def.colors });
  if (def.extra) options.push({ name: def.extra.name, values: def.extra.values.map((v) => v.value) });

  const variants: ProductVariant[] = [];
  for (const deviceId of deviceValues) {
    for (const color of colorValues) {
      for (const extra of extraValues) {
        const device = getDevice(deviceId);
        const key = [deviceId, color, extra?.value].filter(Boolean).join("|");
        const selectedOptions: Record<string, string> = {};
        if (device) selectedOptions[DEVICE_OPTION] = device.name;
        if (color) selectedOptions[COLOR_OPTION] = color;
        if (extra && def.extra) selectedOptions[def.extra.name] = extra.value;

        const soldOut = def.soldOut?.includes(key) ?? false;
        const quantity = soldOut ? 0 : (def.lowStock?.[key] ?? 15);
        const brandKey = device?.brandSlug ?? "x";

        variants.push({
          id: `demo-${def.handle}-${slugify(key || "standaard")}`,
          sku: `CZ-${slugify(def.handle).slice(0, 12).toUpperCase()}-${variants.length + 1}`,
          title: Object.values(selectedOptions).join(" / ") || "Standaard",
          price: def.price + (extra?.surcharge ?? 0),
          compareAtPrice: def.compareAtPrice,
          availableForSale: quantity > 0,
          quantityAvailable: quantity,
          selectedOptions,
          deviceId: device?.id,
          color: color ? colorFor(color) : undefined,
          imageIndex: indexByKey.get(`${brandKey}|${color ?? "Zwart"}`) ?? 0,
        });
      }
    }
  }

  return {
    id: `demo-${def.handle}`,
    handle: def.handle,
    title: def.title,
    brand: def.brand,
    brandSlug: slugify(def.brand),
    category: def.category,
    productType: def.productType,
    description: def.description,
    highlights: def.highlights,
    specs: def.specs,
    material: def.material,
    magsafe: def.magsafe,
    images,
    options,
    variants,
    compatibility: def.compatibility,
    createdAt: def.createdAt,
    featured: def.featured ?? false,
    tags: def.tags ?? [],
  };
}

const deviceCompat: Compatibility = { kind: "device" };

const defs: Def[] = [
  /* -------------------------------------------------------------- */
  /* Telefoonhoesjes                                                 */
  /* -------------------------------------------------------------- */
  {
    handle: "spigen-ultra-hybrid-magfit",
    title: "Ultra Hybrid MagFit",
    brand: "Spigen",
    category: "telefoonhoesjes",
    productType: "Transparant hoesje",
    description:
      "Transparant hoesje met een stevige achterkant en een flexibele, schokdempende rand. De ingebouwde magneetring maakt het hoesje geschikt voor MagSafe-laders en -houders.",
    highlights: ["Ingebouwde MagSafe-magneten", "Transparante achterkant", "Verhoogde rand rond scherm en camera"],
    specs: [
      { label: "Materiaal", value: "Polycarbonaat achterkant, TPU-rand" },
      { label: "Draadloos laden", value: "Ja, via MagSafe en Qi" },
    ],
    material: "Polycarbonaat",
    magsafe: true,
    compatibility: deviceCompat,
    createdAt: "2026-09-19",
    featured: true,
    price: 2999,
    image: "clear",
    devices: ["iphone-17-pro-max", "iphone-17-pro", "iphone-17", "iphone-16-pro", "iphone-16"],
    colors: ["Transparant"],
    soldOut: ["iphone-16-pro|Transparant"],
    lowStock: { "iphone-17-pro-max|Transparant": 2 },
  },
  {
    handle: "spigen-silicone-fit-magfit",
    title: "Silicone Fit MagFit",
    brand: "Spigen",
    category: "telefoonhoesjes",
    productType: "Siliconen hoesje",
    description:
      "Siliconen hoesje met een zachte, grijpvaste afwerking en een microvezel binnenkant. Met magneetring voor MagSafe-accessoires.",
    highlights: ["Zachte siliconen afwerking", "Microvezel binnenkant", "MagSafe-compatibel"],
    specs: [
      { label: "Materiaal", value: "Siliconen, microvezel voering" },
      { label: "Draadloos laden", value: "Ja, via MagSafe en Qi" },
    ],
    material: "Siliconen",
    magsafe: true,
    compatibility: deviceCompat,
    createdAt: "2026-09-12",
    featured: true,
    price: 2999,
    image: "silicone",
    devices: ["iphone-17-pro", "iphone-17", "iphone-16-pro", "iphone-16", "iphone-15"],
    colors: ["Zwart", "Marineblauw", "Salie", "Zand"],
    soldOut: ["iphone-17-pro|Zand", "iphone-16|Salie", "iphone-15|Marineblauw"],
    lowStock: { "iphone-17|Zwart": 3 },
  },
  {
    handle: "spigen-wallet-s",
    title: "Wallet S Bookcase",
    brand: "Spigen",
    category: "telefoonhoesjes",
    productType: "Bookcase",
    description:
      "Bookcase van kunstleer met pasjesvakken en een magnetische sluiting. De klep is ook als standaard te gebruiken.",
    highlights: ["Pasjesvakken in de klep", "Magnetische sluiting", "Standaardfunctie"],
    specs: [
      { label: "Materiaal", value: "Kunstleer, TPU-houder" },
      { label: "Draadloos laden", value: "Zonder pasjes in de klep" },
    ],
    material: "Kunstleer",
    magsafe: false,
    compatibility: deviceCompat,
    createdAt: "2026-06-03",
    price: 2499,
    image: "book",
    devices: ["iphone-16", "iphone-15", "iphone-13", "galaxy-s25", "galaxy-s24"],
    colors: ["Zwart", "Bruin"],
    soldOut: ["iphone-13|Bruin"],
  },
  {
    handle: "spigen-thin-fit",
    title: "Thin Fit",
    brand: "Spigen",
    category: "telefoonhoesjes",
    productType: "Hardcase",
    description:
      "Dun en licht hardcase met een matte afwerking. Precies uitgesneden voor knoppen, poort en camera, voor wie zo min mogelijk extra dikte wil.",
    highlights: ["Dun en licht", "Matte afwerking", "Precies passende uitsparingen"],
    specs: [
      { label: "Materiaal", value: "Polycarbonaat" },
      { label: "Draadloos laden", value: "Ja (Qi)" },
    ],
    material: "Polycarbonaat",
    magsafe: false,
    compatibility: deviceCompat,
    createdAt: "2026-04-21",
    price: 1999,
    image: "hardcase",
    devices: ["galaxy-s25-ultra", "galaxy-s25", "galaxy-s24", "galaxy-a56"],
    colors: ["Zwart", "Blauw", "Groen"],
    soldOut: ["galaxy-a56|Groen"],
  },
  {
    handle: "otterbox-defender-magsafe",
    title: "Defender Series met MagSafe",
    brand: "OtterBox",
    category: "telefoonhoesjes",
    productType: "Schokbestendig hoesje",
    description:
      "Robuust, meerlaags hoesje voor wie extra bescherming wil bij vallen en stoten. Met magneten voor MagSafe-accessoires.",
    highlights: ["Meerlaagse bescherming", "Stevige hoeken", "MagSafe-compatibel"],
    specs: [
      { label: "Materiaal", value: "Synthetisch rubber en polycarbonaat" },
      { label: "Draadloos laden", value: "Ja, via MagSafe en Qi" },
    ],
    material: "Rubber",
    magsafe: true,
    compatibility: deviceCompat,
    createdAt: "2026-09-25",
    featured: true,
    price: 5999,
    image: "rugged",
    devices: ["iphone-17-pro-max", "iphone-17-pro", "iphone-16-pro"],
    colors: ["Zwart", "Grijs"],
    lowStock: { "iphone-17-pro|Grijs": 1 },
  },
  {
    handle: "spigen-liquid-crystal",
    title: "Liquid Crystal",
    brand: "Spigen",
    category: "telefoonhoesjes",
    productType: "Transparant hoesje",
    description:
      "Flexibel, transparant hoesje van TPU. Licht van gewicht, eenvoudig aan te brengen en met verhoogde randen rond scherm en camera.",
    highlights: ["Flexibel TPU", "Licht van gewicht", "Verhoogde randen"],
    specs: [
      { label: "Materiaal", value: "TPU" },
      { label: "Draadloos laden", value: "Ja (Qi)" },
    ],
    material: "TPU",
    magsafe: false,
    compatibility: deviceCompat,
    createdAt: "2026-02-10",
    price: 1499,
    image: "clear",
    devices: ["galaxy-s25-ultra", "galaxy-s25", "galaxy-a56", "iphone-15", "iphone-13"],
    colors: ["Transparant"],
  },
  {
    handle: "mujjo-full-leather-case-magsafe",
    title: "Full Leather Case met MagSafe",
    brand: "Mujjo",
    category: "telefoonhoesjes",
    productType: "Leren hoesje",
    description:
      "Leren hoesje dat mooi patineert naarmate je het gebruikt. Met magneten voor MagSafe-laders en -accessoires.",
    highlights: ["Echt leer", "Krijgt patina bij gebruik", "MagSafe-compatibel"],
    specs: [
      { label: "Materiaal", value: "Leer, microvezel voering" },
      { label: "Draadloos laden", value: "Ja, via MagSafe en Qi" },
    ],
    material: "Leer",
    magsafe: true,
    compatibility: deviceCompat,
    createdAt: "2026-09-29",
    featured: true,
    price: 5995,
    image: "leather",
    devices: ["iphone-17-pro-max", "iphone-17-pro", "iphone-air"],
    colors: ["Cognac", "Zwart", "Donkergroen"],
    soldOut: ["iphone-air|Donkergroen"],
  },
  {
    handle: "spigen-slim-armor-cs",
    title: "Slim Armor CS met pasjeshouder",
    brand: "Spigen",
    category: "telefoonhoesjes",
    productType: "Hoesje met pasjeshouder",
    description:
      "Slank hoesje met een verborgen pasjesvak aan de achterkant. Handig als je zonder portemonnee de deur uit wilt.",
    highlights: ["Verborgen pasjesvak", "Slank profiel", "Grijpvaste zijkanten"],
    specs: [
      { label: "Materiaal", value: "TPU en polycarbonaat" },
      { label: "Draadloos laden", value: "Niet met pasjes in het vak" },
    ],
    material: "TPU",
    magsafe: false,
    compatibility: deviceCompat,
    createdAt: "2026-05-14",
    price: 2499,
    image: "wallet",
    devices: ["iphone-16-pro", "iphone-16", "galaxy-a56"],
    colors: ["Zwart", "Roze"],
  },
  {
    handle: "pitaka-magez-case-iphone-air",
    title: "MagEZ Case",
    brand: "PITAKA",
    category: "telefoonhoesjes",
    productType: "Hardcase",
    description:
      "Ultradun hoesje van aramidevezel voor de iPhone Air, zodat het slanke profiel van je toestel behouden blijft. Met magneten voor MagSafe.",
    highlights: ["Aramidevezel", "Ultradun", "MagSafe-compatibel"],
    specs: [
      { label: "Materiaal", value: "Aramidevezel" },
      { label: "Draadloos laden", value: "Ja, via MagSafe en Qi" },
    ],
    material: "Aramidevezel",
    magsafe: true,
    compatibility: deviceCompat,
    createdAt: "2026-08-30",
    price: 5999,
    image: "hardcase",
    devices: ["iphone-air"],
    colors: ["Zwart", "Titanium"],
  },
  {
    handle: "samsung-silicone-case",
    title: "Silicone Case",
    brand: "Samsung",
    category: "telefoonhoesjes",
    productType: "Siliconen hoesje",
    description:
      "Siliconen hoesje met zachte voering, ontworpen voor Galaxy-toestellen. Beschermt tegen krassen en kleine stoten in het dagelijks gebruik.",
    highlights: ["Zachte voering", "Goede grip", "Ontworpen voor Galaxy"],
    specs: [
      { label: "Materiaal", value: "Siliconen" },
      { label: "Draadloos laden", value: "Ja (Qi)" },
    ],
    material: "Siliconen",
    magsafe: false,
    compatibility: deviceCompat,
    createdAt: "2026-03-18",
    price: 2999,
    image: "silicone",
    devices: ["galaxy-s25", "galaxy-s24"],
    colors: ["Lavendel", "Zwart", "Mint"],
    soldOut: ["galaxy-s24|Mint", "galaxy-s24|Lavendel"],
  },

  /* -------------------------------------------------------------- */
  /* Screenprotectors                                                */
  /* -------------------------------------------------------------- */
  {
    handle: "panzerglass-ultra-wide-fit",
    title: "Ultra-Wide Fit Screenprotector",
    brand: "PanzerGlass",
    category: "screenprotectors",
    productType: "Gehard glas",
    description:
      "Gehard glas dat het scherm tot dicht bij de rand bedekt. Met hulpmiddel om het glas recht en zonder luchtbellen aan te brengen.",
    highlights: ["Gehard glas", "Dekt bijna het hele scherm", "Inclusief aanbrenghulp"],
    specs: [
      { label: "Materiaal", value: "Gehard glas" },
      { label: "Hoesjevriendelijk", value: "Ja" },
    ],
    material: "Gehard glas",
    compatibility: deviceCompat,
    createdAt: "2026-09-15",
    featured: true,
    price: 2999,
    image: "glass",
    devices: [
      "iphone-17-pro-max",
      "iphone-17-pro",
      "iphone-17",
      "iphone-16-pro",
      "iphone-16",
      "iphone-15",
      "iphone-13",
    ],
    soldOut: ["iphone-13"],
  },
  {
    handle: "panzerglass-privacy-ultra-wide-fit",
    title: "Privacy Ultra-Wide Fit",
    brand: "PanzerGlass",
    category: "screenprotectors",
    productType: "Privacyglas",
    description:
      "Gehard glas met privacyfilter: van voren goed leesbaar, vanaf de zijkant donker. Handig in de trein of op kantoor.",
    highlights: ["Privacyfilter", "Gehard glas", "Inclusief aanbrenghulp"],
    specs: [
      { label: "Materiaal", value: "Gehard glas met privacyfilter" },
      { label: "Hoesjevriendelijk", value: "Ja" },
    ],
    material: "Gehard glas",
    compatibility: deviceCompat,
    createdAt: "2026-07-07",
    price: 3499,
    image: "privacy",
    devices: ["iphone-17-pro", "iphone-16-pro", "iphone-16", "galaxy-s25"],
  },
  {
    handle: "whitestone-dome-glass-s25-ultra",
    title: "Dome Glass",
    brand: "Whitestone",
    category: "screenprotectors",
    productType: "Gehard glas",
    description:
      "Gehard glas voor de Galaxy S25 Ultra dat met vloeibare lijm en een uv-lamp wordt aangebracht, voor een volledige hechting over het hele scherm.",
    highlights: ["Volledige hechting", "Werkt met de vingerafdruksensor", "Inclusief uv-lamp"],
    specs: [
      { label: "Materiaal", value: "Gehard glas" },
      { label: "Aanbrengen", value: "Met vloeibare lijm en uv-lamp" },
    ],
    material: "Gehard glas",
    compatibility: deviceCompat,
    createdAt: "2026-05-02",
    price: 4499,
    image: "glass",
    devices: ["galaxy-s25-ultra"],
    lowStock: { "galaxy-s25-ultra": 2 },
  },
  {
    handle: "spigen-neo-flex",
    title: "Neo Flex Screenfolie (2 stuks)",
    brand: "Spigen",
    category: "screenprotectors",
    productType: "Folie",
    description:
      "Flexibele beschermfolie die ook gebogen randen volgt. In de verpakking zitten twee folies.",
    highlights: ["2 stuks", "Flexibele folie", "Volgt gebogen randen"],
    specs: [
      { label: "Materiaal", value: "TPU-folie" },
      { label: "Inhoud", value: "2 folies" },
    ],
    material: "TPU-folie",
    compatibility: deviceCompat,
    createdAt: "2026-01-22",
    price: 1499,
    image: "film",
    devices: ["galaxy-s25", "galaxy-s24", "galaxy-a56"],
  },
  {
    handle: "panzerglass-hoops-camera-lens-protector",
    title: "Hoops Camera Lens Protector",
    brand: "PanzerGlass",
    category: "screenprotectors",
    productType: "Cameraprotector",
    description:
      "Afzonderlijke glazen ringen die elke cameralens apart beschermen, met behoud van het ontwerp van je toestel.",
    highlights: ["Per lens een ring", "Gehard glas", "Inclusief aanbrenghulp"],
    specs: [{ label: "Materiaal", value: "Gehard glas met aluminium rand" }],
    material: "Gehard glas",
    compatibility: deviceCompat,
    createdAt: "2026-09-22",
    price: 2499,
    image: "lens",
    devices: ["iphone-17-pro-max", "iphone-17-pro", "iphone-16-pro"],
    colors: ["Zwart", "Titanium"],
  },
  {
    handle: "panzerglass-anti-blue-light",
    title: "Anti-Blue Light Screenprotector",
    brand: "PanzerGlass",
    category: "screenprotectors",
    productType: "Gehard glas",
    description:
      "Gehard glas met een filter dat een deel van het blauwe licht van je scherm dempt.",
    highlights: ["Filtert blauw licht", "Gehard glas", "Inclusief aanbrenghulp"],
    specs: [
      { label: "Materiaal", value: "Gehard glas" },
      { label: "Hoesjevriendelijk", value: "Ja" },
    ],
    material: "Gehard glas",
    compatibility: deviceCompat,
    createdAt: "2025-11-30",
    price: 3499,
    image: "glass",
    devices: ["iphone-16", "iphone-15", "galaxy-s24"],
    soldOut: ["galaxy-s24"],
  },

  /* -------------------------------------------------------------- */
  /* Opladers                                                        */
  /* -------------------------------------------------------------- */
  {
    handle: "belkin-boostcharge-20w-usb-c",
    title: "BoostCharge 20W USB-C-lader",
    brand: "Belkin",
    category: "opladers",
    productType: "Thuislader",
    description:
      "Compacte thuislader met één USB-C-poort en USB Power Delivery. Gebruik een kabel die past bij de aansluiting van je toestel.",
    highlights: ["20W USB Power Delivery", "Compact formaat", "Kabel niet inbegrepen"],
    specs: [
      { label: "Vermogen", value: "20W" },
      { label: "Poorten", value: "1× USB-C" },
      { label: "Laadstandaard", value: "USB Power Delivery" },
      { label: "Kabel inbegrepen", value: "Nee" },
    ],
    compatibility: {
      kind: "rules",
      chargingAny: ["usb-pd"],
      note: "Kabel niet inbegrepen. Gebruik een USB-C-kabel met de aansluiting van jouw toestel.",
    },
    createdAt: "2026-03-02",
    featured: true,
    price: 1999,
    image: "charger",
    colors: ["Wit", "Zwart"],
  },
  {
    handle: "samsung-45w-power-adapter",
    title: "45W Power Adapter met USB-C-kabel",
    brand: "Samsung",
    category: "opladers",
    productType: "Thuislader",
    description:
      "Lader voor Super Fast Charging op Galaxy-toestellen die dit ondersteunen. Inclusief USB-C naar USB-C-kabel.",
    highlights: ["Tot 45W", "Super Fast Charging (PPS)", "USB-C-kabel inbegrepen"],
    specs: [
      { label: "Vermogen", value: "45W" },
      { label: "Poorten", value: "1× USB-C" },
      { label: "Laadstandaard", value: "USB PD met PPS" },
      { label: "Kabel inbegrepen", value: "Ja, USB-C naar USB-C" },
    ],
    compatibility: {
      kind: "rules",
      connectorsAny: ["usb-c"],
      chargingAny: ["pps"],
      note: "Bedoeld voor toestellen met PPS-snelladen en een USB-C-aansluiting.",
    },
    createdAt: "2026-04-08",
    price: 3999,
    image: "pps",
    colors: ["Zwart"],
  },
  {
    handle: "belkin-boostcharge-pro-65w-dual",
    title: "BoostCharge Pro 65W lader met 2 poorten",
    brand: "Belkin",
    category: "opladers",
    productType: "Thuislader",
    description:
      "Compacte GaN-lader met twee USB-C-poorten. Laad je telefoon en laptop tegelijk; het vermogen wordt over beide poorten verdeeld.",
    highlights: ["2× USB-C", "GaN-technologie", "Tot 65W totaal"],
    specs: [
      { label: "Vermogen", value: "65W totaal" },
      { label: "Poorten", value: "2× USB-C" },
      { label: "Laadstandaard", value: "USB Power Delivery" },
      { label: "Kabel inbegrepen", value: "Nee" },
    ],
    compatibility: {
      kind: "rules",
      chargingAny: ["usb-pd"],
      note: "Kabel niet inbegrepen.",
    },
    createdAt: "2026-08-14",
    featured: true,
    price: 4999,
    image: "dual",
    colors: ["Wit"],
    lowStock: { Wit: 3 },
  },
  {
    handle: "belkin-boostcharge-pro-magnetische-lader",
    title: "BoostCharge Pro magnetische draadloze lader",
    brand: "Belkin",
    category: "opladers",
    productType: "Draadloze lader",
    description:
      "Magnetische laadpuck die vanzelf op de juiste plek klikt. Werkt met toestellen met MagSafe en met hoesjes met magneetring.",
    highlights: ["Magnetische uitlijning", "Draadloos laden", "Vaste kabel"],
    specs: [
      { label: "Aansluiting", value: "Vaste USB-C-kabel" },
      { label: "Adapter inbegrepen", value: "Nee" },
    ],
    magsafe: true,
    compatibility: {
      kind: "rules",
      featuresAll: ["magsafe"],
      note: "Vereist een toestel met MagSafe of een hoesje met magneetring.",
    },
    createdAt: "2026-09-05",
    featured: true,
    price: 3999,
    image: "wireless",
    colors: ["Wit", "Zwart"],
    soldOut: ["Zwart"],
  },
  {
    handle: "belkin-boostcharge-draadloos-laadstation",
    title: "BoostCharge draadloos laadstation",
    brand: "Belkin",
    category: "opladers",
    productType: "Draadloze lader",
    description:
      "Schuin laadstation voor op je bureau of nachtkastje. Laad je telefoon staand en draadloos via Qi.",
    highlights: ["Staand laden", "Qi-standaard", "Antislip voet"],
    specs: [
      { label: "Laadstandaard", value: "Qi" },
      { label: "Adapter inbegrepen", value: "Controleer bij aankoop" },
    ],
    magsafe: false,
    compatibility: {
      kind: "rules",
      featuresAll: ["qi"],
      note: "Alleen voor toestellen die draadloos laden via Qi ondersteunen.",
    },
    createdAt: "2025-12-12",
    price: 3499,
    image: "stand",
    colors: ["Zwart"],
  },
  {
    handle: "anker-autolader-usb-c-usb-a",
    title: "Autolader USB-C + USB-A",
    brand: "Anker",
    category: "opladers",
    productType: "Autolader",
    description:
      "Autolader voor de 12V-aansluiting met een USB-C- en een USB-A-poort. Snelladen via USB Power Delivery op de USB-C-poort.",
    highlights: ["USB-C en USB-A", "Snelladen via USB-C", "Compact"],
    specs: [
      { label: "Poorten", value: "1× USB-C, 1× USB-A" },
      { label: "Laadstandaard", value: "USB Power Delivery (USB-C)" },
      { label: "Kabel inbegrepen", value: "Nee" },
    ],
    compatibility: {
      kind: "rules",
      chargingAny: ["usb-pd"],
      note: "Kabel niet inbegrepen.",
    },
    createdAt: "2026-02-26",
    price: 2499,
    image: "carcharger",
    colors: ["Zwart"],
  },

  /* -------------------------------------------------------------- */
  /* Kabels                                                          */
  /* -------------------------------------------------------------- */
  {
    handle: "belkin-boostcharge-usb-c-kabel-gevlochten",
    title: "BoostCharge USB-C naar USB-C kabel, gevlochten",
    brand: "Belkin",
    category: "kabels",
    productType: "USB-C-kabel",
    description:
      "Stevige gevlochten kabel met versterkte stekkers, voor snelladen en gegevensoverdracht.",
    highlights: ["Gevlochten mantel", "Geschikt voor snelladen", "Versterkte stekkers"],
    specs: [{ label: "Aansluitingen", value: "USB-C naar USB-C" }],
    material: "Gevlochten nylon",
    compatibility: { kind: "rules", connectorsAny: ["usb-c"] },
    createdAt: "2026-07-20",
    featured: true,
    price: 1999,
    image: "cable",
    colors: ["Zwart", "Wit"],
    extra: { name: "Lengte", values: [{ value: "1 meter" }, { value: "2 meter", surcharge: 500 }] },
    soldOut: ["Wit|2 meter"],
  },
  {
    handle: "apple-usb-c-naar-lightning-kabel",
    title: "USB-C-naar-Lightning-kabel",
    brand: "Apple",
    category: "kabels",
    productType: "Lightning-kabel",
    description:
      "Originele Apple-kabel voor iPhones met Lightning-aansluiting. Met een USB-C-lader met Power Delivery laad je snel.",
    highlights: ["Origineel Apple", "Snelladen met USB-C-lader", "Lightning-aansluiting"],
    specs: [{ label: "Aansluitingen", value: "USB-C naar Lightning" }],
    material: "TPE",
    compatibility: { kind: "rules", connectorsAny: ["lightning"] },
    createdAt: "2025-10-04",
    price: 2500,
    image: "lightning",
    colors: ["Wit"],
    extra: { name: "Lengte", values: [{ value: "1 meter" }, { value: "2 meter", surcharge: 1000 }] },
  },
  {
    handle: "anker-powerline-usb-a-naar-usb-c",
    title: "PowerLine USB-A naar USB-C kabel",
    brand: "Anker",
    category: "kabels",
    productType: "USB-C-kabel",
    description:
      "Voor laders, auto's en computers met een USB-A-poort. Laadt toestellen met USB-C op standaardsnelheid.",
    highlights: ["Voor USB-A-poorten", "Duurzame mantel", "Laad- en datakabel"],
    specs: [
      { label: "Aansluitingen", value: "USB-A naar USB-C" },
      { label: "Lengte", value: "1 meter" },
    ],
    material: "TPE",
    compatibility: { kind: "rules", connectorsAny: ["usb-c"] },
    createdAt: "2025-09-15",
    price: 1299,
    image: "cable",
    colors: ["Zwart"],
  },
  {
    handle: "anker-powerline-3-in-1-kabel",
    title: "PowerLine 3-in-1 kabel",
    brand: "Anker",
    category: "kabels",
    productType: "Multikabel",
    description:
      "Eén kabel met drie stekkers: USB-C, Lightning en Micro-USB. Handig in de auto of op reis met meerdere toestellen.",
    highlights: ["USB-C, Lightning en Micro-USB", "Eén kabel voor meerdere toestellen", "Gevlochten"],
    specs: [{ label: "Aansluitingen", value: "USB-A naar USB-C, Lightning en Micro-USB" }],
    material: "Gevlochten nylon",
    compatibility: {
      kind: "rules",
      connectorsAny: ["usb-c", "lightning"],
      note: "Laadt op standaardsnelheid, geen snelladen.",
    },
    createdAt: "2026-06-18",
    price: 1999,
    image: "multi",
    colors: ["Zwart"],
  },
  {
    handle: "anker-powerline-usb-c-kabel-3m",
    title: "PowerLine USB-C naar USB-C kabel, 3 meter",
    brand: "Anker",
    category: "kabels",
    productType: "USB-C-kabel",
    description:
      "Extra lange USB-C-kabel, zodat je comfortabel kunt bellen of gamen terwijl je toestel laadt.",
    highlights: ["3 meter lang", "Geschikt voor snelladen", "Duurzame mantel"],
    specs: [
      { label: "Aansluitingen", value: "USB-C naar USB-C" },
      { label: "Lengte", value: "3 meter" },
    ],
    material: "Gevlochten nylon",
    compatibility: { kind: "rules", connectorsAny: ["usb-c"] },
    createdAt: "2026-08-01",
    price: 1999,
    image: "cable",
    colors: ["Grijs"],
    soldOut: ["Grijs"],
  },

  /* -------------------------------------------------------------- */
  /* Houders                                                         */
  /* -------------------------------------------------------------- */
  {
    handle: "belkin-magnetische-ventilatiehouder",
    title: "Magnetische ventilatiehouder",
    brand: "Belkin",
    category: "houders",
    productType: "Autohouder",
    description:
      "Autohouder voor op het ventilatierooster die je toestel magnetisch vasthoudt. Met één hand plaatsen en losnemen.",
    highlights: ["Magnetische bevestiging", "Draaibaar", "Voor ventilatieroosters"],
    specs: [
      { label: "Bevestiging", value: "Ventilatierooster" },
      { label: "Houdkracht", value: "MagSafe-magneten" },
    ],
    magsafe: true,
    compatibility: {
      kind: "rules",
      featuresAll: ["magsafe"],
      note: "Werkt alleen met toestellen met MagSafe of een hoesje met magneetring.",
    },
    createdAt: "2026-09-08",
    featured: true,
    price: 3999,
    image: "vent",
    colors: ["Zwart"],
  },
  {
    handle: "iottie-easy-one-touch-dashboardhouder",
    title: "Easy One Touch dashboard- en voorruithouder",
    brand: "iOttie",
    category: "houders",
    productType: "Autohouder",
    description:
      "Telefoonhouder met zuignap voor dashboard of voorruit. De klem houdt je toestel stevig vast en opent met één hand.",
    highlights: ["Zuignap voor dashboard of voorruit", "Verstelbare arm", "Klem met één hand te bedienen"],
    specs: [
      { label: "Bevestiging", value: "Dashboard of voorruit" },
      { label: "Klembreedte", value: "60–85 mm" },
    ],
    magsafe: false,
    compatibility: {
      kind: "rules",
      widthMm: { min: 60, max: 85 },
      note: "Houd rekening met de extra breedte van een dik hoesje.",
    },
    createdAt: "2025-11-11",
    price: 3499,
    image: "clamp",
    colors: ["Zwart"],
  },
  {
    handle: "iottie-active-edge-fietshouder",
    title: "Active Edge fietshouder",
    brand: "iOttie",
    category: "houders",
    productType: "Fietshouder",
    description:
      "Stuurhouder voor op de fiets die je toestel met een klem vasthoudt. Zonder gereedschap te monteren.",
    highlights: ["Montage zonder gereedschap", "Stevige klem", "Voor het stuur"],
    specs: [
      { label: "Bevestiging", value: "Stuur" },
      { label: "Klembreedte", value: "64–76 mm" },
    ],
    magsafe: false,
    compatibility: {
      kind: "rules",
      widthMm: { min: 64, max: 76 },
      note: "Niet geschikt voor brede toestellen boven 76 mm.",
    },
    createdAt: "2026-05-27",
    price: 2999,
    image: "bike",
    colors: ["Zwart"],
    lowStock: { Zwart: 2 },
  },
  {
    handle: "esr-halolock-magnetische-standaard",
    title: "HaloLock magnetische bureaustandaard",
    brand: "ESR",
    category: "houders",
    productType: "Standaard",
    description:
      "Standaard met magnetische kop, verstelbaar in hoogte en hoek. Ideaal voor videobellen of het volgen van een recept.",
    highlights: ["Magnetische kop", "Verstelbaar", "Stevige voet"],
    specs: [{ label: "Bevestiging", value: "Magnetisch (MagSafe)" }],
    material: "Aluminium",
    magsafe: true,
    compatibility: {
      kind: "rules",
      featuresAll: ["magsafe"],
      note: "Vereist een toestel met MagSafe of een hoesje met magneetring.",
    },
    createdAt: "2026-07-30",
    price: 2999,
    image: "desk",
    colors: ["Grijs", "Zwart"],
  },

  /* -------------------------------------------------------------- */
  /* Powerbanks                                                      */
  /* -------------------------------------------------------------- */
  {
    handle: "anker-maggo-powerbank-5000",
    title: "MagGo Powerbank 5.000 mAh",
    brand: "Anker",
    category: "powerbanks",
    productType: "Magnetische powerbank",
    description:
      "Compacte powerbank die magnetisch aan de achterkant van je toestel klikt en draadloos laadt. Zelf opladen via USB-C.",
    highlights: ["Klikt magnetisch vast", "Draadloos laden", "USB-C-poort"],
    specs: [
      { label: "Capaciteit", value: "5.000 mAh" },
      { label: "Uitgangen", value: "Magnetisch draadloos, USB-C" },
    ],
    magsafe: true,
    compatibility: {
      kind: "rules",
      featuresAll: ["magsafe"],
      note: "Draadloos laden alleen met MagSafe-toestellen of een hoesje met magneetring.",
    },
    createdAt: "2026-09-26",
    featured: true,
    price: 3999,
    image: "magpack",
    colors: ["Wit", "Zwart", "Blauw"],
    soldOut: ["Blauw"],
  },
  {
    handle: "anker-powerbank-10000-20w",
    title: "Powerbank 10.000 mAh, 20W",
    brand: "Anker",
    category: "powerbanks",
    productType: "Powerbank",
    description:
      "Handzame powerbank met snelladen via USB Power Delivery op de USB-C-poort.",
    highlights: ["20W USB Power Delivery", "USB-C en USB-A", "Handzaam formaat"],
    specs: [
      { label: "Capaciteit", value: "10.000 mAh" },
      { label: "Uitgangen", value: "USB-C (20W), USB-A" },
    ],
    magsafe: false,
    compatibility: {
      kind: "rules",
      chargingAny: ["usb-pd"],
      note: "Gebruik een kabel die past bij de aansluiting van jouw toestel.",
    },
    createdAt: "2026-01-09",
    price: 2999,
    image: "powerbank",
    colors: ["Zwart", "Wit"],
  },
  {
    handle: "samsung-battery-pack-20000-45w",
    title: "Battery Pack 20.000 mAh, 45W",
    brand: "Samsung",
    category: "powerbanks",
    productType: "Powerbank",
    description:
      "Grote powerbank voor meerdere laadbeurten, met Super Fast Charging voor Galaxy-toestellen die dit ondersteunen.",
    highlights: ["45W Super Fast Charging", "USB-C", "Voor meerdere laadbeurten"],
    specs: [
      { label: "Capaciteit", value: "20.000 mAh" },
      { label: "Laadstandaard", value: "USB PD met PPS" },
    ],
    magsafe: false,
    compatibility: {
      kind: "rules",
      connectorsAny: ["usb-c"],
      chargingAny: ["pps"],
      note: "45W-snelladen werkt met toestellen die PPS ondersteunen.",
    },
    createdAt: "2026-06-25",
    price: 6999,
    image: "powerbank",
    imageBig: true,
    colors: ["Grijs"],
    lowStock: { Grijs: 4 },
  },
  {
    handle: "anker-nano-powerbank-lightning",
    title: "Nano Powerbank met Lightning-stekker",
    brand: "Anker",
    category: "powerbanks",
    productType: "Mini powerbank",
    description:
      "Kleine powerbank die direct in de Lightning-poort van je iPhone steekt. Geen kabel nodig.",
    highlights: ["Ingebouwde Lightning-stekker", "Zakformaat", "Geen kabel nodig"],
    specs: [
      { label: "Capaciteit", value: "5.000 mAh" },
      { label: "Uitgang", value: "Lightning-stekker" },
    ],
    magsafe: false,
    compatibility: { kind: "rules", connectorsAny: ["lightning"] },
    createdAt: "2025-08-19",
    price: 2999,
    image: "minipack",
    colors: ["Wit", "Roze"],
  },
];

export const demoProducts: Product[] = defs.map(build);
