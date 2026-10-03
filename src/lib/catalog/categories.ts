import type { Category, CategorySlug } from "./types";

/** Hoofdcategorieën in navigatievolgorde. */
export const categories: Category[] = [
  {
    slug: "telefoonhoesjes",
    name: "Telefoonhoesjes",
    singular: "Telefoonhoesje",
    description:
      "Hoesjes voor jouw exacte toestel: van dunne transparante cases tot bookcases met pasjesvak.",
    deviceSpecific: true,
  },
  {
    slug: "screenprotectors",
    name: "Screenprotectors",
    singular: "Screenprotector",
    description:
      "Gehard glas, privacyglas en folie die precies op het scherm van jouw model passen.",
    deviceSpecific: true,
  },
  {
    slug: "opladers",
    name: "Opladers",
    singular: "Oplader",
    description:
      "Snelladers, draadloze laders en autoladers. Per product staat welke laadstandaard je toestel nodig heeft.",
    deviceSpecific: false,
  },
  {
    slug: "kabels",
    name: "Kabels",
    singular: "Kabel",
    description: "Laad- en datakabels met USB-C of Lightning, in verschillende lengtes.",
    deviceSpecific: false,
  },
  {
    slug: "houders",
    name: "Houders",
    singular: "Houder",
    description: "Telefoonhouders voor auto, fiets en bureau, magnetisch of met klem.",
    deviceSpecific: false,
  },
  {
    slug: "powerbanks",
    name: "Powerbanks",
    singular: "Powerbank",
    description: "Extra energie onderweg: compacte, magnetische en krachtige powerbanks.",
    deviceSpecific: false,
  },
];

export function getCategory(slug: string | null | undefined): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function isCategorySlug(value: string): value is CategorySlug {
  return categories.some((c) => c.slug === value);
}
