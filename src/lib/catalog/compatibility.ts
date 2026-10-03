import { chargingLabels, connectorLabels, featureLabels, getDevice } from "./devices";
import type { Device, Product, ProductVariant } from "./types";

/** Varianten die exact voor dit toestel bedoeld zijn (alleen bij `device`-compatibiliteit). */
function deviceVariants(product: Product, deviceId: string): ProductVariant[] {
  return product.variants.filter((v) => v.deviceId === deviceId);
}

/**
 * Past dit product bij het toestel?
 *
 * Toestelgebonden producten passen alleen als er een variant voor exact dit
 * model bestaat. Regelgebaseerde producten passen alleen als het toestel aan
 * alle expliciet opgegeven eisen voldoet; zonder eisen past er niets.
 */
export function isCompatible(product: Product, device: Device): boolean {
  const compat = product.compatibility;
  if (compat.kind === "device") {
    return deviceVariants(product, device.id).length > 0;
  }

  const checks: boolean[] = [];
  if (compat.connectorsAny?.length) {
    checks.push(compat.connectorsAny.includes(device.connector));
  }
  if (compat.featuresAll?.length) {
    checks.push(compat.featuresAll.every((f) => device.features.includes(f)));
  }
  if (compat.chargingAny?.length) {
    checks.push(compat.chargingAny.some((c) => device.charging.includes(c)));
  }
  if (compat.widthMm) {
    checks.push(device.widthMm >= compat.widthMm.min && device.widthMm <= compat.widthMm.max);
  }
  return checks.length > 0 && checks.every(Boolean);
}

/** Varianten die bij een toestel horen; bij regelgebaseerde producten alle varianten. */
export function variantsForDevice(product: Product, device: Device): ProductVariant[] {
  if (!isCompatible(product, device)) return [];
  return product.compatibility.kind === "device"
    ? deviceVariants(product, device.id)
    : product.variants;
}

/** Alle toestellen waarvoor een toestelgebonden product varianten heeft. */
export function deviceIdsOf(product: Product): string[] {
  const ids = new Set<string>();
  for (const v of product.variants) if (v.deviceId) ids.add(v.deviceId);
  return [...ids];
}

/** Leesbare eisen van een regelgebaseerd product, voor productpagina's. */
export function describeRequirements(product: Product): string[] {
  const compat = product.compatibility;
  if (compat.kind !== "rules") return [];
  const lines: string[] = [];
  if (compat.connectorsAny?.length) {
    lines.push(
      `Aansluiting op je toestel: ${compat.connectorsAny.map((c) => connectorLabels[c]).join(" of ")}`,
    );
  }
  if (compat.featuresAll?.length) {
    lines.push(`Je toestel moet ondersteunen: ${compat.featuresAll.map((f) => featureLabels[f]).join(" en ")}`);
  }
  if (compat.chargingAny?.length) {
    lines.push(
      `Snelladen vereist: ${compat.chargingAny.map((c) => chargingLabels[c]).join(" of ")}`,
    );
  }
  if (compat.widthMm) {
    lines.push(
      `Geschikt voor toestellen van ${compat.widthMm.min} tot ${compat.widthMm.max} mm breed (zonder hoesje)`,
    );
  }
  return lines;
}

/** Korte compatibiliteitsregel voor productkaarten. */
export function compatibilitySummary(product: Product, deviceId?: string): string {
  const device = getDevice(deviceId);
  if (device) return `Geschikt voor ${device.name}`;

  if (product.compatibility.kind === "device") {
    const names = deviceIdsOf(product)
      .map((id) => getDevice(id)?.name)
      .filter((n): n is string => Boolean(n));
    if (names.length === 0) return "";
    if (names.length <= 2) return `Voor ${names.join(" en ")}`;
    return `Voor ${names[0]} en ${names.length - 1} andere modellen`;
  }

  const compat = product.compatibility;
  if (compat.featuresAll?.includes("magsafe")) return "Voor toestellen met MagSafe";
  if (compat.featuresAll?.includes("qi")) return "Voor toestellen met Qi-laden";
  if (compat.connectorsAny?.length) {
    return `Voor toestellen met ${compat.connectorsAny.map((c) => connectorLabels[c]).join(" of ")}`;
  }
  if (compat.chargingAny?.includes("pps") && !compat.chargingAny.includes("usb-pd")) {
    return "Voor toestellen met PPS-snelladen";
  }
  if (compat.chargingAny?.length) return "Voor toestellen met USB Power Delivery";
  if (compat.widthMm) return `Toestelbreedte ${compat.widthMm.min}–${compat.widthMm.max} mm`;
  return "";
}
