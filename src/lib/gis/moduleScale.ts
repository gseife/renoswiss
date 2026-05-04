/**
 * Scale a static `Module` (calibrated to a 185 m² SFH demo) to the
 * actual building. Cost scales by area-derived factors per module;
 * savings scale linearly with annualEnergy. Solar is special-cased:
 * sized to the *headroom* on the roof (potential − installed).
 *
 * The static `MODULES` array stays the calibration baseline so the
 * demo path (no live data) keeps its hand-tuned numbers.
 */

import type { Building, Module, ModuleId } from "@/data/types";
import type { Eligibility } from "./mapper";

/** Calibration baseline (matches src/data/building.ts). */
const BASE_AREA_M2 = 185;
const BASE_ENERGY_KWH = 28_400;
const BASE_SOLAR_KWP = 8.4;
const PANEL_KW = 0.4;

export interface ScaleContext {
  building: Building;
  eligibility: Eligibility | null;
}

/** Each module's cost scaling. Keep formulas physically motivated so
 * the numbers stay defensible. */
const costScale = (id: ModuleId, b: Building, e: Eligibility | null): number => {
  const r = Math.max(0.5, b.area / BASE_AREA_M2);
  switch (id) {
    case "facade":
      // Facade area scales sublinearly with floor area (perimeter ∝ √A).
      return Math.pow(r, 0.7);
    case "roof":
      // Pitched roof ≈ footprint × 1.15. Footprint ≈ floor area / storeys.
      return r / Math.max(1, (b.floors || 2) / 2);
    case "heating": {
      // HP capacity scales sublinearly with demand.
      return Math.pow(r, 0.6);
    }
    case "windows":
      // Window count ∝ floor area (≈ rooms).
      return r;
    case "solar":
      return solarHeadroomKw(e) / BASE_SOLAR_KWP;
    case "basement":
      // Footprint scaling.
      return r / Math.max(1, (b.floors || 2) / 2);
    case "electrical":
      // Mostly flat — panel + EV charger doesn't depend on house size.
      return 1;
  }
};

const savingScale = (id: ModuleId, b: Building, e: Eligibility | null): number => {
  if (id === "solar") return solarHeadroomKw(e) / BASE_SOLAR_KWP;
  // Envelope + heating savings scale with the heating bill.
  return Math.max(0.3, b.annualEnergy / BASE_ENERGY_KWH);
};

const solarHeadroomKw = (e: Eligibility | null): number => {
  const potential = e?.roofPvPotentialKw ?? BASE_SOLAR_KWP;
  const installed = e?.installedPvKw ?? 0;
  return Math.max(0, potential - installed);
};

const solarDescFor = (kwp: number): string => {
  const panels = Math.max(1, Math.round(kwp / PANEL_KW));
  return `${kwp.toFixed(1)} kWp rooftop PV (${panels} panels), battery storage option, smart inverter`;
};

export const scaleModule = (m: Module, ctx: ScaleContext): Module => {
  const { building, eligibility } = ctx;
  const cs = costScale(m.id, building, eligibility);
  const ss = savingScale(m.id, building, eligibility);

  const desc =
    m.id === "solar"
      ? solarDescFor(solarHeadroomKw(eligibility))
      : m.desc;

  return {
    ...m,
    desc,
    estCost: Math.round(m.estCost * cs),
    energySaving: Math.round(m.energySaving * ss),
    co2Saving: Math.round(m.co2Saving * ss * 10) / 10,
  };
};

export const scaleModules = (modules: Module[], ctx: ScaleContext): Module[] =>
  modules.map((m) => scaleModule(m, ctx));
