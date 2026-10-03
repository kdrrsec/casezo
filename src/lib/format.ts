import type { Cents } from "@/lib/catalog/types";

const euro = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });

/** Formatteert eurocenten als "€ 24,95". */
export function formatPrice(cents: Cents): string {
  return euro.format(cents / 100);
}

export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
