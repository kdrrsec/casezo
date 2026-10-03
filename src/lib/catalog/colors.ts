import type { ColorValue } from "./types";

/**
 * Kleurnamen met bijbehorende staalkleur. Shopify kan ook zelf stalen leveren
 * (optionValues.swatch); deze tabel is de terugvaloptie.
 */
const palette: Record<string, string> = {
  zwart: "#1f2226",
  wit: "#f5f5f2",
  transparant: "#dfe6ee",
  grijs: "#8a9099",
  marineblauw: "#1f2f54",
  blauw: "#2f5fa8",
  salie: "#a3b39a",
  zand: "#d8c6a5",
  bruin: "#6b4a33",
  cognac: "#9a5a2c",
  donkergroen: "#2f4a3a",
  groen: "#3f7a57",
  roze: "#e7b9c4",
  lavendel: "#b8acd9",
  mint: "#a9dcc7",
  titanium: "#b9b4ab",
};

export function colorFor(name: string, hex?: string | null): ColorValue {
  return { name, hex: hex ?? palette[name.trim().toLowerCase()] ?? "#9aa0a6" };
}

export function colorSlug(name: string): string {
  return slugify(name);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
