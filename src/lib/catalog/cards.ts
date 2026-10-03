import { compatibilitySummary } from "./compatibility";
import type { Cents, Product, ProductImage, ProductVariant } from "./types";

/** Serialiseerbare gegevens voor een productkaart. */
export type ProductCardData = {
  id: string;
  handle: string;
  title: string;
  brand: string;
  href: string;
  image: ProductImage | null;
  price: Cents;
  /** True als de getoonde prijs een vanaf-prijs is. */
  priceFrom: boolean;
  compareAtPrice?: Cents;
  stock: StockState;
  compatibility: string;
};

export type StockState = { status: "in" | "low" | "out"; label: string };

export function stockState(variants: ProductVariant[]): StockState {
  const available = variants.filter((v) => v.availableForSale);
  if (available.length === 0) return { status: "out", label: "Uitverkocht" };
  const known = available.map((v) => v.quantityAvailable).filter((q): q is number => q !== undefined);
  const total = known.length === available.length ? known.reduce((a, b) => a + b, 0) : undefined;
  if (total !== undefined && total <= 3) {
    return { status: "low", label: `Nog ${total} op voorraad` };
  }
  return { status: "in", label: "Op voorraad" };
}

type CardOptions = {
  /** Varianten die bij de huidige filters passen; standaard alle varianten. */
  variants?: ProductVariant[];
  /** Toestel-ID dat in link en compatibiliteitsregel wordt meegegeven. */
  deviceId?: string;
  /** Kleur-slug die in de link wordt meegegeven. */
  colorSlug?: string;
};

export function toCardData(product: Product, options: CardOptions = {}): ProductCardData {
  const variants = options.variants?.length ? options.variants : product.variants;
  const prices = variants.map((v) => v.price);
  const minPrice = Math.min(...prices);
  // Toon bij voorkeur het beeld van een leverbare variant.
  const lead = variants.find((v) => v.availableForSale) ?? variants[0];
  const image = product.images[lead?.imageIndex ?? 0] ?? product.images[0] ?? null;

  const params = new URLSearchParams();
  if (options.deviceId) params.set("toestel", options.deviceId);
  if (options.colorSlug) params.set("kleur", options.colorSlug);
  const qs = params.toString();

  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    brand: product.brand,
    href: `/product/${product.handle}${qs ? `?${qs}` : ""}`,
    image,
    price: minPrice,
    priceFrom: prices.some((p) => p !== minPrice),
    compareAtPrice: variants.find((v) => v.price === minPrice)?.compareAtPrice,
    stock: stockState(variants),
    compatibility: compatibilitySummary(product, options.deviceId),
  };
}
