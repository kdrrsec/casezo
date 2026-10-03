import { getCategory } from "./categories";
import { deviceIdsOf } from "./compatibility";
import { devices, getDeviceBrand } from "./devices";
import type { Device, Product } from "./types";

const STOPWORDS = new Set(["voor", "de", "het", "een", "met", "en", "van", "of", "mijn", "je", "jouw"]);

export function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Herkent een toestel in de zoekopdracht ("hoesje iphone 16 pro").
 * Het langste passende toestel wint, zodat "iPhone 16 Pro" niet als
 * "iPhone 16" wordt gelezen. Geeft het toestel en de resterende tekst terug.
 */
export function detectDevice(query: string): { device?: Device; rest: string } {
  const q = ` ${normalize(query)} `;
  let best: { device: Device; phrase: string } | undefined;
  for (const device of devices) {
    const name = normalize(device.name);
    const brand = normalize(getDeviceBrand(device.brandSlug)?.name ?? "");
    const candidates = [name, `${brand} ${name}`, name.replace(/^galaxy /, "")];
    for (const phrase of candidates) {
      if (q.includes(` ${phrase} `) && (!best || phrase.length > best.phrase.length)) {
        best = { device, phrase };
      }
    }
  }
  if (!best) return { rest: query };
  return { device: best.device, rest: q.replace(` ${best.phrase} `, " ").trim() };
}

function tokens(query: string): string[] {
  return normalize(query)
    .split(" ")
    .filter((t) => t && !STOPWORDS.has(t));
}

/** Geeft een relevantiescore; 0 betekent geen treffer. */
export function scoreProduct(product: Product, query: string): number {
  const terms = tokens(query);
  if (terms.length === 0) return 1;

  const category = getCategory(product.category);
  const fields: [string, number][] = [
    [normalize(product.title), 6],
    [normalize(product.brand), 5],
    [normalize(product.productType), 4],
    [normalize(`${category?.name ?? ""} ${category?.singular ?? ""}`), 3],
    [
      normalize(
        deviceIdsOf(product)
          .map((id) => devices.find((d) => d.id === id)?.name ?? "")
          .join(" "),
      ),
      2,
    ],
    [
      normalize(
        [
          ...product.tags,
          ...product.highlights,
          product.material ?? "",
          product.magsafe ? "magsafe magnetisch" : "",
          ...product.variants.map((v) => v.color?.name ?? ""),
          ...product.specs.map((s) => s.value),
        ].join(" "),
      ),
      1,
    ],
  ];

  let score = 0;
  for (const term of terms) {
    let best = 0;
    for (const [text, weight] of fields) {
      if (!text.includes(term)) continue;
      // Hele woorden tellen zwaarder dan deeltreffers.
      const whole = ` ${text} `.includes(` ${term} `);
      best = Math.max(best, whole ? weight : weight * 0.6);
    }
    if (best === 0) return 0;
    score += best;
  }
  return score;
}
