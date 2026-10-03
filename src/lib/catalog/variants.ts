import { colorSlug } from "./colors";
import { getDevice } from "./devices";
import { DEVICE_OPTION, COLOR_OPTION, type Product, type ProductVariant } from "./types";

/**
 * Hulpfuncties voor variantkeuze op de productpagina (client en server).
 */

export type Selection = Record<string, string | undefined>;

function matches(variant: ProductVariant, selection: Selection, ignore?: string): boolean {
  return Object.entries(selection).every(
    ([name, value]) => name === ignore || value === undefined || variant.selectedOptions[name] === value,
  );
}

/** Variant die exact bij de volledige selectie hoort. */
export function findVariant(product: Product, selection: Selection): ProductVariant | undefined {
  if (product.options.some((o) => !selection[o.name])) return undefined;
  return product.variants.find((v) => matches(v, selection));
}

/** Status van een optiewaarde gegeven de overige keuzes. */
export function optionValueState(
  product: Product,
  selection: Selection,
  optionName: string,
  value: string,
): "available" | "soldout" | "none" {
  const candidates = product.variants.filter(
    (v) => v.selectedOptions[optionName] === value && matches(v, selection, optionName),
  );
  if (candidates.length === 0) return "none";
  return candidates.some((v) => v.availableForSale) ? "available" : "soldout";
}

/** Toestelnaam in de optie voor een toestel-ID, als het product die variant heeft. */
export function deviceOptionValue(product: Product, deviceId: string | null | undefined): string | undefined {
  if (!deviceId) return undefined;
  return product.variants.find((v) => v.deviceId === deviceId)?.selectedOptions[DEVICE_OPTION];
}

/**
 * Berekent de effectieve selectie.
 *
 * - Toestel: expliciete keuze > toestel uit URL > opgeslagen toestel. Is het
 *   gewenste toestel niet beschikbaar, dan blijft de keuze leeg; er wordt
 *   nooit automatisch een ander model gekozen. Alleen als er geen toestel
 *   bekend is én het product maar één model kent, wordt dat voorgeselecteerd.
 * - Overige opties: expliciete keuze > kleur uit URL > eerste leverbare waarde.
 */
export function resolveSelection(
  product: Product,
  picked: Selection,
  context: { urlDeviceId?: string; storedDeviceId?: string; urlColor?: string },
): Selection {
  const selection: Selection = {};
  const deviceOption = product.options.find((o) => o.name === DEVICE_OPTION);

  if (deviceOption) {
    const preferredId = context.urlDeviceId ?? context.storedDeviceId;
    selection[DEVICE_OPTION] =
      picked[DEVICE_OPTION] ??
      (preferredId
        ? deviceOptionValue(product, preferredId)
        : deviceOption.values.length === 1
          ? deviceOption.values[0]
          : undefined);
  }

  for (const option of product.options) {
    if (option.name === DEVICE_OPTION) continue;
    if (picked[option.name]) {
      selection[option.name] = picked[option.name];
      continue;
    }
    if (option.name === COLOR_OPTION && context.urlColor) {
      const fromUrl = option.values.find((v) => colorSlug(v) === context.urlColor);
      if (fromUrl) {
        selection[option.name] = fromUrl;
        continue;
      }
    }
    selection[option.name] =
      option.values.find((v) => optionValueState(product, selection, option.name, v) === "available") ??
      option.values.find((v) => optionValueState(product, selection, option.name, v) !== "none") ??
      option.values[0];
  }
  return selection;
}

/** Beelden die bij een variant horen (groep vanaf de variantfoto tot de volgende). */
export function imagesForVariant(product: Product, variant: ProductVariant | undefined) {
  const starts = [...new Set(product.variants.map((v) => v.imageIndex).filter((i): i is number => i !== undefined))].sort(
    (a, b) => a - b,
  );
  const start = variant?.imageIndex ?? starts[0];
  if (start === undefined || starts.length <= 1) return product.images;
  const end = starts.find((s) => s > start) ?? product.images.length;
  return product.images.slice(start, end);
}

export function deviceNameFor(id: string | undefined): string | undefined {
  return getDevice(id)?.name;
}
