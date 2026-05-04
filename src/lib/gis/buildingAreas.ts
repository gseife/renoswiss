/**
 * Pure geometry helpers used by both the subsidy estimator (HFM 2015
 * CHF/m² rates) and the market-cost estimator. They translate the
 * building's `area` (heated EBF) into the physical scaling unit each
 * measure is priced against.
 *
 * All formulas assume a roughly square footprint — fine for a first-
 * order estimate, would be replaced with the real footprint polygon
 * (already available from GWR) for a paid version.
 */

import type { Building } from "@/data/types";

/** Outer wall area available for facade insulation, in m².
 * Perimeter (4 × √footprint) × wall height (storeys × 2.7m), minus
 * 30% for windows / doors / roof overhangs. */
export const facadeM2 = (b: Building): number => {
  const footprint = b.area / Math.max(1, b.floors);
  const perimeter = 4 * Math.sqrt(footprint);
  const wallHeight = (b.floors || 2) * 2.7;
  return Math.round(perimeter * wallHeight * 0.7);
};

/** Pitched-roof surface area ≈ footprint × 1.15. */
export const roofM2 = (b: Building): number =>
  Math.round((b.area / Math.max(1, b.floors)) * 1.15);

/** Basement ceiling area = footprint. */
export const basementM2 = (b: Building): number =>
  Math.round(b.area / Math.max(1, b.floors));

/** Glazed area, ~16% of heated floor area for typical Swiss residential
 * stock. Replaces the constant 14× from the static demo string. */
export const windowsM2 = (b: Building): number =>
  Math.round(b.area * 0.16);

/** Heat-pump capacity (kW) sized to the building. Heuristic:
 * 45 W/m² of heated EBF for unrenovated stock, capped to a sensible
 * residential range. Matches typical SIA 384/2 sizing for retrofit
 * cases without doing a full heat-loss calculation. */
export const heatingCapacityKw = (b: Building): number => {
  const raw = b.area * 0.045;
  return Math.max(8, Math.min(40, Math.round(raw * 10) / 10));
};
