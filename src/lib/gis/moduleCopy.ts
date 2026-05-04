/**
 * Per-module reason copy, derived from live building + eligibility.
 * Falls back to the module's static `reason` field when there's no
 * live data (the demo path) or when no dynamic angle improves on it.
 *
 * Returning the same static string from a dynamic function is a no-op;
 * returning a *different* string replaces the static copy in the UI.
 */

import type { Building, ModuleId } from "@/data/types";
import type { Eligibility } from "./mapper";

export interface CopyContext {
  building: Building;
  eligibility: Eligibility | null;
  /** Injected for deterministic tests. */
  now?: Date;
}

type CopyFn = (ctx: CopyContext) => string | null;

const isClean = (heating: string): boolean =>
  heating.includes("Wärmepumpe") ||
  heating.includes("Fernwärme") ||
  heating.includes("Solar");

const COPY: Partial<Record<ModuleId, CopyFn>> = {
  facade: ({ building }) => {
    if (building.year > 2010) return null;
    return `${building.year}-vintage facade. ${building.insulation} — typically the single largest heat-loss source for buildings of this cohort.`;
  },

  roof: ({ building }) => {
    if (building.year > 2010) return null;
    return `${building.roof}. Roof typically accounts for ~25% of heat loss in ${building.year}-era stock.`;
  },

  heating: ({ building, eligibility }) => {
    // Gated cards render the gate reason instead — no copy needed.
    if (eligibility?.heatingRecentlyRenewed) return null;
    if (isClean(building.heating)) return null;
    return `${building.heating} is ${building.heatingAge} years old (typical lifespan 20–25 years). Heat-pump replacement halves CO₂ and unlocks federal Gebäudeprogramm subsidies.`;
  },

  windows: ({ building }) => {
    if (
      building.windows.includes("Dreifach") ||
      building.windows.includes("Triple")
    ) {
      return null;
    }
    return `${building.windows}. Triple-glazing upgrade cuts U-value 30–40% and removes thermal bridges at the frames.`;
  },

  solar: ({ eligibility }) => {
    if (eligibility?.pvAlreadyInstalled) return null;
    return `Federal sonnendach indicates suitable roof potential at this address. Pairs especially well with a heat pump or EV.`;
  },

  basement: ({ building }) => {
    if (building.basement.includes("Gedämmt")) return null;
    return `${building.basement}. Ceiling insulation is one of the cheapest CHF/kWh measures available — usually pays back in under 8 years.`;
  },

  electrical: ({ building, eligibility }) => {
    // If the heating is already a HP, the panel is presumably sized.
    if (isClean(building.heating) && !eligibility?.pvAlreadyInstalled) {
      return "Existing heat pump in place; recommend EV-charger prep + smart energy management.";
    }
    return null;
  },
};

/**
 * Returns the reason copy to show on a module card. Always returns
 * a non-empty string; falls back to the module's static `reason`.
 */
export const reasonForModule = (
  id: ModuleId,
  staticReason: string,
  ctx: CopyContext,
): string => {
  const fn = COPY[id];
  return fn?.(ctx) ?? staticReason;
};
