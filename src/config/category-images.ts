import type { StaticImageData } from "next/image";

import kabels from "../../public/categories/kabels.webp";
import houders from "../../public/categories/houders.webp";
import opladers from "../../public/categories/opladers.webp";
import powerbanks from "../../public/categories/powerbanks.webp";
import screenprotectors from "../../public/categories/screenprotectors.webp";
import telefoonhoesjes from "../../public/categories/telefoonhoesjes.webp";
import type { CategorySlug } from "@/lib/catalog/types";

/** Categoriebeelden voor de homepage. Vervang een bestand in public/categories om het te wijzigen. */
export const categoryImages: Record<CategorySlug, StaticImageData> = {
  telefoonhoesjes,
  screenprotectors,
  opladers,
  kabels,
  houders,
  powerbanks,
};

/** Zachte achtergrondtint per categorie, voor tegels en paginakoppen. */
export const categoryTints: Record<CategorySlug, string> = {
  telefoonhoesjes: "#dff1f4",
  screenprotectors: "#e6e9fb",
  opladers: "#ffeedb",
  kabels: "#e3f3e8",
  houders: "#fbe6ea",
  powerbanks: "#ece6fb",
};
