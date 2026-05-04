/**
 * Cheap property-value mock derived from BFS-style per-Gemeinde
 * medians × year/condition factors. Real-platform path uses IAZI /
 * Wüest / PriceHubble (paid). Numbers below are reasonable orders
 * of magnitude for residential CHF/m² (Wohnfläche basis), refresh
 * quarterly from BFS Wohneigentumspreisindex.
 */

import type { GwrAttributes } from "./types";
import type { GeakClass } from "./condition";

/** CHF/m² Wohnfläche by ZH BFS Gemeindenummer.
 * Sample of the 162 ZH municipalities — extend as needed.
 * Last verified: spring 2026, BFS / IAZI public medians. */
const ZH_PRICE_PER_M2: Record<number, number> = {
  // Bezirk Affoltern (rural Knonaueramt)
  1: 7000, // Aeugst am Albis
  2: 7800, // Affoltern am Albis
  3: 8000, // Bonstetten
  4: 7200, // Hausen am Albis
  6: 6500, // Kappel am Albis
  7: 7000, // Knonau
  8: 6500, // Maschwanden
  9: 7400, // Mettmenstetten
  10: 7600, // Obfelden
  11: 7400, // Ottenbach
  12: 6900, // Rifferswil
  13: 9200, // Stallikon
  14: 9500, // Wettswil am Albis
  // Bezirk Zürich (city)
  261: 17000, // Zürich (Stadt)
  // Goldküste
  151: 16000, // Zollikon
  154: 15500, // Küsnacht
  155: 14000, // Erlenbach
  156: 13500, // Herrliberg
  157: 12500, // Meilen
  158: 12000, // Uetikon am See
  159: 11500, // Männedorf
  160: 11000, // Stäfa
  // Pfannenstiel + linkes Ufer
  131: 11000, // Adliswil
  133: 12000, // Kilchberg
  136: 13500, // Rüschlikon
  138: 11500, // Thalwil
  295: 11500, // Horgen
  293: 11000, // Wädenswil
  // Winterthur + Glatttal
  230: 7800, // Winterthur
  53: 11500, // Wallisellen
  61: 10500, // Dübendorf
  62: 10000, // Dietlikon
  // Limmattal
  243: 9800, // Schlieren
  247: 10500, // Dietikon
};

const DEFAULT_ZH_M2 = 8500;
const DEFAULT_CH_M2 = 6500;

const yearFactor = (year: number): number => {
  if (year <= 1948) return 0.85;
  if (year <= 1978) return 0.92;
  if (year <= 1994) return 1.0;
  if (year <= 2010) return 1.05;
  return 1.12;
};

const conditionFactor = (geak: GeakClass): number => {
  switch (geak) {
    case "A":
      return 1.15;
    case "B":
      return 1.1;
    case "C":
      return 1.05;
    case "D":
      return 1.0;
    case "E":
      return 0.96;
    case "F":
      return 0.92;
    case "G":
      return 0.88;
  }
};

export interface ValuationInputs {
  gwr: Pick<GwrAttributes, "gdekt" | "ggdenr">;
  /** Heated reference area (m²). */
  ebfM2: number;
  /** Construction year. */
  year: number;
  /** Current GEAK class (drives the condition discount). */
  geak: GeakClass;
}

export const estimatePropertyValue = (inputs: ValuationInputs): number => {
  const base =
    inputs.gwr.gdekt === "ZH"
      ? (ZH_PRICE_PER_M2[inputs.gwr.ggdenr] ?? DEFAULT_ZH_M2)
      : DEFAULT_CH_M2;
  return Math.round(
    inputs.ebfM2 * base * yearFactor(inputs.year) * conditionFactor(inputs.geak),
  );
};
