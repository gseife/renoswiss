/**
 * Cohort-based defaults for the four envelope-condition fields that the
 * GWR does not record (insulation / windows / roof / basement), plus the
 * GEAK letter derivation from kWh/m²·a.
 *
 * Cohorts chosen to match BFE Gebäudetypologie Schweiz break-points and
 * the stepwise tightening of SIA 380/1 (1980, 1995, 2010). Defaults
 * assume *no envelope retrofit*; callers may bump a cohort up when the
 * heating renewal date is recent (proxy for a wider retrofit).
 */

export type Cohort =
  | "<=1918"
  | "1919-1948"
  | "1949-1978"
  | "1979-1994"
  | "1995-2010"
  | "2011+";

export const cohortFromYear = (year: number): Cohort => {
  if (year <= 1918) return "<=1918";
  if (year <= 1948) return "1919-1948";
  if (year <= 1978) return "1949-1978";
  if (year <= 1994) return "1979-1994";
  if (year <= 2010) return "1995-2010";
  return "2011+";
};

export interface Condition {
  insulation: string;
  windows: string;
  roof: string;
  basement: string;
}

const TABLE: Record<Cohort, Condition> = {
  "<=1918": {
    insulation: "Keine / minimal (Originalmauerwerk)",
    windows: "Holz-Doppelfenster (oft ersetzt)",
    roof: "Unisoliertes Ziegeldach",
    basement: "Unisolierter Naturstein",
  },
  "1919-1948": {
    insulation: "Keine (5–10 cm bei Sanierung)",
    windows: "Kasten- oder ersetzte Doppelverglasung",
    roof: "Unisoliertes Ziegeldach",
    basement: "Unisoliert",
  },
  "1949-1978": {
    insulation: "Minimal (4–8 cm)",
    windows: "Original Doppelverglasung",
    roof: "Unisoliertes Betondach",
    basement: "Unisoliert",
  },
  "1979-1994": {
    insulation: "Leicht (8–12 cm, nach SIA 180:1980)",
    windows: "IV-Glas Doppelverglasung",
    roof: "Leichte Dämmung 8 cm",
    basement: "Teilweise gedämmt",
  },
  "1995-2010": {
    insulation: "Standard (14–18 cm)",
    windows: "Doppel-IV Low-E",
    roof: "Gedämmt 16 cm",
    basement: "Gedämmt",
  },
  "2011+": {
    insulation: "Minergie-konform (20+ cm)",
    windows: "Dreifachverglasung Low-E",
    roof: "Gedämmt 22+ cm",
    basement: "Gedämmt",
  },
};

const COHORT_ORDER: Cohort[] = [
  "<=1918",
  "1919-1948",
  "1949-1978",
  "1979-1994",
  "1995-2010",
  "2011+",
];

const bumpCohort = (c: Cohort, by: number): Cohort => {
  const i = COHORT_ORDER.indexOf(c);
  return COHORT_ORDER[Math.min(COHORT_ORDER.length - 1, i + by)];
};

export interface ConditionInputs {
  year: number;
  /** Year the heating was last renewed. Owners renewing heating often
   * also touch the envelope, so a recent renewal bumps the envelope
   * cohort up by one for older buildings (≤1978). */
  heatingRenewedYear?: number | null;
}

export const deriveCondition = (inputs: ConditionInputs): Condition => {
  const baseCohort = cohortFromYear(inputs.year);
  let cohort = baseCohort;
  if (
    inputs.heatingRenewedYear &&
    inputs.heatingRenewedYear - inputs.year > 5 &&
    COHORT_ORDER.indexOf(baseCohort) <= 2 // ≤ 1978
  ) {
    cohort = bumpCohort(baseCohort, 1);
  }
  return TABLE[cohort];
};

/**
 * GEAK letter from specific final energy demand (kWh/m²·a). Thresholds
 * approximate the SIA 380/1 boundaries used by the GEAK tool for the
 * Gebäudehülle axis. Real GEAK letters would come from the Verein GEAK
 * central DB; this is a defensible mock for unrated buildings.
 */
export type GeakClass = "A" | "B" | "C" | "D" | "E" | "F" | "G";

export const geakFromIntensity = (kwhPerM2Year: number): GeakClass => {
  if (kwhPerM2Year < 50) return "A";
  if (kwhPerM2Year < 80) return "B";
  if (kwhPerM2Year < 110) return "C";
  if (kwhPerM2Year < 140) return "D";
  if (kwhPerM2Year < 180) return "E";
  if (kwhPerM2Year < 230) return "F";
  return "G";
};

/** Heated reference area (Energiebezugsfläche, EBF) ~ footprint × storeys.
 * Real GWR has `gebf` for newer records; we fall back to this estimate. */
export const estimateEbfM2 = (
  footprintM2: number,
  storeys: number | null,
): number => {
  const floors = storeys && storeys > 0 ? storeys : 2;
  // Subtract 15% for unheated zones, walls, stairwells.
  return Math.round(footprintM2 * floors * 0.85);
};
