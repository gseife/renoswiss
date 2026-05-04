/**
 * GWR enum lookups. Only the codes that appear in real Swiss residential
 * stock are mapped — unknowns fall back to a generic label so the UI never
 * shows a raw number.
 *
 * Sources: BFS GWR Merkmalskatalog (eCH-0206), BFE.
 */

import type { GwrAttributes } from "./types";

/** Building category (gkat). */
export const buildingTypeFromGwr = (g: Pick<GwrAttributes, "gkat" | "gklas" | "ganzwhg">): string => {
  // gkat 1020 = Wohngebäude. Distinguish SFH vs MFH by gklas + dwelling count.
  if (g.gkat === 1020) {
    // gklas: 1110 = SFH, 1121/1122 = small MFH, 1130 = MFH, 1212 = retirement
    if (g.gklas === 1110 || (g.ganzwhg ?? 0) <= 1) return "Einfamilienhaus";
    if (g.gklas === 1121 || g.gklas === 1122) return "Kleines Mehrfamilienhaus";
    if (g.gklas === 1130 || g.gklas === 1212) return "Mehrfamilienhaus";
    return "Wohngebäude";
  }
  if (g.gkat === 1030) return "Wohngebäude mit Nebennutzung";
  if (g.gkat === 1040) return "Gebäude mit teilweiser Wohnnutzung";
  if (g.gkat === 1060) return "Gebäude ohne Wohnnutzung";
  if (g.gkat === 1080) return "Sonderbau";
  return "Gebäude";
};

/**
 * Heating generator (gwaerzh1). Codes per eCH-0206 section
 * "Wärmeerzeuger Heizung".
 */
const HEATING_GENERATOR: Record<number, string> = {
  7400: "Keine",
  7410: "Wärmepumpe",
  7411: "Wärmepumpe (Erdsonde)",
  7420: "Thermische Solaranlage",
  7430: "Heizkessel",
  7431: "Heizkessel (Niedertemperatur)",
  7432: "Heizkessel (Kondensation)",
  7435: "Ofen",
  7436: "Wärmekraftkopplung",
  7440: "Elektrospeicher",
  7441: "Elektrowiderstand",
  7450: "Wärmetauscher",
  7460: "Fernwärme",
  7499: "Andere",
};

/** Heating energy source (genh1). */
const HEATING_SOURCE: Record<number, string> = {
  7500: "Keine",
  7501: "Luft",
  7510: "Erdwärme",
  7511: "Elektrizität",
  7512: "Gas",
  7513: "Heizöl",
  7514: "Holz",
  7515: "Sonne (thermisch)",
  7516: "Abwärme",
  7517: "Fernwärme",
  7518: "Kohle",
  7519: "Andere",
};

export const heatingLabelFromGwr = (
  g: Pick<GwrAttributes, "gwaerzh1" | "genh1" | "gwaerdath1">,
): string => {
  const gen = g.gwaerzh1 != null ? HEATING_GENERATOR[g.gwaerzh1] : null;
  const src = g.genh1 != null ? HEATING_SOURCE[g.genh1] : null;
  const year = parseGwrYear(g.gwaerdath1);

  if (!gen) return "Unbekannt";

  // Skip the source for cases where it is implied by the generator
  // (e.g. heat pump → "Wärmepumpe" not "Wärmepumpe (Luft)").
  const implied = gen.includes("Wärmepumpe") || gen.includes("Fernwärme") || gen.includes("Solaranlage");
  const body = implied || !src ? gen : `${gen} (${src})`;
  return year ? `${body} (${year})` : body;
};

/** Build period (gbaup) → mid-period year, used when gbauj is missing. */
const PERIOD_MID_YEAR: Record<number, number> = {
  8011: 1918, // before 1919
  8012: 1934, // 1919–1945
  8013: 1955, // 1946–1960
  8014: 1965, // 1961–1970
  8015: 1975, // 1971–1980
  8016: 1985, // 1981–1985
  8017: 1988, // 1986–1990
  8018: 1993, // 1991–1995
  8019: 1998, // 1996–2000
  8020: 2003, // 2001–2005
  8021: 2008, // 2006–2010
  8022: 2013, // 2011–2015
  8023: 2018, // 2016–2020
  8024: 2022, // 2021+
};

export const yearFromGwr = (g: Pick<GwrAttributes, "gbauj" | "gbaup">): number | null => {
  if (g.gbauj && g.gbauj > 1700) return g.gbauj;
  if (g.gbaup && PERIOD_MID_YEAR[g.gbaup]) return PERIOD_MID_YEAR[g.gbaup];
  return null;
};

/** Parse "DD.MM.YYYY" → year, returning null if not parseable. */
export const parseGwrYear = (s: string | null | undefined): number | null => {
  if (!s) return null;
  const m = /(\d{4})$/.exec(s);
  return m ? Number(m[1]) : null;
};

/** True if the heating source is electricity-driven (heat pump or direct). */
export const isElectricallyDriven = (
  g: Pick<GwrAttributes, "gwaerzh1" | "genh1">,
): boolean => {
  const gen = g.gwaerzh1;
  if (gen === 7410 || gen === 7411 || gen === 7440 || gen === 7441) return true;
  return g.genh1 === 7511;
};

/** True if the heating source is fossil (oil, gas, coal). */
export const isFossilHeating = (g: Pick<GwrAttributes, "genh1">): boolean => {
  return g.genh1 === 7512 || g.genh1 === 7513 || g.genh1 === 7518;
};
