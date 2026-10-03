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
 * Alle productmerken zijn fictief. Prijzen en voorraad zijn voorbeeldwaarden.
 * Productbeelden zijn gegenereerde illustraties (zie /demo-images), zodat er
 * geen beeldmateriaal van derden wordt gebruikt.
 */

/** Soorten illustraties die de demo-afbeeldingsroute kan tekenen. */
export type DemoImageKind =
  | "case"
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
          url: `/demo-images/${def.image}_${brand}_${hex}_${view}.svg`,
          alt: [def.title, def.colors ? color : null, view === 2 ? "andere kant" : null]
            .filter(Boolean)
            .join(" – "),
          width: 800,
          height: 800,
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
    handle: "nordvik-clear-case-magsafe",
    title: "Clear Case met MagSafe",
    brand: "Nordvik",
    category: "telefoonhoesjes",
    productType: "Transparant hoesje",
    description:
      "Kristalhelder hoesje dat de kleur van je iPhone laat zien. De ingebouwde magneetring klikt direct vast op MagSafe-laders en -houders. Een vergeelbestendige coating houdt het hoesje langer helder.",
    highlights: ["Ingebouwde MagSafe-magneetring", "Vergeelbestendige coating", "Verhoogde rand rond camera"],
    specs: [
      { label: "Materiaal", value: "Polycarbonaat met TPU-rand" },
      { label: "Dikte", value: "1,4 mm" },
      { label: "Draadloos laden", value: "Ja, via MagSafe en Qi" },
    ],
    material: "Polycarbonaat",
    magsafe: true,
    compatibility: deviceCompat,
    createdAt: "2026-09-19",
    featured: true,
    price: 2995,
    image: "clear",
    devices: ["iphone-17-pro-max", "iphone-17-pro", "iphone-17", "iphone-16-pro", "iphone-16"],
    colors: ["Transparant"],
    soldOut: ["iphone-16-pro|Transparant"],
    lowStock: { "iphone-17-pro-max|Transparant": 2 },
  },
  {
    handle: "nordvik-silicone-case-magsafe",
    title: "Silicone Case met MagSafe",
    brand: "Nordvik",
    category: "telefoonhoesjes",
    productType: "Siliconen hoesje",
    description:
      "Zacht aanvoelend siliconen hoesje met een microvezel binnenkant die je toestel beschermt tegen krassen. Met magneetring voor MagSafe-accessoires.",
    highlights: ["Zachte, grijpvaste afwerking", "Microvezel binnenkant", "MagSafe-compatibel"],
    specs: [
      { label: "Materiaal", value: "Vloeibare siliconen, microvezel voering" },
      { label: "Dikte", value: "1,6 mm" },
      { label: "Draadloos laden", value: "Ja, via MagSafe en Qi" },
    ],
    material: "Siliconen",
    magsafe: true,
    compatibility: deviceCompat,
    createdAt: "2026-09-12",
    featured: true,
    price: 3495,
    image: "case",
    devices: ["iphone-17-pro", "iphone-17", "iphone-16-pro", "iphone-16", "iphone-15"],
    colors: ["Zwart", "Marineblauw", "Salie", "Zand"],
    soldOut: ["iphone-17-pro|Zand", "iphone-16|Salie", "iphone-15|Marineblauw"],
    lowStock: { "iphone-17|Zwart": 3 },
  },
  {
    handle: "velaro-bookcase-kunstleer",
    title: "Bookcase Kunstleer",
    brand: "Velaro",
    category: "telefoonhoesjes",
    productType: "Bookcase",
    description:
      "Klassieke bookcase met magneetsluiting en drie pasjesvakken. De klep dient ook als standaard voor het kijken van video's.",
    highlights: ["3 pasjesvakken en geldvak", "Magnetische sluiting", "Standaardfunctie"],
    specs: [
      { label: "Materiaal", value: "Kunstleer, TPU-houder" },
      { label: "Pasjesvakken", value: "3" },
      { label: "Draadloos laden", value: "Mogelijk, zonder pasjes in de klep" },
    ],
    material: "Kunstleer",
    magsafe: false,
    compatibility: deviceCompat,
    createdAt: "2026-06-03",
    price: 2495,
    image: "book",
    devices: ["iphone-16", "iphone-15", "iphone-13", "galaxy-s25", "galaxy-s24"],
    colors: ["Zwart", "Bruin"],
    soldOut: ["iphone-13|Bruin"],
  },
  {
    handle: "velaro-slim-hardcase",
    title: "Slim Hardcase",
    brand: "Velaro",
    category: "telefoonhoesjes",
    productType: "Hardcase",
    description:
      "Dun en licht hardcase met matte afwerking die vingerafdrukken tegengaat. Precies uitgesneden voor knoppen, poort en camera.",
    highlights: ["Slechts 0,9 mm dun", "Matte, vingerafdrukvrije afwerking", "Exacte uitsparingen"],
    specs: [
      { label: "Materiaal", value: "Polycarbonaat" },
      { label: "Dikte", value: "0,9 mm" },
      { label: "Draadloos laden", value: "Ja (Qi)" },
    ],
    material: "Polycarbonaat",
    magsafe: false,
    compatibility: deviceCompat,
    createdAt: "2026-04-21",
    price: 1995,
    image: "case",
    devices: ["galaxy-s25-ultra", "galaxy-s25", "galaxy-s24", "galaxy-a56"],
    colors: ["Zwart", "Blauw", "Groen"],
    soldOut: ["galaxy-a56|Groen"],
  },
  {
    handle: "nordvik-rugged-armor-case",
    title: "Rugged Armor Case",
    brand: "Nordvik",
    category: "telefoonhoesjes",
    productType: "Schokbestendig hoesje",
    description:
      "Robuust hoesje met versterkte hoeken en een dubbele laag voor extra bescherming bij vallen. Inclusief MagSafe-magneetring.",
    highlights: ["Versterkte hoeken", "Dubbellaagse constructie", "MagSafe-compatibel"],
    specs: [
      { label: "Materiaal", value: "TPU binnenlaag, polycarbonaat buitenschaal" },
      { label: "Dikte", value: "2,8 mm" },
      { label: "Draadloos laden", value: "Ja, via MagSafe en Qi" },
    ],
    material: "TPU",
    magsafe: true,
    compatibility: deviceCompat,
    createdAt: "2026-09-25",
    featured: true,
    price: 3995,
    image: "rugged",
    devices: ["iphone-17-pro-max", "iphone-17-pro", "iphone-16-pro"],
    colors: ["Zwart", "Grijs"],
    lowStock: { "iphone-17-pro|Grijs": 1 },
  },
  {
    handle: "velaro-clear-case",
    title: "Clear Case",
    brand: "Velaro",
    category: "telefoonhoesjes",
    productType: "Transparant hoesje",
    description:
      "Flexibel transparant hoesje van zacht TPU. Eenvoudig aan te brengen en met verhoogde randen rond scherm en camera.",
    highlights: ["Flexibel TPU", "Verhoogde randen", "Licht van gewicht"],
    specs: [
      { label: "Materiaal", value: "TPU" },
      { label: "Dikte", value: "1,2 mm" },
      { label: "Draadloos laden", value: "Ja (Qi)" },
    ],
    material: "TPU",
    magsafe: false,
    compatibility: deviceCompat,
    createdAt: "2026-02-10",
    price: 1495,
    image: "clear",
    devices: ["galaxy-s25-ultra", "galaxy-s25", "galaxy-a56", "iphone-15", "iphone-13"],
    colors: ["Transparant"],
  },
  {
    handle: "nordvik-leather-case-magsafe",
    title: "Leather Case met MagSafe",
    brand: "Nordvik",
    category: "telefoonhoesjes",
    productType: "Leren hoesje",
    description:
      "Hoesje van volnerf leer dat mooi patineert naarmate je het gebruikt. Aluminium knoppen en een magneetring voor MagSafe.",
    highlights: ["Volnerf leer", "Aluminium knoppen", "MagSafe-compatibel"],
    specs: [
      { label: "Materiaal", value: "Volnerf leer, microvezel voering" },
      { label: "Dikte", value: "1,5 mm" },
      { label: "Draadloos laden", value: "Ja, via MagSafe en Qi" },
    ],
    material: "Leer",
    magsafe: true,
    compatibility: deviceCompat,
    createdAt: "2026-09-29",
    featured: true,
    price: 4995,
    image: "case",
    devices: ["iphone-17-pro-max", "iphone-17-pro", "iphone-air"],
    colors: ["Cognac", "Zwart", "Donkergroen"],
    soldOut: ["iphone-air|Donkergroen"],
  },
  {
    handle: "velaro-wallet-case",
    title: "Wallet Case met pasjeshouder",
    brand: "Velaro",
    category: "telefoonhoesjes",
    productType: "Hoesje met pasjeshouder",
    description:
      "Slank hoesje met een verborgen pasjesvak aan de achterkant voor twee pasjes. Ideaal als je zonder portemonnee de deur uit wilt.",
    highlights: ["Ruimte voor 2 pasjes", "Slank profiel", "Grijpvaste zijkanten"],
    specs: [
      { label: "Materiaal", value: "TPU met kunstleer pasjesvak" },
      { label: "Pasjesvakken", value: "2" },
      { label: "Draadloos laden", value: "Niet met pasjes in het vak" },
    ],
    material: "TPU",
    magsafe: false,
    compatibility: deviceCompat,
    createdAt: "2026-05-14",
    price: 2295,
    image: "wallet",
    devices: ["iphone-16-pro", "iphone-16", "galaxy-a56"],
    colors: ["Zwart", "Roze"],
  },
  {
    handle: "nordvik-thin-case-air",
    title: "Ultra Thin Case",
    brand: "Nordvik",
    category: "telefoonhoesjes",
    productType: "Hardcase",
    description:
      "Speciaal ontworpen voor de iPhone Air: een hoesje van 0,6 mm dat het dunne profiel van je toestel behoudt.",
    highlights: ["0,6 mm dun", "Behoudt het slanke profiel", "MagSafe-compatibel"],
    specs: [
      { label: "Materiaal", value: "Aramidevezel-composiet" },
      { label: "Dikte", value: "0,6 mm" },
      { label: "Draadloos laden", value: "Ja, via MagSafe en Qi" },
    ],
    material: "Aramidevezel",
    magsafe: true,
    compatibility: deviceCompat,
    createdAt: "2026-08-30",
    price: 3995,
    image: "case",
    devices: ["iphone-air"],
    colors: ["Zwart", "Titanium"],
  },
  {
    handle: "velaro-silicone-case",
    title: "Silicone Case",
    brand: "Velaro",
    category: "telefoonhoesjes",
    productType: "Siliconen hoesje",
    description:
      "Kleurrijk siliconen hoesje met zachte voering. Beschermt tegen krassen en kleine stoten in het dagelijks gebruik.",
    highlights: ["Zachte voering", "Vrolijke kleuren", "Goede grip"],
    specs: [
      { label: "Materiaal", value: "Siliconen" },
      { label: "Dikte", value: "1,5 mm" },
      { label: "Draadloos laden", value: "Ja (Qi)" },
    ],
    material: "Siliconen",
    magsafe: false,
    compatibility: deviceCompat,
    createdAt: "2026-03-18",
    price: 1795,
    image: "case",
    devices: ["galaxy-s25", "galaxy-s24", "galaxy-a56"],
    colors: ["Lavendel", "Zwart", "Mint"],
    soldOut: ["galaxy-s24|Mint", "galaxy-s24|Lavendel"],
  },

  /* -------------------------------------------------------------- */
  /* Screenprotectors                                                */
  /* -------------------------------------------------------------- */
  {
    handle: "shieldline-gehard-glas",
    title: "Screenprotector Gehard Glas 9H",
    brand: "Shieldline",
    category: "screenprotectors",
    productType: "Gehard glas",
    description:
      "Gehard glas met hardheid 9H dat je scherm beschermt tegen krassen. Inclusief installatieframe voor bubbelvrij aanbrengen.",
    highlights: ["Hardheid 9H", "Installatieframe inbegrepen", "Hoesjevriendelijk formaat"],
    specs: [
      { label: "Materiaal", value: "Gehard glas" },
      { label: "Dikte", value: "0,33 mm" },
      { label: "Inhoud", value: "1 screenprotector, installatieframe, reinigingsset" },
    ],
    material: "Gehard glas",
    compatibility: deviceCompat,
    createdAt: "2026-09-15",
    featured: true,
    price: 1495,
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
    handle: "shieldline-privacy-glas",
    title: "Privacy Glas Screenprotector",
    brand: "Shieldline",
    category: "screenprotectors",
    productType: "Privacyglas",
    description:
      "Gehard glas met privacyfilter: van voren goed leesbaar, vanaf de zijkant donker. Handig in de trein of op kantoor.",
    highlights: ["Kijkhoekfilter", "Hardheid 9H", "Installatieframe inbegrepen"],
    specs: [
      { label: "Materiaal", value: "Gehard glas met privacyfilter" },
      { label: "Kijkhoek", value: "Circa 30° vanaf het midden" },
      { label: "Inhoud", value: "1 screenprotector, installatieframe" },
    ],
    material: "Gehard glas",
    compatibility: deviceCompat,
    createdAt: "2026-07-07",
    price: 2195,
    image: "privacy",
    devices: ["iphone-17-pro", "iphone-16-pro", "iphone-16", "galaxy-s25"],
  },
  {
    handle: "shieldline-full-cover-ultra",
    title: "Full Cover Glas met vingerafdrukopening",
    brand: "Shieldline",
    category: "screenprotectors",
    productType: "Gehard glas",
    description:
      "Randloos gehard glas voor de Galaxy S25 Ultra, met een uitsparing die de ultrasone vingerafdruksensor vrijhoudt.",
    highlights: ["Werkt met de vingerafdruksensor", "Randloze dekking", "Inclusief uithardingslamp"],
    specs: [
      { label: "Materiaal", value: "Gehard glas" },
      { label: "Dikte", value: "0,3 mm" },
      { label: "Inhoud", value: "2 screenprotectors, uv-lamp, lijm" },
    ],
    material: "Gehard glas",
    compatibility: deviceCompat,
    createdAt: "2026-05-02",
    price: 2495,
    image: "glass",
    devices: ["galaxy-s25-ultra"],
    lowStock: { "galaxy-s25-ultra": 2 },
  },
  {
    handle: "velaro-screenfolie-duopack",
    title: "Screenfolie Duopack",
    brand: "Velaro",
    category: "screenprotectors",
    productType: "Folie",
    description:
      "Twee flexibele beschermfolies die ook de gebogen randen volgen. Zelfherstellend bij lichte krasjes.",
    highlights: ["2 stuks", "Zelfherstellend", "Volgt gebogen randen"],
    specs: [
      { label: "Materiaal", value: "TPU-folie" },
      { label: "Dikte", value: "0,15 mm" },
      { label: "Inhoud", value: "2 folies, spuitflacon, rakel" },
    ],
    material: "TPU-folie",
    compatibility: deviceCompat,
    createdAt: "2026-01-22",
    price: 1295,
    image: "film",
    devices: ["galaxy-s25", "galaxy-s24", "galaxy-a56"],
  },
  {
    handle: "shieldline-camera-lens-protector",
    title: "Camera Lens Protector",
    brand: "Shieldline",
    category: "screenprotectors",
    productType: "Cameraprotector",
    description:
      "Afzonderlijke glazen ringen die elke cameralens beschermen zonder de beeldkwaliteit te beïnvloeden.",
    highlights: ["Per lens een ring", "Geen invloed op flitser", "Aluminium rand"],
    specs: [
      { label: "Materiaal", value: "Saffierglas met aluminium rand" },
      { label: "Inhoud", value: "3 lensringen, applicator" },
    ],
    material: "Saffierglas",
    compatibility: deviceCompat,
    createdAt: "2026-09-22",
    price: 1695,
    image: "lens",
    devices: ["iphone-17-pro-max", "iphone-17-pro", "iphone-16-pro"],
    colors: ["Zwart", "Titanium"],
  },
  {
    handle: "shieldline-anti-blauwlicht-glas",
    title: "Anti-blauwlicht Glas",
    brand: "Shieldline",
    category: "screenprotectors",
    productType: "Gehard glas",
    description:
      "Gehard glas met een filter dat een deel van het blauwe licht van je scherm dempt, met behoud van natuurlijke kleuren.",
    highlights: ["Filtert blauw licht", "Hardheid 9H", "Oleofobe coating"],
    specs: [
      { label: "Materiaal", value: "Gehard glas" },
      { label: "Dikte", value: "0,33 mm" },
      { label: "Inhoud", value: "1 screenprotector, installatieframe" },
    ],
    material: "Gehard glas",
    compatibility: deviceCompat,
    createdAt: "2025-11-30",
    price: 1795,
    image: "glass",
    devices: ["iphone-16", "iphone-15", "galaxy-s24"],
    soldOut: ["galaxy-s24"],
  },

  /* -------------------------------------------------------------- */
  /* Opladers                                                        */
  /* -------------------------------------------------------------- */
  {
    handle: "voltaro-20w-usb-c-snellader",
    title: "20W USB-C Snellader",
    brand: "Voltaro",
    category: "opladers",
    productType: "Thuislader",
    description:
      "Compacte thuislader met één USB-C-poort en USB Power Delivery. Gebruik een kabel die past bij de aansluiting van je toestel.",
    highlights: ["20W USB Power Delivery", "Compact formaat", "Kabel niet inbegrepen"],
    specs: [
      { label: "Vermogen", value: "20W" },
      { label: "Poorten", value: "1× USB-C" },
      { label: "Laadstandaard", value: "USB Power Delivery 3.0" },
      { label: "Kabel inbegrepen", value: "Nee" },
    ],
    compatibility: {
      kind: "rules",
      chargingAny: ["usb-pd"],
      note: "Kabel niet inbegrepen. Gebruik een USB-C-kabel met de aansluiting van jouw toestel.",
    },
    createdAt: "2026-03-02",
    featured: true,
    price: 1795,
    image: "charger",
    colors: ["Wit", "Zwart"],
  },
  {
    handle: "voltaro-45w-pps-snellader",
    title: "45W Super Fast Charger met USB-C-kabel",
    brand: "Voltaro",
    category: "opladers",
    productType: "Thuislader",
    description:
      "Krachtige lader met PPS-ondersteuning voor de hoogste laadsnelheid op toestellen die PPS gebruiken. Inclusief USB-C naar USB-C-kabel van 1 meter.",
    highlights: ["45W met PPS", "USB-C-kabel inbegrepen", "Temperatuurbeveiliging"],
    specs: [
      { label: "Vermogen", value: "45W" },
      { label: "Poorten", value: "1× USB-C" },
      { label: "Laadstandaard", value: "USB PD 3.0 met PPS" },
      { label: "Kabel inbegrepen", value: "Ja, USB-C naar USB-C, 1 m" },
    ],
    compatibility: {
      kind: "rules",
      connectorsAny: ["usb-c"],
      chargingAny: ["pps"],
      note: "Bedoeld voor toestellen met PPS-snelladen en een USB-C-aansluiting.",
    },
    createdAt: "2026-04-08",
    price: 3495,
    image: "pps",
    colors: ["Zwart"],
  },
  {
    handle: "voltaro-65w-gan-dubbele-lader",
    title: "65W GaN Lader met 2 poorten",
    brand: "Voltaro",
    category: "opladers",
    productType: "Thuislader",
    description:
      "Laad je telefoon en laptop tegelijk met deze compacte GaN-lader. Het vermogen wordt automatisch over beide poorten verdeeld.",
    highlights: ["2× USB-C", "GaN-technologie", "Tot 65W totaal"],
    specs: [
      { label: "Vermogen", value: "65W totaal" },
      { label: "Poorten", value: "2× USB-C" },
      { label: "Laadstandaard", value: "USB Power Delivery 3.0" },
      { label: "Kabel inbegrepen", value: "Nee" },
    ],
    compatibility: {
      kind: "rules",
      chargingAny: ["usb-pd"],
      note: "Kabel niet inbegrepen.",
    },
    createdAt: "2026-08-14",
    featured: true,
    price: 4495,
    image: "dual",
    colors: ["Wit"],
    lowStock: { Wit: 3 },
  },
  {
    handle: "voltaro-magnetische-draadloze-lader",
    title: "Magnetische Draadloze Lader 15W",
    brand: "Voltaro",
    category: "opladers",
    productType: "Draadloze lader",
    description:
      "Magnetische laadpuck die vanzelf op de juiste plek klikt. Werkt met toestellen met MagSafe en met MagSafe-hoesjes.",
    highlights: ["Magnetische uitlijning", "Tot 15W draadloos", "Gevlochten kabel van 1 m"],
    specs: [
      { label: "Vermogen", value: "Tot 15W" },
      { label: "Aansluiting", value: "Vaste USB-C-kabel, 1 m" },
      { label: "Adapter inbegrepen", value: "Nee, minimaal 20W USB-C-adapter aanbevolen" },
    ],
    magsafe: true,
    compatibility: {
      kind: "rules",
      featuresAll: ["magsafe"],
      note: "Vereist een toestel met MagSafe of een hoesje met magneetring.",
    },
    createdAt: "2026-09-05",
    featured: true,
    price: 2995,
    image: "wireless",
    colors: ["Wit", "Zwart"],
    soldOut: ["Zwart"],
  },
  {
    handle: "voltaro-qi-laadstation",
    title: "Qi Draadloos Laadstation",
    brand: "Voltaro",
    category: "opladers",
    productType: "Draadloze lader",
    description:
      "Schuin laadstation voor op je bureau of nachtkastje. Laad staand of liggend draadloos via Qi.",
    highlights: ["Staand en liggend laden", "Qi-standaard", "Antislip voet"],
    specs: [
      { label: "Vermogen", value: "Tot 15W" },
      { label: "Aansluiting", value: "USB-C-ingang" },
      { label: "Adapter inbegrepen", value: "Nee" },
    ],
    magsafe: false,
    compatibility: {
      kind: "rules",
      featuresAll: ["qi"],
      note: "Alleen voor toestellen die draadloos laden via Qi ondersteunen.",
    },
    createdAt: "2025-12-12",
    price: 2495,
    image: "stand",
    colors: ["Zwart"],
  },
  {
    handle: "voltaro-autolader-30w",
    title: "Autolader 30W USB-C",
    brand: "Voltaro",
    category: "opladers",
    productType: "Autolader",
    description:
      "Autolader voor de 12V-aansluiting met een USB-C- en een USB-A-poort. Snelladen via USB Power Delivery op de USB-C-poort.",
    highlights: ["USB-C (30W) en USB-A", "Past in elke 12/24V-aansluiting", "Led-indicator"],
    specs: [
      { label: "Vermogen", value: "30W (USB-C), 18W (USB-A)" },
      { label: "Poorten", value: "1× USB-C, 1× USB-A" },
      { label: "Laadstandaard", value: "USB Power Delivery 3.0" },
      { label: "Kabel inbegrepen", value: "Nee" },
    ],
    compatibility: {
      kind: "rules",
      chargingAny: ["usb-pd"],
      note: "Kabel niet inbegrepen.",
    },
    createdAt: "2026-02-26",
    price: 1995,
    image: "carcharger",
    colors: ["Zwart"],
  },

  /* -------------------------------------------------------------- */
  /* Kabels                                                          */
  /* -------------------------------------------------------------- */
  {
    handle: "corda-usb-c-naar-usb-c-gevlochten",
    title: "USB-C naar USB-C Kabel Gevlochten",
    brand: "Corda",
    category: "kabels",
    productType: "USB-C-kabel",
    description:
      "Stevige gevlochten kabel met versterkte stekkers. Geschikt voor snelladen tot 60W en gegevensoverdracht.",
    highlights: ["Gevlochten nylon", "Tot 60W", "Versterkte stekkers"],
    specs: [
      { label: "Aansluitingen", value: "USB-C naar USB-C" },
      { label: "Max. vermogen", value: "60W" },
      { label: "Data", value: "USB 2.0 (480 Mbit/s)" },
    ],
    material: "Gevlochten nylon",
    compatibility: { kind: "rules", connectorsAny: ["usb-c"] },
    createdAt: "2026-07-20",
    featured: true,
    price: 1295,
    image: "cable",
    colors: ["Zwart", "Wit"],
    extra: { name: "Lengte", values: [{ value: "1 meter" }, { value: "2 meter", surcharge: 300 }] },
    soldOut: ["Wit|2 meter"],
  },
  {
    handle: "corda-usb-c-naar-lightning",
    title: "USB-C naar Lightning Kabel",
    brand: "Corda",
    category: "kabels",
    productType: "Lightning-kabel",
    description:
      "Kabel voor iPhones met Lightning-aansluiting. In combinatie met een USB-C-snellader laad je snel via USB Power Delivery.",
    highlights: ["Snelladen met USB-C-adapter", "Flexibele mantel", "Getest op 10.000 buigingen"],
    specs: [
      { label: "Aansluitingen", value: "USB-C naar Lightning" },
      { label: "Max. vermogen", value: "27W" },
    ],
    material: "TPE",
    compatibility: { kind: "rules", connectorsAny: ["lightning"] },
    createdAt: "2025-10-04",
    price: 1495,
    image: "lightning",
    colors: ["Wit"],
    extra: { name: "Lengte", values: [{ value: "1 meter" }, { value: "2 meter", surcharge: 300 }] },
  },
  {
    handle: "corda-usb-a-naar-usb-c",
    title: "USB-A naar USB-C Kabel",
    brand: "Corda",
    category: "kabels",
    productType: "USB-C-kabel",
    description:
      "Voor oudere laders, autoladers en computers met een USB-A-poort. Laadt toestellen met USB-C op standaardsnelheid.",
    highlights: ["Voor USB-A-laders", "Standaard laden tot 15W", "Datakabel"],
    specs: [
      { label: "Aansluitingen", value: "USB-A naar USB-C" },
      { label: "Max. vermogen", value: "15W" },
      { label: "Lengte", value: "1 meter" },
    ],
    material: "TPE",
    compatibility: { kind: "rules", connectorsAny: ["usb-c"] },
    createdAt: "2025-09-15",
    price: 995,
    image: "cable",
    colors: ["Zwart"],
  },
  {
    handle: "corda-3-in-1-laadkabel",
    title: "3-in-1 Laadkabel",
    brand: "Corda",
    category: "kabels",
    productType: "Multikabel",
    description:
      "Eén kabel met drie stekkers: USB-C, Lightning en Micro-USB. Handig voor in de auto of op reis met meerdere toestellen.",
    highlights: ["USB-C, Lightning en Micro-USB", "Gevlochten", "1,2 meter"],
    specs: [
      { label: "Aansluitingen", value: "USB-A naar USB-C, Lightning en Micro-USB" },
      { label: "Max. vermogen", value: "12W gedeeld" },
      { label: "Lengte", value: "1,2 meter" },
    ],
    material: "Gevlochten nylon",
    compatibility: {
      kind: "rules",
      connectorsAny: ["usb-c", "lightning"],
      note: "Laadt op standaardsnelheid, geen snelladen.",
    },
    createdAt: "2026-06-18",
    price: 1695,
    image: "multi",
    colors: ["Zwart"],
  },
  {
    handle: "corda-usb-c-kabel-haaks-3m",
    title: "USB-C Kabel Haaks 3 meter",
    brand: "Corda",
    category: "kabels",
    productType: "USB-C-kabel",
    description:
      "Extra lange kabel met haakse stekker, zodat je comfortabel kunt gamen of bellen terwijl je toestel laadt.",
    highlights: ["Haakse stekker", "3 meter lang", "Tot 60W"],
    specs: [
      { label: "Aansluitingen", value: "USB-C naar USB-C (haaks)" },
      { label: "Max. vermogen", value: "60W" },
      { label: "Lengte", value: "3 meter" },
    ],
    material: "Gevlochten nylon",
    compatibility: { kind: "rules", connectorsAny: ["usb-c"] },
    createdAt: "2026-08-01",
    price: 1995,
    image: "cable",
    colors: ["Grijs"],
    soldOut: ["Grijs"],
  },

  /* -------------------------------------------------------------- */
  /* Houders                                                         */
  /* -------------------------------------------------------------- */
  {
    handle: "mountix-magnetische-ventilatiehouder",
    title: "Magnetische Ventilatiehouder",
    brand: "Mountix",
    category: "houders",
    productType: "Autohouder",
    description:
      "Autohouder voor op het ventilatierooster die je toestel magnetisch vasthoudt. Met één hand plaatsen en losnemen.",
    highlights: ["Magnetische bevestiging", "360° draaibaar", "Klem voor horizontale roosters"],
    specs: [
      { label: "Bevestiging", value: "Ventilatierooster" },
      { label: "Houdkracht", value: "MagSafe-magneten" },
      { label: "Draaibaar", value: "360°" },
    ],
    magsafe: true,
    compatibility: {
      kind: "rules",
      featuresAll: ["magsafe"],
      note: "Werkt alleen met toestellen met MagSafe of een hoesje met magneetring.",
    },
    createdAt: "2026-09-08",
    featured: true,
    price: 2495,
    image: "vent",
    colors: ["Zwart"],
  },
  {
    handle: "mountix-dashboard-klemhouder",
    title: "Dashboard Klemhouder",
    brand: "Mountix",
    category: "houders",
    productType: "Autohouder",
    description:
      "Telefoonhouder met zuignap voor dashboard of voorruit. De verstelbare klem houdt je toestel stevig vast, ook met hoesje.",
    highlights: ["Zuignap met gel-laag", "Verstelbare arm", "Klem met één hand te openen"],
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
    price: 2295,
    image: "clamp",
    colors: ["Zwart"],
  },
  {
    handle: "mountix-fietshouder",
    title: "Fietshouder met klem",
    brand: "Mountix",
    category: "houders",
    productType: "Fietshouder",
    description:
      "Stevige stuurhouder voor op de fiets met een veiligheidsband rond de hoeken van je toestel.",
    highlights: ["Montage zonder gereedschap", "Veiligheidsband", "Voor stuurbuis 22–32 mm"],
    specs: [
      { label: "Bevestiging", value: "Stuur (22–32 mm)" },
      { label: "Klembreedte", value: "64–76 mm" },
    ],
    magsafe: false,
    compatibility: {
      kind: "rules",
      widthMm: { min: 64, max: 76 },
      note: "Niet geschikt voor brede toestellen boven 76 mm.",
    },
    createdAt: "2026-05-27",
    price: 1995,
    image: "bike",
    colors: ["Zwart"],
    lowStock: { Zwart: 2 },
  },
  {
    handle: "mountix-magnetische-bureaustandaard",
    title: "Magnetische Bureaustandaard",
    brand: "Mountix",
    category: "houders",
    productType: "Standaard",
    description:
      "Aluminium standaard met magnetische kop, in hoogte en hoek verstelbaar. Ideaal voor videobellen.",
    highlights: ["Aluminium", "Verstelbare hoogte", "Magnetische kop"],
    specs: [
      { label: "Materiaal", value: "Aluminium" },
      { label: "Hoogte", value: "14–22 cm" },
    ],
    material: "Aluminium",
    magsafe: true,
    compatibility: {
      kind: "rules",
      featuresAll: ["magsafe"],
      note: "Vereist een toestel met MagSafe of een hoesje met magneetring.",
    },
    createdAt: "2026-07-30",
    price: 3495,
    image: "desk",
    colors: ["Grijs", "Zwart"],
  },

  /* -------------------------------------------------------------- */
  /* Powerbanks                                                      */
  /* -------------------------------------------------------------- */
  {
    handle: "ampera-magnetische-powerbank-5000",
    title: "Magnetische Powerbank 5.000 mAh",
    brand: "Ampera",
    category: "powerbanks",
    productType: "Magnetische powerbank",
    description:
      "Dunne powerbank die magnetisch aan de achterkant van je toestel klikt en draadloos laadt. Zelf opladen via USB-C.",
    highlights: ["Klikt magnetisch vast", "Draadloos laden tot 7,5W", "USB-C in- en uitgang"],
    specs: [
      { label: "Capaciteit", value: "5.000 mAh" },
      { label: "Uitgangen", value: "Magnetisch draadloos, USB-C (20W)" },
      { label: "Gewicht", value: "115 g" },
    ],
    magsafe: true,
    compatibility: {
      kind: "rules",
      featuresAll: ["magsafe"],
      note: "Draadloos laden alleen met MagSafe-toestellen of een hoesje met magneetring.",
    },
    createdAt: "2026-09-26",
    featured: true,
    price: 3495,
    image: "magpack",
    colors: ["Wit", "Zwart", "Blauw"],
    soldOut: ["Blauw"],
  },
  {
    handle: "ampera-powerbank-10000-20w",
    title: "Powerbank 10.000 mAh 20W",
    brand: "Ampera",
    category: "powerbanks",
    productType: "Powerbank",
    description:
      "Handzame powerbank met snelladen via USB Power Delivery. Inclusief korte USB-C naar USB-C-kabel.",
    highlights: ["20W USB Power Delivery", "USB-C en USB-A", "Led-capaciteitsindicator"],
    specs: [
      { label: "Capaciteit", value: "10.000 mAh" },
      { label: "Uitgangen", value: "1× USB-C (20W), 1× USB-A (18W)" },
      { label: "Kabel inbegrepen", value: "USB-C naar USB-C, 30 cm" },
    ],
    magsafe: false,
    compatibility: {
      kind: "rules",
      chargingAny: ["usb-pd"],
      note: "Meegeleverde kabel is USB-C. Voor Lightning heb je een aparte kabel nodig.",
    },
    createdAt: "2026-01-09",
    price: 2495,
    image: "powerbank",
    colors: ["Zwart", "Wit"],
  },
  {
    handle: "ampera-powerbank-20000-45w",
    title: "Powerbank 20.000 mAh 45W PPS",
    brand: "Ampera",
    category: "powerbanks",
    productType: "Powerbank",
    description:
      "Grote powerbank voor meerdere laadbeurten, met 45W-snelladen via PPS voor toestellen die dat ondersteunen.",
    highlights: ["45W met PPS", "Twee USB-C-poorten", "Laadt ook tablets"],
    specs: [
      { label: "Capaciteit", value: "20.000 mAh" },
      { label: "Uitgangen", value: "2× USB-C (45W totaal)" },
      { label: "Kabel inbegrepen", value: "USB-C naar USB-C, 50 cm" },
    ],
    magsafe: false,
    compatibility: {
      kind: "rules",
      connectorsAny: ["usb-c"],
      chargingAny: ["pps"],
      note: "45W-snelladen werkt met toestellen die PPS ondersteunen.",
    },
    createdAt: "2026-06-25",
    price: 4995,
    image: "powerbank",
    colors: ["Grijs"],
    lowStock: { Grijs: 4 },
  },
  {
    handle: "ampera-mini-powerbank-lightning",
    title: "Mini Powerbank met Lightning-stekker",
    brand: "Ampera",
    category: "powerbanks",
    productType: "Mini powerbank",
    description:
      "Kleine powerbank die direct in de Lightning-poort van je iPhone steekt. Geen kabel nodig.",
    highlights: ["Directe Lightning-stekker", "Zakformaat", "Doorlaadfunctie"],
    specs: [
      { label: "Capaciteit", value: "5.000 mAh" },
      { label: "Uitgang", value: "Lightning-stekker (12W)" },
      { label: "Opladen", value: "Via USB-C" },
    ],
    magsafe: false,
    compatibility: { kind: "rules", connectorsAny: ["lightning"] },
    createdAt: "2025-08-19",
    price: 2495,
    image: "minipack",
    colors: ["Wit", "Roze"],
  },
];

export const demoProducts: Product[] = defs.map(build);
