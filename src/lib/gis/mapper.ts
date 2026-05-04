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
import { estimatePropertyValue } from "./valuation";
import type {
  GwrAttributes,
  HeritageObject,
  PvInstallation,
  SolarRoofPotential,
} from "./types";

/** CHF/kWh price by fuel, Spring 2026 retail values for canton Zürich.
 *
 *  - electricity: ewz Pak 2 H4 + EKZ Standard residential blend (0.28).
 *  - oil: Avenergy weekly HEL retail Q1-2026 (~CHF 115/100L → 0.115/kWh).
 *  - gas: ewb / Erdgas Zürich H-Gas tariff Q1-2026 (0.105/kWh after the
 *    post-2024 supply-crisis softening).
 *  - district: ewz Wärmeverbund tariffs (network-renewable mix, premium).
 *  - wood: pellet retail (CHF 480/t, 4.8 kWh/kg → 0.10/kWh).
 *
 * A real platform would refresh these monthly from BFS LIK + Avenergy +
 * the Gemeinde's electric utility tariff sheet.
 */
const FUEL_PRICE_CHF_PER_KWH = {
  electricity: 0.28,
  oil: 0.115,
  gas: 0.105,
  district: 0.13,
  wood: 0.1,
} as const;

/** kg CO₂ per kWh delivered, useful-heat basis. Sources: BAFU Treibhaus-
 * gasinventar (oil/gas/wood), KBOB Ökobilanzdaten (electricity Swiss mix
 * 2024 ~40 g/kWh), district-heat factor weighted to ZH renewable mix. */
const EMISSION_FACTOR_KG_PER_KWH = {
  electricity: 0.04,
  oil: 0.3,
  gas: 0.2,
  district: 0.06,
  wood: 0.02,
  hp: 0.04,
} as const;

/** Seasonal performance factor (JAZ) by GWR generator code. Air-water HPs
 * sit around 3.0 in Swiss field studies (BFE/HSLU 2022); ground-source
 * around 4.0 thanks to the stable source temperature. */
const HP_COP_AIR = 3.0;
const HP_COP_GROUND = 4.0;
const hpCopFor = (gwaerzh1: number | null): number =>
  gwaerzh1 === 7411 ? HP_COP_GROUND : HP_COP_AIR;

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
  /** True when a cantonal heritage object sits within ~25m of the
   * parcel — façade insulation and roof-mounted PV are typically
   * restricted on listed buildings. */
  heritageBlock: boolean;
  /** Closest heritage object within 200m, if any. */
  heritageObject: HeritageObject | null;
  /** Distance in metres to that object. */
  heritageDistanceM: number | null;
  /** District heat suitability area intersects the parcel. */
  districtHeatAvailable: boolean;
  /** Geothermal-use zone code from the cantonal Wärmenutzungsatlas
   * (A=zulässig, B–D=mit Auflagen, null=outside the published zones). */
  geothermalZone: string | null;
  /** Canton code from GWR — drives cantonal subsidy programs. */
  canton: string;
  /** BFS Gemeindenummer — drives communal top-ups. */
  bfsGemeindeNr: number;
  /** True when the current primary heating burns oil/gas/coal —
   * gates the heating-replacement subsidy. */
  currentHeatingFossil: boolean;
  /** True when the building is already on a clean heating system
   * (heat pump, district heat, or thermal solar). Used to suppress the
   * heating-replacement recommendation regardless of the renewal year. */
  currentHeatingClean: boolean;
}

/** Sonnendach kWh→kWp factor for canton Zürich (BFE/MeteoSwiss 2024
 * radiation atlas, ZH-mean). The sonnendach layer normally returns the
 * real per-roof yield, so this fallback rarely fires. */
const PV_YIELD_KWH_PER_KWP = 1050;

export interface ZhContext {
  heritageBlock: boolean;
  heritageObject: HeritageObject | null;
  heritageDistanceM: number | null;
  districtHeatAvailable: boolean;
  geothermalZone: string | null;
}

export interface MapperInputs {
  gwr: GwrAttributes;
  /** Override the address label (e.g. the autocomplete pick). */
  addressLabel?: string;
  solar?: SolarRoofPotential | null;
  pvInstallations?: PvInstallation[];
  /** Cantonal context (heritage / district heat / geothermal). Optional —
   * cantons outside ZH leave this null. */
  zhContext?: ZhContext | null;
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
  // intensity × EBF. Per-cohort SFH baseline below; multi-family stock has
  // a better surface-to-volume ratio and runs ~25% lower for the same
  // cohort (BFE Gebäudetypologie 2017, Table 4-2).
  const sfhFallbackIntensity =
    year <= 1978 ? 150 : year <= 1994 ? 110 : year <= 2010 ? 90 : 60;
  const isMfh = type.includes("Mehrfamilienhaus");
  const fallbackIntensity = isMfh
    ? Math.round(sfhFallbackIntensity * 0.75)
    : sfhFallbackIntensity;
  const heatingDemand = solar?.heatingDemandKwh ?? Math.round(ebf * fallbackIntensity);
  const dhwDemand = solar?.dhwDemandKwh ?? Math.round(ebf * 22);
  const usefulHeatKwh = heatingDemand + dhwDemand;

  // Energy delivered + cost depend on the heating system.
  const electric = isElectricallyDriven(gwr);
  const fossil = isFossilHeating(gwr);
  const cop = hpCopFor(gwr.gwaerzh1);
  const annualEnergy = electric ? Math.round(usefulHeatKwh / cop) : usefulHeatKwh;
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

  const estimatedValue = estimatePropertyValue({
    gwr,
    ebfM2: ebf,
    year,
    geak: geakClass,
  });

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

  const zh = inputs.zhContext ?? null;

  // GWR generator codes that count as "already clean" — replacing them
  // with another heat pump isn't a sensible recommendation.
  // 7410/7411 = Wärmepumpe, 7420 = Solaranlage, 7460 = Fernwärme.
  const cleanGenCodes = new Set([7410, 7411, 7420, 7460]);
  const currentHeatingClean =
    gwr.gwaerzh1 != null && cleanGenCodes.has(gwr.gwaerzh1);

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
    heritageBlock: zh?.heritageBlock ?? false,
    heritageObject: zh?.heritageObject ?? null,
    heritageDistanceM: zh?.heritageDistanceM ?? null,
    districtHeatAvailable: zh?.districtHeatAvailable ?? false,
    geothermalZone: zh?.geothermalZone ?? null,
    canton: gwr.gdekt,
    bfsGemeindeNr: gwr.ggdenr,
    currentHeatingFossil: fossil,
    currentHeatingClean,
  };

  return { building, eligibility };
};
