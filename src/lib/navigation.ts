import "server-only";

import {
  categories,
  deviceBrands,
  getDeviceMenu,
  getProductBrands,
  getProductTypes,
} from "@/lib/catalog";
import { slugify } from "@/lib/catalog/colors";
import type { CategorySlug } from "@/lib/catalog/types";

export type MenuLink = { label: string; href: string };
export type MenuColumn = { title: string; links: MenuLink[] };
export type MenuItem = {
  key: string;
  label: string;
  href: string;
  columns: MenuColumn[];
  footer: MenuLink;
};

const categoryHref = (slug: string, query?: Record<string, string>) => {
  const qs = query ? `?${new URLSearchParams(query).toString()}` : "";
  return `/categorie/${slug}${qs}`;
};

async function typeColumn(slug: CategorySlug, title = "Soort"): Promise<MenuColumn> {
  const types = await getProductTypes(slug);
  return {
    title,
    links: types.map((t) => ({ label: t, href: categoryHref(slug, { type: slugify(t) }) })),
  };
}

/** Navigatie met megamenu, opgebouwd uit de actuele catalogus. */
export async function getMainMenu(): Promise<MenuItem[]> {
  const items: MenuItem[] = [];

  for (const category of categories) {
    const columns: MenuColumn[] = [];

    if (category.deviceSpecific) {
      // Hoesjes en screenprotectors: per telefoonmerk en model, alleen modellen met producten.
      const groups = await getDeviceMenu(category.slug);
      for (const group of groups) {
        columns.push({
          title: group.brand.name,
          links: group.series.flatMap((s) =>
            s.devices.map((d) => ({ label: d.name, href: categoryHref(category.slug, { toestel: d.id }) })),
          ),
        });
      }
      columns.push(await typeColumn(category.slug));
    } else {
      columns.push(await typeColumn(category.slug));
      const extra: MenuLink[] = [];
      if (category.slug === "opladers" || category.slug === "houders" || category.slug === "powerbanks") {
        extra.push({ label: "MagSafe-compatibel", href: categoryHref(category.slug, { magsafe: "1" }) });
      }
      for (const brand of deviceBrands) {
        extra.push({
          label: `Geschikt voor ${brand.name}`,
          href: categoryHref(category.slug, { telefoonmerk: brand.slug }),
        });
      }
      columns.push({ title: "Snel naar", links: extra });
    }

    items.push({
      key: category.slug,
      label: category.name,
      href: categoryHref(category.slug),
      columns,
      footer: { label: `Alle ${category.name.toLowerCase()}`, href: categoryHref(category.slug) },
    });
  }

  const brands = await getProductBrands();
  items.push({
    key: "merken",
    label: "Merken",
    href: "/merken",
    columns: [
      {
        title: "Accessoires voor",
        links: deviceBrands.map((b) => ({ label: b.name, href: `/toestel/${b.slug}` })),
      },
      {
        title: "Productmerken",
        links: brands.map((b) => ({ label: b.name, href: `/merk/${b.slug}` })),
      },
    ],
    footer: { label: "Alle merken", href: "/merken" },
  });

  return items;
}
