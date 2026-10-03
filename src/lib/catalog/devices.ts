import type { Device, DeviceBrand } from "./types";

/**
 * Toestelregister.
 *
 * Toestellen staan los van de productbron: ook met Shopify blijft dit register
 * de bron voor technische gegevens (aansluiting, MagSafe, laadstandaarden).
 * Een nieuw merk toevoegen = een regel in `deviceBrands` en de modellen in
 * `devices`. De volgorde hieronder is de weergavevolgorde (nieuwste eerst).
 */
export const deviceBrands: DeviceBrand[] = [
  { slug: "apple", name: "Apple" },
  { slug: "samsung", name: "Samsung" },
];

export const devices: Device[] = [
  // Apple
  {
    id: "iphone-17-pro-max",
    brandSlug: "apple",
    name: "iPhone 17 Pro Max",
    series: "iPhone 17-serie",
    releaseYear: 2025,
    connector: "usb-c",
    features: ["magsafe", "qi"],
    charging: ["usb-pd"],
    widthMm: 78,
  },
  {
    id: "iphone-17-pro",
    brandSlug: "apple",
    name: "iPhone 17 Pro",
    series: "iPhone 17-serie",
    releaseYear: 2025,
    connector: "usb-c",
    features: ["magsafe", "qi"],
    charging: ["usb-pd"],
    widthMm: 71.9,
  },
  {
    id: "iphone-air",
    brandSlug: "apple",
    name: "iPhone Air",
    series: "iPhone 17-serie",
    releaseYear: 2025,
    connector: "usb-c",
    features: ["magsafe", "qi"],
    charging: ["usb-pd"],
    widthMm: 74.7,
  },
  {
    id: "iphone-17",
    brandSlug: "apple",
    name: "iPhone 17",
    series: "iPhone 17-serie",
    releaseYear: 2025,
    connector: "usb-c",
    features: ["magsafe", "qi"],
    charging: ["usb-pd"],
    widthMm: 71.5,
  },
  {
    id: "iphone-16-pro",
    brandSlug: "apple",
    name: "iPhone 16 Pro",
    series: "iPhone 16-serie",
    releaseYear: 2024,
    connector: "usb-c",
    features: ["magsafe", "qi"],
    charging: ["usb-pd"],
    widthMm: 71.5,
  },
  {
    id: "iphone-16",
    brandSlug: "apple",
    name: "iPhone 16",
    series: "iPhone 16-serie",
    releaseYear: 2024,
    connector: "usb-c",
    features: ["magsafe", "qi"],
    charging: ["usb-pd"],
    widthMm: 71.6,
  },
  {
    id: "iphone-15",
    brandSlug: "apple",
    name: "iPhone 15",
    series: "iPhone 15-serie",
    releaseYear: 2023,
    connector: "usb-c",
    features: ["magsafe", "qi"],
    charging: ["usb-pd"],
    widthMm: 71.6,
  },
  {
    id: "iphone-13",
    brandSlug: "apple",
    name: "iPhone 13",
    series: "iPhone 13-serie",
    releaseYear: 2021,
    connector: "lightning",
    features: ["magsafe", "qi"],
    charging: ["usb-pd"],
    widthMm: 71.5,
  },
  // Samsung
  {
    id: "galaxy-s25-ultra",
    brandSlug: "samsung",
    name: "Galaxy S25 Ultra",
    series: "Galaxy S-serie",
    releaseYear: 2025,
    connector: "usb-c",
    features: ["qi"],
    charging: ["usb-pd", "pps"],
    widthMm: 77.6,
  },
  {
    id: "galaxy-s25",
    brandSlug: "samsung",
    name: "Galaxy S25",
    series: "Galaxy S-serie",
    releaseYear: 2025,
    connector: "usb-c",
    features: ["qi"],
    charging: ["usb-pd", "pps"],
    widthMm: 70.5,
  },
  {
    id: "galaxy-s24",
    brandSlug: "samsung",
    name: "Galaxy S24",
    series: "Galaxy S-serie",
    releaseYear: 2024,
    connector: "usb-c",
    features: ["qi"],
    charging: ["usb-pd", "pps"],
    widthMm: 70.6,
  },
  {
    id: "galaxy-a56",
    brandSlug: "samsung",
    name: "Galaxy A56",
    series: "Galaxy A-serie",
    releaseYear: 2025,
    connector: "usb-c",
    features: [],
    charging: ["usb-pd", "pps"],
    widthMm: 77.5,
  },
];

const deviceById = new Map(devices.map((d) => [d.id, d]));

export function getDevice(id: string | null | undefined): Device | undefined {
  return id ? deviceById.get(id) : undefined;
}

export function getDeviceBrand(slug: string | null | undefined): DeviceBrand | undefined {
  return deviceBrands.find((b) => b.slug === slug);
}

export function getDevicesForBrand(brandSlug: string): Device[] {
  return devices.filter((d) => d.brandSlug === brandSlug);
}

/** Zoekt een toestel op basis van de weergavenaam (bv. Shopify-optiewaarde). */
export function findDeviceByName(name: string): Device | undefined {
  const needle = name.trim().toLowerCase();
  return devices.find((d) => {
    const brand = getDeviceBrand(d.brandSlug)?.name.toLowerCase() ?? "";
    const full = d.name.toLowerCase();
    return full === needle || `${brand} ${full}` === needle;
  });
}

export const connectorLabels: Record<Device["connector"], string> = {
  "usb-c": "USB-C",
  lightning: "Lightning",
};

export const featureLabels: Record<Device["features"][number], string> = {
  magsafe: "MagSafe / magnetisch laden",
  qi: "Draadloos laden (Qi)",
};

export const chargingLabels: Record<Device["charging"][number], string> = {
  "usb-pd": "USB Power Delivery",
  pps: "USB PD met PPS (Super Fast Charging)",
};
