/**
 * Federal + cantonal + communal subsidy estimator. Replaces the
 * static SUBSIDIES list when live building data is present.
 *
 * Sources:
 *  - Federal Gebäudeprogramm (HFM 2015 measure codes M-01..M-19),
 *    rates per dasgebaeudeprogramm.ch, current as of 2026.
 *  - Kanton ZH Energieförderung — flat 50% top-up on federal envelope
 *    measures when ≥3 envelope modules are selected (≈ GEAK Plus path).
 *  - Stadt Zürich Energiefonds — extra CHF 350/kWp on PV (BFS 261).
 *  - Pronovo EIV — Grundbeitrag CHF 200 + CHF 380/kWp first 30 kWp.
 *
 * All amounts are estimates. A real implementation would query each
 * canton's portal + check the per-module Anforderungen (U-values etc.).
 */

import type { Building, Module, ModuleId, Subsidy } from "@/data/types";
import type { Eligibility } from "./mapper";
import { basementM2, facadeM2, heatingCapacityKw, roofM2, windowsM2 } from "./buildingAreas";

/** Federal Gebäudeprogramm rate per envelope module + scaling unit.
 * `chfPerScalingUnit` × `scaleFor(module, building)` = federal CHF. */
const FEDERAL_ENVELOPE_RATES: Partial<Record<ModuleId, { chfPerM2: number }>> = {
  facade: { chfPerM2: 30 }, // M-01: CHF 30/m² of insulated wall
  roof: { chfPerM2: 30 }, // M-02
  basement: { chfPerM2: 25 }, // M-03 (basement ceiling)
  windows: { chfPerM2: 70 }, // M-04 (only as part of full reno)
};

/** Kanton ZH Energieförderung 2026 envelope rates. Roughly federal × 1.5
 * for facade/roof/basement under the GEAK-Plus path; windows stack only
 * when the wall U-value also meets the cantonal target. The cantonal
 * portion is added on top of the federal payout, not as a multiplier. */
const KT_ZH_ENVELOPE_RATES: Partial<Record<ModuleId, { chfPerM2: number }>> = {
  facade: { chfPerM2: 45 },
  roof: { chfPerM2: 45 },
  basement: { chfPerM2: 35 },
  windows: { chfPerM2: 80 }, // only fires alongside facade/roof
};

/** Federal heat-pump bonus (HFM 2015 M-05/M-06). Two-part tariff:
 * a base + per-kW bonus, with ground-source paying ~30% more. The
 * generator code `gwaerzh1 = 7411` flags ground-source. */
const HEATING_BASE_AIR_CHF = 3500;
const HEATING_PER_KW_AIR_CHF = 250;
const HEATING_BASE_GROUND_CHF = 5000;
const HEATING_PER_KW_GROUND_CHF = 360;

/** Kanton ZH heat-pump kicker on top of federal M-05/06. Air-water gets a
 * flat CHF 4,000 + CHF 200/kW; ground-source CHF 5,500 + CHF 280/kW. */
const KT_ZH_HEATING_BASE_AIR_CHF = 4000;
const KT_ZH_HEATING_PER_KW_AIR_CHF = 200;
const KT_ZH_HEATING_BASE_GROUND_CHF = 5500;
const KT_ZH_HEATING_PER_KW_GROUND_CHF = 280;

const scaleFor = (id: ModuleId, b: Building): number => {
  switch (id) {
    case "facade":
      return facadeM2(b);
    case "roof":
      return roofM2(b);
    case "basement":
      return basementM2(b);
    case "windows":
      return windowsM2(b);
    default:
      return 1;
  }
};

const federalEnvelopeAmountFor = (id: ModuleId, b: Building): number => {
  const r = FEDERAL_ENVELOPE_RATES[id];
  if (!r) return 0;
  return Math.round(r.chfPerM2 * scaleFor(id, b));
};

/** Replacement HP type isn't selected by the user yet — assume the same
 * generator the site is already plumbed for if it's a HP, otherwise air-
 * water (the typical retrofit). Ground-source pays a meaningfully higher
 * bonus, so getting this right matters for accuracy. */
const federalHeatingAmountFor = (b: Building, e: Eligibility): number => {
  const groundSource = e.geothermalZone != null; // ZH zone signals geothermal feasibility
  const base = groundSource ? HEATING_BASE_GROUND_CHF : HEATING_BASE_AIR_CHF;
  const perKw = groundSource ? HEATING_PER_KW_GROUND_CHF : HEATING_PER_KW_AIR_CHF;
  return Math.round(base + perKw * heatingCapacityKw(b));
};

const ktZhEnvelopeAmountFor = (
  id: ModuleId,
  b: Building,
  envelopeSelected: ModuleId[],
): number => {
  const r = KT_ZH_ENVELOPE_RATES[id];
  if (!r) return 0;
  // Windows only count toward the cantonal envelope subsidy when the
  // wall is also being insulated (cantonal U-value gate).
  if (id === "windows" && !envelopeSelected.includes("facade")) return 0;
  return Math.round(r.chfPerM2 * scaleFor(id, b));
};

const ktZhHeatingAmountFor = (b: Building, e: Eligibility): number => {
  const groundSource = e.geothermalZone != null;
  const base = groundSource
    ? KT_ZH_HEATING_BASE_GROUND_CHF
    : KT_ZH_HEATING_BASE_AIR_CHF;
  const perKw = groundSource
    ? KT_ZH_HEATING_PER_KW_GROUND_CHF
    : KT_ZH_HEATING_PER_KW_AIR_CHF;
  return Math.round(base + perKw * heatingCapacityKw(b));
};

/** Pronovo Einmalvergütung (one-off) for new PV. */
const pronovoEivChf = (kwp: number): number => {
  if (kwp <= 0) return 0;
  const grundbeitrag = 200;
  const tier1 = Math.min(kwp, 30) * 380;
  const tier2 = Math.max(0, kwp - 30) * 290;
  return Math.round(grundbeitrag + tier1 + tier2);
};

const STADT_ZURICH_BFS = 261;

export interface SubsidyInputs {
  selectedModules: ModuleId[];
  modules: Module[];
  building: Building;
  eligibility: Eligibility;
}

export const computeSubsidies = (inputs: SubsidyInputs): Subsidy[] => {
  const { selectedModules, building, eligibility } = inputs;
  const out: Subsidy[] = [];

  const envelopeIds: ModuleId[] = ["facade", "roof", "basement", "windows"];
  const envelopeSelected = envelopeIds.filter((id) =>
    selectedModules.includes(id),
  );

  // ---- Federal Gebäudeprogramm ----
  let federal = 0;
  for (const id of envelopeSelected) {
    federal += federalEnvelopeAmountFor(id, building);
  }

  // Heating subsidy fires only when actually swapping from fossil to clean.
  const heatingSelected =
    selectedModules.includes("heating") &&
    !eligibility.heatingRecentlyRenewed &&
    eligibility.currentHeatingFossil;
  if (heatingSelected) federal += federalHeatingAmountFor(building, eligibility);

  if (federal > 0) {
    out.push({
      source: "Gebäudeprogramm (Federal)",
      amount: federal,
      status: "Pre-qualified",
      desc: "Envelope measures + heating replacement (HFM 2015)",
      auto: true,
    });
  }

  // ---- Kanton ZH Energieförderung ----
  // Per-measure rates that stack on top of federal HFM 2015. The
  // GEAK-Plus path (≥3 envelope modules) is required for the envelope
  // bonus; the heat-pump kicker fires whenever the federal HP bonus
  // does. Windows only count when the facade is also insulated.
  if (eligibility.canton === "ZH") {
    let cantonal = 0;
    if (envelopeSelected.length >= 3) {
      for (const id of envelopeSelected) {
        cantonal += ktZhEnvelopeAmountFor(id, building, envelopeSelected);
      }
    }
    if (heatingSelected) cantonal += ktZhHeatingAmountFor(building, eligibility);
    if (cantonal > 0) {
      out.push({
        source: "Kanton Zürich — Energieförderung",
        amount: cantonal,
        status: "Pre-qualified",
        desc:
          envelopeSelected.length >= 3
            ? "GEAK-Plus envelope rates + cantonal heat-pump kicker"
            : "Cantonal heat-pump kicker (GEAK-Plus envelope path not met)",
        auto: true,
      });
    }
  }

  // ---- Pronovo EIV (PV one-off) ----
  const pvHeadroomKw = Math.max(
    0,
    (eligibility.roofPvPotentialKw ?? 0) - eligibility.installedPvKw,
  );
  if (selectedModules.includes("solar") && pvHeadroomKw > 0) {
    out.push({
      source: "Pronovo EIV (Federal)",
      amount: pronovoEivChf(pvHeadroomKw),
      status: "Pre-qualified",
      desc: `One-off remuneration for ${pvHeadroomKw.toFixed(1)} kWp installation`,
      auto: true,
    });

    // Stadt Zürich extra (CHF 350/kWp).
    if (
      eligibility.canton === "ZH" &&
      eligibility.bfsGemeindeNr === STADT_ZURICH_BFS
    ) {
      out.push({
        source: "Stadt Zürich — Energiefonds",
        amount: Math.round(pvHeadroomKw * 350),
        status: "Eligible",
        desc: "City of Zürich PV top-up",
        auto: true,
      });
    }
  }

  // ---- ewz Energiefonds (Stadt Zürich smart-energy bonus) ----
  // ProKilowatt is competitive/commercial — not a residential subsidy.
  // For Stadt Zürich, the actual instrument is the ewz Energiefonds
  // Smart-Home/Energiemanagement bonus (CHF 500-1,000, by application).
  if (
    selectedModules.includes("electrical") &&
    eligibility.canton === "ZH" &&
    eligibility.bfsGemeindeNr === STADT_ZURICH_BFS
  ) {
    out.push({
      source: "ewz Energiefonds (Stadt Zürich)",
      amount: 800,
      status: "To verify",
      desc: "Smart-home + energy-management installation bonus",
      auto: false,
    });
  }

  return out;
};
