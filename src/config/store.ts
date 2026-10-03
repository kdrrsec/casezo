/**
 * Winkelgegevens van Casezo.
 *
 * Alles wat `null` is, is nog niet aangeleverd door de eigenaar. De website
 * toont op die plekken een duidelijke markering "Nog in te vullen" in plaats
 * van verzonnen gegevens. Vul hier de echte gegevens in zodra ze bekend zijn.
 */
export type StoreConfig = {
  name: string;
  /** Korte omschrijving voor metadata en footer. */
  tagline: string;
  contact: {
    email: string | null;
    phone: string | null;
    /** Bv. "Maandag t/m vrijdag 9:00–17:00". */
    hours: string | null;
  };
  company: {
    legalName: string | null;
    address: string | null;
    kvk: string | null;
    vat: string | null;
  };
  shipping: {
    /** Bv. "PostNL". */
    carrier: string | null;
    /** Bv. "€ 4,95 binnen Nederland". */
    costs: string | null;
    /** Bv. "Op werkdagen voor 17:00 besteld, dezelfde dag verzonden". */
    dispatch: string | null;
    /** Landen waarnaar verzonden wordt. */
    countries: string | null;
  };
  returns: {
    /** Bedenktijd in dagen; wettelijk minimaal 14 dagen voor consumenten. */
    periodDays: number | null;
    /** Wie de retourkosten betaalt. */
    costs: string | null;
    /** Retouradres of -procedure. */
    address: string | null;
  };
};

export const storeConfig: StoreConfig = {
  name: "Casezo",
  tagline: "Telefoonhoesjes en accessoires die passen bij jouw toestel.",
  contact: {
    email: null,
    phone: null,
    hours: null,
  },
  company: {
    legalName: null,
    address: null,
    kvk: null,
    vat: null,
  },
  shipping: {
    carrier: null,
    costs: null,
    dispatch: null,
    countries: null,
  },
  returns: {
    periodDays: null,
    costs: null,
    address: null,
  },
};
