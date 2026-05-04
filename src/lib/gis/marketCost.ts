/**
 * Market-anchored cost estimator. Replaces the static MODULES.estCost
 * × area-power scaling with real CHF/m² × physical scaling unit.
 *
 * ZH-only for now. For non-ZH addresses, this returns null and the
 * caller falls back to the existing scaleModule formula.
 */

import type { Building, ModuleId } from "@/data/types";
import type { Eligibility } from "./mapper";
import {
  BASEMENT_CHF_PER_M2,
  ELECTRICAL_BUNDLE_CHF,
  FACADE_CHF_PER_M2,
  HEATING_BASE_CHF,
  HEATING_CHF_PER_KW,
  PREMIUM_FACTOR,
  PREMIUM_GEMEINDEN_ZH,
  PV_PRICE_TIERS,
  ROOF_CHF_PER_M2,
  WINDOWS_CHF_PER_M2,
} from "@/data/marketRatesZh";
import {
  basementM2,
  facadeM2,
  heatingCapacityKw,
  roofM2,
  windowsM2,
} from "./buildingAreas";

export interface MarketCost {
  /** Total cost in CHF, rounded. */
  cost: number;
  /** Human-readable breakdown, e.g. "300 m² × CHF 320/m² = CHF 96,000". */
  breakdown: string;
  /** True when a regional premium (Stadt ZH / Goldküste) was applied. */
  premium: boolean;
}

const fmt = (n: number): string =>
  new Intl.NumberFormat("de-CH", { maximumFractionDigits: 0 }).format(
    Math.round(n),
  );

/** Solar tier lookup: highest tier whose `upToKwp` covers the size. */
const pvChfPerKwp = (kwp: number): number => {
  for (const tier of PV_PRICE_TIERS) {
    if (kwp <= tier.upToKwp) return tier.chfPerKwp;
  }
  return PV_PRICE_TIERS[PV_PRICE_TIERS.length - 1]!.chfPerKwp;
};

const baseCostFor = (
  id: ModuleId,
  building: Building,
  eligibility: Eligibility,
): { cost: number; breakdown: string } | null => {
  switch (id) {
    case "facade": {
      const m2 = facadeM2(building);
      const cost = m2 * FACADE_CHF_PER_M2;
      return {
        cost,
        breakdown: `${m2} m² Wandfläche × CHF ${FACADE_CHF_PER_M2}/m² = CHF ${fmt(cost)}`,
      };
    }
    case "roof": {
      const m2 = roofM2(building);
      const cost = m2 * ROOF_CHF_PER_M2;
      return {
        cost,
        breakdown: `${m2} m² Dachfläche × CHF ${ROOF_CHF_PER_M2}/m² = CHF ${fmt(cost)}`,
      };
    }
    case "windows": {
      const m2 = windowsM2(building);
      const cost = m2 * WINDOWS_CHF_PER_M2;
      return {
        cost,
        breakdown: `${m2} m² Fensterfläche × CHF ${WINDOWS_CHF_PER_M2}/m² = CHF ${fmt(cost)}`,
      };
    }
    case "basement": {
      const m2 = basementM2(building);
      const cost = m2 * BASEMENT_CHF_PER_M2;
      return {
        cost,
        breakdown: `${m2} m² Kellerdecke × CHF ${BASEMENT_CHF_PER_M2}/m² = CHF ${fmt(cost)}`,
      };
    }
    case "heating": {
      const kw = heatingCapacityKw(building);
      const cost = HEATING_BASE_CHF + kw * HEATING_CHF_PER_KW;
      return {
        cost,
        breakdown: `${kw} kW × CHF ${HEATING_CHF_PER_KW}/kW + CHF ${fmt(HEATING_BASE_CHF)} (Tankrückbau, WW) = CHF ${fmt(cost)}`,
      };
    }
    case "solar": {
      const kwp = Math.max(
        0,
        (eligibility.roofPvPotentialKw ?? 0) - eligibility.installedPvKw,
      );
      if (kwp <= 0) {
        return { cost: 0, breakdown: "Keine PV-Reserve auf dem Dach" };
      }
      const rate = pvChfPerKwp(kwp);
      const cost = kwp * rate;
      return {
        cost,
        breakdown: `${kwp.toFixed(1)} kWp × CHF ${rate}/kWp = CHF ${fmt(cost)}`,
      };
    }
    case "electrical": {
      return {
        cost: ELECTRICAL_BUNDLE_CHF,
        breakdown: `Pauschal: Verteiler-Upgrade + EV-Vorbereitung + Energiemanagement = CHF ${fmt(ELECTRICAL_BUNDLE_CHF)}`,
      };
    }
  }
};

/** Returns null when the building isn't in canton ZH (caller falls
 * back to the generic scaling formula). */
export const marketCostFor = (
  id: ModuleId,
  building: Building,
  eligibility: Eligibility | null,
): MarketCost | null => {
  if (!eligibility || eligibility.canton !== "ZH") return null;

  const base = baseCostFor(id, building, eligibility);
  if (!base) return null;

  const isPremium = PREMIUM_GEMEINDEN_ZH.has(eligibility.bfsGemeindeNr);
  const factor = isPremium ? PREMIUM_FACTOR : 1;
  const cost = Math.round(base.cost * factor);
  const suffix = isPremium
    ? ` · +${Math.round((PREMIUM_FACTOR - 1) * 100)}% Stadt/Goldküste`
    : "";

  return {
    cost,
    breakdown: `${base.breakdown}${suffix}`,
    premium: isPremium,
  };
};
