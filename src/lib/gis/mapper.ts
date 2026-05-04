/**
 * Assemble a `Building` (the shape the UI consumes) from the raw
 * federal sources. Pure functions only — no I/O.
 */

import type { Building } from "@/data/types";
import {
  buildingTypeFromGwr,
  heatingLabelFromGwr,
  isElectricallyDriven,
  isFossilHeating,
  parseGwrYear,
  yearFromGwr,
} from "./codes";
import {
  deriveCondition,
  estimateEbfM2,
  geakFromIntensity,
} from "./condition";
import type {
  GwrAttributes,
  PvInstallation,
  SolarRoofPotential,
} from "./types";

/** CHF/kWh price by fuel, 2026 retail estimates. */
const FUEL_PRICE_CHF_PER_KWH = {
  electricity: 0.27,
  oil: 0.105,
  gas: 0.115,
  district: 0.12,
  wood: 0.08,
} as const;

/** kg CO₂ per kWh delivered, useful-heat basis. */
const EMISSION_FACTOR_KG_PER_KWH = {
  electricity: 0.04,
  oil: 0.3,
  gas: 0.2,
  district: 0.06,
  wood: 0.02,
  hp: 0.04,
} as const;

const HP_COP = 3.5;

export interface MappedAddress {
  /** Canonical "Strasse Nr, PLZ Ort" — built from GWR fields when the
   * caller doesn't already have a clean label. */
  fallbackAddress: string;
}

export const fallbackAddressFromGwr = (g: GwrAttributes): string => {
  const plz = g.plz_plz6.split("/")[0]?.trim() || "";
  return `${g.strname_deinr}, ${plz} ${g.ggdename}`.trim();
};

export interface Eligibility {
  /** Heating renewed in the last `recentYearsThreshold` years. */
  heatingRecentlyRenewed: boolean;
  /** Same, for DHW. */
  dhwRecentlyRenewed: boolean;
  /** A PV installation is registered for this address in the HKN system. */
  pvAlreadyInstalled: boolean;
  /** Total kWp already installed (0 when none). */
  installedPvKw: number;
  /** Year the heating was renewed, if known. */
  heatingRenewedYear: number | null;
  /** Roof PV potential in kWp from sonnendach (full installable size,
   * not "headroom" — subtract installedPvKw to get extension headroom). */
  roofPvPotentialKw: number | null;
}

/** Sonnendach kWh→kWp factor (Swiss average annual yield). */
const PV_YIELD_KWH_PER_KWP = 1100;

export interface MapperInputs {
  gwr: GwrAttributes;
  /** Override the address label (e.g. the autocomplete pick). */
  addressLabel?: string;
  solar?: SolarRoofPotential | null;
  pvInstallations?: PvInstallation[];
  /** "Today" — injectable for deterministic tests. */
  now?: Date;
  /** Window for "recently renewed" eligibility checks. */
  recentYearsThreshold?: number;
}

export interface MapperResult {
  building: Building;
  eligibility: Eligibility;
}

export const mapToBuilding = (inputs: MapperInputs): MapperResult => {
  const { gwr, solar, pvInstallations, now = new Date() } = inputs;
  const recentThreshold = inputs.recentYearsThreshold ?? 5;
  const currentYear = now.getFullYear();

  const year = yearFromGwr(gwr) ?? currentYear - 50;
  const type = buildingTypeFromGwr(gwr);
  const footprint = gwr.garea ?? 150;
  const ebf = estimateEbfM2(footprint, gwr.gastw);
  const heatingRenewedYear = parseGwrYear(gwr.gwaerdath1);
  const dhwRenewedYear = parseGwrYear(gwr.gwaerdatw1);
  const heatingAge =
    heatingRenewedYear != null ? Math.max(0, currentYear - heatingRenewedYear) : 25;

  const condition = deriveCondition({ year, heatingRenewedYear });

  // Useful heat from BFE per-building model when available, else cohort
  // intensity × EBF (rough: 150 kWh/m²·a for unrenovated pre-1980, 90 for
  // post-1995, 60 for post-2010).
  const fallbackIntensity =
    year <= 1978 ? 150 : year <= 1994 ? 110 : year <= 2010 ? 90 : 60;
  const heatingDemand = solar?.heatingDemandKwh ?? Math.round(ebf * fallbackIntensity);
  const dhwDemand = solar?.dhwDemandKwh ?? Math.round(ebf * 22);
  const usefulHeatKwh = heatingDemand + dhwDemand;

  // Energy delivered + cost depend on the heating system.
  const electric = isElectricallyDriven(gwr);
  const fossil = isFossilHeating(gwr);
  const annualEnergy = electric ? Math.round(usefulHeatKwh / HP_COP) : usefulHeatKwh;
  const fuelKey: keyof typeof FUEL_PRICE_CHF_PER_KWH = electric
    ? "electricity"
    : gwr.genh1 === 7513
      ? "oil"
      : gwr.genh1 === 7512
        ? "gas"
        : gwr.genh1 === 7517
          ? "district"
          : gwr.genh1 === 7514
            ? "wood"
            : "oil";
  const annualCost = Math.round(annualEnergy * FUEL_PRICE_CHF_PER_KWH[fuelKey]);

  const co2Factor = electric
    ? EMISSION_FACTOR_KG_PER_KWH.hp
    : EMISSION_FACTOR_KG_PER_KWH[fuelKey];
  const co2 = Math.round((annualEnergy * co2Factor) / 100) / 10; // tonnes, 1dp

  // GEAK from intensity. For HP-heated buildings the *envelope* intensity
  // is what matters (useful heat / EBF), not the electrical input.
  const intensityForGeak = usefulHeatKwh / Math.max(ebf, 1);
  const geakClass = geakFromIntensity(intensityForGeak);

  // Property value: keep a rough mock for now (Step 5 replaces with BFS hedonic).
  // CHF/m² placeholder — varies by canton in real data.
  const pricePerM2 = gwr.gdekt === "ZH" ? 6500 : 5500;
  const yearFactor =
    year <= 1948 ? 0.85 : year <= 1978 ? 0.92 : year <= 1994 ? 1.0 : year <= 2010 ? 1.05 : 1.12;
  const conditionFactor =
    geakClass === "A" || geakClass === "B"
      ? 1.1
      : geakClass === "C"
        ? 1.05
        : geakClass === "D"
          ? 1.0
          : geakClass === "E"
            ? 0.96
            : geakClass === "F"
              ? 0.92
              : 0.88;
  const estimatedValue = Math.round(ebf * pricePerM2 * yearFactor * conditionFactor);

  const building: Building = {
    address: inputs.addressLabel ?? fallbackAddressFromGwr(gwr),
    year,
    type,
    area: ebf,
    floors: gwr.gastw ?? 2,
    geakClass,
    heating: heatingLabelFromGwr(gwr),
    heatingAge,
    insulation: condition.insulation,
    windows: condition.windows,
    roof: condition.roof,
    basement: condition.basement,
    annualEnergy,
    annualCost,
    co2,
    estimatedValue,
  };

  const installedPvKw = (pvInstallations ?? []).reduce(
    (s, p) => s + p.totalPowerKw,
    0,
  );

  const roofPvPotentialKw =
    solar?.pvYieldKwh != null
      ? Math.round((solar.pvYieldKwh / PV_YIELD_KWH_PER_KWP) * 10) / 10
      : null;

  const eligibility: Eligibility = {
    heatingRecentlyRenewed:
      heatingRenewedYear != null &&
      currentYear - heatingRenewedYear <= recentThreshold &&
      !fossil,
    dhwRecentlyRenewed:
      dhwRenewedYear != null && currentYear - dhwRenewedYear <= recentThreshold,
    pvAlreadyInstalled: installedPvKw > 0,
    installedPvKw: Math.round(installedPvKw * 10) / 10,
    heatingRenewedYear,
    roofPvPotentialKw,
  };

  return { building, eligibility };
};
