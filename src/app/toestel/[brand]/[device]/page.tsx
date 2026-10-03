import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SaveDeviceButton } from "@/components/device/save-device-button";
import { ListingView } from "@/components/listing/listing-view";
import {
  categories,
  getDevice,
  getDeviceBrand,
  getDeviceCategoryCounts,
  getDevicesWithProducts,
  getListing,
} from "@/lib/catalog";
import { connectorLabels } from "@/lib/catalog/devices";

export async function generateStaticParams() {
  return (await getDevicesWithProducts()).map((d) => ({ brand: d.brandSlug, device: d.id }));
}

async function resolve(params: Promise<{ brand: string; device: string }>) {
  const { brand: brandSlug, device: deviceId } = await params;
  const device = getDevice(deviceId);
  const brand = getDeviceBrand(brandSlug);
  return device && brand && device.brandSlug === brand.slug ? { device, brand } : null;
}

export async function generateMetadata({ params }: PageProps<"/toestel/[brand]/[device]">): Promise<Metadata> {
  const found = await resolve(params);
  if (!found) return {};
  return {
    title: `Accessoires voor ${found.brand.name} ${found.device.name}`,
    description: `Hoesjes, screenprotectors, opladers en meer die passen bij de ${found.device.name}.`,
  };
}

export default async function DevicePage({ params, searchParams }: PageProps<"/toestel/[brand]/[device]">) {
  const found = await resolve(params);
  if (!found) notFound();
  const { device, brand } = found;

  const raw = await searchParams;
  const basePath = `/toestel/${brand.slug}/${device.id}`;
  const [result, counts] = await Promise.all([
    getListing({ deviceId: device.id }, raw, basePath),
    getDeviceCategoryCounts(device.id),
  ]);
  const activeCategory = typeof raw.categorie === "string" ? raw.categorie : null;

  const facts = [
    `Aansluiting: ${connectorLabels[device.connector]}`,
    `MagSafe: ${device.features.includes("magsafe") ? "ja" : "nee"}`,
    `Draadloos laden: ${device.features.includes("qi") ? "ja" : "nee"}`,
  ];

  return (
    <ListingView
      result={result}
      basePath={basePath}
      title={`Accessoires voor ${brand.name} ${device.name}`}
      breadcrumbs={[
        { label: "Merken", href: "/merken" },
        { label: brand.name, href: `/toestel/${brand.slug}` },
        { label: device.name },
      ]}
      intro={
        <div className="mb-8 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-surface px-4 py-3">
            <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-soft">
              {facts.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <SaveDeviceButton deviceId={device.id} name={device.name} />
          </div>
          <nav aria-label="Categorieën voor dit toestel">
            <ul className="flex gap-2 overflow-x-auto pb-1">
              <li>
                <Link
                  href={basePath}
                  scroll={false}
                  aria-current={!activeCategory ? "page" : undefined}
                  className={`block rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap ${
                    !activeCategory ? "border-primary bg-primary text-white" : "border-line-strong bg-white hover:border-ink-soft"
                  }`}
                >
                  Alles
                </Link>
              </li>
              {categories
                .filter((c) => counts[c.slug] > 0)
                .map((c) => {
                  const active = activeCategory === c.slug;
                  return (
                    <li key={c.slug}>
                      <Link
                        href={`${basePath}?categorie=${c.slug}`}
                        scroll={false}
                        aria-current={active ? "page" : undefined}
                        className={`block rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap ${
                          active ? "border-primary bg-primary text-white" : "border-line-strong bg-white hover:border-ink-soft"
                        }`}
                      >
                        {c.name} <span className={active ? "text-white/80" : "text-muted"}>({counts[c.slug]})</span>
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </nav>
        </div>
      }
    />
  );
}
