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
import { marketCostFor } from "./marketCost";
import {
  basementM2,
  facadeM2,
  heatingCapacityKw,
  roofM2,
  windowsM2,
} from "./buildingAreas";

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

/** Existing-system phrasing for the HP scope. We don't recommend an HP
 * for buildings already on a clean system (gated upstream), so the
 * phrasing only needs to cover fossil/wood/electric/unknown. */
const removalPhraseFor = (heatingLabel: string): string => {
  if (heatingLabel.includes("Heizöl")) return "oil tank removal";
  if (heatingLabel.includes("Gas")) return "gas connection capping";
  if (heatingLabel.includes("Holz")) return "wood-boiler removal";
  if (heatingLabel.includes("Elektro")) return "direct-electric heater removal";
  if (heatingLabel.includes("Heizkessel")) return "old boiler removal";
  return "old system removal";
};

const heatingDescFor = (b: Building): string => {
  const kw = heatingCapacityKw(b);
  return `Air-water heat pump (${kw} kW), including ${removalPhraseFor(b.heating)}, new hot water cylinder, controls`;
};

/** Typical residential window area, used to translate the glazed-area
 * estimate into a count consumers can picture. */
const TYPICAL_WINDOW_M2 = 2;
const windowsDescFor = (b: Building): string => {
  const count = Math.max(2, Math.round(windowsM2(b) / TYPICAL_WINDOW_M2));
  return `${count}× triple-glazed windows with thermal break frames, 2× insulated entrance doors`;
};

const facadeDescFor = (b: Building): string =>
  `ETICS Kompaktfassade, mineral wool 20cm, new render — ~${facadeM2(b)} m² wall area`;

const roofDescFor = (b: Building): string =>
  `Aufsparrendämmung 24cm + new membrane and tiles — ~${roofM2(b)} m² roof surface`;

const basementDescFor = (b: Building): string =>
  `Foam boards 12cm on basement ceiling, vapour barrier — ~${basementM2(b)} m² ceiling`;

const electricalDescFor = (b: Building): string => {
  const hasHp = b.heating.includes("Wärmepumpe");
  return hasHp
    ? "EV-charger prep + smart energy-management bundle"
    : "Panel upgrade for heat pump, EV-charger prep, smart energy management";
};

export const scaleModule = (m: Module, ctx: ScaleContext): Module => {
  const { building, eligibility } = ctx;
  const ss = savingScale(m.id, building, eligibility);

  let desc = m.desc;
  if (m.id === "solar") desc = solarDescFor(solarHeadroomKw(eligibility));
  else if (m.id === "heating") desc = heatingDescFor(building);
  else if (m.id === "windows") desc = windowsDescFor(building);
  else if (m.id === "facade") desc = facadeDescFor(building);
  else if (m.id === "roof") desc = roofDescFor(building);
  else if (m.id === "basement") desc = basementDescFor(building);
  else if (m.id === "electrical") desc = electricalDescFor(building);

  // ZH path: anchor cost in real CHF/m² × physical scaling unit.
  // Falls through to the generic area-power formula for other cantons.
  const market = marketCostFor(m.id, building, eligibility);
  const estCost = market
    ? market.cost
    : Math.round(m.estCost * costScale(m.id, building, eligibility));

  return {
    ...m,
    desc,
    estCost,
    energySaving: Math.round(m.energySaving * ss),
    co2Saving: Math.round(m.co2Saving * ss * 10) / 10,
  };
};

export const scaleModules = (modules: Module[], ctx: ScaleContext): Module[] =>
  modules.map((m) => scaleModule(m, ctx));
