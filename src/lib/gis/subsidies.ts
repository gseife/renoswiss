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
import { basementM2, facadeM2, roofM2, windowsM2 } from "./buildingAreas";

/** Federal Gebäudeprogramm rate per module + scaling unit.
 * `chfPerScalingUnit` × `scaleFor(module, building)` = federal CHF. */
const FEDERAL_RATES: Partial<Record<ModuleId, { chfPerM2?: number; flatChf?: number }>> = {
  facade: { chfPerM2: 30 }, // M-01: CHF 30/m² of insulated wall
  roof: { chfPerM2: 30 }, // M-02
  basement: { chfPerM2: 25 }, // M-03 (basement ceiling)
  windows: { chfPerM2: 70 }, // M-04 (only as part of full reno)
  heating: { flatChf: 5000 }, // M-05/06: avg CHF 5k for HP swap
};

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

const federalAmountFor = (id: ModuleId, b: Building): number => {
  const r = FEDERAL_RATES[id];
  if (!r) return 0;
  if (r.flatChf) return r.flatChf;
  if (r.chfPerM2) return Math.round(r.chfPerM2 * scaleFor(id, b));
  return 0;
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
    federal += federalAmountFor(id, building);
  }

  // Heating subsidy fires only when actually swapping from fossil to clean.
  const heatingSelected =
    selectedModules.includes("heating") &&
    !eligibility.heatingRecentlyRenewed &&
    eligibility.currentHeatingFossil;
  if (heatingSelected) federal += FEDERAL_RATES.heating?.flatChf ?? 0;

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
  // 50% top-up on federal envelope subsidies when GEAK-Plus path
  // (≥3 envelope modules selected).
  if (eligibility.canton === "ZH" && envelopeSelected.length >= 3) {
    const cantonal = Math.round(federal * 0.5);
    if (cantonal > 0) {
      out.push({
        source: "Kanton Zürich — Energieförderung",
        amount: cantonal,
        status: "Pre-qualified",
        desc: "GEAK-Plus comprehensive renovation top-up",
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

  // ---- ProKilowatt (federal, optional) ----
  // Lump-sum estimate — only applies for energy-management upgrades.
  if (selectedModules.includes("electrical")) {
    out.push({
      source: "ProKilowatt (Federal)",
      amount: 1500,
      status: "To verify",
      desc: "Smart energy management efficiency credit",
      auto: false,
    });
  }

  return out;
};
