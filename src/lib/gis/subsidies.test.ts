import { describe, it, expect } from "vitest";
import { computeSubsidies } from "./subsidies";
import { MODULES } from "@/data/modules";
import type { Building } from "@/data/types";
import type { Eligibility } from "./mapper";

const ROSSMATTENWEG: Building = {
  address: "Rossmattenweg 1, 8932 Mettmenstetten",
  year: 1924,
  type: "Kleines Mehrfamilienhaus",
  area: 523,
  floors: 3,
  geakClass: "E",
  heating: "Wärmepumpe (2023)",
  heatingAge: 3,
  insulation: "Minimal (4–8 cm)",
  windows: "Original Doppelverglasung",
  roof: "Unisoliertes Ziegeldach",
  basement: "Unisoliert",
  annualEnergy: 25073,
  annualCost: 6770,
  co2: 1,
  estimatedValue: 3_158_083,
};

const ROSS_ELIG: Eligibility = {
  heatingRecentlyRenewed: true,
  dhwRecentlyRenewed: true,
  pvAlreadyInstalled: true,
  installedPvKw: 9.9,
  heatingRenewedYear: 2023,
  roofPvPotentialKw: 15.8,
  heritageBlock: false,
  heritageObject: null,
  heritageDistanceM: null,
  districtHeatAvailable: false,
  geothermalZone: "F",
  canton: "ZH",
  bfsGemeindeNr: 9,
  currentHeatingFossil: false,
};

describe("computeSubsidies — Rossmattenweg 1 (HP-already, PV-already, ZH rural)", () => {
  it("returns federal subsidy for envelope-only retrofit", () => {
    const r = computeSubsidies({
      selectedModules: ["facade", "roof", "windows"],
      modules: MODULES,
      building: ROSSMATTENWEG,
      eligibility: ROSS_ELIG,
    });
    const fed = r.find((s) => s.source.includes("Federal"));
    expect(fed?.amount).toBeGreaterThan(0);
  });

  it("does NOT include heating subsidy when HP already installed", () => {
    const r = computeSubsidies({
      selectedModules: ["facade", "roof", "heating"],
      modules: MODULES,
      building: ROSSMATTENWEG,
      eligibility: ROSS_ELIG,
    });
    const fed = r.find((s) => s.source.includes("Federal"))!;
    // Should be facade+roof only (no +5000 heating flat).
    expect(fed.amount).toBeLessThan(15_000);
  });

  it("includes ZH cantonal top-up at >=3 envelope modules", () => {
    const r = computeSubsidies({
      selectedModules: ["facade", "roof", "windows", "basement"],
      modules: MODULES,
      building: ROSSMATTENWEG,
      eligibility: ROSS_ELIG,
    });
    const ktzh = r.find((s) => s.source.includes("Kanton Zürich"));
    expect(ktzh).toBeDefined();
    expect(ktzh!.amount).toBeGreaterThan(0);
  });

  it("does NOT trigger Pronovo EIV when no headroom (PV already installed at full size)", () => {
    const r = computeSubsidies({
      selectedModules: ["solar"],
      modules: MODULES,
      building: ROSSMATTENWEG,
      eligibility: { ...ROSS_ELIG, installedPvKw: 15.8 },
    });
    expect(r.find((s) => s.source.includes("Pronovo"))).toBeUndefined();
  });

  it("does trigger Pronovo EIV with headroom (5.9 kWp extension)", () => {
    const r = computeSubsidies({
      selectedModules: ["solar"],
      modules: MODULES,
      building: ROSSMATTENWEG,
      eligibility: ROSS_ELIG, // 15.8 - 9.9 = 5.9 kWp
    });
    const eiv = r.find((s) => s.source.includes("Pronovo"));
    expect(eiv).toBeDefined();
    // 200 grundbeitrag + 5.9 × 380 = 2442
    expect(eiv!.amount).toBeGreaterThan(2400);
    expect(eiv!.amount).toBeLessThan(2500);
  });

  it("adds Stadt Zürich top-up only for BFS 261", () => {
    const stadtZurich: Eligibility = {
      ...ROSS_ELIG,
      bfsGemeindeNr: 261,
      installedPvKw: 0, // pretend no existing
      roofPvPotentialKw: 10,
    };
    const r = computeSubsidies({
      selectedModules: ["solar"],
      modules: MODULES,
      building: ROSSMATTENWEG,
      eligibility: stadtZurich,
    });
    expect(r.find((s) => s.source.includes("Stadt Zürich"))).toBeDefined();
  });

  it("non-ZH gets no cantonal top-up", () => {
    const bern: Eligibility = { ...ROSS_ELIG, canton: "BE" };
    const r = computeSubsidies({
      selectedModules: ["facade", "roof", "windows", "basement"],
      modules: MODULES,
      building: ROSSMATTENWEG,
      eligibility: bern,
    });
    expect(r.find((s) => s.source.includes("Kanton Zürich"))).toBeUndefined();
  });

  it("fires heating subsidy when fossil + not-recently-renewed", () => {
    const oilHouse: Eligibility = {
      ...ROSS_ELIG,
      heatingRecentlyRenewed: false,
      currentHeatingFossil: true,
    };
    const r = computeSubsidies({
      selectedModules: ["heating"],
      modules: MODULES,
      building: ROSSMATTENWEG,
      eligibility: oilHouse,
    });
    const fed = r.find((s) => s.source.includes("Federal"));
    expect(fed?.amount).toBeGreaterThanOrEqual(5_000);
  });
});
